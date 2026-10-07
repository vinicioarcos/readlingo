import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandlers } from '../lib/translation.mjs';

const origin = 'https://readlingo.arcdata.app';
const env = { READLINGO_TRANSLATION_ENABLED: 'true', AZURE_TRANSLATOR_TIER: 'F0', AZURE_TRANSLATOR_KEY: 'azure_private_key_123456789', AZURE_TRANSLATOR_REGION: 'eastus', READLINGO_TRANSLATION_ACCESS_KEY: 'personal_access_123456789012345678901234567890' };
function request(body = { text: 'sheep', consent: true }, headers = {}, url = origin + '/api/translate') {
  return new Request(url, { method: 'POST', headers: { origin, 'content-type': 'application/json', authorization: `Bearer ${env.READLINGO_TRANSLATION_ACCESS_KEY}`, ...headers }, body: JSON.stringify(body) });
}
function noFetch() { throw new Error('Provider must not be called'); }
const ok = () => new Response(JSON.stringify([{ translations: [{ text: 'oveja', to: 'es' }] }]));

test('Configuration exposes indicators only; disabled by default and paid tiers blocked', async () => {
  for (const settings of [{}, { ...env, READLINGO_TRANSLATION_ENABLED: 'false' }, { ...env, AZURE_TRANSLATOR_TIER: 'S1' }, { ...env, READLINGO_TRANSLATION_ACCESS_KEY: 'short' }, { ...env, AZURE_TRANSLATOR_REGION: '' }]) {
    const handlers = createHandlers(settings, noFetch);
    const config = await handlers.GET().json(); assert.equal(config.translation, false);
    assert.equal((await handlers.POST(request())).status, 503);
  }
  const response = createHandlers(env, noFetch).GET();
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { translation: true, pronunciation: false, requiresAccess: true, wordOnly: true, provider: 'Azure Translator', plan: 'F0' });
});
test('HTTPS exact same-origin allowlist and bearer authentication required before provider', async () => {
  const handler = createHandlers(env, noFetch).POST;
  for (const bad of [request(undefined, { origin: 'https://evil.example' }), request(undefined, { origin: '' }), request(undefined, {}, 'http://readlingo.arcdata.app/api/translate'), request(undefined, { origin: 'https://unapproved.vercel.app' }, 'https://unapproved.vercel.app/api/translate')]) assert.equal((await handler(bad)).status, 403);
  for (const auth of ['', 'Bearer wrong', `Basic ${env.READLINGO_TRANSLATION_ACCESS_KEY}`, `Bearer ${'x'.repeat(env.READLINGO_TRANSLATION_ACCESS_KEY.length)}`]) assert.equal((await handler(request(undefined, { authorization: auth }))).status, 401);
});
test('Single word, explicit consent, strict JSON shape and bounded body', async () => {
  const handler = createHandlers(env, noFetch).POST;
  for (const body of [{ text: 'two words', consent: true }, { text: '<script>', consent: true }, { text: 'a'.repeat(81), consent: true }, { text: '', consent: true }, { text: 'sheep' }, { text: 'sheep', consent: false }, { text: 'sheep', consent: true, book: 'private' }, null, []]) assert.equal((await handler(request(body))).status, 400);
  assert.equal((await handler(request(undefined, { 'content-type': 'text/plain' }))).status, 415);
  assert.equal((await handler(request(undefined, { 'content-length': '1025' }))).status, 413);
  assert.equal((await handler(request({ text: 'a'.repeat(2000), consent: true }))).status, 400);
  const invalid = new Request(origin + '/api/translate', { method: 'POST', headers: { origin, authorization: `Bearer ${env.READLINGO_TRANSLATION_ACCESS_KEY}`, 'content-type': 'application/json' }, body: '{' });
  assert.equal((await handler(invalid)).status, 400);
});
test('Only selected word sent to fixed Azure endpoint; no retry or redirect; no credentials returned', async () => {
  let calls = 0;
  const handler = createHandlers(env, async (url, options) => {
    calls++; assert.equal(url, 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=es');
    assert.equal(options.redirect, 'error'); assert.equal(options.method, 'POST');
    assert.equal(options.headers['Ocp-Apim-Subscription-Key'], env.AZURE_TRANSLATOR_KEY);
    assert.equal(options.headers['Ocp-Apim-Subscription-Region'], 'eastus');
    assert.deepEqual(JSON.parse(options.body), [{ Text: "don't" }]); return ok();
  }).POST;
  const response = await handler(request({ text: "don't", consent: true }));
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { translation: 'oveja', source: 'Azure Translator' }); assert.equal(calls, 1);
});
test('Quota and upstream failures sanitized without retries or provider body disclosure', async () => {
  for (const status of [429, 401, 403, 500]) {
    let calls = 0;
    const response = await createHandlers(env, async () => { calls++; return new Response(env.AZURE_TRANSLATOR_KEY, { status }); }).POST(request());
    assert.equal(response.status, status === 429 ? 429 : 502); assert.equal(calls, 1);
    const text = await response.text(); assert.ok(!text.includes(env.AZURE_TRANSLATOR_KEY)); assert.ok(!text.includes(env.READLINGO_TRANSLATION_ACCESS_KEY));
  }
});
test('Malformed, oversized, missing-language and empty provider results rejected', async () => {
  for (const body of ['invalid', '{}', JSON.stringify([{ translations: [{ text: '', to: 'es' }] }]), JSON.stringify([{ translations: [{ text: 'word', to: 'en' }] }]), JSON.stringify([{ translations: [{ text: 'a'.repeat(501), to: 'es' }] }]), 'x'.repeat(16385)]) {
    assert.equal((await createHandlers(env, async () => new Response(body)).POST(request())).status, 502);
  }
});
test('Abort bounds Azure fetch and response streaming; failures never log request data', async () => {
  const fetchUntilAbort = async (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error(env.AZURE_TRANSLATOR_KEY)), { once: true }));
  const response = await createHandlers(env, fetchUntilAbort, { timeoutMs: 5 }).POST(request());
  assert.equal(response.status, 504); assert.ok(!(await response.text()).includes(env.AZURE_TRANSLATOR_KEY));
  const stalledBody = async (_url, { signal }) => new Response(new ReadableStream({
    start(controller) { signal.addEventListener('abort', () => controller.error(new Error('aborted response')), { once: true }); }
  }));
  assert.equal((await createHandlers(env, stalledBody, { timeoutMs: 5 }).POST(request())).status, 504);
  assert.equal((await createHandlers(env, async () => { throw new Error('private details'); }).POST(request())).status, 502);
});
test('Incoming stream is bounded without trusting content-length and invalid UTF-8 is rejected', async () => {
  const headers = { origin, authorization: `Bearer ${env.READLINGO_TRANSLATION_ACCESS_KEY}`, 'content-type': 'application/json' };
  let cancelled = false;
  const oversized = new Request(origin + '/api/translate', { method: 'POST', headers, duplex: 'half', body: new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(1025)); }, cancel() { cancelled = true; } }) });
  assert.equal((await createHandlers(env, noFetch).POST(oversized)).status, 400); assert.equal(cancelled, true);
  const invalid = new Request(origin + '/api/translate', { method: 'POST', headers, body: new Uint8Array([0xff, 0xfe]) });
  assert.equal((await createHandlers(env, noFetch).POST(invalid)).status, 400);
});
test('Explicit server origin extension supports exact HTTPS preview, rejects wildcards and paths', async () => {
  const preview = 'https://readlingo-private.vercel.app';
  const handler = createHandlers({ ...env, READLINGO_TRANSLATION_ALLOWED_ORIGINS: `${preview},https://*.vercel.app,http://bad.example,https://path.example/a` }, ok).POST;
  assert.equal((await handler(request(undefined, { origin: preview }, preview + '/api/translate'))).status, 200);
  assert.equal((await handler(request(undefined, { origin: 'https://path.example' }, 'https://path.example/api/translate'))).status, 403);
});
