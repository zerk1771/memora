// Memora · carpetas elegidas por el usuario, detección facial on-device y agrupado por persona.
import * as db from './db.js';

const IMG_RE = /\.(jpe?g|png|webp|gif|bmp|avif)$/i;
const DETECT_MAX = 960;   // lado máximo usado para detectar (ahorra memoria en móvil)
const THUMB_MAX = 320;
const FACE_THUMB = 128;
export const DEFAULT_THRESHOLD = 0.5; // distancia euclídea entre descriptores (menor = más estricto)

// Archivos elegidos con <input webkitdirectory> (Android): sólo viven en memoria durante la sesión.
const sessionFiles = new Map(); // sourceId -> Map(path -> File)

// Dentro de un iframe (vista previa embebida) el selector nativo está bloqueado: se usa el selector de archivos.
export const isEmbedded = (() => { try { return window.self !== window.top; } catch { return true; } })();
export const supportsFSA = () => typeof window.showDirectoryPicker === 'function' && !isEmbedded;

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

export async function addSourceFromFiles(fileList) {
  const files = [...fileList].filter((f) => IMG_RE.test(f.name));
  const first = fileList[0];
  const rel = (first && first.webkitRelativePath) || '';
  let nativeName = '';
  try { nativeName = window.MemoraNative?.lastFolderName?.() || ''; } catch { /* sin puente */ }
  const name = rel.split('/')[0] || nativeName || 'Carpeta';
  const sources = await db.all('sources');
  let src = sources.find((s) => s.kind === 'input' && s.name === name);
  if (!src) {
    src = { id: db.uid('src'), name, kind: 'input', enabled: true, recursive: true, addedAt: Date.now(), photoCount: 0 };
    await db.put('sources', src);
  }
  const map = new Map();
  files.forEach((f) => map.set((f.webkitRelativePath || f.name).split('/').slice(1).join('/') || f.name, f));
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

const dist = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; } return Math.sqrt(s); };

/* ---------- Escaneo ---------- */

export async function scan({ sourceIds = null, onProgress = () => {}, signal } = {}) {
  const threshold = await db.getSetting('threshold', DEFAULT_THRESHOLD);
  const sources = (await db.all('sources')).filter((s) => s.enabled && (!sourceIds || sourceIds.includes(s.id)));
  const persons = new Map((await db.all('persons')).map((p) => [p.id, p]));
  const report = { scanned: 0, skipped: 0, faces: 0, unsupported: 0, blocked: [] };

  onProgress({ phase: 'models', done: 0, total: 0 });
  await loadModels();
  const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });

  for (const src of sources) {
    if ((await sourceAccess(src)) !== 'granted') { report.blocked.push(src.name); continue; }
    let files;
    try { files = await listFiles(src); } catch { report.blocked.push(src.name); continue; }

    const known = new Map((await db.byIndex('photos', 'sourceId', src.id)).map((p) => [p.id, p]));
    const seen = new Set();
    let done = 0;

    for (const f of files) {
      if (signal?.aborted) return { ...report, aborted: true };
      const id = `${src.id}:${f.path}`;
      seen.add(id);
      onProgress({ phase: 'scan', source: src.name, done: done++, total: files.length });
      let file;
      try { file = await f.getFile(); } catch { continue; }
      const prev = known.get(id);
      if (prev && prev.size === file.size && prev.lastModified === file.lastModified) { report.skipped++; continue; }
      if (prev) await dropPhotoFaces(id, persons);

      let bitmap;
      try { bitmap = await createImageBitmap(file); } catch { report.unsupported++; continue; }
      const origW = bitmap.width; const origH = bitmap.height;
      const { canvas, scale } = canvasFrom(bitmap, DETECT_MAX);
      const thumb = await toBlob(canvasFrom(bitmap, THUMB_MAX).canvas);
      bitmap.close?.();

      let results = [];
      try { results = await faceapi.detectAllFaces(canvas, opts).withFaceLandmarks(true).withFaceDescriptors(); } catch (e) { console.warn('[memora] detección falló', f.path, e); }

      const faces = [];
      for (const r of results) {
        const box = r.detection.box;
        if (box.width < 24 || box.height < 24) continue; // caras diminutas = ruido
        const descriptor = Array.from(r.descriptor);
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
        best.centroid = best.centroid.map((v, i) => (v * best.count + descriptor[i]) / (best.count + 1));
        best.count += 1;
        faces.push({
          id: faceId, photoId: id, personId: best.id, descriptor,
          box: { x: box.x / scale, y: box.y / scale, w: box.width / scale, h: box.height / scale },
          thumb: await faceThumb(canvas, box),
        });
      }
      await db.put('photos', {
        id, sourceId: src.id, path: f.path, name: file.name, size: file.size, lastModified: file.lastModified,
        thumb, origW, origH, faceCount: faces.length, hidden: prev?.hidden || false, scannedAt: Date.now(),
      });
      await db.putMany('faces', faces);
      await db.putMany('persons', [...new Set(faces.map((x) => x.personId))].map((pid) => persons.get(pid)));
      report.scanned++; report.faces += faces.length;
      if (report.scanned % 4 === 0) await new Promise((r) => setTimeout(r, 0)); // deja respirar la UI
    }

    // Fotos borradas del disco: se limpian del índice (no se toca el archivo original).
    const gone = [...known.keys()].filter((k) => !seen.has(k));
    for (const k of gone) await dropPhotoFaces(k, persons);
    await db.delMany('photos', gone);
    src.photoCount = seen.size; src.lastScan = Date.now();
    await db.put('sources', src);
    onProgress({ phase: 'scan', source: src.name, done: files.length, total: files.length });
  }
  await recount();
  onProgress({ phase: 'done', done: 1, total: 1 });
  return report;
}

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
  const noFaces = photos.filter((p) => enabled.has(p.sourceId) && p.faceCount === 0);
  return { sources, photos, people, noFaces, hiddenPhotos: photos.filter((p) => p.hidden && enabled.has(p.sourceId)) };
}
