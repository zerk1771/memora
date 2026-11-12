// Pompa · análisis en segundo plano (Web Worker): decodifica, hace miniaturas, huella visual
// y reconocimiento facial sin trabar la pantalla ni el teclado.
import * as faceapi from '../vendor/face-api.esm.js';
import { measure, classify } from './quality.js';

const DETECT_MAX = 960;
const THUMB_MAX = 320;
const FACE_THUMB = 128;
let ready = null;

function setup() {
  if (ready) return ready;
  ready = (async () => {
    // face-api espera un navegador con document: le damos lienzos fuera de pantalla.
    class NoElement {}
    faceapi.env.setEnv({
      Canvas: OffscreenCanvas,
      CanvasRenderingContext2D: self.OffscreenCanvasRenderingContext2D,
      Image: NoElement,
      ImageData,
      Video: NoElement,
      createCanvasElement: () => new OffscreenCanvas(1, 1),
      createImageElement: () => new NoElement(),
      createVideoElement: () => new NoElement(),
      fetch: self.fetch.bind(self),
      readFile: () => { throw new Error('sin sistema de archivos'); },
    });
    let ok = false;
    try { ok = await faceapi.tf.setBackend('webgl'); } catch { ok = false; }
    if (!ok) await faceapi.tf.setBackend('cpu');
    await faceapi.tf.ready();
    const models = new URL('../vendor/models/', import.meta.url).href;
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(models),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(models),
      faceapi.nets.faceRecognitionNet.loadFromUri(models),
    ]);
    return faceapi.tf.getBackend();
  })();
  ready.catch(() => { ready = null; });
  return ready;
}

function scaled(bitmap, max) {
  const s = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const c = new OffscreenCanvas(Math.max(1, Math.round(bitmap.width * s)), Math.max(1, Math.round(bitmap.height * s)));
  c.getContext('2d').drawImage(bitmap, 0, 0, c.width, c.height);
  return { canvas: c, scale: s };
}

function dhash(source) {
  const c = new OffscreenCanvas(9, 8); const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(source, 0, 0, 9, 8);
  const d = g.getImageData(0, 0, 9, 8).data; let bits = '';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const i = (y * 9 + x) * 4; const j = i + 4;
    bits += (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) > (d[j] * 0.3 + d[j + 1] * 0.59 + d[j + 2] * 0.11) ? '1' : '0';
  }
  let hex = ''; for (let k = 0; k < 64; k += 4) hex += parseInt(bits.slice(k, k + 4), 2).toString(16);
  return hex;
}

async function faceThumb(canvas, box) {
  const m = Math.max(box.width, box.height) * 0.35;
  const size = Math.max(box.width, box.height) + m * 2;
  const sx = Math.max(0, box.x + box.width / 2 - size / 2);
  const sy = Math.max(0, box.y + box.height / 2 - size / 2);
  const c = new OffscreenCanvas(FACE_THUMB, FACE_THUMB);
  c.getContext('2d').drawImage(canvas, sx, sy, size, size, 0, 0, FACE_THUMB, FACE_THUMB);
  return c.convertToBlob({ type: 'image/jpeg', quality: 0.82 });
}

// Pasada 1 (rápida): miniatura, huella y medidas de calidad. No usa reconocimiento facial.
function measureBitmap(bitmap) {
  const { canvas } = scaled(bitmap, 384);
  const d = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data;
  return measure(d, canvas.width, canvas.height);
}

async function indexPhoto(file) {
  let bitmap;
  try { bitmap = await createImageBitmap(file); } catch { throw new Error('unsupported'); }
  const origW = bitmap.width; const origH = bitmap.height;
  const thumbC = scaled(bitmap, THUMB_MAX).canvas;
  const q = measureBitmap(bitmap);
  bitmap.close?.();
  const thumb = await thumbC.convertToBlob({ type: 'image/jpeg', quality: 0.78 });
  return { thumb, hash: dhash(thumbC), origW, origH, q, kind: classify(file.name || '', q) };
}

// Pasada 2: sólo caras (descriptores para agrupar por persona).
async function findFaces(file) {
  await setup();
  let bitmap;
  try { bitmap = await createImageBitmap(file); } catch { throw new Error('unsupported'); }
  const { canvas, scale } = scaled(bitmap, DETECT_MAX);
  bitmap.close?.();
  const img = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height);
  const input = faceapi.tf.browser.fromPixels(img);
  let results = [];
  try {
    results = await faceapi.detectAllFaces(input, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
      .withFaceLandmarks(true).withFaceDescriptors();
  } finally { input.dispose(); }
  const faces = [];
  for (const r of results) {
    const box = r.detection.box;
    if (box.width < 24 || box.height < 24) continue;
    faces.push({
      descriptor: Array.from(r.descriptor),
      box: { x: box.x / scale, y: box.y / scale, w: box.width / scale, h: box.height / scale },
      thumb: await faceThumb(canvas, box),
    });
  }
  return { faces };
}

async function analyze(file) {
  await setup();
  const bitmap = await createImageBitmap(file);
  const origW = bitmap.width; const origH = bitmap.height;
  const { canvas, scale } = scaled(bitmap, DETECT_MAX);
  const thumbC = scaled(bitmap, THUMB_MAX).canvas;
  bitmap.close?.();
  const thumb = await thumbC.convertToBlob({ type: 'image/jpeg', quality: 0.78 });
  const hash = dhash(thumbC);
  const img = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height);
  const input = faceapi.tf.browser.fromPixels(img);
  let results = [];
  try {
    results = await faceapi.detectAllFaces(input, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
      .withFaceLandmarks(true).withFaceDescriptors();
  } finally { input.dispose(); }
  const faces = [];
  for (const r of results) {
    const box = r.detection.box;
    if (box.width < 24 || box.height < 24) continue; // caras diminutas = ruido
    faces.push({
      descriptor: Array.from(r.descriptor),
      box: { x: box.x / scale, y: box.y / scale, w: box.width / scale, h: box.height / scale },
      thumb: await faceThumb(canvas, box),
    });
  }
  return { thumb, hash, origW, origH, faces };
}

self.onmessage = async (e) => {
  const { id, type, file } = e.data;
  try {
    if (type === 'setup') { const backend = await setup(); self.postMessage({ id, ok: true, backend }); return; }
    if (type === 'ping') { self.postMessage({ id, ok: true }); return; }
    const out = type === 'index' ? await indexPhoto(file) : type === 'faces' ? await findFaces(file) : await analyze(file);
    self.postMessage({ id, ok: true, out });
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err?.message === 'unsupported' || err?.name === 'InvalidStateError' || /decode|source image/i.test(String(err?.message)) ? 'unsupported' : err?.message || err) });
  }
};
