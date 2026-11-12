// Pompa · medidas de calidad y tipo de foto (compartido entre el worker y el hilo principal).
export const SHOT_RE = /(screen[ _-]?shot|captura|screen_|scrn|screenrecord)/i;

// data: RGBA de una versión chica (~384 px) de la foto.
export function measure(data, w, h) {
  const n = w * h; const gray = new Float32Array(n);
  let sum = 0; let satSum = 0; let white = 0; let dark = 0; let bright = 0;
  for (let i = 0, k = 0; k < n; i += 4, k++) {
    const r = data[i]; const g = data[i + 1]; const b = data[i + 2];
    const mx = Math.max(r, g, b); const mn = Math.min(r, g, b);
    const y = 0.299 * r + 0.587 * g + 0.114 * b; gray[k] = y; sum += y;
    const sat = mx ? (mx - mn) / mx : 0; satSum += sat;
    if (y > 185 && sat < 0.18) white++;
    if (y < 35) dark++;
    if (y > 245) bright++;
  }
  // Nitidez: varianza del laplaciano (baja = borrosa). Bordes: proporción de cambios fuertes (texto, líneas).
  let lapSum = 0; let lapSq = 0; let edges = 0; let m = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const k = y * w + x;
    const lap = gray[k - 1] + gray[k + 1] + gray[k - w] + gray[k + w] - 4 * gray[k];
    lapSum += lap; lapSq += lap * lap; m++;
    if (Math.abs(lap) > 60) edges++;
  }
  const mean = lapSum / Math.max(1, m);
  return {
    sharp: Math.round(lapSq / Math.max(1, m) - mean * mean), luma: Math.round(sum / n), sat: +(satSum / n).toFixed(3),
    white: +(white / n).toFixed(3), dark: +(dark / n).toFixed(3), burnt: +(bright / n).toFixed(3), edges: +(edges / Math.max(1, m)).toFixed(4),
  };
}

export function classify(name, q) {
  if (SHOT_RE.test(name || '')) return 'screenshot';
  if (q.burnt > 0.45) return 'photo';                 // sobreexpuesta: es foto (mala), no papel
  // Papel, fotocopia, ticket, cartel o pantalla fotografiada: mucho blanco y muchos trazos.
  if ((q.white >= 0.38 && q.edges >= 0.03) || (q.white >= 0.85 && q.sat < 0.1)) return 'doc';
  return 'photo';
}

// Problemas de calidad (para sugerir borrar). Calibrado con fotos de muestra.
export function issue(q) {
  if (!q) return null;
  if (q.luma < 30 && q.dark > 0.75) return 'dark';
  if (q.burnt > 0.45) return 'burnt';
  if (q.sharp < 180) return 'blur';
  return null;
}
