// Pompa · burbuja flotante + ventana compacta. Todo local.
import { CSS, FONT_FACES } from './styles.js';
import * as db from './db.js';
import * as sc from './scanner.js';
import { exportToFolder, exportToZip, exportToNative } from './exporter.js';
import { issue } from './quality.js';
import morphdom from '../vendor/morphdom-esm.js';

const NATIVE = typeof window.MemoraNative !== 'undefined'; // dentro del APK de Android
const VERSION = '2.6';

const sv = (p, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${p}</svg>`;
const I = {
  gallery: sv('<path d="M7 4h11a2 2 0 0 1 2 2v9"/><rect x="3.5" y="7.5" width="13" height="12" rx="2"/><circle cx="8" cy="11.5" r="1.3" fill="currentColor" stroke="none"/><path d="M3.5 17.5l4-4 3 3 2-2 4 4"/>'),
  close: sv('<path d="M6 6l12 12M18 6 6 18"/>', 'stroke-width="2"'),
  back: sv('<path d="M15 5l-7 7 7 7"/>', 'stroke-width="2"'),
  next: sv('<path d="M9 5l7 7-7 7"/>', 'stroke-width="2"'),
  people: sv('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.8-3 3-4.6 5.5-4.6s4.7 1.6 5.5 4.6"/><path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 14.6c1.5.6 2.6 2 3 4.4"/>'),
  photos: sv('<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>'),
  folder: sv('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
  folderPlus: sv('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 10.5v5M9.5 13h5"/>'),
  lock: sv('<rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>'),
  gear: sv('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>'),
  check: sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 'stroke-width="2.6"'),
  merge: sv('<path d="M6 4v4a6 6 0 0 0 6 6 6 6 0 0 1 6 6M18 4v4a6 6 0 0 1-3 5.2M12 14v6"/>'),
  export: sv('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 10v6M9.5 13.5 12 16l2.5-2.5"/>'),
  refresh: sv('<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>'),
  trash: sv('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  split: sv('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.8-3 3-4.6 5.5-4.6 1.4 0 2.6.4 3.6 1.2M16 14l5 5M21 14l-5 5"/>'),
  star: sv('<path d="M12 3.6l2.6 5.2 5.7.8-4.1 4 1 5.7L12 16.6l-5.2 2.7 1-5.7-4.1-4 5.7-.8z"/>'),
  starFill: sv('<path d="M12 3.6l2.6 5.2 5.7.8-4.1 4 1 5.7L12 16.6l-5.2 2.7 1-5.7-4.1-4 5.7-.8z" fill="currentColor"/>'),
  select: sv('<rect x="4" y="4" width="16" height="16" rx="5"/><path d="M8.5 12l2.5 2.5 4.5-5"/>'),
  search: sv('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'),
  play: sv('<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>'),
  pause: sv('<path d="M8 5v14M16 5v14"/>', 'stroke-width="2.6"'),
  together: sv('<circle cx="8.5" cy="12" r="5"/><circle cx="15.5" cy="12" r="5"/>'),
  copies: sv('<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'),
  eye: sv('<path d="M3 12c.5-1.5 4-6 9-6s8.5 4.5 9 6c-.5 1.5-4 6-9 6s-8.5-4.5-9-6z"/><circle cx="12" cy="12" r="3"/>'),
  eyeOff: sv('<path d="M3 3l18 18M10.6 6.1A9.7 9.7 0 0 1 12 6c5 0 8.5 4.5 9 6-.3.8-1.2 2.3-2.7 3.6M6.4 7.6C4.6 8.9 3.4 10.7 3 12c.5 1.5 4 6 9 6 1.5 0 2.9-.4 4-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
  sparkle: sv('<path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>'),
  shield: sv('<path d="M12 3.5l7 2.8v5.4c0 4.3-3 7.6-7 8.8-4-1.2-7-4.5-7-8.8V6.3z"/><path d="M9 12l2.2 2.2L15.5 10"/>'),
  doc: sv('<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10.5a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M14 3.5V8h4M9 12h6M9 15.5h6"/>'),
  phone: sv('<rect x="6.5" y="3" width="11" height="18" rx="2.5"/><path d="M10.5 17.5h3"/>'),
  blur: sv('<circle cx="12" cy="12" r="7.5" stroke-dasharray="2.5 2.5"/><circle cx="12" cy="12" r="3"/>'),
  moon: sv('<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>'),
  sun: sv('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>'),
  more: sv('<circle cx="6" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.3" fill="currentColor" stroke="none"/>'),
  del: sv('<path d="M9 6h11v12H9l-5-6z"/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5"/>'),
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = new Intl.NumberFormat('es-AR');
const plural = (n, a, b) => `${nf.format(n)} ${n === 1 ? a : b}`;
const SIZES = [{ k: 'mini', px: 24, l: 'Mini' }, { k: 'chica', px: 30, l: 'Chica' }, { k: 'media', px: 38, l: 'Media' }];
const IDLE = [{ k: 1, l: 'Sólida' }, { k: 0.72, l: 'Suave' }, { k: 0.45, l: 'Discreta' }];
const THEMES = [{ k: 'system', l: 'Sistema' }, { k: 'dark', l: 'Oscuro' }, { k: 'light', l: 'Claro' }];
const TABS = [['people', 'Personas', I.people], ['photos', 'Fotos', I.photos], ['clean', 'Borrar', I.trash], ['sources', 'Carpetas', I.folder], ['vault', 'Bóveda', I.lock], ['settings', 'Ajustes', I.gear]];
const WINS = [{ k: 'compacta', l: 'Compacta', w: 296, h: 480 }, { k: 'normal', l: 'Normal', w: 328, h: 560 }, { k: 'grande', l: 'Grande', w: 9999, h: 9999 }];
// Categorías de “Borrar”. Calibradas con fotos de muestra; siempre las revisás antes.
const CLEAN = [
  { k: 'shots', l: 'Capturas de pantalla', d: 'Capturas que ya cumplieron su función.', test: (p) => p.kind === 'screenshot' },
  { k: 'docs', l: 'Papeles y pantallas', d: 'Fotos de papeles, carteles, tickets o monitores sacadas para consultar algo.', test: (p) => p.kind === 'doc' },
  { k: 'blur', l: 'Borrosas o movidas', d: 'Salieron fuera de foco.', test: (p) => p.kind === 'photo' && issue(p.q) === 'blur' },
  { k: 'dark', l: 'Muy oscuras', d: 'Casi no se ve nada.', test: (p) => issue(p.q) === 'dark' },
  { k: 'burnt', l: 'Quemadas', d: 'Demasiada luz: se perdió la imagen.', test: (p) => issue(p.q) === 'burnt' },
];
const PAGE = 120;

async function sha(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`rostra:${text}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const vibrate = (ms = 8) => { try { navigator.vibrate?.(ms); } catch { /* sin vibración */ } };

class Pompa {
  constructor(host = document.body) {
    this.hostEl = document.createElement('rostra-gallery');
    host.appendChild(this.hostEl);
    this.root = this.hostEl.attachShadow({ mode: 'open' });
    this.state = { open: false, tab: 'people', view: null, selecting: false, sel: new Set(), scan: null,
      query: '', filter: 'all', limit: PAGE, cleanSel: new Set(), vaultOpen: false, pin: '', pinStep: null, pinFirst: '', dupes: null };
    this.scanQueue = new Set();
    this.thumbs = new Map(); // miniaturas con URL estable: no se recargan ni parpadean
    this.data = { sources: [], people: [], visible: [], noFaces: [], hiddenPhotos: [], photos: [] };
  }

  async init() {
    if (!document.getElementById('rostra-fonts')) {
      const st = document.createElement('style'); st.id = 'rostra-fonts';
      st.textContent = FONT_FACES(new URL('../vendor/', import.meta.url).href);
      document.head.appendChild(st);
    }
    this.settings = {
      size: await db.getSetting('bubbleSize', 'chica'),
      pos: await db.getSetting('bubblePos', { side: 'right', y: 0.62 }),
      threshold: await db.getSetting('threshold', sc.DEFAULT_THRESHOLD),
      theme: await db.getSetting('theme', 'system'),
      idle: await db.getSetting('idle', 1),
      pinHash: await db.getSetting('pinHash', ''),
      win: await db.getSetting('win', null),
    };
    this.root.innerHTML = `<style>${CSS}</style>
      <button class="bubble" part="bubble" aria-label="Abrir Pompa" aria-expanded="false">
        <span class="dot">${I.gallery}
          <svg class="ring" viewBox="0 0 36 36" style="display:none"><circle class="bg" cx="18" cy="18" r="16"/><circle class="fg" cx="18" cy="18" r="16" stroke-dasharray="100.5" stroke-dashoffset="100.5"/></svg>
        </span>
      </button>
      <div class="scrim"></div>
      <section class="sheet" role="dialog" aria-modal="true" aria-label="Pompa">
        <header class="head">
          <div class="grow"><p class="eyebrow-brand">Pompa<i>.</i></p><p class="brand"></p><p class="stats num"></p></div>
          <button class="iconbtn" data-a="close" aria-label="Cerrar">${I.close}</button>
        </header>
        <div class="progress" hidden></div>
        <div class="body"></div>
        <nav class="nav" role="tablist">
          ${TABS.map(([k, l, ic]) => `<button class="tab" role="tab" data-a="tab" data-v="${k}" aria-label="${l}">${ic}<span>${l}</span></button>`).join('')}
        </nav>
        <div class="toast" role="status" aria-live="polite"></div>
        <div class="resize" role="slider" aria-label="Cambiar tamaño de la ventana" tabindex="0"><i></i></div>
      </section>
      <input type="file" class="picker" webkitdirectory directory multiple accept="image/*" hidden>`;
    this.$ = (s) => this.root.querySelector(s);
    this.$('.dot svg').classList.add('ico');
    const bubble = this.$('.bubble');
    bubble.classList.add('dragging');
    this.applyTheme(); this.applyIdle(); this.applySize();
    requestAnimationFrame(() => requestAnimationFrame(() => bubble.classList.remove('dragging')));
    this.bindBubble();
    this.bindResize();
    this.root.addEventListener('click', (e) => this.onClick(e));
    this.root.addEventListener('change', (e) => this.onChange(e));
    this.root.addEventListener('input', (e) => this.onInput(e));
    // Mantener apretado en “Borrar”: ver la foto grande antes de decidir.
    this.root.addEventListener('contextmenu', (e) => {
      const el = e.composedPath().find((n) => n.classList?.contains('pick')); if (!el) return;
      e.preventDefault();
      const g = this.cleanGroups().find((x) => x.k === this.state.view?.cat); if (!g) return;
      this.ctxList = g.items.map((p) => ({ photo: p }));
      this.openViewer('list', el.dataset.v);
    });
    this.root.addEventListener('focusout', () => setTimeout(() => { if (this.pendingRender && this.state.open && !this.typingIn()) this.render(); }, 250));
    this.$('.scrim').addEventListener('click', () => this.close());
    window.addEventListener('popstate', () => { if (this.state.open && !NATIVE) this.close(true); });
    window.addEventListener('keydown', (e) => this.onKey(e));
    await this.refresh();
    if (NATIVE) { this.syncNativePos(); this.open(); }
    // Red de seguridad: si algo cambió en los datos y la pantalla no se enteró, se actualiza sola.
    setInterval(() => this.heartbeat(), 2000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.heartbeat(true); });
    window.addEventListener('focus', () => this.heartbeat(true)); // el APK abre directo la ventana junto a la burbuja
  }

  /* ---------- Apariencia ---------- */
  applyTheme() {
    if (this.settings.theme === 'system') this.hostEl.removeAttribute('data-theme');
    else this.hostEl.setAttribute('data-theme', this.settings.theme);
  }
  applyIdle() { this.hostEl.style.setProperty('--idle', String(this.settings.idle)); }
  applySize() {
    const px = (SIZES.find((s) => s.k === this.settings.size) || SIZES[1]).px;
    this.hostEl.style.setProperty('--bubble', `${px}px`);
    this.bubblePx = px;
    this.placeBubble();
  }

  /* ---------- Burbuja ---------- */
  placeBubble(x, y) {
    const b = this.$('.bubble'); const box = this.bubblePx + 14;
    const W = window.innerWidth; const H = window.innerHeight;
    if (x === undefined) {
      const p = this.settings.pos;
      x = typeof p.x === 'number' ? p.x * W : (p.side === 'left' ? 2 : W - box - 2);
      y = p.y * H;
    }
    x = Math.min(Math.max(x, 0), W - box);
    y = Math.min(Math.max(y, 0), H - box);
    b.style.transform = `translate(${x}px, ${y}px)`;
    this.bxy = { x, y };
    if (this.state.open) this.placeSheet();
  }

  bindBubble() {
    const b = this.$('.bubble'); let start = null; let moved = false;
    b.addEventListener('pointerdown', (e) => {
      start = { px: e.clientX, py: e.clientY, x: this.bxy.x, y: this.bxy.y }; moved = false;
      try { b.setPointerCapture(e.pointerId); } catch { /* sin captura */ }
    });
    b.addEventListener('pointermove', (e) => {
      if (!start) return;
      const dx = e.clientX - start.px; const dy = e.clientY - start.py;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      moved = true; b.classList.add('dragging'); this.manualRect = null;
      this.placeBubble(start.x + dx, start.y + dy);
    });
    b.addEventListener('pointerup', async () => {
      if (!start) return; start = null; b.classList.remove('dragging');
      if (!moved) return; // el toque simple abre por 'click'
      this.justDragged = true; setTimeout(() => { this.justDragged = false; }, 350);
      this.settings.pos = { x: this.bxy.x / window.innerWidth, y: this.bxy.y / window.innerHeight }; // queda donde la soltás
      if (NATIVE) try { window.MemoraNative.setBubblePos(this.settings.pos.x, this.settings.pos.y); } catch { /* sin puente */ }
      vibrate(6);
      await db.setSetting('bubblePos', this.settings.pos);
    });
    b.addEventListener('pointercancel', () => { start = null; b.classList.remove('dragging'); this.placeBubble(); });
    b.addEventListener('click', () => {
      if (this.justDragged) { this.justDragged = false; return; }
      vibrate(5);
      if (this.state.open) this.close(); else this.open();
    });
    window.addEventListener('resize', () => { if (!this.minimizing && !document.hidden) this.placeBubble(); });
  }

  setRing(frac) {
    const ring = this.$('.ring');
    ring.style.display = frac == null ? 'none' : '';
    if (frac != null) ring.querySelector('.fg').style.strokeDashoffset = String(100.5 * (1 - frac));
  }

  /* ---------- Ventana ---------- */
  open() {
    if (this.state.open) return;
    this.state.open = true; this.manualRect = null;
    if (!NATIVE) try { history.pushState({ rostra: true }, ''); } catch { /* vista embebida */ }
    const b = this.$('.bubble'); b.classList.add('open'); b.setAttribute('aria-expanded', 'true');
    this.$('.dot .badge')?.remove();
    this.render(); this.placeSheet();
    this.$('.scrim').classList.add('on'); this.$('.sheet').classList.add('on');
  }

  close(fromPop = false) {
    if (this.closeOverlay()) { if (fromPop && !NATIVE) try { history.pushState({ rostra: true }, ''); } catch { /* */ } return; }
    if (this.state.view && fromPop) { this.state.view = null; this.render(); try { history.pushState({ rostra: true }, ''); } catch { /* */ } return; }
    Object.assign(this.state, { open: false, view: null, selecting: false, vaultOpen: false, pin: '', pinStep: null });
    this.state.sel.clear();
    const b = this.$('.bubble'); b.classList.remove('open'); b.setAttribute('aria-expanded', 'false');
    this.$('.scrim').classList.remove('on'); this.$('.sheet').classList.remove('on');
    if (NATIVE) {
      // Se esconde al instante: al minimizar, Android achica la ventana y la burbuja se reacomodaba ("salía corriendo").
      setTimeout(() => { this.minimizing = true; b.style.transition = 'none'; b.style.visibility = 'hidden'; try { window.MemoraNative.minimize(); } catch { /* sin puente */ } }, 240);
      return;
    }
    try { if (!fromPop && history.state?.rostra) history.back(); } catch { /* vista embebida */ }
    b.focus();
  }

  // Ventana compacta que se despliega hacia el lado con más espacio.
  placeSheet() {
    const sh = this.$('.sheet'); if (!sh || !this.bxy) return;
    const W = window.innerWidth; const H = window.innerHeight; const box = this.bubblePx + 14; const gap = 4;
    const win = this.settings.win || { w: 328, h: 560 };
    const pw = Math.round(Math.min(Math.max(win.w, 260), W - 16)); const ph = Math.round(Math.min(Math.max(win.h, 360), H - 16));
    const cx = this.bxy.x + box / 2; const cy = this.bxy.y + box / 2;
    this.toRight = cx < W / 2;
    let left = this.toRight ? this.bxy.x + box + gap : this.bxy.x - pw - gap;
    let top = cy - ph / 2;
    if (this.manualRect) { left = this.manualRect.left; top = this.manualRect.top; } // la dejaste donde la agrandaste
    left = Math.min(Math.max(left, 8), W - pw - 8);
    top = Math.min(Math.max(top, 8), H - ph - 8);
    Object.assign(sh.style, { left: `${left}px`, top: `${top}px` });
    sh.style.setProperty('--pw', `${pw}px`); sh.style.setProperty('--ph', `${ph}px`);
    sh.style.setProperty('--ox', `${Math.min(Math.max(cx - left, 0), pw)}px`);
    sh.style.setProperty('--oy', `${Math.min(Math.max(cy - top, 0), ph)}px`);
  }

  // Agarradera inferior: la ventana crece hacia donde arrastrás (como en una computadora).
  // Desde la mitad derecha: fijo el borde izquierdo y crece a la derecha. Desde la mitad izquierda: al revés.
  // Hacia abajo crece hacia abajo (el borde de arriba queda fijo).
  bindResize() {
    const g = this.$('.resize'); const sh = this.$('.sheet'); let st = null;
    const W = () => window.innerWidth; const H = () => window.innerHeight;
    const apply = (left, top, w, h) => {
      w = Math.round(Math.min(Math.max(w, 260), W() - 16)); h = Math.round(Math.min(Math.max(h, 360), H() - 16));
      this.settings.win = { w, h }; this.manualRect = { left, top };
      this.placeSheet();
    };
    g.addEventListener('pointerdown', (e) => {
      const r = sh.getBoundingClientRect();
      st = { x: e.clientX, y: e.clientY, l: r.left, t: r.top, w: r.width, h: r.height, fromLeft: e.clientX < r.left + r.width / 2 };
      g.dataset.side = st.fromLeft ? 'l' : 'r';
      sh.classList.add('resizing'); try { g.setPointerCapture(e.pointerId); } catch { /* */ }
    });
    g.addEventListener('pointermove', (e) => {
      if (!st) return;
      const dx = e.clientX - st.x; const dy = e.clientY - st.y;
      if (st.fromLeft) {
        const right = st.l + st.w;
        const w = Math.min(st.w - dx, right - 8); // arrastrar a la izquierda agranda hacia la izquierda
        apply(right - Math.max(260, w), st.t, w, st.h + dy);
      } else {
        apply(st.l, st.t, Math.min(st.w + dx, W() - 8 - st.l), st.h + dy); // a la derecha agranda hacia la derecha
      }
    });
    const end = async () => {
      if (!st) return; st = null; sh.classList.remove('resizing'); delete g.dataset.side;
      const r = sh.getBoundingClientRect();
      this.settings.win = { w: Math.round(r.width), h: Math.round(r.height) };
      this.manualRect = { left: r.left, top: r.top };
      vibrate(5); await db.setSetting('win', this.settings.win);
    };
    g.addEventListener('pointerup', end); g.addEventListener('pointercancel', end);
    g.addEventListener('keydown', async (e) => {
      const step = { ArrowUp: [0, -24], ArrowDown: [0, 24], ArrowLeft: [-16, 0], ArrowRight: [16, 0] }[e.key]; if (!step) return;
      e.preventDefault(); const r = sh.getBoundingClientRect();
      apply(r.left, r.top, r.width + step[0], r.height + step[1]); await db.setSetting('win', this.settings.win);
    });
  }

  closeOverlay() {
    if (this.show) { this.stopShow(); return true; }
    if (this.viewer) { this.closeViewer(); return true; }
    const dlg = this.root.querySelector('.dialog'); if (dlg) { dlg.dispatchEvent(new Event('dismiss')); return true; }
    return false;
  }

  /* ---------- Android ---------- */
  nativeBack() {
    if (this.closeOverlay()) return true;
    if (this.state.view) { this.state.view = null; this.render(); return true; }
    if (this.state.selecting) { this.state.selecting = false; this.state.sel.clear(); this.render(); return true; }
    if (this.state.open) { this.close(); return true; }
    try { window.MemoraNative.minimize(); } catch { /* sin puente */ }
    return true;
  }
  syncNativePos() {
    try {
      const [fx, fy] = String(window.MemoraNative.bubblePos()).split(',').map(Number);
      if (Number.isFinite(fx) && Number.isFinite(fy) && fx >= 0) { this.settings.pos = { x: fx, y: fy }; this.placeBubble(); }
    } catch { /* sin puente */ }
  }
  onNativeResume() {
    this.minimizing = false;
    const b = this.$('.bubble');
    this.syncNativePos();
    b.style.visibility = ''; requestAnimationFrame(() => { b.style.transition = ''; });
    if (!this.state.open) this.open(); else this.render();
  }

  // El APK avisa apenas elegís una carpeta y mientras la recorre: así nunca parece que no pasa nada.
  pickingFolder() { this.pickProgress('la carpeta', 0, false); }
  pickProgress(folder, n, done) {
    this.state.picking = done ? null : { folder, n };
    if (!this.state.open) this.open();
    if (this.state.tab !== 'sources' || this.state.view) { this.state.tab = 'sources'; this.state.view = null; }
    this.render();
  }

  /* ---------- Datos ---------- */
  // URL estable por foto/cara: la misma miniatura conserva su URL entre actualizaciones (sin parpadeo negro).
  cachedUrl(key, blob) {
    if (!blob) return '';
    const hit = this.thumbs.get(key);
    if (hit) { this.thumbs.delete(key); this.thumbs.set(key, hit); return hit; }
    const u = URL.createObjectURL(blob); this.thumbs.set(key, u);
    if (this.thumbs.size > 2500) { const [k, old] = this.thumbs.entries().next().value; this.thumbs.delete(k); URL.revokeObjectURL(old); }
    return u;
  }
  photoUrl(p) { return p ? this.cachedUrl(`p:${p.id}:${p.scannedAt || 0}`, p.thumb) : ''; }
  faceUrl(f) { return f ? this.cachedUrl(`f:${f.id}`, f.thumb) : ''; }

  async refresh() {
    this.data = await sc.snapshot();
    this.state.dupes = null;
    const unnamed = this.data.people.filter((p) => !p.hidden && !p.name && p.visibleCount).length;
    const dot = this.$('.dot'); let badge = dot.querySelector('.badge');
    if (unnamed && !this.state.scan && !this.state.open) {
      if (!badge) { badge = document.createElement('span'); badge.className = 'badge num'; dot.appendChild(badge); }
      badge.textContent = unnamed > 9 ? '9+' : unnamed;
    } else badge?.remove();
    if (this.state.open) this.render();
  }

  render() {
    const { view, tab } = this.state;
    this.root.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.v === tab)));
    const titles = { people: 'Personas', photos: 'Fotos', clean: 'Borrar', sources: 'Carpetas', vault: 'Bóveda', settings: 'Ajustes' };
    this.$('.head .brand').textContent = titles[tab] || 'Pompa';
    const people = this.data.people.filter((p) => !p.hidden && p.visibleCount).length;
    this.$('.stats').textContent = this.data.visible.length
      ? `${plural(this.data.visible.length, 'foto', 'fotos')} · ${plural(people, 'persona', 'personas')}`
      : 'Tus personas, en una pompa';
    let html;
    if (view?.type === 'person') html = this.viewPerson(view.id);
    else if (view?.type === 'together') html = this.viewTogether(view.ids);
    else if (view?.type === 'clean') html = this.viewClean(view.cat);
    else if (view?.type === 'album') html = this.viewAlbum(view.src, view.dir);
    else html = this[`tab_${tab}`]();
    // Sólo cambia lo que cambió: las miniaturas existentes quedan intactas y el campo donde escribís no se toca.
    const body = this.$('.body');
    const next = document.createElement('div'); next.innerHTML = html;
    const active = this.root.activeElement;
    morphdom(body, next, {
      childrenOnly: true,
      getNodeKey: (n) => (n.nodeType === 1 && (n.dataset?.key || n.id)) || null,
      onBeforeElUpdated: (from, to) => !(from === active && from.tagName === 'INPUT') && !from.isEqualNode(to),
    });
    this.pendingRender = false;
    this.renderProgress();
  }

  typingIn() {
    const a = this.root.activeElement;
    return a && a.tagName === 'INPUT' && ['text', 'search', ''].includes(a.type) ? a : null; // sólo campos de texto
  }

  async heartbeat(force = false) {
    if (!this.state.open || document.hidden || this.hbBusy) return;
    this.hbBusy = true;
    try {
      const sig = await sc.quickSignature();
      if (force || sig !== this.hbSig) { this.hbSig = sig; this.lastSig = null; await this.liveRefresh(); }
    } catch { /* reintenta en el próximo latido */ } finally { this.hbBusy = false; }
  }

  // Actualización en vivo durante el escaneo: nunca interrumpe lo que estás escribiendo.
  async liveRefresh() {
    if (this.liveBusy) return; this.liveBusy = true;
    try { this.data = await sc.snapshot(); } finally { this.liveBusy = false; }
    if (!this.state.open || document.hidden) return;
    const sig = `${this.data.visible.length}|${this.data.people.length}|${this.data.people.reduce((n, p) => n + p.items.length, 0)}`;
    if (sig === this.lastSig) return; // nada nuevo que mostrar
    this.lastSig = sig;
    const people = this.data.people.filter((p) => !p.hidden && p.visibleCount).length;
    this.$('.stats').textContent = `${plural(this.data.visible.length, 'foto', 'fotos')} · ${plural(people, 'persona', 'personas')}`;
    const a = this.typingIn();
    if (a) {
      if (a.dataset.a === 'query') {
        const grid = this.$('#pgrid');
        if (grid) { const n = document.createElement('div'); n.innerHTML = this.peopleGrid(); morphdom(grid, n, { childrenOnly: true, getNodeKey: (x) => (x.nodeType === 1 && x.dataset?.key) || null }); }
      }
      this.pendingRender = true; // se redibuja cuando dejes de escribir
      return;
    }
    if (this.state.tab === 'vault' && this.state.pinStep) return; // no tocar el teclado del PIN
    this.render();
  }

  renderProgress() {
    const el = this.$('.progress'); const s = this.state.scan;
    el.hidden = !s; if (!s) return;
    const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
    const step = s.phase === 'index' ? 'Paso 1 de 2 · ' : s.phase === 'faces' ? 'Paso 2 de 2 · ' : '';
    const title = s.phase === 'models' || s.phase === 'indexed' ? esc(s.label || 'Preparando…') : `${esc(s.label || 'Buscando caras')} · <span class="num">${pct}%</span>`;
    const sub = s.phase === 'models' ? 'Un momento' : s.phase === 'indexed' ? 'Ya podés usar Fotos y Borrar' : `${step}${esc(s.source)} · ${nf.format(s.done)} de ${nf.format(s.total)}`;
    if (!el.querySelector('.bar') || el.dataset.stop !== String(!s.noStop)) {
      el.dataset.stop = String(!s.noStop);
      el.innerHTML = `<div class="txt"><b></b><span class="ellipsis num"></span><div class="bar"><i></i></div></div>${s.noStop ? '' : '<button class="stop" data-a="cancel-scan">Frenar</button>'}`;
    }
    // Sólo se actualizan texto y barra: no se recrea nada (sin saltos ni toques perdidos).
    const t = el.querySelector('b'); if (t.innerHTML !== title) t.innerHTML = title;
    const u = el.querySelector('.ellipsis'); if (u.textContent !== sub) u.textContent = sub;
    el.querySelector('.bar i').style.width = `${pct}%`;
  }


  /* ---------- Personas ---------- */
  tab_people() {
    const { sources, people } = this.data;
    if (!sources.length) {
      return `${this.overlayBanner()}<div class="empty"><div class="art">${I.gallery}</div>
        <h3>Tus personas, ordenadas solas</h3>
        <p class="note">Elegí las carpetas que quieras. Pompa reconoce cada cara y arma su álbum, sin subir nada a internet.</p>
        <ul class="perks">
          <li>${I.people}<span><b>Álbumes por persona</b> con nombre, portada y recuerdos.</span></li>
          <li>${I.together}<span><b>Juntos</b>: las fotos donde aparecen dos o más personas.</span></li>
          <li>${I.lock}<span><b>Bóveda con PIN</b> para lo que no querés a la vista.</span></li>
        </ul>
        <button class="btn primary block" data-a="add-source">${I.folderPlus}Elegir una carpeta</button></div>`;
    }
    const visible = people.filter((p) => !p.hidden && p.visibleCount);
    if (!visible.length) {
      return `${this.overlayBanner()}<div class="empty"><div class="art">${I.people}</div>
        <h3>${this.state.scan ? 'Reconociendo caras…' : 'Todavía no hay caras'}</h3>
        <p class="note">${this.state.scan ? 'Van a ir apareciendo acá a medida que avance.' : 'Escaneá tus carpetas para agrupar a las personas.'}</p>
        ${this.state.scan ? '' : `<button class="btn primary block" data-a="scan">${I.refresh}Buscar caras</button>`}</div>`;
    }
    const { selecting, sel } = this.state;
    return `${this.overlayBanner()}
      <label class="search">${I.search}<input type="search" data-a="query" placeholder="Buscar persona" value="${esc(this.state.query)}" aria-label="Buscar persona" enterkeyhint="search"></label>
      <div class="row" style="margin-bottom:16px">
        ${selecting
          ? `<button class="btn ghost" data-a="sel-cancel">${I.close}Listo</button>`
          : `<button class="btn primary" data-a="export-all">${I.export}Armar carpetas</button>
             <button class="btn ghost" data-a="sel-start">${I.select}Elegir</button>`}
      </div>
      <div class="people" id="pgrid">${this.peopleGrid()}</div>
      ${selecting && sel.size ? `<div class="selbar"><span class="n num">${plural(sel.size, 'elegida', 'elegidas')}</span>
        <button class="btn ghost" data-a="sel-hide" aria-label="Guardar en la bóveda">${I.lock}</button>
        <button class="btn ghost" data-a="sel-merge" ${sel.size < 2 ? 'disabled' : ''}>${I.merge}Unir</button>
        <button class="btn primary" data-a="sel-together" ${sel.size < 2 ? 'disabled' : ''}>${I.together}Juntos</button></div>` : ''}`;
  }

  peopleGrid() {
    const q = this.state.query.trim().toLowerCase();
    const list = this.data.people.filter((p) => !p.hidden && p.visibleCount && (!q || (p.name || 'sin nombre').toLowerCase().includes(q)));
    if (!list.length) return `<p class="note" style="grid-column:1/-1;text-align:center;padding:20px 0">Nadie con ese nombre.</p>`;
    const { selecting, sel } = this.state;
    return list.map((p) => `
      <button class="person ${p.name ? 'named' : ''} ${sel.has(p.id) ? 'sel' : ''}" data-key="pe-${p.id}" data-a="${selecting ? 'toggle-sel' : 'open-person'}" data-v="${p.id}">
        <img class="avatar" alt="" src="${this.faceUrl(p.cover)}">
        ${selecting ? `<span class="check">${sel.has(p.id) ? I.check : ''}</span>` : ''}
        <span class="nm ${p.name ? '' : 'unnamed'}">${esc(p.name || 'Sin nombre')}</span>
        <span class="ct num">${plural(p.visibleCount, 'foto', 'fotos')}</span>
      </button>`).join('');
  }

  photoCell(photo, face, ctx) {
    return `<button class="ph" data-key="ph-${photo.id}${face ? `-${face.id}` : ''}" data-a="view" data-ctx="${ctx}" data-v="${photo.id}" ${face ? `data-f="${face.id}"` : ''} aria-label="${esc(photo.name)}">
      <img loading="lazy" decoding="async" alt="" src="${this.photoUrl(photo)}">${photo.fav ? `<span class="fav">${I.starFill}</span>` : ''}</button>`;
  }

  viewPerson(id) {
    const p = this.data.people.find((x) => x.id === id);
    if (!p) { this.state.view = null; return this.tab_people(); }
    const items = p.items.filter((i) => !i.photo.hidden);
    const favs = items.filter((i) => i.photo.fav).length;
    this.ctxList = items;
    return `
      <div class="hero">
        <button class="iconbtn back" data-a="back" aria-label="Volver">${I.back}</button>
        <img class="avatar" alt="" src="${this.faceUrl(p.cover)}">
        <input class="name-in" data-a="rename" data-v="${p.id}" value="${esc(p.name)}" placeholder="¿Quién es?" maxlength="40" enterkeyhint="done" aria-label="Nombre">
        <p class="sub num">${plural(items.length, 'foto', 'fotos')}${favs ? ` · ${plural(favs, 'favorita', 'favoritas')}` : ''}</p>
      </div>
      <div class="actions">
        <button class="act" data-a="memory" data-v="${p.id}"><span class="i">${I.play}</span>Recuerdo</button>
        <button class="act" data-a="export-one" data-v="${p.id}"><span class="i">${I.export}</span>Exportar</button>
        <button class="act" data-a="merge-into" data-v="${p.id}"><span class="i">${I.merge}</span>Unir</button>
        <button class="act" data-a="hide-person" data-v="${p.id}"><span class="i">${I.lock}</span>Bóveda</button>
      </div>
      <div class="photos">${items.map((i) => this.photoCell(i.photo, i.face, 'person')).join('')}</div>`;
  }

  viewTogether(ids) {
    const ppl = ids.map((id) => this.data.people.find((p) => p.id === id)).filter(Boolean);
    const items = sc.together(this.data.people, ids);
    this.ctxList = items.map((i) => ({ photo: i.photo }));
    const names = ppl.map((p) => p.name || 'Sin nombre');
    return `
      <div class="hero">
        <button class="iconbtn back" data-a="back" aria-label="Volver">${I.back}</button>
        <div class="faces-stack">${ppl.slice(0, 4).map((p) => `<img alt="" src="${this.faceUrl(p.cover)}">`).join('')}</div>
        <p class="brand" style="font-size:26px;margin-top:10px">Juntos</p>
        <p class="sub">${esc(names.join(' + '))} · <span class="num">${plural(items.length, 'foto', 'fotos')}</span></p>
      </div>
      ${items.length
        ? `<div class="actions" style="grid-template-columns:1fr 1fr"><button class="act" data-a="memory-together"><span class="i">${I.play}</span>Recuerdo</button>
           <button class="act" data-a="export-together"><span class="i">${I.export}</span>Exportar</button></div>
           <div class="photos">${items.map((i) => this.photoCell(i.photo, null, 'list')).join('')}</div>`
        : '<p class="note" style="text-align:center;padding:24px 8px">Todavía no hay fotos donde aparezcan juntos.</p>'}`;
  }

  /* ---------- Fotos ---------- */
  tab_photos() {
    const { visible, noFaces } = this.data;
    if (!visible.length) {
      return `<div class="empty"><div class="art">${I.photos}</div><h3>Tu línea de tiempo</h3>
        <p class="note">Cuando agregues una carpeta, tus fotos aparecen acá ordenadas por mes.</p>
        <button class="btn primary block" data-a="add-source">${I.folderPlus}Elegir una carpeta</button></div>`;
    }
    const f = this.state.filter;
    const favs = visible.filter((p) => p.fav);
    const docs = visible.filter((p) => p.kind === 'doc'); const shots = visible.filter((p) => p.kind === 'screenshot');
    const chips = [['all', 'Todas', I.photos], ['fav', `Favoritas${favs.length ? ` ${favs.length}` : ''}`, I.star], ['docs', `Papeles${docs.length ? ` ${docs.length}` : ''}`, I.doc], ['shots', `Capturas${shots.length ? ` ${shots.length}` : ''}`, I.phone], ['dupes', 'Duplicadas', I.copies], ['nofaces', 'Sin caras', I.gallery]]
      .map(([k, l, ic]) => `<button class="chip" data-a="filter" data-v="${k}" aria-pressed="${f === k}">${ic}${l}</button>`).join('');
    let content;
    if (f === 'dupes') content = this.dupesView();
    else {
      const list = f === 'fav' ? favs : f === 'nofaces' ? noFaces : f === 'docs' ? docs : f === 'shots' ? shots : visible;
      this.ctxList = list.map((p) => ({ photo: p }));
      content = list.length ? this.timeline(list) : `<p class="note" style="text-align:center;padding:28px 8px">${f === 'fav' ? 'Tocá la estrella en una foto para tenerla acá.' : f === 'docs' ? 'No hay fotos de papeles ni de pantallas.' : 'Nada por acá.'}</p>`;
    }
    return `<div class="chips">${chips}</div>${content}`;
  }

  timeline(list) {
    const shown = list.slice(0, this.state.limit);
    const fmt = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' });
    const groups = [];
    for (const p of shown) {
      const key = fmt.format(new Date(p.lastModified || p.scannedAt));
      if (!groups.length || groups.at(-1).key !== key) groups.push({ key, items: [] });
      groups.at(-1).items.push(p);
    }
    return groups.map((g) => `<div class="month"><h4>${esc(g.key.charAt(0).toUpperCase() + g.key.slice(1))}</h4><span class="num">${nf.format(g.items.length)}</span></div>
      <div class="photos">${g.items.map((p) => this.photoCell(p, null, 'list')).join('')}</div>`).join('')
      + (list.length > shown.length ? `<button class="btn ghost block" style="margin-top:14px" data-a="more">Ver ${nf.format(Math.min(PAGE, list.length - shown.length))} más</button>` : '');
  }

  dupesView() {
    if (!this.state.dupes) {
      if (!this.dupesBusy) this.computeDupes();
      return '<p class="note" style="text-align:center;padding:28px 8px">Comparando fotos…</p>';
    }
    const groups = this.state.dupes;
    if (!groups.length) return `<div class="empty" style="padding-top:8px"><div class="art">${I.check}</div><h3>Sin duplicadas</h3><p class="note">No encontramos fotos repetidas en tus carpetas.</p></div>`;
    const extra = groups.reduce((n, g) => n + g.length - 1, 0);
    return `<p class="note" style="margin-bottom:12px">${plural(groups.length, 'grupo', 'grupos')} de fotos casi iguales. Se conserva la de mejor calidad (marcada) y las copias van a la bóveda: nada se borra.</p>
      <button class="btn primary block" style="margin-bottom:14px" data-a="dupes-all">${I.copies}Guardar ${plural(extra, 'copia', 'copias')} en la bóveda</button>
      ${groups.map((g, i) => `<div class="dupe"><div class="strip">${g.slice(0, 4).map((p, j) => `<img class="${j === 0 ? 'keep' : ''}" alt="" src="${this.photoUrl(p)}">`).join('')}</div>
        <div class="meta"><p class="num">${plural(g.length, 'foto', 'fotos')} · ${esc(g[0].name)}</p><button class="btn ghost" data-a="dupes-one" data-v="${i}">Ordenar</button></div></div>`).join('')}`;
  }

  /* ---------- Borrar ---------- */
  cleanGroups() {
    const vis = this.data.visible;
    const groups = CLEAN.map((c) => ({ ...c, items: vis.filter(c.test) }));
    if (this.state.dupes) groups.push({ k: 'dupes', l: 'Repetidas', d: 'Copias casi iguales. Se conserva la de mejor calidad.', items: this.state.dupes.flatMap((g) => g.slice(1)) });
    return groups;
  }

  tab_clean() {
    if (!this.data.visible.length) {
      return `<div class="empty"><div class="art">${I.trash}</div><h3>Liberá espacio</h3>
        <p class="note">Cuando agregues una carpeta, acá aparecen las fotos que conviene borrar: capturas, papeles, borrosas y repetidas.</p>
        <button class="btn primary block" data-a="add-source">${I.folderPlus}Elegir una carpeta</button></div>`;
    }
    if (!this.state.dupes && !this.dupesBusy) this.computeDupes();
    const icons = { shots: I.phone, docs: I.doc, blur: I.blur, dark: I.moon, burnt: I.sun, dupes: I.copies };
    const groups = this.cleanGroups();
    const total = new Set(groups.flatMap((g) => g.items.map((p) => p.id))).size;
    const mb = (groups.flatMap((g) => g.items).reduce((m, p, i, arr) => (arr.findIndex((x) => x.id === p.id) === i ? m + (p.size || 0) : m), 0) / 1048576);
    return `<div class="hero" style="padding:2px 0 10px"><p class="brand num" style="font-size:40px">${nf.format(total)}</p>
        <p class="sub num">${total ? `fotos para revisar · cerca de ${nf.format(Math.round(mb))} MB` : 'Nada para borrar por ahora'}</p></div>
      ${this.state.scan && this.state.scan.phase === 'index' ? '<p class="note small" style="text-align:center;margin-bottom:10px">Todavía estoy ordenando fotos: la lista va a crecer.</p>' : ''}
      ${groups.map((g) => `<button class="clean" data-a="clean-open" data-v="${g.k}" ${g.items.length ? '' : 'disabled'}>
        <span class="ic">${icons[g.k]}</span>
        <span class="tx"><span class="t">${esc(g.l)}</span><span class="s">${esc(g.d)}</span></span>
        <span class="strip">${g.items.slice(0, 3).map((p) => `<img alt="" src="${this.photoUrl(p)}">`).join('')}</span>
        <span class="n num">${g.k === 'dupes' && !this.state.dupes ? '…' : nf.format(g.items.length)}</span></button>`).join('')}
      <p class="note small" style="text-align:center;margin-top:14px">Nada se borra sin que lo confirmes. Revisá cada grupo antes.</p>`;
  }

  computeDupes() {
    this.dupesBusy = true;
    sc.ensureHashes().then(async (n) => {
      if (n) this.data = await sc.snapshot();
      this.state.dupes = sc.findDuplicates(this.data.visible);
      this.dupesBusy = false;
      if (this.state.open && (this.state.tab === 'clean' || this.state.filter === 'dupes') && !this.typingIn()) this.render();
    }).catch(() => { this.dupesBusy = false; });
  }

  viewClean(k) {
    const g = this.cleanGroups().find((x) => x.k === k);
    if (!g) { this.state.view = null; return this.tab_clean(); }
    const sel = this.state.cleanSel;
    const items = g.items;
    const srcs = new Map(this.data.sources.map((s) => [s.id, s]));
    const deletable = items.filter((p) => sel.has(p.id) && sc.canDeleteHere(srcs.get(p.sourceId))).length;
    const n = items.filter((p) => sel.has(p.id)).length;
    return `<div class="hero" style="padding-bottom:8px">
        <button class="iconbtn back" data-a="back" aria-label="Volver">${I.back}</button>
        <p class="brand" style="font-size:24px;margin-top:6px">${esc(g.l)}</p>
        <p class="sub">${esc(g.d)}</p></div>
      <div class="row" style="margin-bottom:10px"><button class="btn ghost" data-a="clean-all" data-v="${k}">${n === items.length ? 'Quitar todas' : 'Elegir todas'}</button></div>
      <p class="note small" style="margin:0 2px 8px">Tocá una foto para sacarla o ponerla en la lista. Mantené apretado para verla grande.</p>
      <div class="photos">${items.map((p) => `<button class="ph pick ${sel.has(p.id) ? 'on' : ''}" data-key="ck-${p.id}" data-a="clean-toggle" data-v="${p.id}" aria-pressed="${sel.has(p.id)}" aria-label="${esc(p.name)}">
        <img loading="lazy" decoding="async" alt="" src="${this.photoUrl(p)}"><span class="mark">${sel.has(p.id) ? I.check : ''}</span></button>`).join('')}</div>
      <div class="selbar"><span class="n num">${plural(n, 'elegida', 'elegidas')}</span>
        <button class="btn ghost" data-a="clean-hide" ${n ? '' : 'disabled'}>${I.lock}Bóveda</button>
        <button class="btn danger-fill" data-a="clean-delete" ${deletable ? '' : 'disabled'}>${I.trash}Borrar ${deletable ? nf.format(deletable) : ''}</button></div>
      ${n && !deletable ? '<p class="note small" style="margin-top:20px">En esta vista no se pueden borrar archivos. Usá la app instalada, o mandalas a la bóveda.</p>' : ''}`;
  }

  async cleanDelete() {
    const g = this.cleanGroups().find((x) => x.k === this.state.view.cat);
    const srcs = new Map(this.data.sources.map((s) => [s.id, s]));
    const list = g.items.filter((p) => this.state.cleanSel.has(p.id) && sc.canDeleteHere(srcs.get(p.sourceId)));
    if (!list.length) return;
    const mb = list.reduce((m, p) => m + (p.size || 0), 0) / 1048576;
    if (!(await this.confirm(`¿Borrar ${plural(list.length, 'foto', 'fotos')}?`, `Se borran del teléfono y liberás cerca de ${nf.format(Math.round(mb))} MB. No se puede deshacer.`, 'Borrar', true))) return;
    const onP = (d, t) => { this.state.scan = { phase: 'scan', label: 'Borrando', source: g.l, done: d, total: t, noStop: true }; this.renderProgress(); };
    try {
      const r = await sc.deletePhotos(list, onP);
      this.state.cleanSel.clear();
      this.toast(r.failed ? `${plural(r.deleted, 'foto borrada', 'fotos borradas')} · ${r.failed} no se pudieron (volvé a elegir la carpeta)` : `${plural(r.deleted, 'foto borrada', 'fotos borradas')}`);
    } finally { this.state.scan = null; this.renderProgress(); }
    this.state.dupes = null;
    await this.refresh();
  }

  /* ---------- Carpetas ---------- */
  tab_sources() {
    const { sources, visible } = this.data;
    const pick = this.state.picking;
    // Primeras 4 fotos ya ordenadas de cada subcarpeta (para el mosaico).
    const covers = new Map();
    for (const p of visible) {
      const k = `${p.sourceId}|${p.path.includes('/') ? p.path.slice(0, p.path.lastIndexOf('/')) : ''}`;
      const l = covers.get(k) || []; if (l.length < 4) { l.push(p); covers.set(k, l); }
    }
    const scanning = this.state.scan && this.state.scan.source;
    const status = (s) => {
      if (this.scanQueue.has(s.id)) return '<span class="tag-st">En fila</span>';
      if (scanning === s.name) return '<span class="tag-st on">Importando</span>';
      if (s.lastScan) return '<span class="tag-st ok">Lista</span>';
      return '<span class="tag-st">Sin analizar</span>';
    };
    const sections = sources.map((s) => {
      const needs = s._access && s._access !== 'granted';
      const dirs = Object.entries(s.dirs || { '': s.photoCount || 0 }).filter(([, n]) => n > 0).sort((x, y) => (x[0] === '' ? -1 : y[0] === '' ? 1 : y[1] - x[1]));
      const albums = dirs.map(([d, n]) => {
        const cover = covers.get(`${s.id}|${d}`) || [];
        const label = d === '' ? s.name : d.split('/').pop();
        return `<button class="album" data-key="al-${s.id}-${esc(d)}" data-a="open-album" data-v="${s.id}" data-d="${esc(d)}">
          <span class="cover">${cover.length ? cover.map((p) => `<img alt="" src="${this.photoUrl(p)}">`).join('') + '<i></i>'.repeat(4 - cover.length) : `<span class="ph-empty">${I.folder}</span>`}</span>
          <span class="meta"><span class="tx"><span class="t">${esc(label)}</span><span class="s num">${plural(n, 'foto', 'fotos')}</span></span></span></button>`;
      }).join('');
      return `<section class="srcsec ${s.enabled ? '' : 'off'}" data-key="sec-${s.id}">
        <div class="srchead">
          <span class="ic">${I.folder}</span>
          <div class="tx"><p class="t">${esc(s.name)} ${status(s)}</p>
            <p class="s num ${needs ? 'warn' : ''}">${needs ? (s.kind === 'input' ? 'Volvé a elegirla para ver los originales' : 'Falta dar acceso') : `${plural(s.photoCount || 0, 'foto', 'fotos')} · ${plural(dirs.length, 'carpeta', 'carpetas')}`}</p></div>
          <button class="switch sm" role="switch" aria-checked="${s.enabled}" aria-label="Incluir ${esc(s.name)}" data-a="toggle-src" data-v="${s.id}"></button>
          <button class="iconbtn sm" data-a="src-menu" data-v="${s.id}" aria-label="Opciones de ${esc(s.name)}">${I.more}</button>
        </div>
        <div class="albums">${albums}</div></section>`;
    }).join('');
    return `${pick ? `<div class="banner"><p><b>Leyendo ${esc(pick.folder)}</b> · <span class="num">${nf.format(pick.n)}</span> fotos encontradas…</p></div>` : ''}
      <button class="btn primary block" data-a="add-source" style="margin-bottom:14px">${I.folderPlus}Agregar carpeta</button>
      ${sections || '<p class="note" style="text-align:center;padding:20px 8px">Elegí una carpeta, por ejemplo DCIM: se importan ella y todas sus subcarpetas, cada una con su cantidad de fotos.</p>'}
      ${sources.length ? `<button class="btn ghost block" style="margin-top:6px" data-a="scan" ${this.state.scan ? 'disabled' : ''}>${I.refresh}Escanear todo</button>
      <p class="note small" style="margin:12px 2px 0">Tocá un álbum para ver sus fotos. El interruptor saca la carpeta de la vista sin borrar nada.</p>` : ''}`;
  }

  viewAlbum(srcId, dir) {
    const src = this.data.sources.find((x) => x.id === srcId);
    if (!src) { this.state.view = null; return this.tab_sources(); }
    const list = this.data.visible.filter((p) => p.sourceId === srcId && (p.path.includes('/') ? p.path.slice(0, p.path.lastIndexOf('/')) : '') === dir);
    this.ctxList = list.map((p) => ({ photo: p }));
    const total = (src.dirs || {})[dir] ?? list.length;
    return `<div class="hero" style="padding-bottom:10px">
        <button class="iconbtn back" data-a="back" aria-label="Volver">${I.back}</button>
        <p class="brand" style="font-size:24px;margin-top:6px">${esc(dir === '' ? src.name : dir.split('/').pop())}</p>
        <p class="sub num">${esc(src.name)}${dir ? ` / ${esc(dir)}` : ''} · ${plural(total, 'foto', 'fotos')}</p></div>
      ${list.length ? this.timeline(list) : ''}
      ${list.length < total ? `<p class="note small" style="text-align:center;margin-top:12px">Importando: ${nf.format(list.length)} de ${nf.format(total)} listas. Las demás aparecen solas.</p>` : ''}`;
  }

  // Menú de acciones de una carpeta.
  async srcMenu(id) {
    const s = this.data.sources.find((x) => x.id === id); if (!s) return;
    const needs = s._access && s._access !== 'granted';
    const opts = [
      needs ? (s.kind === 'input' ? ['reselect', 'Volver a elegir la carpeta', I.folderPlus] : ['grant', 'Dar acceso', I.check]) : ['scan', 'Escanear ahora', I.refresh],
      ['rec', s.recursive ? 'Sólo la carpeta principal' : 'Incluir subcarpetas', I.folder],
      ['remove', 'Quitar de Pompa', I.trash],
    ];
    const k = await this.menu(s.name, `${plural(s.photoCount || 0, 'foto', 'fotos')}${s.lastScan ? ` · escaneada el ${new Date(s.lastScan).toLocaleDateString('es-AR')}` : ''}`, opts);
    const fake = (a) => this.onClick({ composedPath: () => [{ dataset: { a, v: id }, tagName: 'BUTTON' }] });
    if (k === 'scan') return this.startScan([id]);
    if (k === 'reselect') return this.addSource();
    if (k === 'grant') return fake('grant');
    if (k === 'rec') return fake('toggle-rec');
    if (k === 'remove') return fake('remove-src');
  }

  menu(title, text, opts) {
    return new Promise((resolve) => {
      const d = document.createElement('div'); d.className = 'dialog';
      d.innerHTML = `<div class="card" role="dialog" aria-label="${esc(title)}"><h3>${esc(title)}</h3><p class="note num">${esc(text)}</p>
        <div class="list">${opts.map(([k, l, ic]) => `<button class="opt ${k === 'remove' ? 'warn' : ''}" data-r="${k}"><span class="oi">${ic}</span><span>${esc(l)}</span></button>`).join('')}</div>
        <button class="btn ghost block" data-r="">Cancelar</button></div>`;
      const done = (val) => { d.remove(); resolve(val); };
      d.addEventListener('dismiss', () => done(null));
      d.addEventListener('click', (e) => { const b = e.composedPath().find((n) => n.dataset && 'r' in n.dataset); if (b || e.target === d) done(b?.dataset.r || null); });
      this.root.appendChild(d);
    });
  }

  /* ---------- Bóveda ---------- */
  tab_vault() {
    const st = this.state;
    if (!this.settings.pinHash) {
      if (st.pinStep !== 'set' && st.pinStep !== 'confirm') st.pinStep = 'set';
      return this.keypadView(st.pinStep === 'set' ? 'Creá tu PIN' : 'Repetilo', 'Cuatro números para abrir la bóveda. Lo que guardes acá queda fuera de la galería y de las exportaciones.');
    }
    if (!st.vaultOpen) { st.pinStep = 'unlock'; return this.keypadView('Bóveda', 'Ingresá tu PIN'); }
    const hp = this.data.people.filter((p) => p.hidden);
    const ph = this.data.hiddenPhotos;
    return `<div class="row" style="margin-bottom:6px"><button class="btn ghost" data-a="vault-lock">${I.lock}Cerrar bóveda</button></div>
      ${!hp.length && !ph.length ? `<div class="empty"><div class="art">${I.shield}</div><h3>Bóveda vacía</h3><p class="note">Desde una persona o una foto, tocá “Bóveda” para guardarla acá.</p></div>` : ''}
      ${hp.length ? `<p class="eyebrow">Personas</p><div class="people">${hp.map((p) => `
        <button class="person" data-a="show-person" data-v="${p.id}"><img class="avatar" alt="" src="${this.faceUrl(p.cover)}">
        <span class="nm ${p.name ? '' : 'unnamed'}">${esc(p.name || 'Sin nombre')}</span><span class="ct">Tocá para mostrar</span></button>`).join('')}</div>` : ''}
      ${ph.length ? `<p class="eyebrow">Fotos · tocá para devolverlas</p><div class="photos">${ph.map((p) => `
        <button class="ph" data-a="show-photo" data-v="${p.id}" aria-label="Mostrar ${esc(p.name)}"><img loading="lazy" alt="" src="${this.photoUrl(p)}"><span class="hid">${I.eye}</span></button>`).join('')}</div>` : ''}`;
  }

  keypadView(title, sub) {
    const n = this.state.pin.length;
    return `<div class="vault"><div class="lock">${I.lock}</div><h3>${esc(title)}</h3><p class="note">${esc(sub)}</p>
      <div class="pins" aria-label="${n} de 4">${[0, 1, 2, 3].map((i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div>
      <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button class="key num" data-a="key" data-v="${d}">${d}</button>`).join('')}
        <span></span><button class="key num" data-a="key" data-v="0">0</button><button class="key ghost" data-a="key-del" aria-label="Borrar">${I.del}</button></div></div>`;
  }

  async onKey(e) {
    if (!this.state.open) return;
    if (e.key === 'Escape') { if (!this.closeOverlay()) this.close(); return; }
    if (this.show && e.key === ' ') { e.preventDefault(); this.toggleShow(); return; }
    if (this.viewer && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { this.stepViewer(e.key === 'ArrowRight' ? 1 : -1); return; }
    const inInput = e.composedPath()[0]?.tagName === 'INPUT';
    if (!inInput && this.state.tab === 'vault' && this.state.pinStep && /^[0-9]$/.test(e.key) && !this.state.view) this.pressKey(e.key);
  }

  async pressKey(d) {
    const st = this.state;
    if (st.pin.length >= 4 || this.pinBusy) return;
    st.pin += d; vibrate(4); this.render();
    if (st.pin.length < 4) return;
    this.pinBusy = true;
    try {
      const pin = st.pin;
      await new Promise((r) => setTimeout(r, 140));
      if (st.pinStep === 'set') { st.pinFirst = pin; st.pin = ''; st.pinStep = 'confirm'; return this.render(); }
      if (st.pinStep === 'confirm') {
        if (pin !== st.pinFirst) { st.pin = ''; st.pinStep = 'set'; this.shake(); return this.toast('No coincide. Probá de nuevo'); }
        this.settings.pinHash = await sha(pin); await db.setSetting('pinHash', this.settings.pinHash);
        st.pin = ''; st.pinStep = null; st.vaultOpen = true; this.toast('Bóveda lista'); return this.render();
      }
      if (st.pinStep === 'unlock') {
        if ((await sha(pin)) === this.settings.pinHash) { st.pin = ''; st.pinStep = null; st.vaultOpen = true; vibrate(10); return this.render(); }
        st.pin = ''; this.shake(); this.toast('PIN incorrecto');
      }
    } finally { this.pinBusy = false; }
  }
  shake() { this.render(); this.$('.pins')?.classList.add('shake'); vibrate([20, 40, 20]); }

  /* ---------- Ajustes ---------- */
  tab_settings() {
    const t = this.settings.threshold;
    const seg = (list, cur, a) => `<div class="seg">${list.map((o) => `<button aria-pressed="${o.k === cur}" data-a="${a}" data-v="${o.k}">${o.l}</button>`).join('')}</div>`;
    return `
      <p class="eyebrow">Apariencia</p>
      <div class="group"><div class="item stack"><div class="tx"><p class="t">Tema</p></div>${seg(THEMES, this.settings.theme, 'theme')}</div></div>
      <p class="eyebrow">Ventana</p>
      <div class="group"><div class="item stack"><div class="tx"><p class="t">Tamaño de la ventana</p><p class="s">También podés arrastrar la barrita de abajo de la ventana.</p></div>
        ${seg(WINS, this.winKey(), 'win')}</div></div>
      <p class="eyebrow">Burbuja flotante</p>
      <div class="group">
        <div class="item stack"><div class="tx"><p class="t">Tamaño</p><p class="s">Movela a donde quieras: se queda donde la soltás.</p></div>${seg(SIZES.map((s) => ({ k: s.k, l: `${s.l} · ${s.px}` })), this.settings.size, 'size')}</div>
        <div class="item stack"><div class="tx"><p class="t">Presencia en reposo</p></div>${seg(IDLE, this.settings.idle, 'idle')}</div>
        ${NATIVE ? this.overlayItem() : ''}
      </div>
      <p class="eyebrow">Reconocimiento</p>
      <div class="group"><div class="item stack"><div class="tx"><p class="t">Cómo agrupa las caras</p><p class="s">Estricto separa más · flexible junta más.</p></div>
        <input type="range" min="0.38" max="0.62" step="0.02" value="${t}" data-a="threshold" aria-label="Sensibilidad">
        <div class="range-l num"><span>Estricto</span><span>${t.toFixed(2)}</span><span>Flexible</span></div>
        <button class="btn ghost block" data-a="regroup">${I.refresh}Reagrupar sin perder nombres</button></div></div>
      <p class="eyebrow">Privacidad</p>
      <div class="group">
        <div class="item"><span class="ic">${I.shield}</span><div class="tx"><p class="t">100% en tu dispositivo</p><p class="s">Sin cuentas, sin nube, sin servidores.</p></div></div>
        <div class="item"><span class="ic">${I.lock}</span><div class="tx"><p class="t">PIN de la bóveda</p><p class="s">${this.settings.pinHash ? 'Activo · evita miradas, no cifra archivos' : 'Sin configurar'}</p></div>
          ${this.settings.pinHash ? '<button class="chip" data-a="pin-reset">Cambiar</button>' : ''}</div>
        <div class="item"><span class="ic">${I.trash}</span><div class="tx"><p class="t">Borrar todo el índice</p><p class="s">Tus fotos originales quedan intactas.</p></div>
          <button class="chip" data-a="wipe">Borrar</button></div>
      </div>
      <p class="note small" style="text-align:center;margin-top:18px">Pompa ${VERSION} · hecho para quedarse en tu teléfono</p>`;
  }

  winKey() {
    const w = this.settings.win; if (!w) return 'normal';
    const o = WINS.find((x) => Math.abs(x.w - w.w) < 2 && Math.abs(x.h - w.h) < 2); return o ? o.k : '';
  }

  overlayItem() {
    let on = false; let can = false;
    try { on = window.MemoraNative.overlayEnabled(); can = window.MemoraNative.canOverlay(); } catch { /* */ }
    return `<div class="item"><div class="tx"><p class="t">Sobre otras apps</p>
      <p class="s">${on && !can ? 'Falta el permiso de Android' : 'La burbuja queda flotando cuando salís'}</p></div>
      <button class="switch" role="switch" aria-checked="${on && can}" aria-label="Burbuja sobre otras apps" data-a="overlay"></button></div>`;
  }

  overlayBanner() {
    if (!NATIVE) return '';
    try { if (window.MemoraNative.canOverlay()) return ''; } catch { return ''; }
    return `<div class="banner"><p>Dejá la burbuja flotando sobre cualquier app.</p><button class="btn primary" data-a="overlay-on">Activar</button></div>`;
  }

  /* ---------- Eventos ---------- */
  onInput(e) {
    const t = e.composedPath()[0];
    if (t.dataset?.a === 'query') {
      this.state.query = t.value;
      const grid = this.$('#pgrid');
      if (grid) { const n = document.createElement('div'); n.innerHTML = this.peopleGrid(); morphdom(grid, n, { childrenOnly: true, getNodeKey: (x) => (x.nodeType === 1 && x.dataset?.key) || null }); }
    }
    if (t.dataset?.a === 'threshold') { const lbl = this.root.querySelector('.range-l span:nth-child(2)'); if (lbl) lbl.textContent = Number(t.value).toFixed(2); }
  }

  async onChange(e) {
    const t = e.composedPath()[0];
    if (t.classList?.contains('picker')) {
      const files = [...(t.files || [])]; // copiar ANTES de limpiar: limpiar el input vacía su lista
      t.value = '';
      this.state.picking = null;
      if (!files.length) return this.toast('Esa carpeta no tiene fotos compatibles');
      try {
        const src = await sc.addSourceFromFiles(files);
        return await this.afterAdd(src);
      } catch (err) {
        console.error('[pompa] agregar carpeta', err);
        this.toast(`No pude agregar la carpeta: ${err?.message || err}`);
      }
      return;
    }
    if (t.dataset?.a === 'rename') { await sc.renamePerson(t.dataset.v, t.value); await this.refresh(); this.toast('Nombre guardado'); }
    if (t.dataset?.a === 'threshold') { this.settings.threshold = Number(t.value); await db.setSetting('threshold', this.settings.threshold); }
  }

  async onClick(e) {
    const el = e.composedPath().find((n) => n.dataset?.a);
    if (!el || el.tagName === 'INPUT') return;
    const { a, v } = el.dataset;
    const S = this.state;
    try {
      switch (a) {
        case 'close': return this.close();
        case 'tab': Object.assign(S, { tab: v, view: null, selecting: false, limit: PAGE }); S.sel.clear(); if (v !== 'vault') S.pin = ''; this.$('.body').scrollTop = 0; return this.render();
        case 'back': S.view = null; return this.render();
        case 'add-source': return this.addSource();
        case 'scan': return this.startScan();
        case 'scan-one': return this.startScan([v]);
        case 'cancel-scan': this.abort?.abort(); return;
        case 'grant': if (await sc.requestAccess(this.data.sources.find((s) => s.id === v))) { await this.refresh(); this.startScan([v]); } return;
        case 'toggle-src': { const s = this.data.sources.find((x) => x.id === v); await sc.setSource(v, { enabled: !s.enabled }); return this.refreshSources(); }
        case 'toggle-rec': { const s = this.data.sources.find((x) => x.id === v); await sc.setSource(v, { recursive: !s.recursive }); this.toast(s.recursive ? 'Sólo la carpeta principal' : 'Incluye subcarpetas · volvé a escanear'); return this.refreshSources(); }
        case 'remove-src': {
          const s = this.data.sources.find((x) => x.id === v);
          if (!(await this.confirm(`¿Quitar “${s.name}”?`, 'Se borra su índice en Pompa. Tus fotos originales no se tocan.', 'Quitar'))) return;
          await sc.removeSource(v); this.toast('Carpeta quitada'); return this.refreshSources();
        }
        case 'src-menu': return this.srcMenu(v);
        case 'open-album': S.view = { type: 'album', src: v, dir: el.dataset.d || '' }; S.limit = PAGE; this.$('.body').scrollTop = 0; return this.render();
        case 'open-person': S.view = { type: 'person', id: v }; this.$('.body').scrollTop = 0; return this.render();
        case 'sel-start': S.selecting = true; S.sel.clear(); return this.render();
        case 'sel-cancel': S.selecting = false; S.sel.clear(); return this.render();
        case 'toggle-sel': vibrate(4); if (S.sel.has(v)) S.sel.delete(v); else S.sel.add(v); return this.render();
        case 'sel-hide': for (const id of S.sel) await sc.setPersonHidden(id, true); this.toast(`${plural(S.sel.size, 'persona', 'personas')} en la bóveda`); S.selecting = false; S.sel.clear(); return this.refresh();
        case 'sel-merge': return this.mergeSelected();
        case 'sel-together': { const ids = [...S.sel]; S.selecting = false; S.sel.clear(); S.view = { type: 'together', ids }; this.$('.body').scrollTop = 0; return this.render(); }
        case 'merge-into': return this.pickMergeTarget(v);
        case 'hide-person': await sc.setPersonHidden(v, true); S.view = null; this.toast('Guardada en la bóveda'); return this.refresh();
        case 'show-person': await sc.setPersonHidden(v, false); this.toast('Vuelve a la galería'); return this.refresh();
        case 'show-photo': await sc.setPhotoHidden(v, false); this.toast('Foto visible otra vez'); return this.refresh();
        case 'view': return this.openViewer(el.dataset.ctx, v, el.dataset.f);
        case 'memory': { const p = this.data.people.find((x) => x.id === v); return this.startShow(p.items.filter((i) => !i.photo.hidden).map((i) => i.photo), p.name || 'Recuerdo'); }
        case 'memory-together': return this.startShow((this.ctxList || []).map((i) => i.photo), 'Juntos');
        case 'export-all': return this.export(this.data.people.filter((p) => !p.hidden));
        case 'export-one': return this.export(this.data.people.filter((p) => p.id === v));
        case 'export-together': return this.export([{ name: 'Juntos', items: this.ctxList || [] }]);
        case 'filter': S.filter = v; S.limit = PAGE; return this.render();
        case 'clean-open': { const g = this.cleanGroups().find((x) => x.k === v); S.cleanSel = new Set(g.items.map((p) => p.id)); S.view = { type: 'clean', cat: v }; this.$('.body').scrollTop = 0; return this.render(); }
        case 'clean-toggle': vibrate(4); if (S.cleanSel.has(v)) S.cleanSel.delete(v); else S.cleanSel.add(v); return this.render();
        case 'clean-all': { const g = this.cleanGroups().find((x) => x.k === v); const all = g.items.every((p) => S.cleanSel.has(p.id)); S.cleanSel = all ? new Set() : new Set(g.items.map((p) => p.id)); return this.render(); }
        case 'clean-hide': { const ids = [...S.cleanSel]; for (const id of ids) await sc.setPhotoHidden(id, true); S.cleanSel.clear(); this.toast(`${plural(ids.length, 'foto', 'fotos')} en la bóveda`); S.dupes = null; return this.refresh(); }
        case 'clean-delete': return this.cleanDelete();
        case 'win': { const o = WINS.find((x) => x.k === v); this.manualRect = null; this.settings.win = { w: o.w, h: o.h }; await db.setSetting('win', this.settings.win); this.placeSheet(); return this.render(); }
        case 'more': S.limit += PAGE; return this.render();
        case 'dupes-all': return this.hideDupes(S.dupes || []);
        case 'dupes-one': return this.hideDupes([(S.dupes || [])[Number(v)]].filter(Boolean));
        case 'key': return this.pressKey(v);
        case 'key-del': S.pin = S.pin.slice(0, -1); return this.render();
        case 'vault-lock': S.vaultOpen = false; return this.render();
        case 'pin-reset':
          if (!(await this.confirm('¿Cambiar el PIN?', 'Vas a crear uno nuevo. Lo que está en la bóveda se mantiene.', 'Cambiar'))) return;
          this.settings.pinHash = ''; await db.setSetting('pinHash', ''); Object.assign(S, { tab: 'vault', vaultOpen: false, pin: '', pinStep: 'set' }); return this.render();
        case 'theme': this.settings.theme = v; await db.setSetting('theme', v); this.applyTheme(); return this.render();
        case 'idle': this.settings.idle = Number(v); await db.setSetting('idle', this.settings.idle); this.applyIdle(); return this.render();
        case 'size': this.settings.size = v; await db.setSetting('bubbleSize', v); this.applySize();
          if (NATIVE) try { window.MemoraNative.setBubbleSize((SIZES.find((x) => x.k === v) || SIZES[1]).px); } catch { /* */ }
          return this.render();
        case 'overlay-on': window.MemoraNative.setOverlay(true); return this.toast('Activá “Mostrar sobre otras apps” y volvé');
        case 'overlay': {
          const M = window.MemoraNative; const active = M.overlayEnabled() && M.canOverlay();
          if (active) { M.setOverlay(false); this.toast('La burbuja queda sólo dentro de Pompa'); }
          else { M.setOverlay(true); this.toast(M.canOverlay() ? 'Listo: salí y la vas a ver flotando' : 'Activá “Mostrar sobre otras apps” y volvé'); }
          return this.render();
        }
        case 'regroup': return this.regroup();
        case 'wipe':
          if (!(await this.confirm('¿Borrar todo?', 'Se borran carpetas, caras, nombres y la bóveda de Pompa. Tus fotos originales quedan intactas.', 'Borrar', true))) return;
          await db.clearAll(); this.settings.pinHash = ''; S.view = null; S.vaultOpen = false; this.toast('Índice borrado'); return this.refresh();
        default:
      }
    } catch (err) {
      if (err?.name === 'AbortError') return; // el usuario canceló un selector
      console.error('[rostra]', err); this.toast('Algo falló. Probá de nuevo.');
    }
  }

  async refreshSources() {
    await this.refresh();
    for (const s of this.data.sources) s._access = await sc.sourceAccess(s);
    this.render();
  }

  async addSource() {
    if (!sc.supportsFSA()) { this.$('.picker').click(); if (NATIVE) this.toast('Elegí la carpeta y tocá “Usar esta carpeta”'); return; } // Android, iOS y APK: selector del sistema
    let src;
    try { src = await sc.addSourceFromPicker(); } catch (err) {
      if (err?.name === 'AbortError' && err?.message?.toLowerCase().includes('abort')) return; // canceló el usuario
      this.toast('Elegí la carpeta en el selector del sistema');
      this.$('.picker').click();
      return;
    }
    return this.afterAdd(src);
  }

  // Después de cada carpeta: ofrecer sumar otra antes de empezar (el selector de Android elige una por vez).
  async afterAdd(src) {
    this.scanQueue.add(src.id);
    Object.assign(this.state, { tab: 'sources', view: null, picking: null });
    if (!this.state.open) this.open();
    await this.refresh();
    this.lastSig = null; this.render(); // redibujo explícito: la carpeta aparece sí o sí
    const nDirs = Object.keys(src.dirs || {}).length;
    this.toast(`${src.name}: ${plural(src.photoCount || 0, 'foto', 'fotos')} en ${plural(nDirs, 'carpeta', 'carpetas')}`);
    if (this.state.scan) return; // queda en fila y se ve en Carpetas como “En fila”
    const more = await this.confirm(`${src.name}: ${plural(src.photoCount || 0, 'foto', 'fotos')}`, `Encontré ${plural(nDirs, 'carpeta', 'carpetas')} con fotos. ¿Querés sumar otra carpeta antes de empezar? Se importan todas juntas, en segundo plano.`, 'Agregar otra', false, 'Empezar');
    if (more) { this.addSource(); return; }
    const ids = [...this.scanQueue]; this.scanQueue.clear();
    this.startScan(ids);
  }

  async startScan(ids) {
    if (this.state.scan) {
      (ids || this.data.sources.filter((s) => s.enabled).map((s) => s.id)).forEach((id) => this.scanQueue.add(id));
      this.toast('Queda en la fila: sigue después de lo actual');
      return;
    }
    this.abort = new AbortController();
    this.state.scan = { phase: 'models', done: 0, total: 0, source: '' };
    this.setRing(0); this.renderProgress();
    let last = 0;
    try {
      const r = await sc.scan({
        sourceIds: ids, signal: this.abort.signal,
        onProgress: (p) => {
          this.state.scan = p; this.setRing(p.total ? p.done / p.total : 0); this.renderProgress();
          if (p.phase === 'indexed') { last = Date.now(); this.state.dupes = null; this.liveRefresh(); if (p.pending) this.toast(`Fotos ordenadas · ahora busco caras en ${nf.format(p.pending)}`); return; }
          if (Date.now() - last > 3000) { last = Date.now(); this.liveRefresh(); }
        },
      });
      const extra = r.docs ? ` · ${plural(r.docs, 'papel', 'papeles')}` : '';
      const msg = r.aborted ? 'Escaneo en pausa · seguí cuando quieras' : `${plural(r.scanned, 'foto nueva', 'fotos nuevas')} · ${plural(r.faces, 'cara', 'caras')}${extra}`;
      this.toast(r.blocked.length ? `${msg} · sin acceso: ${r.blocked.join(', ')}` : r.unsupported ? `${msg} · ${r.unsupported} sin formato compatible` : msg);
    } catch (err) {
      console.error('[rostra] escaneo', err);
      this.toast('No se pudo iniciar el reconocimiento');
    } finally {
      this.state.scan = null; this.setRing(null);
      await this.refreshSources();
      if (this.scanQueue.size) { const q = [...this.scanQueue]; this.scanQueue.clear(); setTimeout(() => this.startScan(q), 300); }
    }
  }

  async mergeSelected() {
    const ids = [...this.state.sel];
    const named = this.data.people.find((p) => ids.includes(p.id) && p.name);
    const count = (id) => this.data.people.find((p) => p.id === id)?.count || 0;
    const target = named?.id || ids.sort((a, b) => count(b) - count(a))[0];
    await sc.mergePersons(target, ids);
    this.state.selecting = false; this.state.sel.clear();
    this.toast(`${ids.length} grupos unidos`);
    await this.refresh();
  }

  async pickMergeTarget(fromId) {
    const others = this.data.people.filter((p) => p.id !== fromId && !p.hidden);
    if (!others.length) return this.toast('No hay otras personas');
    const target = await this.choose('¿Con quién la unís?', 'Todas sus fotos pasan a esa persona.', others);
    if (!target) return;
    await sc.mergePersons(target, [fromId]);
    this.state.view = { type: 'person', id: target };
    this.toast('Unidas'); await this.refresh();
  }

  async regroup() {
    if (!(await this.confirm('¿Reagrupar?', 'Las personas con nombre se mantienen. Las “Sin nombre” se vuelven a agrupar con la sensibilidad elegida.', 'Reagrupar'))) return;
    await sc.regroup(this.settings.threshold);
    this.toast('Caras reagrupadas'); await this.refresh();
  }

  async hideDupes(groups) {
    const copies = groups.flatMap((g) => g.slice(1));
    if (!copies.length) return;
    for (const p of copies) await sc.setPhotoHidden(p.id, true);
    this.toast(`${plural(copies.length, 'copia guardada', 'copias guardadas')} en la bóveda`);
    await this.refresh();
  }

  async export(people) {
    const list = people.map((p) => ({ ...p, items: p.items.filter((i) => !i.photo.hidden) })).filter((p) => p.items.length);
    if (!list.length) return this.toast('No hay fotos visibles para exportar');
    if (sc.isEmbedded) return this.toast('Armar carpetas funciona en la app instalada');
    const n = list.reduce((s, p) => s + p.items.length, 0);
    const fsa = sc.supportsFSA(); const pick = fsa || NATIVE;
    if (!(await this.confirm('Armar carpetas', `Una carpeta por persona: ${plural(list.length, 'carpeta', 'carpetas')}, ${plural(n, 'foto', 'fotos')}. ${pick ? 'Elegí dónde crearlas.' : 'Se descarga un .zip.'} Se copian: los originales no se mueven ni se borran.`, pick ? 'Elegir destino' : 'Descargar .zip'))) return;
    const onP = (d, t) => { this.state.scan = { phase: 'scan', label: 'Copiando', source: 'Armando carpetas', done: d, total: t, noStop: true }; this.renderProgress(); this.setRing(d / t); };
    try {
      const r = NATIVE ? await exportToNative(list, onP) : fsa ? await exportToFolder(list, onP) : await exportToZip(list, onP);
      if (r.cancelled) return this.toast('No se eligió destino');
      this.toast(r.missing.length ? `Listo · ${r.missing.length} sin original (volvé a elegir la carpeta)` : `Listo · ${plural(r.done, 'foto copiada', 'fotos copiadas')}`);
    } finally { this.state.scan = null; this.setRing(null); this.renderProgress(); }
  }

  /* ---------- Visor ---------- */
  async openViewer(ctx, photoId, faceId) {
    const list = this.ctxList || [];
    const idx = Math.max(0, list.findIndex((i) => i.photo.id === photoId && (!faceId || i.face?.id === faceId)));
    if (!list.length) return;
    const personId = ctx === 'person' ? this.state.view?.id : null;
    const wrap = document.createElement('div');
    wrap.className = 'viewer'; wrap.setAttribute('role', 'dialog');
    this.root.appendChild(wrap);
    this.viewer = { el: wrap, list, idx, personId, src: null };
    wrap.addEventListener('click', (e) => this.onViewerClick(e));
    let sx = null;
    wrap.addEventListener('pointerdown', (e) => { if (e.composedPath().some((n) => n.classList?.contains('stage'))) sx = e.clientX; });
    wrap.addEventListener('pointerup', (e) => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) this.stepViewer(dx < 0 ? 1 : -1); });
    await this.paintViewer();
  }

  async paintViewer() {
    const V = this.viewer; if (!V) return;
    const { photo, face } = V.list[V.idx];
    const orig = await sc.getOriginal(photo);
    if (!this.viewer) return;
    if (V.src) URL.revokeObjectURL(V.src);
    V.src = URL.createObjectURL(orig || photo.thumb);
    const inPerson = !!V.personId;
    V.el.innerHTML = `<div class="top"><button class="iconbtn" data-vx="close" aria-label="Cerrar">${I.back}</button>
        <span class="t num">${nf.format(V.idx + 1)} de ${nf.format(V.list.length)}</span>
        <button class="iconbtn ${photo.fav ? 'on' : ''}" data-vx="fav" aria-label="Favorita">${photo.fav ? I.starFill : I.star}</button></div>
      <div class="stage"><div class="wrap"><img alt="${esc(photo.name)}" src="${V.src}">${inPerson && face ? '<span class="box"></span>' : ''}</div>
        ${V.idx > 0 ? `<button class="nav-arrow l" data-vx="prev" aria-label="Anterior">${I.back}</button>` : ''}
        ${V.idx < V.list.length - 1 ? `<button class="nav-arrow r" data-vx="next" aria-label="Siguiente">${I.next}</button>` : ''}</div>
      <div class="acts">
        ${inPerson ? `<button data-vx="cover">${I.sparkle}Portada</button><button data-vx="detach">${I.split}No es</button>` : ''}
        <button data-vx="hide">${I.lock}Bóveda</button>
      </div>`;
    const img = V.el.querySelector('img'); const box = V.el.querySelector('.box');
    if (box) {
      const place = () => {
        const f = img.clientWidth / (photo.origW || img.naturalWidth || 1);
        Object.assign(box.style, { left: `${face.box.x * f}px`, top: `${face.box.y * f}px`, width: `${face.box.w * f}px`, height: `${face.box.h * f}px` });
      };
      img.onload = place; if (img.complete) place();
    }
  }

  stepViewer(d) {
    const V = this.viewer; if (!V) return;
    const n = V.idx + d; if (n < 0 || n >= V.list.length) return;
    V.idx = n; vibrate(3); this.paintViewer();
  }

  async onViewerClick(e) {
    const b = e.composedPath().find((n) => n.dataset?.vx); if (!b) return;
    const V = this.viewer; const act = b.dataset.vx; const item = V.list[V.idx];
    if (act === 'close') return this.closeViewer();
    if (act === 'prev') return this.stepViewer(-1);
    if (act === 'next') return this.stepViewer(1);
    if (act === 'fav') { item.photo.fav = !item.photo.fav; await sc.setFavorite(item.photo.id, item.photo.fav); vibrate(8); this.toast(item.photo.fav ? 'En favoritas' : 'Fuera de favoritas'); this.dirty = true; return this.paintViewer(); }
    if (act === 'cover') { await sc.setCover(V.personId, item.face.id); this.toast('Portada actualizada'); }
    if (act === 'detach') { await sc.detachFace(item.face.id); this.toast('Separada en una persona nueva'); }
    if (act === 'hide') { await sc.setPhotoHidden(item.photo.id, true); this.toast('Guardada en la bóveda'); }
    this.closeViewer(); await this.refresh();
  }

  closeViewer() {
    if (!this.viewer) return false;
    if (this.viewer.src) URL.revokeObjectURL(this.viewer.src);
    this.viewer.el.remove(); this.viewer = null;
    if (this.dirty) { this.dirty = false; this.refresh(); }
    return true;
  }

  /* ---------- Recuerdo (presentación) ---------- */
  async startShow(photos, title) {
    if (!photos.length) return this.toast('No hay fotos para mostrar');
    const list = photos.slice(0, 40);
    const el = document.createElement('div'); el.className = 'show'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', `Recuerdo: ${title}`);
    el.innerHTML = `<div class="layer"><img alt=""></div><div class="layer"><img alt=""></div><div class="veil"></div>
      <div class="bars">${list.map(() => '<i><b></b></i>').join('')}</div>
      <div class="ctl"><button class="iconbtn" data-sx="pause" aria-label="Pausar">${I.pause}</button><button class="iconbtn" data-sx="close" aria-label="Cerrar">${I.close}</button></div>
      <div class="cap"><h2>${esc(title)}</h2><p class="num"></p></div>`;
    this.root.appendChild(el);
    const dur = 4200; el.style.setProperty('--dur', `${dur}ms`);
    this.show = { el, list, i: -1, paused: false, timer: null, urls: [], layer: 0, dur };
    el.addEventListener('click', (e) => {
      const b = e.composedPath().find((n) => n.dataset?.sx);
      if (b?.dataset.sx === 'close') return this.stopShow();
      if (b?.dataset.sx === 'pause') return this.toggleShow();
      const x = e.clientX / window.innerWidth;
      if (x > 0.66) this.nextSlide(); else if (x < 0.33) this.nextSlide(-1); else this.toggleShow();
    });
    this.nextSlide();
  }

  async nextSlide(dir = 1) {
    const S = this.show; if (!S) return;
    clearTimeout(S.timer);
    const n = S.i + dir;
    if (n >= S.list.length) return this.stopShow();
    S.i = Math.max(0, n);
    const photo = S.list[S.i];
    const file = await sc.getOriginal(photo);
    if (!this.show) return;
    const u = URL.createObjectURL(file || photo.thumb); S.urls.push(u);
    const layers = S.el.querySelectorAll('.layer'); S.layer = 1 - S.layer;
    const img = layers[S.layer].querySelector('img');
    img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
    img.src = u;
    layers[S.layer].classList.add('on'); layers[1 - S.layer].classList.remove('on');
    S.el.querySelectorAll('.bars i').forEach((b, k) => { b.className = k < S.i ? 'done' : k === S.i ? 'now' : ''; });
    const bar = S.el.querySelector('.bars i.now b'); if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
    S.el.querySelector('.cap p').textContent = `${nf.format(S.i + 1)} / ${nf.format(S.list.length)} · ${new Date(photo.lastModified || photo.scannedAt).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`;
    while (S.urls.length > 3) URL.revokeObjectURL(S.urls.shift());
    if (!S.paused) S.timer = setTimeout(() => this.nextSlide(), S.dur);
  }

  toggleShow() {
    const S = this.show; if (!S) return;
    S.paused = !S.paused; S.el.classList.toggle('paused', S.paused);
    S.el.querySelector('[data-sx="pause"]').innerHTML = S.paused ? I.play : I.pause;
    if (S.paused) clearTimeout(S.timer); else S.timer = setTimeout(() => this.nextSlide(), 1600);
  }

  stopShow() {
    const S = this.show; if (!S) return false;
    clearTimeout(S.timer); S.urls.forEach((u) => URL.revokeObjectURL(u)); S.el.remove(); this.show = null;
    return true;
  }

  /* ---------- Diálogos ---------- */
  confirm(title, text, ok, danger = false, cancel = 'Cancelar') {
    return new Promise((resolve) => {
      const d = document.createElement('div'); d.className = 'dialog';
      d.innerHTML = `<div class="card" role="alertdialog" aria-label="${esc(title)}"><h3>${esc(title)}</h3><p class="note">${esc(text)}</p>
        <div class="row"><button class="btn ghost" data-r="0">${esc(cancel)}</button><button class="btn ${danger ? 'danger-fill' : 'primary'}" data-r="1">${esc(ok)}</button></div></div>`;
      const done = (val) => { d.remove(); resolve(val); };
      d.addEventListener('dismiss', () => done(false));
      d.addEventListener('click', (e) => { const b = e.composedPath().find((n) => n.dataset?.r); if (b || e.target === d) done(b?.dataset.r === '1'); });
      this.root.appendChild(d); d.querySelector('[data-r="1"]').focus();
    });
  }

  choose(title, text, people) {
    return new Promise((resolve) => {
      const urls = [];
      const d = document.createElement('div'); d.className = 'dialog';
      d.innerHTML = `<div class="card" role="dialog" aria-label="${esc(title)}"><h3>${esc(title)}</h3><p class="note">${esc(text)}</p>
        <div class="list">${people.map((p) => { const u = p.cover?.thumb ? URL.createObjectURL(p.cover.thumb) : ''; urls.push(u); return `<button class="opt" data-r="${p.id}"><img class="avatar" alt="" src="${u}"><span>${esc(p.name || 'Sin nombre')}</span><span class="note small num" style="margin-left:auto">${p.visibleCount}</span></button>`; }).join('')}</div>
        <button class="btn ghost block" data-r="">Cancelar</button></div>`;
      const done = (val) => { d.remove(); urls.forEach((u) => u && URL.revokeObjectURL(u)); resolve(val); };
      d.addEventListener('dismiss', () => done(null));
      d.addEventListener('click', (e) => { const b = e.composedPath().find((n) => n.dataset && 'r' in n.dataset); if (b || e.target === d) done(b?.dataset.r || null); });
      this.root.appendChild(d);
    });
  }

  toast(msg) {
    const t = this.$('.toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(this.tt); this.tt = setTimeout(() => t.classList.remove('on'), 2600);
  }
}

export async function mountMemora(host) {
  if (window.__memora) return window.__memora;
  const m = new Pompa(host);
  window.__memora = m; window.__rostra = m; window.__pompa = m;
  await m.init();
  return m;
}
export const mountPompa = mountMemora;
