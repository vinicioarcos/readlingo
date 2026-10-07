import { timingSafeEqual } from 'node:crypto';

const AZURE_URL = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=es';
const PRODUCTION_ORIGINS = ['https://readlingo.arcdata.app', 'https://readlingo-eight.vercel.app'];
const MAX_BODY = 1024;
const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin' };
function reply(status, body) { return new Response(JSON.stringify(body), { status, headers: HEADERS }); }
function failure(status, error) { return reply(status, { error }); }
function configured(env) {
  return env.READLINGO_TRANSLATION_ENABLED === 'true' && env.AZURE_TRANSLATOR_TIER === 'F0'
    && typeof env.AZURE_TRANSLATOR_KEY === 'string' && /^[A-Za-z0-9_-]{16,256}$/.test(env.AZURE_TRANSLATOR_KEY)
    && /^[a-z][a-z0-9-]{1,39}$/.test(env.AZURE_TRANSLATOR_REGION || '')
    && /^[A-Za-z0-9_-]{32,256}$/.test(env.READLINGO_TRANSLATION_ACCESS_KEY || '');
}
function allowedOrigins(env) {
  const origins = new Set(PRODUCTION_ORIGINS);
  for (const value of (env.READLINGO_TRANSLATION_ALLOWED_ORIGINS || '').split(',')) {
    try { const url = new URL(value.trim()); if (url.protocol === 'https:' && url.origin === value.trim()) origins.add(url.origin); } catch {}
  }
  return origins;
}
async function boundedText(stream, limit) {
  if (!stream) return '';
  const reader = stream.getReader(); let bytes = 0; const chunks = [];
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) { await reader.cancel(); throw new Error('size'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const joined = new Uint8Array(bytes); let offset = 0;
  for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder('utf-8', { fatal: true }).decode(joined);
}
export function createHandlers(env = process.env, fetchProvider = globalThis.fetch, { timeoutMs = 8000 } = {}) {
  const ready = configured(env), origins = allowedOrigins(env);
  return {
    GET() { return reply(200, { translation: ready, pronunciation: false, requiresAccess: true, wordOnly: true, provider: 'Azure Translator', plan: 'F0' }); },
    async POST(request) {
      if (!ready) return failure(503, 'La traducción en línea no está configurada.');
      if (request.method !== 'POST') return failure(405, 'Método no permitido.');
      const url = new URL(request.url), origin = request.headers.get('origin');
      if (url.protocol !== 'https:' || !origins.has(url.origin) || origin !== url.origin) return failure(403, 'Origen no autorizado.');
      const authorization = request.headers.get('authorization') || '';
      const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
      const actual = Buffer.from(token), expected = Buffer.from(env.READLINGO_TRANSLATION_ACCESS_KEY);
      if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return failure(401, 'Acceso de traducción no autorizado.');
      if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return failure(415, 'Se requiere JSON.');
      const declared = request.headers.get('content-length');
      if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY)) return failure(413, 'Solicitud demasiado grande.');
      let input;
      try { input = JSON.parse(await boundedText(request.body, MAX_BODY)); }
      catch { return failure(400, 'Solicitud inválida o demasiado grande.'); }
      if (!input || typeof input !== 'object' || Array.isArray(input) || input.consent !== true
          || typeof input.text !== 'string' || input.text.length > 80
          || !/^[A-Za-z]+(?:['’-][A-Za-z]+)*$/.test(input.text)
          || Object.keys(input).some(key => key !== 'text' && key !== 'consent')) return failure(400, 'Selecciona una palabra inglesa y autoriza su envío.');
      const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchProvider(AZURE_URL, {
          method: 'POST', redirect: 'error', signal: controller.signal,
          headers: { 'Content-Type': 'application/json', 'Ocp-Apim-Subscription-Key': env.AZURE_TRANSLATOR_KEY, 'Ocp-Apim-Subscription-Region': env.AZURE_TRANSLATOR_REGION },
          body: JSON.stringify([{ Text: input.text }])
        });
        if (response.status === 429) return failure(429, 'Se alcanzó la cuota o el límite de Azure. Intenta más tarde.');
        if (!response.ok) return failure(502, 'Azure no pudo traducir la palabra.');
        const data = JSON.parse(await boundedText(response.body, 16384));
        const translated = data?.[0]?.translations?.[0];
        if (translated?.to !== 'es' || typeof translated.text !== 'string' || !translated.text.trim()
            || translated.text.length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(translated.text)) throw new Error('response');
        return reply(200, { translation: translated.text.trim(), source: 'Azure Translator' });
      } catch { return failure(controller.signal.aborted ? 504 : 502, controller.signal.aborted ? 'Azure tardó demasiado. Intenta más tarde.' : 'No se pudo obtener una traducción válida.'); }
      finally { clearTimeout(timeout); }
    }
  };
}
