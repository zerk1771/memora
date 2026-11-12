// Memora · "Acomodar por carpeta": COPIA las fotos a una carpeta por persona.
// Nunca mueve ni borra originales (evita pérdida de datos).
import { getOriginal } from './scanner.js';

const safe = (s) => (s || 'Sin nombre').replace(/[\\/:*?"<>|]+/g, '_').trim().slice(0, 60) || 'Sin nombre';

function folderName(person, i) { return safe(person.name || `Persona ${i + 1}`); }

// people: [{ name, items:[{photo}] }] ya filtrado (sin ocultos)
export async function exportToFolder(people, onProgress = () => {}) {
  const dest = await window.showDirectoryPicker({ id: 'memora-dest', mode: 'readwrite' });
  const total = people.reduce((n, p) => n + p.items.length, 0);
  let done = 0; const missing = [];
  for (const [i, person] of people.entries()) {
    const dir = await dest.getDirectoryHandle(folderName(person, i), { create: true });
    for (const { photo } of person.items) {
      const file = await getOriginal(photo);
      if (!file) { missing.push(photo.path); onProgress(++done, total); continue; }
      const fh = await dir.getFileHandle(safe(photo.name), { create: true });
      const w = await fh.createWritable();
      await w.write(file); await w.close();
      onProgress(++done, total);
    }
  }
  return { done, missing, dest: dest.name };
}

let jszipLoading = null;
function loadJSZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  jszipLoading ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = new URL('../vendor/jszip.min.js', import.meta.url).href;
    s.onload = () => resolve(window.JSZip);
    s.onerror = () => { jszipLoading = null; reject(new Error('No se pudo cargar JSZip')); };
    document.head.appendChild(s);
  });
  return jszipLoading;
}

export async function exportToZip(people, onProgress = () => {}) {
  const JSZip = await loadJSZip();
  const zip = new JSZip();
  const total = people.reduce((n, p) => n + p.items.length, 0);
  let done = 0; const missing = [];
  for (const [i, person] of people.entries()) {
    const dir = zip.folder(folderName(person, i));
    for (const { photo } of person.items) {
      const file = await getOriginal(photo);
      if (file) dir.file(safe(photo.name), file);
      else { missing.push(photo.path); dir.file(`miniatura_${safe(photo.name)}`, photo.thumb); }
      onProgress(++done, total);
    }
  }
  const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `memora-personas-${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
  return { done, missing };
}
