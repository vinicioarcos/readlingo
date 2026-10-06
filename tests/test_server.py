"""Offline validation: imports, provider adapters and loopback request boundaries."""
import base64
import http.client
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch
import wave
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server


def encoded(raw):
    return base64.b64encode(raw).decode()


def wav(rate=16000, channels=1, seconds=1):
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as out:
        out.setnchannels(channels)
        out.setsampwidth(2)
        out.setframerate(rate)
        out.writeframes(b"\x00\x00" * rate * channels * seconds)
    return buffer.getvalue()


def epub(extra=None):
    buffer = io.BytesIO()
    files = {
        "META-INF/container.xml": '<container><rootfiles><rootfile full-path="OPS/book.opf"/></rootfiles></container>',
        "OPS/book.opf": '<package xmlns="http://www.idpf.org/2007/opf"><metadata><title>Test Book</title></metadata><manifest><item id="a" href="a.xhtml" media-type="application/xhtml+xml"/><item id="b" href="b.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="b"/><itemref idref="a"/></spine></package>',
        "OPS/a.xhtml": '<html><head><title>Hidden title</title><style>hidden</style></head><body><p>Second chapter.</p><script>alert(1)</script></body></html>',
        "OPS/b.xhtml": '<html><body><p>First chapter &amp; friends.</p></body></html>',
    }
    files.update(extra or {})
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, data in files.items():
            archive.writestr(name, data)
    return buffer.getvalue()


class ImportTests(unittest.TestCase):
    def test_txt_utf8(self):
        self.assertEqual(server.import_book({"filename": "Book.txt", "data": encoded("Café".encode())}), {"title": "Book", "text": "Café"})

    def test_epub_follows_spine_and_removes_scripts(self):
        book = server.import_book({"filename": "test.epub", "data": encoded(epub())})
        self.assertEqual(book, {"title": "Test Book", "text": "First chapter & friends.\n\nSecond chapter."})

    def test_unsafe_archive_paths_rejected(self):
        with self.assertRaises(server.AppError) as error:
            server.import_book({"filename": "x.epub", "data": encoded(epub({"../escape": "bad"}))})
        self.assertEqual(error.exception.status, 400)

    def test_entities_rejected(self):
        with self.assertRaises(server.AppError):
            server.import_book({"filename": "x.epub", "data": encoded(epub({"META-INF/container.xml": '<!DOCTYPE foo [<!ENTITY x SYSTEM "file:///etc/passwd">]><container>&x;</container>'}))})

    def test_zip_expansion_limit(self):
        with patch.object(server, "MAX_EXPANDED", 100), self.assertRaises(server.AppError):
            server.import_book({"filename": "x.epub", "data": encoded(epub())})

    def test_external_spine_rejected(self):
        package = '<package><manifest><item id="a" href="https://example.com/data" media-type="text/html"/></manifest><spine><itemref idref="a"/></spine></package>'
        with self.assertRaises(server.AppError):
            server.import_book({"filename": "x.epub", "data": encoded(epub({"OPS/book.opf": package}))})


class ProviderTests(unittest.TestCase):
    def test_audio_format_and_truncation(self):
        server.validate_wav(wav())
        for raw in [wav(rate=8000), wav(channels=2), wav(seconds=31), wav()[:-10], b"not audio"]:
            with self.subTest(size=len(raw)), self.assertRaises(server.AppError):
                server.validate_wav(raw)

    def test_missing_configuration_never_calls_provider(self):
        with patch.dict(os.environ, {}, clear=True), patch.object(server, "cloud_json") as cloud:
            with self.assertRaises(server.AppError) as err:
                server.translate({"text": "Hello"})
            self.assertEqual(err.exception.status, 503)
            with self.assertRaises(server.AppError) as err:
                server.pronunciation({"reference": "Hello", "audio": encoded(wav())})
            self.assertEqual(err.exception.status, 503)
            cloud.assert_not_called()

    def test_translation_contract(self):
        with patch.dict(os.environ, {"AZURE_TRANSLATOR_KEY": "test", "AZURE_TRANSLATOR_REGION": "eastus"}), patch.object(server, "cloud_json", return_value=[{"translations": [{"text": "Hola"}]}]) as cloud:
            result = server.translate({"text": "Hello"})
            self.assertEqual(result["translation"], "Hola")
            self.assertEqual(json.loads(cloud.call_args.args[1]), [{"Text": "Hello"}])

    def test_assessment_flat_and_nested(self):
        for nested in [False, True]:
            scores = {"AccuracyScore": 91, "FluencyScore": 85, "CompletenessScore": 100, "PronScore": 89}
            word_scores = {"AccuracyScore": 91, "ErrorType": "None"}
            phoneme_scores = {"AccuracyScore": 82}
            phoneme = {"Phoneme": "h", **({"PronunciationAssessment": phoneme_scores} if nested else phoneme_scores)}
            word = {"Word": "hello", "Phonemes": [phoneme], **({"PronunciationAssessment": word_scores} if nested else word_scores)}
            best = {"Display": "Hello.", "Words": [word], **({"PronunciationAssessment": scores} if nested else scores)}
            with self.subTest(nested=nested), patch.dict(os.environ, {"AZURE_SPEECH_KEY": "test", "AZURE_SPEECH_REGION": "eastus"}), patch.object(server, "cloud_json", return_value={"RecognitionStatus": "Success", "NBest": [best]}) as cloud:
                result = server.pronunciation({"reference": "Hello", "audio": encoded(wav())})
                self.assertEqual(result["scores"]["pronunciation"], 89)
                self.assertEqual(result["words"][0]["phonemes"][0]["accuracy"], 82)
                assessment = json.loads(base64.b64decode(cloud.call_args.args[2]["Pronunciation-Assessment"]))
                self.assertEqual(assessment["Granularity"], "Phoneme")
                self.assertEqual(assessment["ReferenceText"], "Hello")

    def test_missing_scores_not_fabricated(self):
        with patch.dict(os.environ, {"AZURE_SPEECH_KEY": "test", "AZURE_SPEECH_REGION": "eastus"}), patch.object(server, "cloud_json", return_value={"RecognitionStatus": "Success", "NBest": [{"Display": "Hello"}]}), self.assertRaises(server.AppError) as err:
            server.pronunciation({"reference": "Hello", "audio": encoded(wav())})
        self.assertEqual(err.exception.status, 502)

    def test_env_literal_and_no_override(self):
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, {"EXISTING": "keep"}, clear=True):
            path = Path(directory) / ".env"
            path.write_text('EXISTING=replace\nNEW="$(do-not-execute)"\n# ignored\n')
            server.load_env(path)
            self.assertEqual(os.environ["EXISTING"], "keep")
            self.assertEqual(os.environ["NEW"], "$(do-not-execute)")


class HTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()
        cls.port = cls.httpd.server_port

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.thread.join(timeout=2)

    def request(self, method, path, body=None, headers=None):
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        connection.request(method, path, body=body, headers=headers or {})
        response = connection.getresponse()
        status, data = response.status, response.read()
        connection.close()
        return status, data

    def test_loopback_config_allowed(self):
        status, data = self.request("GET", "/api/config")
        self.assertEqual(status, 200)
        self.assertEqual(set(json.loads(data)), {"translation", "pronunciation"})

    def test_host_origin_and_fetch_metadata_blocks(self):
        for headers in [{"Host": "evil.test"}, {"Origin": "https://evil.test"}, {"Origin": "null"}, {"Sec-Fetch-Site": "cross-site"}]:
            with self.subTest(headers=headers):
                self.assertEqual(self.request("GET", "/api/config", headers=headers)[0], 403)

    def test_local_api_and_content_type(self):
        payload = json.dumps({"filename": "hello.txt", "data": encoded(b"Hello world")})
        headers = {"Content-Type": "application/json", "Origin": f"http://127.0.0.1:{self.port}"}
        status, data = self.request("POST", "/api/import", payload, headers)
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(data)["text"], "Hello world")
        self.assertEqual(self.request("POST", "/api/import", payload)[0], 415)

    def test_traversal_and_dotfiles(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            web = root / "web"
            web.mkdir()
            (root / "secret.js").write_text("secret")
            (web / "index.html").write_text("page")
            (web / ".env").write_text("secret")
            with patch.object(server, "WEB", web):
                self.assertEqual(self.request("GET", "/")[0], 200)
                for path in ["/../secret.js", "/%2e%2e/secret.js", "/.env", "/server.py"]:
                    with self.subTest(path=path):
                        self.assertEqual(self.request("GET", path)[0], 404)

    def test_symlink_cannot_escape_static_root(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            web = root / "web"
            web.mkdir()
            (root / "secret.js").write_text("secret")
            try:
                (web / "escape.js").symlink_to(root / "secret.js")
            except (OSError, NotImplementedError) as exc:
                self.skipTest(f"Symlink creation unavailable on this platform: {exc}")
            with patch.object(server, "WEB", web):
                self.assertEqual(self.request("GET", "/escape.js")[0], 404)

    def test_oversized_request_rejected_before_read(self):
        status, _ = self.request("POST", "/api/translate", "{}", {"Content-Type": "application/json", "Content-Length": "40000"})
        self.assertEqual(status, 413)


if __name__ == "__main__":
    unittest.main()
