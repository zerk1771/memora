// Memora · estilos encapsulados en Shadow DOM (no chocan con la app anfitriona).
export const CSS = /* css */ `
:host{
  --carbon:#141414; --carbon-2:#1C1C1B; --carbon-3:#262624; --line:#33332F;
  --cream:#F3EBDD; --cream-dim:#B9B2A4; --muted:#8A857B;
  --lime:#A8E063; --lime-strong:#B7F566; --lime-ink:#10140A; --danger:#FF7A6B;
  --bubble:30px;
  all:initial; font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; color:var(--cream);
  -webkit-tap-highlight-color:transparent;
}
*{box-sizing:border-box;margin:0;padding:0;font:inherit;color:inherit}
button{background:none;border:0;cursor:pointer;touch-action:manipulation}
button:focus-visible,input:focus-visible{outline:2px solid var(--lime);outline-offset:2px}
svg{display:block}
[hidden]{display:none!important}

/* ---------- Burbuja flotante ---------- */
.bubble{position:fixed;z-index:2147483001;left:0;top:0;width:calc(var(--bubble) + 14px);height:calc(var(--bubble) + 14px);
  display:grid;place-items:center;touch-action:none;user-select:none;-webkit-user-select:none;
  transition:transform .28s cubic-bezier(.2,.9,.3,1.2),opacity .2s}
.bubble.dragging{transition:none}
.bubble.hidden{opacity:0;pointer-events:none}
.bubble.open .dot{background:var(--lime)} .bubble.open .dot svg.ico{color:var(--lime-ink)}
.banner{display:flex;align-items:center;gap:10px;padding:10px;border-radius:12px;background:rgba(168,224,99,.1);border:1px solid rgba(168,224,99,.35);margin-bottom:12px}
.banner p{flex:1;min-width:0;font-size:12px;line-height:1.35;color:var(--cream)}
.banner .btn{height:36px;font-size:12px;padding:0 10px;flex:none}
.bubble .dot{width:var(--bubble);height:var(--bubble);border-radius:50%;background:var(--carbon);
  border:1.5px solid var(--lime);display:grid;place-items:center;position:relative;
  box-shadow:0 4px 14px rgba(0,0,0,.45),0 0 0 3px rgba(168,224,99,.12)}
.bubble .dot svg.ico{width:58%;height:58%;color:var(--lime)}
.bubble .ring{position:absolute;inset:-4px;width:calc(100% + 8px);height:calc(100% + 8px);transform:rotate(-90deg)}
.bubble .ring circle{fill:none;stroke-width:2.5}
.bubble .ring .bg{stroke:rgba(168,224,99,.18)} .bubble .ring .fg{stroke:var(--lime-strong);stroke-linecap:round;transition:stroke-dashoffset .3s}
.bubble .badge{position:absolute;top:-3px;right:-3px;min-width:12px;height:12px;border-radius:6px;background:var(--lime-strong);
  color:var(--lime-ink);font-size:8px;font-weight:800;display:grid;place-items:center;padding:0 3px}

/* ---------- Hoja / panel ---------- */
.scrim{position:fixed;inset:0;z-index:2147482999;background:rgba(0,0,0,.28);opacity:0;pointer-events:none;transition:opacity .2s}
.scrim.on{opacity:1;pointer-events:auto}
.sheet{position:fixed;z-index:2147483000;left:0;top:0;width:var(--pw,320px);height:var(--ph,540px);
  transform-origin:var(--ox,0) var(--oy,50%);transform:scale(.08);opacity:0;pointer-events:none;
  transition:transform .28s cubic-bezier(.2,.9,.25,1.04),opacity .16s;
  background:var(--carbon);border:1px solid var(--line);border-radius:20px;
  display:flex;flex-direction:column;overflow:hidden;box-shadow:0 16px 44px rgba(0,0,0,.55)}
.sheet.on{transform:none;opacity:1;pointer-events:auto}
.head{display:flex;align-items:center;gap:8px;padding:8px 6px 6px 12px}
.head .logo{width:26px;height:26px;border-radius:50%;background:var(--lime);color:var(--lime-ink);display:grid;place-items:center;flex:none}
.head .logo svg{width:16px;height:16px}
.head h2{font-size:15px;font-weight:800;letter-spacing:-.2px;line-height:1.1}
.head p{font-size:11px;color:var(--muted)}
.head .grow{flex:1;min-width:0}
.iconbtn{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;color:var(--cream-dim);flex:none}
.iconbtn:active{background:var(--carbon-3)} .iconbtn svg{width:22px;height:22px}

.tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:3px;margin:0 10px;padding:3px;background:var(--carbon-2);border-radius:12px}
.tab{height:44px;border-radius:9px;font-size:10.5px;font-weight:700;color:var(--cream-dim);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.tab svg{width:17px;height:17px}
.tab[aria-selected="true"]{background:var(--lime);color:var(--lime-ink)}

.progress{margin:8px 10px 0;padding:10px 12px;border-radius:12px;background:var(--carbon-2);border:1px solid var(--line);font-size:12.5px;display:flex;align-items:center;gap:10px}
.progress .bar{flex:1;height:4px;border-radius:2px;background:var(--carbon-3);overflow:hidden;margin-top:6px}
.progress .bar i{display:block;height:100%;background:var(--lime);width:0;transition:width .25s}
.progress .txt{flex:1;min-width:0} .progress b{font-weight:700}
.progress .ellipsis{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--muted);display:block}

.body{flex:1;overflow:auto;padding:12px 12px 16px;overscroll-behavior:contain}
.section-t{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:var(--muted);margin:16px 0 8px}
.section-t:first-child{margin-top:0}
.note{font-size:12.5px;line-height:1.45;color:var(--cream-dim)}
.note.small{font-size:11.5px;color:var(--muted)}

.btn{height:44px;padding:0 16px;border-radius:12px;font-size:14px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:8px;
  background:var(--carbon-3);color:var(--cream);border:1px solid var(--line)}
.btn svg{width:18px;height:18px}
.btn.primary{background:var(--lime);color:var(--lime-ink);border-color:transparent}
.btn.primary:active{background:var(--lime-strong)}
.btn.danger{color:var(--danger)}
.btn.block{width:100%}
.btn:disabled{opacity:.45;pointer-events:none}
.row-btns{display:flex;gap:8px} .row-btns .btn{flex:1}

.empty{text-align:center;padding:28px 12px}
.empty .art{width:84px;height:84px;margin:0 auto 14px;border-radius:50%;background:var(--carbon-2);border:1px dashed var(--line);display:grid;place-items:center;color:var(--lime)}
.empty .art svg{width:40px;height:40px}
.empty h3{font-size:16px;font-weight:800;margin-bottom:6px}
.empty .note{margin-bottom:16px}

/* Personas */
.people{display:grid;grid-template-columns:repeat(3,1fr);gap:12px 6px}
.person{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;position:relative;min-width:0}
.face{width:64px;height:64px;border-radius:50%;object-fit:cover;background:var(--carbon-3);border:2px solid var(--carbon-3)}
.person.sel .face{border-color:var(--lime)}
.person .check{position:absolute;top:-2px;right:calc(50% - 36px);width:22px;height:22px;border-radius:50%;background:var(--carbon);border:2px solid var(--cream-dim);display:grid;place-items:center}
.person.sel .check{background:var(--lime);border-color:var(--lime);color:var(--lime-ink)}
.person .check svg{width:14px;height:14px}
.person .nm{font-size:12px;font-weight:700;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.person .nm.unnamed{color:var(--muted);font-weight:600}
.person .ct{font-size:10.5px;color:var(--muted);margin-top:-4px}
.toolbar{display:flex;gap:6px;margin-bottom:12px}
.toolbar .btn{flex:1;height:40px;padding:0 8px;font-size:12.5px}

.selbar{position:sticky;bottom:-16px;margin:14px -12px -16px;padding:8px 12px 10px;background:var(--carbon-2);border-top:1px solid var(--line);display:flex;gap:8px;align-items:center}
.selbar .n{font-size:13px;font-weight:700;flex:1}

/* Fotos */
.photos{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin:0 -12px}
.ph{position:relative;aspect-ratio:1;background:var(--carbon-2);overflow:hidden}
.ph img{width:100%;height:100%;object-fit:cover;display:block}
.ph .hid{position:absolute;inset:0;background:rgba(0,0,0,.55);display:grid;place-items:center;color:var(--cream)}
.ph .hid svg{width:22px;height:22px}

.detail-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.detail-head{gap:6px} .detail-head .face{width:40px;height:40px}
.name-in{flex:1;min-width:0;height:42px;border-radius:12px;background:var(--carbon-2);border:1px solid var(--line);padding:0 12px;font-size:15px;font-weight:700;color:var(--cream)}
.name-in::placeholder{color:var(--muted);font-weight:600}
.chips{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}
.chip{height:36px;padding:0 12px;border-radius:18px;background:var(--carbon-2);border:1px solid var(--line);font-size:12.5px;font-weight:700;display:inline-flex;align-items:center;gap:6px}
.chip svg{width:15px;height:15px}
.chip.on{background:var(--lime);color:var(--lime-ink);border-color:transparent}

/* Carpetas */
.src{display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;background:var(--carbon-2);border:1px solid var(--line);margin-bottom:8px}
.src{gap:10px;padding:10px} .src .fi{width:34px;height:34px;border-radius:12px;background:var(--carbon-3);display:grid;place-items:center;color:var(--lime);flex:none}
.src .fi svg{width:20px;height:20px}
.src .info{flex:1;min-width:0}
.src .t{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.src .s{font-size:11.5px;color:var(--muted)}
.src .warn{color:var(--lime-strong)}
.src.off{opacity:.6}
.switch{width:46px;height:28px;border-radius:14px;background:var(--carbon-3);border:1px solid var(--line);position:relative;flex:none}
.switch::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:var(--cream-dim);transition:transform .2s,background .2s}
.switch[aria-checked="true"]{background:var(--lime);border-color:transparent}
.switch[aria-checked="true"]::after{transform:translateX(18px);background:var(--lime-ink)}
.src-actions{display:flex;gap:6px;margin:-2px 0 10px 0;flex-wrap:wrap}
.src-actions .chip{height:32px;font-size:12px}

/* Ajustes */
.setting{padding:12px;border-radius:14px;background:var(--carbon-2);border:1px solid var(--line);margin-bottom:8px}
.setting .t{font-size:14px;font-weight:700;margin-bottom:4px}
.seg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px}
.seg button{height:44px;border-radius:10px;background:var(--carbon-3);font-size:11px;flex-direction:column;gap:3px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px}
.seg button[aria-pressed="true"]{background:var(--lime);color:var(--lime-ink)}
.seg i{display:inline-block;border-radius:50%;border:1.5px solid currentColor}
input[type=range]{width:100%;margin-top:12px;accent-color:var(--lime);height:28px}
.range-l{display:flex;justify-content:space-between;font-size:11px;color:var(--muted)}

/* Visor */
.viewer{position:fixed;inset:0;z-index:2147483003;background:#000;display:flex;flex-direction:column}
.viewer .top{display:flex;align-items:center;gap:8px;padding:calc(6px + env(safe-area-inset-top)) 8px 6px}
.viewer .top .t{flex:1;min-width:0;font-size:13px;color:var(--cream-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.viewer .stage{flex:1;position:relative;display:grid;place-items:center;overflow:hidden}
.viewer .stage .wrap{position:relative;max-width:100%;max-height:100%}
.viewer .stage img{max-width:100vw;max-height:calc(100dvh - 170px);display:block}
.viewer .box{position:absolute;border:2px solid var(--lime-strong);border-radius:8px;box-shadow:0 0 0 9999px rgba(0,0,0,.25)}
.viewer .acts{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:10px 12px calc(12px + env(safe-area-inset-bottom))}
.viewer .acts button{height:56px;border-radius:12px;background:var(--carbon-2);font-size:11.5px;font-weight:700;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}
.viewer .acts svg{width:20px;height:20px;color:var(--lime)}

/* Diálogo y toast */
.dialog{position:fixed;inset:0;z-index:2147483004;display:grid;place-items:end center;background:rgba(0,0,0,.55);padding:16px}
.dialog .card{width:100%;max-width:420px;background:var(--carbon-2);border:1px solid var(--line);border-radius:18px;padding:18px;margin-bottom:env(safe-area-inset-bottom)}
.dialog h3{font-size:16px;font-weight:800;margin-bottom:6px}
.dialog .note{margin-bottom:14px}
.dialog .list{max-height:44dvh;overflow:auto;margin:0 -6px 14px}
.dialog .opt{display:flex;align-items:center;gap:10px;padding:8px 6px;border-radius:10px;width:100%;text-align:left}
.dialog .opt:active{background:var(--carbon-3)}
.dialog .opt .face{width:40px;height:40px}
.dialog .opt span{font-size:14px;font-weight:700}
.toast{position:fixed;z-index:2147483005;left:50%;bottom:calc(28px + env(safe-area-inset-bottom));transform:translate(-50%,20px);opacity:0;
  background:var(--cream);color:var(--carbon);font-size:13px;font-weight:700;padding:10px 14px;border-radius:12px;max-width:calc(100vw - 32px);
  transition:opacity .2s,transform .2s;pointer-events:none;box-shadow:0 6px 20px rgba(0,0,0,.4);z-index:2147483006}
.toast.on{opacity:1;transform:translate(-50%,0)}

@media (prefers-reduced-motion:reduce){*{transition:none!important}}
`;
