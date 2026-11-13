// Memora · carpetas elegidas por el usuario, detección facial on-device y agrupado por persona.
import * as db from './db.js';
import { measure, classify } from './quality.js';

const IMG_RE = /\.(jpe?g|png|webp|gif|bmp|avif)$/i;
const DETECT_MAX = 960;   // lado máximo usado para detectar (ahorra memoria en móvil)
const THUMB_MAX = 320;
const FACE_THUMB = 128;
export const DEFAULT_THRESHOLD = 0.5; // distancia euclídea entre descriptores (menor = más estricto)

// Archivos elegidos con <input webkitdirectory> (Android): sólo viven en memoria durante la sesión.
const sessionFiles = new Map(); // sourceId -> Map(path -> File)

// Dentro de un iframe (vista previa embebida) el selector nativo está bloqueado: se usa el selector de archivos.
export const isEmbedded = (() => { try { return window.self !== window.top; } catch { return true; } })();
// En el APK (WebView) el selector nativo de escritorio existe pero no funciona: se usa el del sistema.
export const supportsFSA = () => typeof window.showDirectoryPicker === 'function' && !isEmbedded && typeof window.MemoraNative === 'undefined';

/* ---------- Carpetas ---------- */

export async function addSourceFromPicker() {
  const handle = await window.showDirectoryPicker({ id: 'memora-src', mode: 'read' });
  const sources = await db.all('sources');
  for (const s of sources) {
    if (s.kind === 'fsa' && s.handle && (await s.handle.isSameEntry(handle).catch(() => false))) return s;
  }
  const src = { id: db.uid('src'), name: handle.name, kind: 'fsa', handle, enabled: true, recursive: true, addedAt: Date.now(), photoCount: 0 };
  await db.put('sources', src);
  return src;
}

const dirOf = (path) => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '');

// Cuenta fotos por subcarpeta: { '': 4, 'Camera': 1200, 'Pies': 122 } (vacío = fotos sueltas en la raíz).
export function countDirs(paths) {
  const dirs = {};
  for (const p of paths) { const d = dirOf(p); dirs[d] = (dirs[d] || 0) + 1; }
  return dirs;
}

export async function addSourceFromFiles(fileList) {
  const all = [...fileList];
  let nativeName = ''; let nativePaths = null;
  try {
    nativeName = window.MemoraNative?.lastFolderName?.() || '';
    const raw = window.MemoraNative?.pickedPaths?.();
    if (raw) { const arr = JSON.parse(raw); if (arr.length === all.length) nativePaths = arr; }
  } catch { /* sin puente */ }
  // Ruta relativa de cada archivo (sin la carpeta elegida): 'Pies/IMG_01.jpg' o 'IMG_02.jpg'.
  const relOf = (f, i) => {
    if (nativePaths && nativePaths[i] && nativePaths[i].endsWith(f.name)) return nativePaths[i];
    if (f.webkitRelativePath) return f.webkitRelativePath.split('/').slice(1).join('/') || f.name;
    return f.name;
  };
  const entries = all.map((f, i) => ({ f, path: relOf(f, i) })).filter(({ f }) => IMG_RE.test(f.name) || (f.type || '').startsWith('image/'));
  const first = all[0];
  const rel = (first && first.webkitRelativePath) || '';
  const name = rel.split('/')[0] || nativeName || 'Carpeta';
  const sources = await db.all('sources');
  let src = sources.find((s) => s.kind === 'input' && s.name === name);
  if (!src) src = { id: db.uid('src'), name, kind: 'input', enabled: true, recursive: true, addedAt: Date.now(), photoCount: 0 };
  // Se ve al instante: la carpeta y sus subcarpetas con su cantidad de fotos, antes de analizar nada.
  src.dirs = countDirs(entries.map((e) => e.path));
  src.photoCount = entries.length;
  await db.put('sources', src);
  const map = new Map();
  entries.forEach(({ f, path }) => map.set(path, f));
  sessionFiles.set(src.id, map);
  return src;
}

export async function sourceAccess(src) {
  if (src.kind === 'input') return sessionFiles.has(src.id) ? 'granted' : 'reselect';
  if (!src.handle) return 'reselect';
  try { return await src.handle.queryPermission({ mode: 'read' }); } catch { return 'prompt'; }
}

export async function requestAccess(src) {
  if (src.kind !== 'fsa' || !src.handle) return false;
  try { return (await src.handle.requestPermission({ mode: 'read' })) === 'granted'; } catch { return false; }
}

async function* walk(dir, recursive, prefix = '') {
  for await (const entry of dir.values()) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.kind === 'file' && IMG_RE.test(entry.name)) yield { path, getFile: () => entry.getFile() };
    else if (entry.kind === 'directory' && recursive && !entry.name.startsWith('.')) yield* walk(entry, recursive, path);
  }
}

async function listFiles(src) {
  const out = [];
  if (src.kind === 'input') {
    const map = sessionFiles.get(src.id);
    if (!map) throw new Error('reselect');
    for (const [path, file] of map) {
      if (!src.recursive && path.includes('/')) continue;
      out.push({ path, getFile: async () => file });
    }
    return out;
  }
  for await (const f of walk(src.handle, src.recursive)) out.push(f);
  return out;
}

export async function getOriginal(photo) {
  const src = await db.get('sources', photo.sourceId);
  if (!src) return null;
  if (src.kind === 'input') return sessionFiles.get(src.id)?.get(photo.path) || null;
  if ((await sourceAccess(src)) !== 'granted') return null;
  try {
    const parts = photo.path.split('/');
    let dir = src.handle;
    for (const p of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(p);
    return await (await dir.getFileHandle(parts.at(-1))).getFile();
  } catch { return null; }
}

/* ---------- Motor facial (carga diferida: ~8 MB sólo cuando se escanea) ---------- */

let faceapi = null;
let modelsReady = null;

export function loadModels() {
  if (modelsReady) return modelsReady;
  modelsReady = (async () => {
    const base = new URL('../vendor/', import.meta.url).href;
    faceapi = await import(new URL('face-api.esm.js', base).href);
    // WebGL (GPU) si está; si no, CPU. Se evita el backend wasm porque no se distribuye su .wasm.
    let ok = false;
    try { ok = await faceapi.tf.setBackend('webgl'); } catch { ok = false; }
    if (!ok) await faceapi.tf.setBackend('cpu');
    await faceapi.tf.ready();
    const models = new URL('models/', base).href;
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(models),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(models),
      faceapi.nets.faceRecognitionNet.loadFromUri(models),
    ]);
    return faceapi;
  })();
  modelsReady.catch(() => { modelsReady = null; });
  return modelsReady;
}

function canvasFrom(bitmap, max) {
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bitmap.width * scale);
  c.height = Math.round(bitmap.height * scale);
  c.getContext('2d').drawImage(bitmap, 0, 0, c.width, c.height);
  return { canvas: c, scale };
}

const toBlob = (canvas, q = 0.78) => new Promise((r) => canvas.toBlob(r, 'image/jpeg', q));

async function faceThumb(canvas, box) {
  const m = Math.max(box.width, box.height) * 0.35;
  const size = Math.max(box.width, box.height) + m * 2;
  const sx = Math.max(0, box.x + box.width / 2 - size / 2);
  const sy = Math.max(0, box.y + box.height / 2 - size / 2);
  const c = document.createElement('canvas');
  c.width = c.height = FACE_THUMB;
  c.getContext('2d').drawImage(canvas, sx, sy, size, size, 0, 0, FACE_THUMB, FACE_THUMB);
  return toBlob(c, 0.82);
}

// Huella visual (dHash 64 bits) para encontrar fotos casi iguales.
export function dhash(source) {
  const c = document.createElement('canvas'); c.width = 9; c.height = 8;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(source, 0, 0, 9, 8);
  const d = g.getImageData(0, 0, 9, 8).data;
  let bits = '';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const i = (y * 9 + x) * 4; const j = i + 4;
    bits += (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) > (d[j] * 0.3 + d[j + 1] * 0.59 + d[j + 2] * 0.11) ? '1' : '0';
  }
  let hex = ''; for (let k = 0; k < 64; k += 4) hex += parseInt(bits.slice(k, k + 4), 2).toString(16);
  return hex;
}

const hamming = (a, b) => {
  let n = 0;
  for (let i = 0; i < 16; i++) { let x = parseInt(a[i], 16) ^ parseInt(b[i], 16); while (x) { n += x & 1; x >>= 1; } }
  return n;
};

// Fotos indexadas antes de esta versión no tienen huella: se calcula desde la miniatura.
export async function ensureHashes() {
  const photos = (await db.all('photos')).filter((p) => !p.hash && p.thumb);
  for (const p of photos) {
    try { const bmp = await createImageBitmap(p.thumb); p.hash = dhash(bmp); bmp.close?.(); await db.put('photos', p); } catch { /* miniatura ilegible */ }
  }
  return photos.length;
}

// Grupos de fotos casi idénticas (distancia de huella <= 5). Se sugiere conservar la más pesada.
export function findDuplicates(photos) {
  const list = photos.filter((p) => p.hash);
  const used = new Set(); const groups = [];
  for (let i = 0; i < list.length; i++) {
    if (used.has(list[i].id)) continue;
    const g = [list[i]];
    for (let j = i + 1; j < list.length; j++) {
      if (!used.has(list[j].id) && hamming(list[i].hash, list[j].hash) <= 5) { g.push(list[j]); used.add(list[j].id); }
    }
    if (g.length > 1) { used.add(list[i].id); groups.push(g.sort((a, b) => b.size - a.size)); }
  }
  return groups;
}

export async function setFavorite(photoId, fav) {
  const p = await db.get('photos', photoId); if (!p) return;
  p.fav = fav; await db.put('photos', p);
}

const dist = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; } return Math.sqrt(s); };

/* ---------- Analizador: Web Worker con respaldo en el hilo principal ---------- */

let analyzerPromise = null;

function workerAnalyzer() {
  return new Promise((resolve, reject) => {
    if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') { reject(new Error('sin worker')); return; }
    let w;
    try { w = new Worker(new URL('./analyze-worker.js', import.meta.url), { type: 'module' }); } catch (e) { reject(e); return; }
    const pending = new Map(); let seq = 0;
    const fail = (err) => { pending.forEach((p) => p.reject(err)); pending.clear(); };
    w.onmessage = (e) => { const p = pending.get(e.data.id); if (!p) return; pending.delete(e.data.id); if (e.data.ok) p.resolve(e.data); else p.reject(new Error(e.data.error)); };
    w.onerror = (e) => { e.preventDefault?.(); fail(new Error(e.message || 'worker')); };
    const call = (msg) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { resolve: res, reject: rej }); w.postMessage({ ...msg, id }); });
    const timer = setTimeout(() => { fail(new Error('el worker no respondió')); w.terminate(); }, 30000);
    call({ type: 'ping' }).then(() => {
      clearTimeout(timer);
      resolve({
        mode: 'worker',
        index: async (file) => (await call({ type: 'index', file })).out,
        faces: async (file) => (await call({ type: 'faces', file })).out,
      });
    }, (err) => { clearTimeout(timer); w.terminate(); reject(err); });
  });
}

function mainAnalyzer() {
  return {
    mode: 'main',
    index: async (file) => {
      let bitmap;
      try { bitmap = await createImageBitmap(file); } catch { throw new Error('unsupported'); }
      const origW = bitmap.width; const origH = bitmap.height;
      const thumbCanvas = canvasFrom(bitmap, THUMB_MAX).canvas;
      const small = canvasFrom(bitmap, 384).canvas;
      bitmap.close?.();
      const d = small.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, small.width, small.height).data;
      const q = measure(d, small.width, small.height);
      return { thumb: await toBlob(thumbCanvas), hash: dhash(thumbCanvas), origW, origH, q, kind: classify(file.name, q) };
    },
    faces: async (file) => {
      await loadModels();
      let bitmap;
      try { bitmap = await createImageBitmap(file); } catch { throw new Error('unsupported'); }
      const { canvas, scale } = canvasFrom(bitmap, DETECT_MAX);
      bitmap.close?.();
      const results = await faceapi.detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
        .withFaceLandmarks(true).withFaceDescriptors();
      const faces = [];
      for (const r of results) {
        const box = r.detection.box;
        if (box.width < 24 || box.height < 24) continue;
        faces.push({ descriptor: Array.from(r.descriptor), box: { x: box.x / scale, y: box.y / scale, w: box.width / scale, h: box.height / scale }, thumb: await faceThumb(canvas, box) });
      }
      return { faces };
    },
  };
}

export function getAnalyzer() {
  if (!analyzerPromise) {
    analyzerPromise = workerAnalyzer().catch((err) => {
      console.warn('[pompa] sin segundo plano, analizo en el hilo principal:', err?.message || err);
      return mainAnalyzer();
    });
  }
  return analyzerPromise;
}

/* ---------- Escaneo en dos pasadas ---------- */

// Ya pasó por la búsqueda de caras (los índices viejos no tienen facesDone pero sí faceCount).
export const facesDone = (p) => p.facesDone === true || (p.facesDone === undefined && typeof p.faceCount === 'number');
// Papeles y capturas no se analizan en busca de caras: ahorra mucho tiempo.
const wantsFaces = (p) => (p.kind || 'photo') === 'photo';

export async function scan({ sourceIds = null, onProgress = () => {}, signal } = {}) {
  const threshold = await db.getSetting('threshold', DEFAULT_THRESHOLD);
  const sources = (await db.all('sources')).filter((s) => s.enabled && (!sourceIds || sourceIds.includes(s.id)));
  const persons = new Map((await db.all('persons')).map((p) => [p.id, p]));
  const report = { scanned: 0, skipped: 0, faces: 0, unsupported: 0, blocked: [], docs: 0, shots: 0 };
  const analyzer = await getAnalyzer();
  const queue = []; // fotos que esperan la búsqueda de caras

  // Pasada 1: ordenar todas las fotos (rápido). La galería ya se puede usar al terminar.
  for (const src of sources) {
    if ((await sourceAccess(src)) !== 'granted') { report.blocked.push(src.name); continue; }
    let files;
    try { files = await listFiles(src); } catch { report.blocked.push(src.name); continue; }
    const known = new Map((await db.byIndex('photos', 'sourceId', src.id)).map((p) => [p.id, p]));
    // Índices viejos guardaban sólo el nombre (sin subcarpeta): se migran sin perder caras, nombres ni favoritas.
    const flat = new Map();
    for (const p of known.values()) if (!p.path.includes('/')) flat.set(`${p.name}|${p.size}`, p);
    const seen = new Set();
    let done = 0;
    for (const f of files) {
      if (signal?.aborted) return { ...report, aborted: true };
      const id = `${src.id}:${f.path}`;
      seen.add(id);
      if (!known.has(id) && f.path.includes('/')) {
        try {
          const file0 = await f.getFile();
          const old = flat.get(`${file0.name}|${file0.size}`);
          if (old && !seen.has(old.id)) {
            const moved = { ...old, id, path: f.path };
            const faces = await db.byIndex('faces', 'photoId', old.id);
            faces.forEach((x) => { x.photoId = id; });
            await db.put('photos', moved); await db.putMany('faces', faces); await db.del('photos', old.id);
            known.delete(old.id); known.set(id, moved); flat.delete(`${file0.name}|${file0.size}`);
          }
        } catch { /* sigue como foto nueva */ }
      }
      onProgress({ phase: 'index', label: 'Ordenando fotos', source: src.name, done: done++, total: files.length });
      let file;
      try { file = await f.getFile(); } catch { continue; }
      const prev = known.get(id);
      const same = prev && prev.size === file.size && prev.lastModified === file.lastModified;
      if (same && prev.q) {
        report.skipped++;
        if (!facesDone(prev) && wantsFaces(prev) && !prev.hidden) queue.push({ f, id, src });
        continue;
      }
      if (prev && !same) await dropPhotoFaces(id, persons);
      let a;
      try { a = await analyzer.index(file); } catch (e) {
        if (e?.message !== 'unsupported') console.warn('[pompa] no se pudo ordenar', f.path, e);
        report.unsupported++; continue;
      }
      const keepFaces = same && facesDone(prev);
      const photo = {
        ...(keepFaces ? prev : {}),
        id, sourceId: src.id, path: f.path, name: file.name, size: file.size, lastModified: file.lastModified,
        thumb: a.thumb, hash: a.hash, origW: a.origW, origH: a.origH, q: a.q, kind: a.kind,
        faceCount: keepFaces ? prev.faceCount : 0, facesDone: keepFaces || !wantsFaces(a),
        hidden: prev?.hidden || false, fav: prev?.fav || false, scannedAt: Date.now(),
      };
      await db.put('photos', photo);
      if (a.kind === 'doc') report.docs++;
      if (a.kind === 'screenshot') report.shots++;
      if (!photo.facesDone) queue.push({ f, id, src });
      report.scanned++;
      await new Promise((r) => setTimeout(r, 0));
    }
    // Fotos borradas del disco: se limpian del índice (no se toca el archivo original).
    const gone = [...known.keys()].filter((k) => !seen.has(k));
    for (const k of gone) await dropPhotoFaces(k, persons);
    await db.delMany('photos', gone);
    src.photoCount = seen.size; src.lastScan = Date.now();
    src.dirs = countDirs(files.map((x) => x.path));
    await db.put('sources', src);
  }
  onProgress({ phase: 'indexed', label: 'Fotos ordenadas', source: '', done: 1, total: 1, pending: queue.length });

  // Pasada 2: buscar caras sólo en las fotos que lo necesitan.
  let i = 0;
  for (const { f, id, src } of queue) {
    if (signal?.aborted) { await recount(); return { ...report, aborted: true }; }
    onProgress({ phase: 'faces', label: 'Buscando caras', source: src.name, done: i++, total: queue.length });
    let file; let r;
    try { file = await f.getFile(); r = await analyzer.faces(file); } catch (e) {
      if (e?.message !== 'unsupported') console.warn('[pompa] caras falló', f.path, e);
      continue;
    }
    const photo = await db.get('photos', id); if (!photo) continue;
    const faces = [];
    for (const fc of r.faces) {
      const descriptor = fc.descriptor;
      let best = null; let bestD = Infinity;
      for (const p of persons.values()) {
        if (!p.centroid) continue;
        const d = dist(descriptor, p.centroid);
        if (d < bestD) { bestD = d; best = p; }
      }
      const faceId = db.uid('face');
      if (!best || bestD > threshold) {
        best = { id: db.uid('per'), name: '', hidden: false, centroid: descriptor, count: 0, coverFaceId: faceId, createdAt: Date.now() };
        persons.set(best.id, best);
      }
      best.centroid = best.centroid.map((v, k) => (v * best.count + descriptor[k]) / (best.count + 1));
      best.count += 1;
      faces.push({ id: faceId, photoId: id, personId: best.id, descriptor, box: fc.box, thumb: fc.thumb });
    }
    photo.faceCount = faces.length; photo.facesDone = true;
    await db.put('photos', photo);
    await db.putMany('faces', faces);
    await db.putMany('persons', [...new Set(faces.map((x) => x.personId))].map((pid) => persons.get(pid)));
    report.faces += faces.length;
    await new Promise((res) => setTimeout(res, 0));
  }
  await recount();
  onProgress({ phase: 'done', done: 1, total: 1 });
  return report;
}

/* ---------- Borrar del dispositivo (con confirmación del usuario) ---------- */

// Devuelve { deleted, failed, cantHere }. cantHere = carpetas donde este navegador no permite borrar.
export async function deletePhotos(photos, onProgress = () => {}) {
  const out = { deleted: 0, failed: 0, cantHere: 0 };
  const sources = new Map((await db.all('sources')).map((s) => [s.id, s]));
  const granted = new Set();
  let i = 0;
  for (const p of photos) {
    onProgress(++i, photos.length);
    const src = sources.get(p.sourceId);
    let ok = false;
    try {
      if (src?.kind === 'fsa' && src.handle) {
        if (!granted.has(src.id)) {
          const perm = await src.handle.requestPermission({ mode: 'readwrite' });
          if (perm !== 'granted') { out.failed++; continue; }
          granted.add(src.id);
        }
        const parts = p.path.split('/');
        let dir = src.handle;
        for (const part of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(part);
        await dir.removeEntry(parts.at(-1));
        ok = true;
      } else if (src?.kind === 'input' && typeof window.MemoraNative !== 'undefined') {
        ok = !!window.MemoraNative.deleteFile(src.name, p.path);
      } else { out.cantHere++; continue; }
    } catch (e) { console.warn('[pompa] no se pudo borrar', p.path, e); ok = false; }
    if (!ok) { out.failed++; continue; }
    await dropPhotoFaces(p.id);
    await db.del('photos', p.id);
    sessionFiles.get(p.sourceId)?.delete(p.path);
    if (src) { src.photoCount = Math.max(0, (src.photoCount || 1) - 1); }
    out.deleted++;
  }
  for (const s of sources.values()) await db.put('sources', s);
  await recount();
  return out;
}

export const canDeleteHere = (src) => (src?.kind === 'fsa') || (src?.kind === 'input' && typeof window.MemoraNative !== 'undefined');

async function dropPhotoFaces(photoId, personsMap) {
  const faces = await db.byIndex('faces', 'photoId', photoId);
  await db.delMany('faces', faces.map((f) => f.id));
  if (personsMap) faces.forEach((f) => { const p = personsMap.get(f.personId); if (p) p.count = Math.max(0, p.count - 1); });
}

/* ---------- Organización (todo queda a disposición del usuario) ---------- */

// Recalcula contadores/centroides y elimina personas sin caras.
export async function recount() {
  const faces = await db.all('faces');
  const persons = await db.all('persons');
  const groups = new Map();
  faces.forEach((f) => { if (!groups.has(f.personId)) groups.set(f.personId, []); groups.get(f.personId).push(f); });
  const keep = []; const drop = [];
  for (const p of persons) {
    const g = groups.get(p.id);
    if (!g || !g.length) { drop.push(p.id); continue; }
    const len = g[0].descriptor.length;
    const c = new Array(len).fill(0);
    g.forEach((f) => f.descriptor.forEach((v, i) => { c[i] += v / g.length; }));
    p.centroid = c; p.count = g.length;
    if (!g.some((f) => f.id === p.coverFaceId)) p.coverFaceId = g[0].id;
    keep.push(p);
  }
  await db.putMany('persons', keep);
  await db.delMany('persons', drop);
}

export async function renamePerson(id, name) {
  const p = await db.get('persons', id); if (!p) return;
  p.name = name.trim().slice(0, 40); await db.put('persons', p);
}

export async function setPersonHidden(id, hidden) {
  const p = await db.get('persons', id); if (!p) return;
  p.hidden = hidden; await db.put('persons', p);
}

export async function setCover(personId, faceId) {
  const p = await db.get('persons', personId); if (!p) return;
  p.coverFaceId = faceId; await db.put('persons', p);
}

export async function mergePersons(targetId, otherIds) {
  const target = await db.get('persons', targetId);
  for (const oid of otherIds) {
    if (oid === targetId) continue;
    const other = await db.get('persons', oid);
    const faces = await db.byIndex('faces', 'personId', oid);
    faces.forEach((f) => { f.personId = targetId; });
    await db.putMany('faces', faces);
    if (target && !target.name && other?.name) target.name = other.name;
  }
  if (target) await db.put('persons', target);
  await recount();
}

// Fotos donde aparecen TODAS las personas elegidas.
export function together(people, ids) {
  const sets = ids.map((id) => new Set((people.find((p) => p.id === id)?.items || []).map((i) => i.photo.id)));
  if (!sets.length) return [];
  const first = people.find((p) => p.id === ids[0]);
  return (first?.items || []).filter((i) => !i.photo.hidden && sets.every((s) => s.has(i.photo.id)));
}

// Reagrupa sólo las caras "Sin nombre"; las personas con nombre quedan fijas.
export async function regroup(threshold = DEFAULT_THRESHOLD) {
  await db.setSetting('threshold', threshold);
  const persons = await db.all('persons');
  const fixed = persons.filter((p) => p.name);
  const loose = persons.filter((p) => !p.name);
  const looseIds = new Set(loose.map((p) => p.id));
  const hiddenLoose = new Set(loose.filter((p) => p.hidden).map((p) => p.id));
  const faces = (await db.all('faces')).filter((f) => looseIds.has(f.personId) && !hiddenLoose.has(f.personId));
  const groups = fixed.map((p) => ({ p, sum: p.centroid.slice(), n: p.count || 1 }));
  for (const f of faces) {
    let best = null; let bestD = Infinity;
    for (const g of groups) { const d = dist(f.descriptor, g.sum); if (d < bestD) { bestD = d; best = g; } }
    if (!best || bestD > threshold) {
      best = { p: { id: db.uid('per'), name: '', hidden: false, centroid: f.descriptor, count: 0, coverFaceId: f.id, createdAt: Date.now() }, sum: f.descriptor.slice(), n: 0 };
      groups.push(best);
    }
    best.sum = best.sum.map((v, i) => (v * best.n + f.descriptor[i]) / (best.n + 1)); best.n += 1;
    f.personId = best.p.id;
  }
  await db.putMany('faces', faces);
  await db.putMany('persons', groups.map((g) => ({ ...g.p, centroid: g.sum })));
  await db.delMany('persons', loose.filter((p) => !hiddenLoose.has(p.id)).map((p) => p.id));
  await recount();
}

// "No es esta persona": saca la cara a una persona nueva.
export async function detachFace(faceId) {
  const f = await db.get('faces', faceId); if (!f) return null;
  const p = { id: db.uid('per'), name: '', hidden: false, centroid: f.descriptor, count: 1, coverFaceId: f.id, createdAt: Date.now() };
  f.personId = p.id;
  await db.put('persons', p); await db.put('faces', f);
  await recount();
  return p.id;
}

export async function setPhotoHidden(photoId, hidden) {
  const p = await db.get('photos', photoId); if (!p) return;
  p.hidden = hidden; await db.put('photos', p);
}

export async function setSource(id, patch) {
  const s = await db.get('sources', id); if (!s) return;
  Object.assign(s, patch); await db.put('sources', s);
}

// Quitar carpeta = olvidar su índice. Los archivos originales NO se tocan.
export async function removeSource(id) {
  const photos = await db.byIndex('photos', 'sourceId', id);
  for (const p of photos) await dropPhotoFaces(p.id);
  await db.delMany('photos', photos.map((p) => p.id));
  await db.del('sources', id);
  sessionFiles.delete(id);
  await recount();
}

/* ---------- Lecturas para la UI ---------- */

export async function snapshot() {
  const [sources, photos, faces, persons] = await Promise.all(['sources', 'photos', 'faces', 'persons'].map((n) => db.all(n)));
  const enabled = new Set(sources.filter((s) => s.enabled).map((s) => s.id));
  const photoMap = new Map(photos.map((p) => [p.id, p]));
  const faceMap = new Map(faces.map((f) => [f.id, f]));
  const photosByPerson = new Map();
  faces.forEach((f) => {
    const ph = photoMap.get(f.photoId);
    if (!ph || !enabled.has(ph.sourceId)) return;
    if (!photosByPerson.has(f.personId)) photosByPerson.set(f.personId, new Map());
    photosByPerson.get(f.personId).set(ph.id, { photo: ph, face: f });
  });
  const people = persons
    .map((p) => {
      const items = [...(photosByPerson.get(p.id)?.values() || [])];
      return { ...p, cover: faceMap.get(p.coverFaceId), items, visibleCount: items.filter((i) => !i.photo.hidden).length };
    })
    .filter((p) => p.items.length)
    .sort((a, b) => (!!b.name - !!a.name) || b.visibleCount - a.visibleCount);
  const inScope = photos.filter((p) => enabled.has(p.sourceId));
  const visible = inScope.filter((p) => !p.hidden).sort((a, b) => b.lastModified - a.lastModified);
  const noFaces = visible.filter((p) => facesDone(p) && p.faceCount === 0 && (p.kind || 'photo') === 'photo');
  const pendingFaces = inScope.filter((p) => !facesDone(p) && (p.kind || 'photo') === 'photo').length;
  return { sources, photos, visible, people, noFaces, pendingFaces, hiddenPhotos: inScope.filter((p) => p.hidden) };
}
