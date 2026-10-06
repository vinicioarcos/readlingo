'use strict';
// Books stay on this origin. No network or third-party runtime is used.
(function (root) {
  const copy = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function merge(base, local, durable) {
    if (!durable) return copy(local);
    if (!base) base = {version: 1, books: [], currentBook: 'garden', positions: {}, vocab: {}};
    const next = copy(durable);
    const before = new Map(base.books.map(b => [b.id, b]));
    const desired = new Map(local.books.map(b => [b.id, b]));
    const books = new Map(next.books.map(b => [b.id, b]));
    for (const id of before.keys()) if (!desired.has(id)) books.delete(id);
    for (const [id, book] of desired) if (!same(book, before.get(id))) books.set(id, copy(book));
    next.books = [...books.values()];
    for (const field of ['positions', 'vocab']) {
      for (const key of new Set([...Object.keys(base[field]), ...Object.keys(local[field])])) {
        if (same(base[field][key], local[field][key])) continue;
        if (Object.prototype.hasOwnProperty.call(local[field], key)) next[field][key] = copy(local[field][key]);
        else delete next[field][key];
      }
    }
    for (const id of before.keys()) if (!desired.has(id)) delete next.positions[id];
    for (const id of Object.keys(next.positions)) if (id.startsWith('user-') && !books.has(id)) delete next.positions[id];
    if (local.currentBook !== base.currentBook) next.currentBook = local.currentBook;
    // A concurrent deletion can invalidate an unchanged tab's selection.
    if (next.currentBook.startsWith('user-') && !books.has(next.currentBook)) next.currentBook = 'garden';
    return next;
  }
  let db, backend, baseline = null, validate, blocked = false, queue = Promise.resolve();
  const legacyKey = 'readlingo.v1';
  function open() {
    return new Promise((resolve, reject) => {
      const request = root.indexedDB.open('readlingo-durable', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('snapshots');
      request.onsuccess = () => {
        db = request.result;
        db.onversionchange = () => db.close();
        resolve();
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(Error('Cierra otras pestañas de ReadLingo para abrir el almacenamiento.'));
    });
  }
  function transaction(write, transform) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('snapshots', write ? 'readwrite' : 'readonly');
      const store = tx.objectStore('snapshots');
      let result, failure;
      const request = store.get('current');
      request.onsuccess = () => {
        try {
          result = transform(request.result || null);
          if (write) store.put(result, 'current');
        } catch (error) { failure = error; tx.abort(); }
      };
      tx.oncomplete = () => resolve(result);
      tx.onabort = tx.onerror = () => reject(failure || tx.error || Error('No se pudo guardar el progreso.'));
    });
  }
  function checked(record) {
    if (!record) return null;
    if (!Number.isSafeInteger(record.revision) || record.revision < 1) throw Error('El almacenamiento contiene datos dañados. Exporta o restaura un respaldo.');
    return {state: validate(record.state), revision: record.revision, backend};
  }
  function legacy() {
    const raw = root.localStorage.getItem(legacyKey);
    return raw === null ? null : validate(JSON.parse(raw));
  }
  async function load(check) {
    validate = check;
    try {
      if (root.indexedDB) {
        try { await open(); backend = 'indexedDB'; }
        catch (error) { backend = 'localStorage'; }
      } else backend = 'localStorage';
      let result;
      if (backend === 'indexedDB') {
        result = checked(await transaction(false, r => r));
        if (!result) {
          const migrated = legacy();
          if (migrated) result = checked(await transaction(true, r => r || {state: migrated, revision: 1}));
        }
      } else {
        const state = legacy();
        result = state ? {state, revision: 1, backend} : null;
      }
      baseline = copy(result?.state || null);
      blocked = false;
      return result || {state: null, revision: 0, backend};
    } catch (error) { blocked = true; throw error; }
  }
  function commit(state, replace) {
    const requested = copy(state);
    const operation = queue.then(async () => {
      if (blocked && !replace) throw Error('Los datos guardados no se pudieron leer. Restaura un respaldo antes de guardar.');
      const local = validate(requested);
      let result;
      if (backend === 'indexedDB') {
        const record = await transaction(true, current => {
          const durable = replace ? null : checked(current)?.state;
          return {state: validate(replace ? local : merge(baseline, local, durable)), revision: (current?.revision || 0) + 1};
        });
        result = checked(record);
      } else {
        const durable = replace ? null : legacy();
        const merged = validate(replace ? local : merge(baseline, local, durable));
        root.localStorage.setItem(legacyKey, JSON.stringify(merged));
        result = {state: merged, revision: 1, backend: 'localStorage'};
      }
      baseline = copy(local);
      blocked = false;
      return result;
    });
    queue = operation.catch(() => {});
    return operation;
  }
  const api = {
    load, save: state => commit(state, false), replace: state => commit(state, true),
    read: async () => { await queue; return backend === 'indexedDB' ? checked(await transaction(false, r => r))?.state || null : legacy(); },
    recovery: async () => {
      if (backend === 'indexedDB') {
        const record = await transaction(false, r => r);
        if (record) return JSON.stringify(record, null, 2);
      }
      return root.localStorage.getItem(legacyKey) || '';
    },
    protect: async () => root.navigator?.storage?.persist ? root.navigator.storage.persist() : false
  };
  root.ReadLingoStore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = {merge};
})(typeof window !== 'undefined' ? window : globalThis);
