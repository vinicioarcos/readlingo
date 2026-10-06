#!/usr/bin/env python3
"""ReadLingo: dependency-free, loopback-only learning server (Python 3.11+)."""
from __future__ import annotations

import base64
import binascii
import io
import json
import mimetypes
import os
from pathlib import Path, PurePosixPath
import re
import struct
import urllib.error
import urllib.parse
import urllib.request
import wave
import zipfile
from html.parser import HTMLParser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
WEB = ROOT / "web"
PORT = 8765
MAX_REQUEST = 16 * 1024 * 1024
MAX_UPLOAD = 10 * 1024 * 1024
MAX_EXPANDED = 24 * 1024 * 1024
MAX_TEXT = 1_500_000


class AppError(Exception):
    def __init__(self, status, message):
        self.status, self.message = status, message
        super().__init__(message)


def load_env(path=ROOT / ".env"):
    """Read literal KEY=VALUE lines; never execute shell interpolation."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key, value = key.strip(), value.strip()
        if re.fullmatch(r"[A-Z][A-Z0-9_]*", key):
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                value = value[1:-1]
            os.environ.setdefault(key, value)


def require_text(body, key, maximum):
    value = body.get(key)
    if not isinstance(value, str) or not value.strip() or len(value) > maximum:
        raise AppError(400, f"{key}: se requiere texto no vacío de hasta {maximum} caracteres.")
    return value.strip()


def decode_data(value, maximum):
    if not isinstance(value, str) or len(value) > 4 * ((maximum + 2) // 3):
        raise AppError(400, "Archivo demasiado grande o base64 inválido.")
    try:
        result = base64.b64decode(value, validate=True)
    except (binascii.Error, ValueError):
        raise AppError(400, "El archivo debe enviarse en base64 válido, sin prefijo data:.") from None
    if not result or len(result) > maximum:
        raise AppError(400, "Archivo vacío o demasiado grande.")
    return result


def cloud_json(url, payload, headers):
    request = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    try:
        # Fixed provider URLs only. No redirects, which could forward credentials.
        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, req, fp, code, msg, hdrs, newurl):
                return None
        with urllib.request.build_opener(NoRedirect).open(request, timeout=25) as response:
            raw = response.read(2 * 1024 * 1024 + 1)
            if len(raw) > 2 * 1024 * 1024:
                raise AppError(502, "La respuesta del proveedor supera el límite permitido.")
            return json.loads(raw)
    except AppError:
        raise
    except urllib.error.HTTPError as exc:
        if exc.code == 429:
            raise AppError(429, "El proveedor ha alcanzado su cuota. Intenta más tarde.") from None
        raise AppError(502, "El proveedor rechazó la solicitud. Revisa credenciales, región y cuota en el servidor.") from None
    except (urllib.error.URLError, TimeoutError, OSError, ValueError):
        raise AppError(502, "No se pudo obtener una respuesta válida del proveedor.") from None


def translate(body):
    text = require_text(body, "text", 5000)
    key = os.environ.get("AZURE_TRANSLATOR_KEY", "").strip()
    if not key:
        raise AppError(503, "Traducción no configurada. Añade AZURE_TRANSLATOR_KEY y AZURE_TRANSLATOR_REGION a .env y reinicia.")
    headers = {"Content-Type": "application/json; charset=UTF-8", "Ocp-Apim-Subscription-Key": key}
    region = os.environ.get("AZURE_TRANSLATOR_REGION", "").strip()
    if region:
        headers["Ocp-Apim-Subscription-Region"] = region
    data = cloud_json("https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=es",
                      json.dumps([{"Text": text}]).encode(), headers)
    try:
        result = data[0]["translations"][0]["text"]
        if not isinstance(result, str) or not result.strip():
            raise ValueError()
    except (TypeError, IndexError, KeyError, ValueError):
        raise AppError(502, "El proveedor no devolvió una traducción válida.") from None
    return {"translation": result, "source": "Azure Translator"}


def validate_wav(raw):
    try:
        with wave.open(io.BytesIO(raw), "rb") as audio:
            channels, width, rate, frames, compression, _ = audio.getparams()
            if (channels, width, rate, compression) != (1, 2, 16000, "NONE"):
                raise ValueError()
            if not 1600 <= frames <= 30 * 16000:
                raise ValueError()
            if len(audio.readframes(frames)) != frames * width:
                raise ValueError()
    except (wave.Error, EOFError, ValueError, struct.error):
        raise AppError(400, "El audio debe ser WAV PCM mono, 16 bits, 16000 Hz, de 0,1 a 30 segundos, sin truncar.") from None


def score(obj, name):
    value = obj.get(name)
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not 0 <= value <= 100:
        return None
    return value


def assessment(obj):
    nested = obj.get("PronunciationAssessment")
    return nested if isinstance(nested, dict) else obj


def pronunciation(body):
    reference = require_text(body, "reference", 1200)
    raw = decode_data(body.get("audio"), 1_000_000)
    validate_wav(raw)
    key = os.environ.get("AZURE_SPEECH_KEY", "").strip()
    region = os.environ.get("AZURE_SPEECH_REGION", "").strip()
    if not key or not re.fullmatch(r"[a-z][a-z0-9-]{1,39}", region):
        raise AppError(503, "Evaluación no configurada. Añade AZURE_SPEECH_KEY y AZURE_SPEECH_REGION válidos a .env y reinicia.")
    params = {"ReferenceText": reference, "GradingSystem": "HundredMark", "Granularity": "Phoneme", "Dimension": "Comprehensive", "EnableMiscue": True}
    headers = {"Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000", "Accept": "application/json", "Ocp-Apim-Subscription-Key": key,
               "Pronunciation-Assessment": base64.b64encode(json.dumps(params).encode()).decode()}
    data = cloud_json(f"https://{region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed", raw, headers)
    if not isinstance(data, dict) or data.get("RecognitionStatus") != "Success":
        raise AppError(422, "No se reconoció voz suficiente. Graba de nuevo en un lugar silencioso.")
    try:
        best = data["NBest"][0]
        values = assessment(best)
        scores = {key: score(values, name) for key, name in (("accuracy", "AccuracyScore"), ("fluency", "FluencyScore"), ("completeness", "CompletenessScore"), ("pronunciation", "PronScore"))}
        words = []
        for word in best.get("Words", []):
            words.append({"word": word.get("Word", ""), "accuracy": score(assessment(word), "AccuracyScore"), "error": assessment(word).get("ErrorType", "None"),
                          "phonemes": [{"phoneme": p.get("Phoneme", ""), "accuracy": score(assessment(p), "AccuracyScore")} for p in word.get("Phonemes", [])]})
        if all(value is None for value in scores.values()):
            raise ValueError()
        return {"text": best.get("Display", best.get("Lexical", "")), "scores": scores, "words": words}
    except (KeyError, IndexError, TypeError, AttributeError, ValueError):
        raise AppError(502, "El proveedor no devolvió puntuaciones de pronunciación válidas.") from None


class BookText(HTMLParser):
    BLOCKS = {"p", "div", "br", "h1", "h2", "h3", "h4", "li", "section", "article", "blockquote", "tr"}
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.hidden = [], []
    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style", "head", "svg", "iframe", "object"}:
            self.hidden.append(tag)
        if not self.hidden and tag in self.BLOCKS:
            self.parts.append("\n")
    def handle_endtag(self, tag):
        if self.hidden:
            if tag == self.hidden[-1]:
                self.hidden.pop()
        elif tag in self.BLOCKS:
            self.parts.append("\n")
    def handle_data(self, data):
        if not self.hidden:
            self.parts.append(data)
    def text(self):
        return "\n\n".join(line for line in (re.sub(r"\s+", " ", p).strip() for p in "".join(self.parts).split("\n")) if line)


def xml(raw):
    # Forbid XML entity/DTD definitions. Standard EPUB XML does not need them.
    if b"<!DOCTYPE" in raw.upper() or b"<!ENTITY" in raw.upper():
        raise AppError(400, "EPUB con declaraciones XML no permitidas.")
    try:
        return ET.fromstring(raw)
    except ET.ParseError:
        raise AppError(400, "EPUB: XML inválido.") from None


def import_book(body):
    filename = require_text(body, "filename", 255)
    raw = decode_data(body.get("data"), MAX_UPLOAD)
    suffix = Path(filename).suffix.lower()
    title = Path(filename).stem
    if suffix == ".txt":
        try:
            text = raw.decode("utf-8-sig")
        except UnicodeDecodeError:
            raise AppError(400, "Guarda el archivo TXT con codificación UTF-8.") from None
        if "\x00" in text:
            raise AppError(400, "El archivo no parece texto UTF-8.")
    elif suffix == ".epub":
        try:
            with zipfile.ZipFile(io.BytesIO(raw)) as archive:
                entries = archive.infolist()
                if len(entries) > 1500 or sum(i.file_size for i in entries) > MAX_EXPANDED:
                    raise AppError(400, "EPUB demasiado grande al descomprimir.")
                names = set()
                for item in entries:
                    parts = PurePosixPath(item.filename).parts
                    if (item.filename in names or item.filename.startswith("/") or ".." in parts or "\\" in item.filename or item.flag_bits & 1 or item.file_size > 5 * 1024 * 1024):
                        raise AppError(400, "EPUB con entradas no seguras o demasiado grandes.")
                    names.add(item.filename)
                def read(name):
                    if name not in names:
                        raise AppError(400, "EPUB incompleto: falta un recurso requerido.")
                    content = archive.read(name)
                    if len(content) > 5 * 1024 * 1024:
                        raise AppError(400, "Recurso EPUB demasiado grande.")
                    return content
                container = xml(read("META-INF/container.xml"))
                rootfiles = container.findall(".//{*}rootfile")
                if not rootfiles:
                    raise AppError(400, "EPUB sin documento principal.")
                opf_path = rootfiles[0].get("full-path", "")
                package = xml(read(opf_path))
                title_node = package.find(".//{*}metadata/{*}title")
                if title_node is not None and title_node.text:
                    title = title_node.text.strip()[:300]
                manifest = {i.get("id"): i for i in package.findall(".//{*}manifest/{*}item")}
                chunks = []
                length = 0
                for itemref in package.findall(".//{*}spine/{*}itemref"):
                    if itemref.get("linear") == "no":
                        continue
                    item = manifest.get(itemref.get("idref"))
                    if item is None:
                        raise AppError(400, "EPUB con orden de lectura incompleto.")
                    if item.get("media-type") not in {"application/xhtml+xml", "text/html"}:
                        continue
                    href = urllib.parse.urlsplit(item.get("href", ""))
                    if href.scheme or href.netloc or href.query:
                        raise AppError(400, "EPUB con referencia externa no permitida.")
                    unquoted = urllib.parse.unquote(href.path)
                    if unquoted.startswith("/") or "\\" in unquoted:
                        raise AppError(400, "EPUB con ruta no segura.")
                    # Normalize legitimate relative spine paths without touching disk.
                    components = list(PurePosixPath(opf_path).parent.parts)
                    for part in unquoted.split("/"):
                        if part == "..":
                            if not components:
                                raise AppError(400, "EPUB con ruta fuera del archivo.")
                            components.pop()
                        elif part not in {"", "."}:
                            components.append(part)
                    parser = BookText()
                    parser.feed(read("/".join(components)).decode("utf-8-sig"))
                    chunk = parser.text()
                    length += len(chunk)
                    if length > MAX_TEXT:
                        raise AppError(400, "El texto del EPUB supera el límite de lectura.")
                    chunks.append(chunk)
                text = "\n\n".join(chunks)
        except AppError:
            raise
        except (zipfile.BadZipFile, UnicodeDecodeError, RuntimeError, ValueError, OSError, NotImplementedError):
            raise AppError(400, "No se pudo leer el EPUB. Usa un EPUB válido, UTF-8 y sin DRM.") from None
    else:
        raise AppError(400, "Formatos admitidos: .txt (UTF-8) y .epub sin DRM.")
    text = text.strip()
    if not text or len(text) > MAX_TEXT:
        raise AppError(400, "El libro está vacío o supera 1.500.000 caracteres.")
    return {"title": title, "text": text}


class Handler(BaseHTTPRequestHandler):
    server_version = "ReadLingo"
    sys_version = ""
    def setup(self):
        super().setup()
        self.connection.settimeout(35)
    def log_message(self, format, *args):
        pass  # Do not log uploaded text, audio, keys, URLs or request bodies.
    def headers_out(self, status, content_type, length):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(length))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Permissions-Policy", "microphone=(self), camera=(), geolocation=()")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
        self.end_headers()
    def json_out(self, status, value):
        raw = json.dumps(value, ensure_ascii=False, allow_nan=False).encode()
        self.headers_out(status, "application/json; charset=utf-8", len(raw))
        self.wfile.write(raw)
    def check_request(self):
        hosts = {f"127.0.0.1:{self.server.server_port}", f"localhost:{self.server.server_port}"}
        host = self.headers.get("Host", "")
        if len(self.headers.get_all("Host", [])) != 1 or host not in hosts:
            raise AppError(403, "Host no permitido. Abre la aplicación desde localhost.")
        origin = self.headers.get("Origin")
        if origin is not None and origin != f"http://{host}":
            raise AppError(403, "Origen no permitido.")
        if self.headers.get("Sec-Fetch-Site") not in {None, "same-origin", "none"}:
            raise AppError(403, "Solicitud externa bloqueada.")
        if len(self.headers.get_all("Origin", [])) > 1:
            raise AppError(403, "Origen no válido.")
    def do_GET(self):
        try:
            self.check_request()
            path = urllib.parse.unquote(urllib.parse.urlsplit(self.path).path)
            if path == "/api/config":
                self.json_out(200, {"translation": bool(os.environ.get("AZURE_TRANSLATOR_KEY", "").strip()), "pronunciation": bool(os.environ.get("AZURE_SPEECH_KEY", "").strip() and re.fullmatch(r"[a-z][a-z0-9-]{1,39}", os.environ.get("AZURE_SPEECH_REGION", "").strip()))})
                return
            relative = path.lstrip("/") or "index.html"
            parts = PurePosixPath(relative).parts
            allowed = {".html", ".js", ".css", ".png", ".jpg", ".jpeg", ".svg", ".ico", ".webp", ".woff", ".woff2"}
            if "\\" in relative or "\x00" in relative or any(p.startswith(".") for p in parts) or Path(relative).suffix.lower() not in allowed:
                raise AppError(404, "Recurso no encontrado.")
            file = (WEB / relative).resolve()
            if not file.is_relative_to(WEB.resolve()) or not file.is_file():
                raise AppError(404, "Recurso no encontrado.")
            raw = file.read_bytes()
            kind = mimetypes.guess_type(file.name)[0] or "application/octet-stream"
            if kind.startswith("text/") or file.suffix == ".js":
                kind += "; charset=utf-8"
            self.headers_out(200, kind, len(raw))
            self.wfile.write(raw)
        except AppError as exc:
            self.json_out(exc.status, {"error": exc.message})
    def do_POST(self):
        try:
            self.check_request()
            routes = {"/api/translate": translate, "/api/pronunciation": pronunciation, "/api/import": import_book}
            if self.path not in routes:
                raise AppError(404, "Endpoint no encontrado.")
            if self.headers.get("Transfer-Encoding") or len(self.headers.get_all("Content-Length", [])) != 1:
                raise AppError(400, "Se requiere Content-Length único, sin Transfer-Encoding.")
            try:
                length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                raise AppError(400, "Content-Length inválido.") from None
            limit = MAX_REQUEST if self.path == "/api/import" else (1_400_000 if self.path == "/api/pronunciation" else 32_000)
            if length < 2 or length > limit:
                raise AppError(413, "La solicitud supera el tamaño permitido o está vacía.")
            if self.headers.get_content_type() != "application/json":
                raise AppError(415, "Usa Content-Type: application/json.")
            try:
                raw = self.rfile.read(length)
                if len(raw) != length:
                    raise ValueError()
                body = json.loads(raw)
                if not isinstance(body, dict):
                    raise ValueError()
            except (ValueError, UnicodeDecodeError):
                raise AppError(400, "Cuerpo JSON inválido.") from None
            self.json_out(200, routes[self.path](body))
        except AppError as exc:
            self.json_out(exc.status, {"error": exc.message})
        except (TimeoutError, ConnectionError, BrokenPipeError):
            self.close_connection = True
        except Exception:
            self.json_out(500, {"error": "Error interno. Verifica el archivo o vuelve a intentar."})
    def do_OPTIONS(self):
        self.json_out(405, {"error": "No se permiten solicitudes de otros orígenes."})


def main():
    load_env()
    with ThreadingHTTPServer(("127.0.0.1", PORT), Handler) as server:
        server.daemon_threads = True
        print(f"ReadLingo disponible en http://127.0.0.1:{PORT} — Ctrl+C para salir.")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nReadLingo detenido.")


if __name__ == "__main__":
    main()
