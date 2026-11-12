// Memora · almacenamiento local (IndexedDB). Nada sale del dispositivo.
const DB_NAME = 'memora';
const DB_VERSION = 1;
export const STORES = ['sources', 'photos', 'faces', 'persons', 'settings'];

let dbPromise = null;

export function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('sources')) db.createObjectStore('sources', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('photos')) {
        const s = db.createObjectStore('photos', { keyPath: 'id' });
        s.createIndex('sourceId', 'sourceId');
      }
      if (!db.objectStoreNames.contains('faces')) {
        const s = db.createObjectStore('faces', { keyPath: 'id' });
        s.createIndex('photoId', 'photoId');
        s.createIndex('personId', 'personId');
      }
      if (!db.objectStoreNames.contains('persons')) db.createObjectStore('persons', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function wrap(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function store(name, mode = 'readonly') {
  const db = await openDB();
  return db.transaction(name, mode).objectStore(name);
}

export async function get(name, key) { return wrap((await store(name)).get(key)); }
export async function all(name) { return wrap((await store(name)).getAll()); }
export async function put(name, value) { return wrap((await store(name, 'readwrite')).put(value)); }
export async function del(name, key) { return wrap((await store(name, 'readwrite')).delete(key)); }
export async function byIndex(name, index, value) {
  return wrap((await store(name)).index(index).getAll(value));
}

export async function putMany(name, values) {
  if (!values.length) return;
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(name, 'readwrite');
    const s = tx.objectStore(name);
    values.forEach((v) => s.put(v));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function delMany(name, keys) {
  if (!keys.length) return;
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(name, 'readwrite');
    const s = tx.objectStore(name);
    keys.forEach((k) => s.delete(k));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAll() {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORES, 'readwrite');
    STORES.forEach((n) => tx.objectStore(n).clear());
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSetting(key, fallback) {
  const row = await get('settings', key);
  return row ? row.value : fallback;
}
export async function setSetting(key, value) { return put('settings', { key, value }); }

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
