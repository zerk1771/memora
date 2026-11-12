// Memora · galería flotante: burbuja arrastrable + panel con personas por carpeta.
import { CSS } from './styles.js';
import * as db from './db.js';
import * as sc from './scanner.js';
import { exportToFolder, exportToZip } from './exporter.js';

const I = {
  face: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><circle cx="9" cy="10" r=".6" fill="currentColor"/><circle cx="15" cy="10" r=".6" fill="currentColor"/><path d="M9 15c1.6 1.4 4.4 1.4 6 0"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.8-3 3-4.6 5.5-4.6s4.7 1.6 5.5 4.6"/><path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 14.6c1.5.6 2.6 2 3 4.4"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  folderPlus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 10.5v5M9.5 13h5"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3l18 18M10.6 6.1A9.7 9.7 0 0 1 12 6c5 0 8.5 4.5 9 6-.3.8-1.2 2.3-2.7 3.6M6.4 7.6C4.6 8.9 3.4 10.7 3 12c.5 1.5 4 6 9 6 1.5 0 2.9-.4 4-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12c.5-1.5 4-6 9-6s8.5 4.5 9 6c-.5 1.5-4 6-9 6s-8.5-4.5-9-6z"/><circle cx="12" cy="12" r="3"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  merge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v4a6 6 0 0 0 6 6h0a6 6 0 0 1 6 6M18 4v4a6 6 0 0 1-3 5.2M12 14v6"/></svg>',
  export: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 10v6M9.5 13.5 12 16l2.5-2.5"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  split: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.8-3 3-4.6 5.5-4.6 1.4 0 2.6.4 3.6 1.2M16 14l5 5M21 14l-5 5"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/></svg>',
  select: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>',
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
const SIZES = [{ k: 'mini', px: 24, l: 'Mini' }, { k: 'chica', px: 30, l: 'Chica' }, { k: 'media', px: 40, l: 'Media' }];

class Memora {
  constructor(host = document.body) {
    this.hostEl = document.createElement('memora-gallery');
    host.appendChild(this.hostEl);
    this.root = this.hostEl.attachShadow({ mode: 'open' });
    this.state = { open: false, tab: 'people', view: null, selecting: false, sel: new Set(), scan: null };
    this.urls = []; this.prevUrls = [];
    this.data = { sources: [], people: [], noFaces: [], hiddenPhotos: [], photos: [] };
  }

  async init() {
    this.settings = {
      size: await db.getSetting('bubbleSize', 'chica'),
      pos: await db.getSetting('bubblePos', { side: 'right', y: 0.62 }),
      threshold: await db.getSetting('threshold', sc.DEFAULT_THRESHOLD),
    };
    this.root.innerHTML = `<style>${CSS}</style>
      <button class="bubble" part="bubble" aria-label="Abrir galería de caras" aria-haspopup="dialog">
        <span class="dot">${I.face}
          <svg class="ring" viewBox="0 0 36 36" style="display:none"><circle class="bg" cx="18" cy="18" r="16"/><circle class="fg" cx="18" cy="18" r="16" stroke-dasharray="100.5" stroke-dashoffset="100.5"/></svg>
        </span>
      </button>
      <div class="scrim"></div>
      <section class="sheet" role="dialog" aria-modal="true" aria-label="Memora, caras por carpeta">
        <div class="grab"></div>
        <header class="head">
          <span class="logo">${I.face}</span>
          <div class="grow"><h2>Memora</h2><p>Caras por carpeta · todo local</p></div>
          <button class="iconbtn" data-a="close" aria-label="Cerrar">${I.close}</button>
        </header>
        <nav class="tabs" role="tablist">
          ${[['people', 'Caras', I.people], ['sources', 'Carpetas', I.folder], ['hidden', 'Ocultos', I.eyeOff], ['settings', 'Ajustes', I.gear]]
            .map(([k, l, ic]) => `<button class="tab" role="tab" data-a="tab" data-v="${k}">${ic}${l}</button>`).join('')}
        </nav>
        <div class="progress" hidden></div>
        <div class="body"></div>
      </section>
      <input type="file" class="picker" webkitdirectory directory multiple accept="image/*" hidden>
      <div class="toast" role="status" aria-live="polite"></div>`;
    this.$ = (s) => this.root.querySelector(s);
    this.$('.dot svg').classList.add('ico');
    const bubble = this.$('.bubble');
    bubble.classList.add('dragging'); // primera ubicación sin animación
    this.applySize();
    requestAnimationFrame(() => requestAnimationFrame(() => bubble.classList.remove('dragging')));
    this.bindBubble();
    this.root.addEventListener('click', (e) => this.onClick(e));
    this.root.addEventListener('change', (e) => this.onChange(e));
    this.$('.scrim').addEventListener('click', () => this.close());
    window.addEventListener('popstate', () => { if (this.state.open) this.close(true); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.state.open) this.close(); });
    await this.refresh();
  }

  /* ---------- Burbuja ---------- */
  applySize() {
    const px = (SIZES.find((s) => s.k === this.settings.size) || SIZES[1]).px;
    this.hostEl.style.setProperty('--bubble', `${px}px`);
    this.root.host.style.setProperty('--bubble', `${px}px`);
    this.bubblePx = px;
    this.placeBubble();
  }

  placeBubble(x, y) {
    const b = this.$('.bubble'); const box = this.bubblePx + 14;
    const W = window.innerWidth; const H = window.innerHeight;
    if (x === undefined) {
      const { side, y: fy } = this.settings.pos;
      x = side === 'left' ? 2 : W - box - 2;
      y = fy * H;
    }
    y = Math.min(Math.max(y, 8), H - box - 8);
    b.style.transform = `translate(${x}px, ${y}px)`;
    this.bxy = { x, y };
  }

  bindBubble() {
    const b = this.$('.bubble'); let start = null; let moved = false;
    b.addEventListener('pointerdown', (e) => {
      start = { px: e.clientX, py: e.clientY, x: this.bxy.x, y: this.bxy.y }; moved = false;
      b.setPointerCapture(e.pointerId);
    });
    b.addEventListener('pointermove', (e) => {
      if (!start) return;
      const dx = e.clientX - start.px; const dy = e.clientY - start.py;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      moved = true; b.classList.add('dragging');
      this.placeBubble(start.x + dx, start.y + dy);
    });
    const end = async () => {
      if (!start) return; start = null; b.classList.remove('dragging');
      if (!moved) return; // el toque simple abre por 'click' (evita el click fantasma sobre el fondo)
      this.justDragged = true; setTimeout(() => { this.justDragged = false; }, 350);
      const box = this.bubblePx + 14;
      this.settings.pos = { side: this.bxy.x + box / 2 < window.innerWidth / 2 ? 'left' : 'right', y: this.bxy.y / window.innerHeight };
      this.placeBubble();
      await db.setSetting('bubblePos', this.settings.pos);
    };
    b.addEventListener('pointerup', end);
    b.addEventListener('pointercancel', () => { start = null; b.classList.remove('dragging'); this.placeBubble(); });
    b.addEventListener('click', () => { if (this.justDragged) { this.justDragged = false; return; } this.open(); });
    window.addEventListener('resize', () => this.placeBubble());
  }

  setRing(frac) {
    const ring = this.$('.ring');
    ring.style.display = frac == null ? 'none' : ''; // en SVG el atributo hidden no oculta
    if (frac != null) ring.querySelector('.fg').style.strokeDashoffset = String(100.5 * (1 - frac));
  }

  /* ---------- Panel ---------- */
  open() {
    if (this.state.open) return;
    this.state.open = true;
    history.pushState({ memora: true }, ''); // el botón Atrás de Android cierra el panel
    this.$('.bubble').classList.add('hidden');
    this.$('.scrim').classList.add('on'); this.$('.sheet').classList.add('on');
    this.render();
    setTimeout(() => this.$('[data-a="close"]').focus(), 50);
  }

  close(fromPop = false) {
    if (this.closeViewer()) { if (fromPop) history.pushState({ memora: true }, ''); return; }
    if (this.state.view && fromPop) { this.state.view = null; this.render(); history.pushState({ memora: true }, ''); return; }
    this.state.open = false; this.state.view = null; this.state.selecting = false; this.state.sel.clear();
    this.$('.bubble').classList.remove('hidden');
    this.$('.scrim').classList.remove('on'); this.$('.sheet').classList.remove('on');
    if (!fromPop && history.state?.memora) history.back();
    this.$('.bubble').focus();
  }

  url(blob) { if (!blob) return ''; const u = URL.createObjectURL(blob); this.urls.push(u); return u; }

  async refresh() {
    this.data = await sc.snapshot();
    const unnamed = this.data.people.filter((p) => !p.hidden && !p.name).length;
    const b = this.$('.dot'); let badge = b.querySelector('.badge');
    if (unnamed && !this.state.scan) { if (!badge) { badge = document.createElement('span'); badge.className = 'badge'; b.appendChild(badge); } badge.textContent = unnamed > 9 ? '9+' : unnamed; }
    else badge?.remove();
    if (this.state.open) this.render();
  }

  render() {
    this.prevUrls.forEach((u) => URL.revokeObjectURL(u)); this.prevUrls = this.urls; this.urls = [];
    this.root.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.v === this.state.tab && !this.state.view)));
    const body = this.$('.body');
    const v = this.state.view;
    body.innerHTML = v?.type === 'person' ? this.viewPerson(v.id) : this[`tab_${this.state.tab}`]();
    this.renderProgress();
  }

  renderProgress() {
    const el = this.$('.progress'); const s = this.state.scan;
    el.hidden = !s;
    if (!s) return;
    const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
    el.innerHTML = `<div class="txt"><b>${s.phase === 'models' ? 'Preparando detector de caras…' : `Buscando caras · ${pct}%`}</b>
      <span class="ellipsis">${s.phase === 'models' ? 'Sólo la primera vez (~7 MB, queda guardado)' : `${esc(s.source)} · ${s.done}/${s.total}`}</span>
      <div class="bar"><i style="width:${pct}%"></i></div></div>
      <button class="btn" data-a="cancel-scan" style="height:36px">Frenar</button>`;
  }

  /* ---------- Pestañas ---------- */
  tab_people() {
    const { sources, people, noFaces } = this.data;
    if (!sources.length) {
      return `<div class="empty"><div class="art">${I.folderPlus}</div><h3>Elegí qué carpetas mirar</h3>
        <p class="note">Memora sólo lee las carpetas que vos agregues. Detecta las caras en tu dispositivo y arma una carpeta por persona. No se sube nada.</p>
        <button class="btn primary block" data-a="add-source">${I.folderPlus}Agregar carpeta</button></div>`;
    }
    const visible = people.filter((p) => !p.hidden && p.visibleCount);
    if (!visible.length) {
      return `<div class="empty"><div class="art">${I.face}</div><h3>${this.state.scan ? 'Buscando caras…' : 'Todavía no hay caras'}</h3>
        <p class="note">${this.state.scan ? 'Van a ir apareciendo acá.' : 'Escaneá tus carpetas incluidas para agrupar a las personas.'}</p>
        ${this.state.scan ? '' : `<button class="btn primary block" data-a="scan">${I.refresh}Buscar caras</button>`}</div>`;
    }
    const { selecting, sel } = this.state;
    const grid = visible.map((p) => `
      <button class="person ${sel.has(p.id) ? 'sel' : ''}" data-a="${selecting ? 'toggle-sel' : 'open-person'}" data-v="${p.id}">
        <img class="face" alt="" src="${this.url(p.cover?.thumb)}">
        ${selecting ? `<span class="check">${sel.has(p.id) ? I.check : ''}</span>` : ''}
        <span class="nm ${p.name ? '' : 'unnamed'}">${esc(p.name || 'Sin nombre')}</span>
        <span class="ct">${plural(p.visibleCount, 'foto', 'fotos')}</span>
      </button>`).join('');
    return `
      <div class="toolbar">
        ${selecting
          ? `<button class="btn" data-a="sel-cancel">${I.close}Listo</button>`
          : `<button class="btn primary" data-a="export-all">${I.export}Armar carpetas</button>
             <button class="btn" data-a="sel-start" aria-label="Seleccionar varias">${I.select}Elegir</button>`}
      </div>
      <div class="people">${grid}</div>
      ${noFaces.length ? `<p class="note small" style="margin-top:16px">${plural(noFaces.length, 'foto sin caras', 'fotos sin caras')} (quedan fuera de las carpetas).</p>` : ''}
      ${selecting && sel.size ? `<div class="selbar"><span class="n">${plural(sel.size, 'seleccionada', 'seleccionadas')}</span>
        <button class="btn" data-a="sel-hide">${I.eyeOff}Ocultar</button>
        <button class="btn primary" data-a="sel-merge" ${sel.size < 2 ? 'disabled' : ''}>${I.merge}Unir</button></div>` : ''}`;
  }

  viewPerson(id) {
    const p = this.data.people.find((x) => x.id === id);
    if (!p) { this.state.view = null; return this.tab_people(); }
    const items = p.items.filter((i) => !i.photo.hidden);
    return `
      <div class="detail-head">
        <button class="iconbtn" data-a="back" aria-label="Volver">${I.back}</button>
        <img class="face" alt="" src="${this.url(p.cover?.thumb)}">
        <input class="name-in" data-a="rename" data-v="${p.id}" value="${esc(p.name)}" placeholder="¿Quién es?" maxlength="40" enterkeyhint="done" aria-label="Nombre de la persona">
      </div>
      <div class="chips">
        <button class="chip" data-a="export-one" data-v="${p.id}">${I.export}Exportar carpeta</button>
        <button class="chip" data-a="merge-into" data-v="${p.id}">${I.merge}Unir con…</button>
        <button class="chip" data-a="hide-person" data-v="${p.id}">${I.eyeOff}Ocultar</button>
      </div>
      <p class="section-t">${plural(items.length, 'foto', 'fotos')}${p.items.length - items.length ? ` · ${p.items.length - items.length} oculta(s)` : ''}</p>
      <div class="photos">${items.map((i) => `<button class="ph" data-a="view" data-v="${i.photo.id}" data-f="${i.face.id}" aria-label="${esc(i.photo.name)}"><img loading="lazy" alt="" src="${this.url(i.photo.thumb)}"></button>`).join('')}</div>`;
  }

  tab_sources() {
    const { sources } = this.data;
    const rows = sources.map((s) => {
      const needs = s._access && s._access !== 'granted';
      return `<div class="src ${s.enabled ? '' : 'off'}">
        <span class="fi">${I.folder}</span>
        <div class="info"><p class="t">${esc(s.name)}</p>
          <p class="s ${needs ? 'warn' : ''}">${needs ? (s.kind === 'input' ? 'Volvé a elegirla para escanear' : 'Tocá “Dar acceso” para escanear') : `${plural(s.photoCount || 0, 'foto', 'fotos')}${s.lastScan ? ` · ${new Date(s.lastScan).toLocaleDateString('es-AR')}` : ' · sin escanear'}`}</p></div>
        <button class="switch" role="switch" aria-checked="${s.enabled}" aria-label="Incluir ${esc(s.name)}" data-a="toggle-src" data-v="${s.id}"></button>
      </div>
      <div class="src-actions">
        ${needs ? (s.kind === 'input' ? `<button class="chip on" data-a="add-source">${I.folderPlus}Volver a elegir</button>` : `<button class="chip on" data-a="grant" data-v="${s.id}">${I.check}Dar acceso</button>`) : `<button class="chip" data-a="scan-one" data-v="${s.id}" ${s.enabled ? '' : 'disabled'}>${I.refresh}Escanear</button>`}
        <button class="chip" data-a="toggle-rec" data-v="${s.id}">${s.recursive ? I.check : ''}Subcarpetas</button>
        <button class="chip" data-a="remove-src" data-v="${s.id}">${I.trash}Quitar</button>
      </div>`;
    }).join('');
    return `
      <p class="note" style="margin-bottom:14px">Sólo se leen las carpetas de esta lista. Apagá una para que sus caras desaparezcan de la galería sin borrar nada.</p>
      ${rows}
      <div class="row-btns" style="margin-top:6px">
        <button class="btn primary" data-a="add-source">${I.folderPlus}Agregar carpeta</button>
        ${sources.length ? `<button class="btn" data-a="scan" ${this.state.scan ? 'disabled' : ''}>${I.refresh}Escanear todo</button>` : ''}
      </div>
      <p class="note small" style="margin-top:12px">Quitar una carpeta sólo borra su índice en Memora. Tus fotos originales no se tocan nunca.</p>`;
  }

  tab_hidden() {
    const hp = this.data.people.filter((p) => p.hidden);
    const ph = this.data.hiddenPhotos;
    if (!hp.length && !ph.length) {
      return `<div class="empty"><div class="art">${I.eye}</div><h3>No ocultaste nada</h3>
        <p class="note">Lo que ocultes queda guardado acá, fuera de la galería y de las carpetas exportadas. Lo podés volver a mostrar cuando quieras.</p></div>`;
    }
    return `
      ${hp.length ? `<p class="section-t">Personas ocultas</p><div class="people">${hp.map((p) => `
        <button class="person" data-a="show-person" data-v="${p.id}"><img class="face" alt="" src="${this.url(p.cover?.thumb)}">
        <span class="nm ${p.name ? '' : 'unnamed'}">${esc(p.name || 'Sin nombre')}</span><span class="ct">Tocá para mostrar</span></button>`).join('')}</div>` : ''}
      ${ph.length ? `<p class="section-t" style="margin-top:20px">Fotos ocultas · tocá para mostrar</p><div class="photos">${ph.map((p) => `
        <button class="ph" data-a="show-photo" data-v="${p.id}" aria-label="Mostrar ${esc(p.name)}"><img loading="lazy" alt="" src="${this.url(p.thumb)}"><span class="hid">${I.eye}</span></button>`).join('')}</div>` : ''}`;
  }

  tab_settings() {
    const t = this.settings.threshold;
    return `
      <div class="setting"><p class="t">Tamaño de la burbuja</p><p class="note small">Arrastrala a cualquier borde; se queda donde la dejes.</p>
        <div class="seg">${SIZES.map((s) => `<button aria-pressed="${s.k === this.settings.size}" data-a="size" data-v="${s.k}"><i style="width:${Math.round(s.px / 2.6)}px;height:${Math.round(s.px / 2.6)}px"></i>${s.l} · ${s.px}px</button>`).join('')}</div></div>
      <div class="setting"><p class="t">Cómo agrupa las caras</p>
        <p class="note small">Más estricto separa más; más flexible junta más (y puede mezclar parecidos).</p>
        <input type="range" min="0.38" max="0.62" step="0.02" value="${t}" data-a="threshold" aria-label="Sensibilidad de agrupado">
        <div class="range-l"><span>Estricto</span><span>${t.toFixed(2)}</span><span>Flexible</span></div>
        <button class="btn block" style="margin-top:10px" data-a="regroup">${I.refresh}Reagrupar sin perder nombres</button></div>
      <div class="setting"><p class="t">Privacidad</p>
        <p class="note small">La detección corre en este dispositivo. Las miniaturas y huellas faciales se guardan sólo en este navegador. No hay servidor.</p>
        <button class="btn danger block" style="margin-top:10px" data-a="wipe">${I.trash}Borrar todo el índice</button></div>`;
  }

  /* ---------- Eventos ---------- */
  async onChange(e) {
    const t = e.composedPath()[0];
    if (t.classList?.contains('picker')) {
      const files = t.files; t.value = '';
      if (!files?.length) return;
      const src = await sc.addSourceFromFiles(files);
      this.toast(`Carpeta “${src.name}” agregada`);
      await this.refresh(); this.startScan([src.id]);
      return;
    }
    if (t.dataset?.a === 'rename') { await sc.renamePerson(t.dataset.v, t.value); await this.refresh(); this.toast('Nombre guardado'); }
    if (t.dataset?.a === 'threshold') {
      this.settings.threshold = Number(t.value); await db.setSetting('threshold', this.settings.threshold); this.render();
    }
  }

  async onClick(e) {
    const el = e.composedPath().find((n) => n.dataset?.a);
    if (!el || el.tagName === 'INPUT') return;
    const { a, v } = el.dataset;
    const S = this.state;
    try {
      switch (a) {
        case 'close': return this.close();
        case 'tab': S.tab = v; S.view = null; S.selecting = false; S.sel.clear(); return this.render();
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
          if (!(await this.confirm(`¿Quitar “${s.name}”?`, 'Se borra su índice en Memora. Tus fotos originales no se tocan.', 'Quitar'))) return;
          await sc.removeSource(v); this.toast('Carpeta quitada'); return this.refreshSources();
        }
        case 'open-person': S.view = { type: 'person', id: v }; this.$('.body').scrollTop = 0; return this.render();
        case 'sel-start': S.selecting = true; S.sel.clear(); return this.render();
        case 'sel-cancel': S.selecting = false; S.sel.clear(); return this.render();
        case 'toggle-sel': S.sel.has(v) ? S.sel.delete(v) : S.sel.add(v); return this.render();
        case 'sel-hide': for (const id of S.sel) await sc.setPersonHidden(id, true); this.toast(`${plural(S.sel.size, 'persona oculta', 'personas ocultas')}`); S.selecting = false; S.sel.clear(); return this.refresh();
        case 'sel-merge': return this.mergeSelected();
        case 'merge-into': return this.pickMergeTarget(v);
        case 'hide-person': await sc.setPersonHidden(v, true); S.view = null; this.toast('Persona oculta · está en “Ocultos”'); return this.refresh();
        case 'show-person': await sc.setPersonHidden(v, false); this.toast('Vuelve a la galería'); return this.refresh();
        case 'show-photo': await sc.setPhotoHidden(v, false); this.toast('Foto visible otra vez'); return this.refresh();
        case 'view': return this.openViewer(v, el.dataset.f);
        case 'export-all': return this.export(this.data.people.filter((p) => !p.hidden));
        case 'export-one': return this.export(this.data.people.filter((p) => p.id === v));
        case 'size': this.settings.size = v; await db.setSetting('bubbleSize', v); this.applySize(); return this.render();
        case 'regroup': return this.regroup();
        case 'wipe':
          if (!(await this.confirm('¿Borrar todo el índice?', 'Se borran carpetas elegidas, caras, nombres y ocultos de Memora. Tus fotos originales quedan intactas.', 'Borrar'))) return;
          await db.clearAll(); S.view = null; this.toast('Índice borrado'); return this.refresh();
        default:
      }
    } catch (err) {
      if (err?.name === 'AbortError') return; // el usuario canceló un selector
      console.error('[memora]', err); this.toast('Algo falló. Probá de nuevo.');
    }
  }

  async refreshSources() {
    await this.refresh();
    for (const s of this.data.sources) s._access = await sc.sourceAccess(s);
    this.render();
  }

  async addSource() {
    if (sc.supportsFSA()) {
      const src = await sc.addSourceFromPicker();
      this.toast(`Carpeta “${src.name}” agregada`);
      await this.refresh(); this.startScan([src.id]);
    } else {
      this.$('.picker').click(); // Android/iOS: selector de carpeta del sistema
    }
  }

  async startScan(ids) {
    if (this.state.scan) return;
    this.abort = new AbortController();
    this.state.scan = { phase: 'models', done: 0, total: 0, source: '' };
    this.setRing(0); this.renderProgress();
    let last = 0;
    try {
      const r = await sc.scan({
        sourceIds: ids, signal: this.abort.signal,
        onProgress: (p) => {
          this.state.scan = p; this.setRing(p.total ? p.done / p.total : 0); this.renderProgress();
          if (Date.now() - last > 1500) { last = Date.now(); this.refresh(); }
        },
      });
      const msg = r.aborted ? 'Escaneo frenado' : `${plural(r.scanned, 'foto nueva', 'fotos nuevas')} · ${plural(r.faces, 'cara', 'caras')}`;
      this.toast(r.blocked.length ? `${msg} · sin acceso: ${r.blocked.join(', ')}` : r.unsupported ? `${msg} · ${r.unsupported} sin formato compatible` : msg);
    } catch (err) {
      console.error('[memora] escaneo', err);
      this.toast('No se pudo cargar el detector de caras');
    } finally {
      this.state.scan = null; this.setRing(null);
      await this.refreshSources();
    }
  }

  async mergeSelected() {
    const ids = [...this.state.sel];
    const named = this.data.people.find((p) => ids.includes(p.id) && p.name);
    const target = named?.id || ids.sort((a, b) => (this.data.people.find((p) => p.id === b)?.count || 0) - (this.data.people.find((p) => p.id === a)?.count || 0))[0];
    await sc.mergePersons(target, ids);
    this.state.selecting = false; this.state.sel.clear();
    this.toast(`${ids.length} grupos unidos en uno`);
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
    if (!(await this.confirm('¿Reagrupar caras?', 'Las personas con nombre se mantienen. Las “Sin nombre” se vuelven a agrupar con la sensibilidad elegida.', 'Reagrupar'))) return;
    await sc.regroup(this.settings.threshold);
    this.toast('Caras reagrupadas'); await this.refresh();
  }

  async export(people) {
    const list = people.map((p) => ({ ...p, items: p.items.filter((i) => !i.photo.hidden) })).filter((p) => p.items.length);
    if (!list.length) return this.toast('No hay fotos visibles para exportar');
    const n = list.reduce((s, p) => s + p.items.length, 0);
    const fsa = sc.supportsFSA();
    if (!(await this.confirm('Acomodar en carpetas', `Se crea una carpeta por persona (${plural(list.length, 'carpeta', 'carpetas')}, ${plural(n, 'foto', 'fotos')}). ${fsa ? 'Elegí dónde crearlas.' : 'Se descarga un .zip.'} Se copian: los originales no se mueven ni se borran.`, fsa ? 'Elegir destino' : 'Descargar .zip'))) return;
    const onP = (d, t) => { this.state.scan = { phase: 'scan', source: 'Copiando fotos', done: d, total: t }; this.renderProgress(); this.setRing(d / t); };
    try {
      const r = fsa ? await exportToFolder(list, onP) : await exportToZip(list, onP);
      this.toast(r.missing.length ? `Listo · ${r.missing.length} sin original (volvé a dar acceso a la carpeta)` : `Listo · ${plural(r.done, 'foto copiada', 'fotos copiadas')}`);
    } finally { this.state.scan = null; this.setRing(null); this.renderProgress(); }
  }

  /* ---------- Visor de foto ---------- */
  async openViewer(photoId, faceId) {
    const person = this.data.people.find((p) => p.id === this.state.view?.id);
    const item = person?.items.find((i) => i.photo.id === photoId && i.face.id === faceId) || person?.items.find((i) => i.photo.id === photoId);
    if (!item) return;
    const { photo, face } = item;
    const orig = await sc.getOriginal(photo);
    const src = URL.createObjectURL(orig || photo.thumb);
    const wrap = document.createElement('div');
    wrap.className = 'viewer'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-label', photo.name);
    wrap.innerHTML = `<div class="top"><button class="iconbtn" data-vx="close" aria-label="Cerrar">${I.back}</button><span class="t">${esc(photo.path)}</span></div>
      <div class="stage"><div class="wrap"><img alt="" src="${src}"><span class="box"></span></div></div>
      <div class="acts">
        <button data-vx="cover">${I.star}Usar de portada</button>
        <button data-vx="detach">${I.split}No es esta persona</button>
        <button data-vx="hide">${I.eyeOff}Ocultar foto</button>
      </div>`;
    this.root.appendChild(wrap);
    this.viewer = { el: wrap, src };
    const img = wrap.querySelector('img'); const box = wrap.querySelector('.box');
    const placeBox = () => {
      const f = img.clientWidth / (photo.origW || img.naturalWidth || 1); // caja guardada en coordenadas del original
      Object.assign(box.style, { left: `${face.box.x * f}px`, top: `${face.box.y * f}px`, width: `${face.box.w * f}px`, height: `${face.box.h * f}px` });
    };
    img.onload = placeBox;
    if (img.complete) placeBox();
    wrap.addEventListener('click', async (e) => {
      const b = e.composedPath().find((n) => n.dataset?.vx); if (!b) return;
      const act = b.dataset.vx;
      if (act === 'cover') { await sc.setCover(person.id, face.id); this.toast('Portada actualizada'); }
      if (act === 'detach') { await sc.detachFace(face.id); this.toast('Separada en una persona nueva'); }
      if (act === 'hide') { await sc.setPhotoHidden(photo.id, true); this.toast('Foto oculta · está en “Ocultos”'); }
      this.closeViewer();
      if (act !== 'close') await this.refresh();
    });
  }

  closeViewer() {
    if (!this.viewer) return false;
    URL.revokeObjectURL(this.viewer.src); this.viewer.el.remove(); this.viewer = null;
    return true;
  }

  /* ---------- Diálogos ---------- */
  confirm(title, text, ok) {
    return new Promise((resolve) => {
      const d = document.createElement('div'); d.className = 'dialog';
      d.innerHTML = `<div class="card" role="alertdialog" aria-label="${esc(title)}"><h3>${esc(title)}</h3><p class="note">${esc(text)}</p>
        <div class="row-btns"><button class="btn" data-r="0">Cancelar</button><button class="btn primary" data-r="1">${esc(ok)}</button></div></div>`;
      d.addEventListener('click', (e) => {
        const b = e.composedPath().find((n) => n.dataset?.r);
        if (b || e.target === d) { d.remove(); resolve(b?.dataset.r === '1'); }
      });
      this.root.appendChild(d); d.querySelector('[data-r="1"]').focus();
    });
  }

  choose(title, text, people) {
    return new Promise((resolve) => {
      const urls = [];
      const d = document.createElement('div'); d.className = 'dialog';
      d.innerHTML = `<div class="card" role="dialog" aria-label="${esc(title)}"><h3>${esc(title)}</h3><p class="note">${esc(text)}</p>
        <div class="list">${people.map((p) => { const u = p.cover?.thumb ? URL.createObjectURL(p.cover.thumb) : ''; urls.push(u); return `<button class="opt" data-r="${p.id}"><img class="face" alt="" src="${u}"><span>${esc(p.name || 'Sin nombre')}</span><span class="note small" style="margin-left:auto">${p.visibleCount}</span></button>`; }).join('')}</div>
        <button class="btn block" data-r="">Cancelar</button></div>`;
      d.addEventListener('click', (e) => {
        const b = e.composedPath().find((n) => n.dataset && 'r' in n.dataset);
        if (b || e.target === d) { d.remove(); urls.forEach((u) => u && URL.revokeObjectURL(u)); resolve(b?.dataset.r || null); }
      });
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
  const m = new Memora(host);
  window.__memora = m;
  await m.init();
  return m;
}
