// Pompa · sistema visual. Encapsulado en Shadow DOM: no pisa estilos de la app anfitriona.
// Concepto: una burbuja de vidrio que se despliega en una ventana compacta. Tinta profunda + champagne.
export const FONT_FACES = (base) => `
@font-face{font-family:"Rostra Sans";src:url("${base}fonts/manrope.woff2") format("woff2");font-weight:200 800;font-display:swap}
@font-face{font-family:"Pompa Display";src:url("${base}fonts/jakarta.woff2") format("woff2");font-weight:200 800;font-display:swap}`;

export const CSS = /* css */ `
:host{
  /* Oscuro (predeterminado) */
  --bg:#0B0B0D; --glass:rgba(20,20,24,.84); --raise:rgba(255,255,255,.045); --raise-2:rgba(255,255,255,.08);
  --line:rgba(255,255,255,.08); --line-2:rgba(255,255,255,.14);
  --text:#F3F0EA; --text-2:#B4AEA4; --muted:#7A756D;
  --accent:#E4C894; --accent-2:#C9A46A; --accent-ink:#1B150B; --accent-soft:rgba(228,200,148,.13);
  --danger:#F08A7E; --scrim:rgba(4,4,6,.42); --shadow:0 24px 60px rgba(0,0,0,.55),0 2px 8px rgba(0,0,0,.35);
  --orb-a:#2A2A30; --orb-b:#0E0E11;
  --sans:"Rostra Sans",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --display:"Pompa Display","Rostra Sans",ui-sans-serif,system-ui,sans-serif;
  --bubble:30px;
  all:initial; font-family:var(--sans); color:var(--text); color-scheme:dark;
  -webkit-tap-highlight-color:transparent; font-feature-settings:"ss01","cv11";
}
:host([data-theme="light"]){
  --bg:#F5F3EF; --glass:rgba(252,251,249,.86); --raise:rgba(20,16,10,.04); --raise-2:rgba(20,16,10,.075);
  --line:rgba(20,16,10,.08); --line-2:rgba(20,16,10,.14);
  --text:#17140F; --text-2:#5A544B; --muted:#8C857A;
  --accent:#9C7535; --accent-2:#B98F4E; --accent-ink:#FFFFFF; --accent-soft:rgba(156,117,53,.11);
  --danger:#C2473A; --scrim:rgba(30,24,16,.18); --shadow:0 24px 60px rgba(40,30,15,.18),0 2px 8px rgba(40,30,15,.08);
  --orb-a:#FFFFFF; --orb-b:#E9E5DE; color-scheme:light;
}
@media (prefers-color-scheme: light){
  :host(:not([data-theme="dark"])){
    --bg:#F5F3EF; --glass:rgba(252,251,249,.86); --raise:rgba(20,16,10,.04); --raise-2:rgba(20,16,10,.075);
    --line:rgba(20,16,10,.08); --line-2:rgba(20,16,10,.14);
    --text:#17140F; --text-2:#5A544B; --muted:#8C857A;
    --accent:#9C7535; --accent-2:#B98F4E; --accent-ink:#FFFFFF; --accent-soft:rgba(156,117,53,.11);
    --danger:#C2473A; --scrim:rgba(30,24,16,.18); --shadow:0 24px 60px rgba(40,30,15,.18),0 2px 8px rgba(40,30,15,.08);
    --orb-a:#FFFFFF; --orb-b:#E9E5DE; color-scheme:light;
  }
}
*{box-sizing:border-box;margin:0;padding:0;font:inherit;color:inherit}
button{background:none;border:0;cursor:pointer;touch-action:manipulation;-webkit-user-select:none;user-select:none}
button:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
svg{display:block}
[hidden]{display:none!important}
.num{font-variant-numeric:tabular-nums}

/* ---------- Orbe flotante ---------- */
.bubble{position:fixed;z-index:2147483001;left:0;top:0;width:calc(var(--bubble) + 14px);height:calc(var(--bubble) + 14px);
  display:grid;place-items:center;touch-action:none;user-select:none;-webkit-user-select:none;opacity:var(--idle,1);
  transition:transform .32s cubic-bezier(.2,.9,.3,1.15),opacity .25s}
.bubble.dragging{transition:none;opacity:1}
.bubble.open{opacity:1}
.bubble .dot{width:var(--bubble);height:var(--bubble);border-radius:50%;position:relative;display:grid;place-items:center;
  background:radial-gradient(120% 120% at 30% 22%,var(--orb-a) 0%,var(--orb-b) 70%);
  box-shadow:0 8px 22px rgba(0,0,0,.42),0 1px 2px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.14);
  transition:transform .25s cubic-bezier(.2,.9,.3,1.2)}
.bubble .dot::before{content:"";position:absolute;inset:0;border-radius:50%;padding:1.2px;
  background:conic-gradient(from 210deg,var(--accent) 0deg,rgba(255,255,255,.55) 70deg,var(--accent-2) 160deg,rgba(255,255,255,.08) 250deg,var(--accent) 360deg);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.bubble .dot::after{content:"";position:absolute;left:18%;top:9%;width:46%;height:28%;border-radius:50%;
  background:linear-gradient(180deg,rgba(255,255,255,.22),rgba(255,255,255,0));pointer-events:none}
.bubble:active .dot{transform:scale(.92)}
.bubble.open .dot{transform:scale(1.06)}
.bubble.open .dot::before{background:conic-gradient(var(--accent),var(--accent-2),var(--accent))}
.bubble .dot svg.ico{width:54%;height:54%;color:var(--accent);position:relative;z-index:1}
.bubble .ring{position:absolute;inset:-5px;width:calc(100% + 10px);height:calc(100% + 10px);transform:rotate(-90deg)}
.bubble .ring circle{fill:none;stroke-width:2}
.bubble .ring .bg{stroke:var(--accent-soft)} .bubble .ring .fg{stroke:var(--accent);stroke-linecap:round;transition:stroke-dashoffset .3s}
.bubble .badge{position:absolute;z-index:2;top:-4px;right:-5px;min-width:15px;height:15px;border-radius:8px;padding:0 4px;
  background:var(--accent);color:var(--accent-ink);font-size:9px;font-weight:800;display:grid;place-items:center;
  box-shadow:0 0 0 2px var(--orb-b)}

/* ---------- Ventana compacta ---------- */
.scrim{position:fixed;inset:0;z-index:2147482999;background:var(--scrim);opacity:0;pointer-events:none;transition:opacity .22s}
.scrim.on{opacity:1;pointer-events:auto}
.sheet{position:fixed;z-index:2147483000;left:0;top:0;width:var(--pw,328px);height:var(--ph,560px);
  transform-origin:var(--ox,0) var(--oy,50%);transform:scale(.06);opacity:0;pointer-events:none;
  transition:transform .34s cubic-bezier(.18,.9,.22,1.02),opacity .18s;
  background:var(--glass);-webkit-backdrop-filter:blur(28px) saturate(1.5);backdrop-filter:blur(28px) saturate(1.5);
  border:1px solid var(--line-2);border-radius:26px;box-shadow:var(--shadow);
  display:flex;flex-direction:column;overflow:hidden}
.sheet.on{transform:none;opacity:1;pointer-events:auto}
.sheet.resizing{transition:none}
.resize{height:22px;display:grid;place-items:center;background:var(--raise);cursor:nwse-resize;touch-action:none;flex:none;position:relative}
.resize::before,.resize::after{content:"";position:absolute;bottom:5px;width:9px;height:9px;border-bottom:2px solid var(--line-2);opacity:.9}
.resize::before{left:10px;border-left:2px solid var(--line-2);border-bottom-left-radius:4px}
.resize::after{right:10px;border-right:2px solid var(--line-2);border-bottom-right-radius:4px}
.resize[data-side="l"]::before,.resize[data-side="r"]::after{border-color:var(--accent)}
.resize i{width:42px;height:4px;border-radius:2px;background:var(--line-2);transition:background .15s,width .15s}
.resize:active i,.sheet.resizing .resize i{background:var(--accent);width:56px}
.head{display:flex;align-items:center;gap:10px;padding:14px 8px 8px 18px}
.head .grow{flex:1;min-width:0}
.eyebrow-brand{font-family:var(--display);font-size:10.5px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:var(--text-2);margin-bottom:4px}
.eyebrow-brand i{font-style:normal;color:var(--accent)}
.brand{font-family:var(--display);font-weight:800;font-size:28px;line-height:1;letter-spacing:-.9px;color:var(--text)}
.brand i{font-style:normal;color:var(--accent)}
.stats{font-size:11.5px;color:var(--muted);margin-top:6px;letter-spacing:.2px}
.iconbtn{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;color:var(--text-2);flex:none;transition:background .15s}
.iconbtn:active{background:var(--raise-2)} .iconbtn svg{width:20px;height:20px}

.progress{margin:2px 14px 6px;padding:10px 12px;border-radius:14px;background:var(--accent-soft);font-size:12px;display:flex;align-items:center;gap:10px}
.progress .txt{flex:1;min-width:0} .progress b{font-weight:700}
.progress .ellipsis{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text-2);display:block;font-size:11px;margin-top:1px}
.progress .bar{height:3px;border-radius:2px;background:var(--line);overflow:hidden;margin-top:7px}
.progress .bar i{display:block;height:100%;background:var(--accent);width:0;transition:width .25s}
.progress .stop{height:30px;padding:0 10px;border-radius:15px;font-size:11.5px;font-weight:700;background:var(--raise-2)}

.body{flex:1;overflow:auto;padding:6px 14px 16px;overscroll-behavior:contain;scrollbar-width:none}
.body::-webkit-scrollbar{display:none}

.nav{display:grid;grid-template-columns:repeat(6,1fr);padding:6px 6px 0;border-top:1px solid var(--line);background:var(--raise)}
.tab{height:46px;border-radius:14px;font-size:9.5px;min-width:0;font-weight:600;letter-spacing:.15px;color:var(--muted);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;transition:color .15s}
.tab svg{width:20px;height:20px}
.tab[aria-selected="true"]{color:var(--accent)}
.tab[aria-selected="true"] svg{filter:drop-shadow(0 0 8px var(--accent-soft))}

/* ---------- Piezas ---------- */
.eyebrow{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.1px;color:var(--muted);margin:18px 2px 10px}
.eyebrow:first-child{margin-top:6px}
.note{font-size:12.5px;line-height:1.5;color:var(--text-2)}
.note.small{font-size:11.5px;color:var(--muted)}
.btn{height:42px;padding:0 16px;border-radius:21px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:7px;
  background:var(--raise-2);color:var(--text);transition:transform .12s,background .15s}
.btn:active{transform:scale(.97)}
.btn svg{width:17px;height:17px}
.btn.primary{background:linear-gradient(180deg,var(--accent),var(--accent-2));color:var(--accent-ink);box-shadow:0 6px 18px var(--accent-soft)}
.btn.ghost{background:transparent;border:1px solid var(--line-2)}
.btn.danger{color:var(--danger)}
.btn.danger-fill{background:var(--danger);color:#fff}
.btn.block{width:100%}
.btn:disabled{opacity:.4;pointer-events:none}
.row{display:flex;gap:8px} .row>.btn{flex:1;padding:0 12px;white-space:nowrap;font-size:12.5px}

.search{position:relative;margin:2px 0 12px}
.search svg{position:absolute;left:13px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--muted)}
.search input{width:100%;height:40px;border-radius:20px;background:var(--raise);border:1px solid var(--line);padding:0 14px 0 38px;font-size:13px;color:var(--text)}
.search input::placeholder{color:var(--muted)}

.chips{display:flex;gap:6px;overflow-x:auto;margin:2px -14px 12px;padding:0 14px;scrollbar-width:none}
.chips::-webkit-scrollbar{display:none}
.chip{height:32px;padding:0 13px;border-radius:16px;background:var(--raise);border:1px solid var(--line);font-size:12px;font-weight:600;color:var(--text-2);
  display:inline-flex;align-items:center;gap:6px;white-space:nowrap;flex:none}
.chip svg{width:14px;height:14px}
.chip[aria-pressed="true"]{background:var(--text);color:var(--bg);border-color:transparent}

.empty{text-align:center;padding:22px 6px 8px}
.empty .art{width:96px;height:96px;margin:0 auto 18px;border-radius:30px;display:grid;place-items:center;color:var(--accent);
  background:radial-gradient(100% 100% at 30% 20%,var(--raise-2),transparent);border:1px solid var(--line-2);transform:rotate(-6deg)}
.empty .art svg{width:42px;height:42px;transform:rotate(6deg)}
.empty h3{font-family:var(--display);font-weight:780;letter-spacing:-.45px;font-size:21px;line-height:1.1;margin-bottom:8px;text-wrap:balance}
.empty .note{margin:0 auto 18px;max-width:30ch}
.perks{list-style:none;text-align:left;margin:4px 0 18px;display:grid;gap:10px}
.perks li{display:flex;gap:10px;align-items:flex-start;font-size:12.5px;line-height:1.4;color:var(--text-2)}
.perks li svg{width:16px;height:16px;color:var(--accent);flex:none;margin-top:1px}
.perks b{color:var(--text);font-weight:700}

/* Personas */
.people{display:grid;grid-template-columns:repeat(3,1fr);gap:16px 6px}
.person{display:flex;flex-direction:column;align-items:center;gap:7px;text-align:center;position:relative;min-width:0}
.avatar{width:68px;height:68px;border-radius:50%;object-fit:cover;background:var(--raise-2);display:block;
  box-shadow:0 0 0 1px var(--line-2),0 6px 16px rgba(0,0,0,.22);transition:transform .15s}
.person:active .avatar{transform:scale(.95)}
.person.named .avatar{box-shadow:0 0 0 1.5px var(--accent),0 0 0 4px var(--accent-soft),0 6px 16px rgba(0,0,0,.22)}
.person.sel .avatar{box-shadow:0 0 0 2.5px var(--accent),0 6px 16px rgba(0,0,0,.22);transform:scale(.92)}
.person .check{position:absolute;top:-2px;right:calc(50% - 38px);width:22px;height:22px;border-radius:50%;background:var(--glass);
  border:1.5px solid var(--line-2);display:grid;place-items:center}
.person.sel .check{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.person .check svg{width:13px;height:13px}
.person .nm{font-size:12.5px;font-weight:700;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.1px}
.person .nm.unnamed{color:var(--muted);font-weight:600}
.person .ct{font-size:10.5px;color:var(--muted);margin-top:-5px}

.selbar{position:sticky;bottom:-16px;margin:16px -14px -16px;padding:10px 14px 12px;background:var(--glass);
  -webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);border-top:1px solid var(--line);display:flex;gap:6px;align-items:center}
.selbar .n{font-size:12px;font-weight:700;flex:1;color:var(--text-2)}
.selbar .btn{height:36px;padding:0 12px;font-size:12px}

/* Fotos */
.photos{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;margin:0 -6px;border-radius:14px;overflow:hidden}
.ph{position:relative;aspect-ratio:1;background:var(--raise-2);overflow:hidden;display:block;width:100%}
.ph img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .2s}
.ph:active img{transform:scale(.96)}
.ph .fav{position:absolute;right:5px;bottom:5px;width:18px;height:18px;color:#FFE7B5;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))}
.ph .tag{position:absolute;left:5px;top:5px;font-size:9.5px;font-weight:800;padding:2px 6px;border-radius:8px;background:rgba(0,0,0,.55);color:#fff}
.ph .hid{position:absolute;inset:0;background:rgba(0,0,0,.5);display:grid;place-items:center;color:#fff}
.ph .hid svg{width:20px;height:20px}
.month{display:flex;align-items:baseline;justify-content:space-between;margin:18px 2px 8px}
.month:first-of-type{margin-top:4px}
.month h4{font-family:var(--display);font-weight:780;letter-spacing:-.45px;font-size:15px;line-height:1}
.month span{font-size:11px;color:var(--muted)}

.dupe{padding:10px;border-radius:16px;background:var(--raise);border:1px solid var(--line);margin-bottom:10px}
.dupe .strip{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:10px}
.dupe .strip img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;display:block}
.dupe .strip .keep{box-shadow:0 0 0 2px var(--accent)}
.dupe .meta{display:flex;align-items:center;gap:8px}
.dupe .meta p{flex:1;font-size:11.5px;color:var(--text-2)}
.dupe .meta .btn{height:32px;font-size:11.5px;padding:0 12px}

/* Carpetas como álbumes */
.albums{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.album{border-radius:20px;background:var(--raise);border:1px solid var(--line);padding:6px;display:flex;flex-direction:column;gap:6px;min-width:0;text-align:left}
.album.off .cover{opacity:.4;filter:grayscale(1)}
.album .cover{aspect-ratio:1;width:100%;border-radius:15px;overflow:hidden;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:2px;background:var(--raise-2);transition:transform .12s}
.album .cover:active{transform:scale(.97)}
.album .cover img{width:100%;height:100%;object-fit:cover;display:block}
.album .cover i{background:var(--raise-2)}
.album .cover .ph-empty{grid-column:1/-1;grid-row:1/-1;display:grid;place-items:center;color:var(--muted)}
.album .cover .ph-empty svg{width:30px;height:30px}
.album .meta{display:flex;align-items:center;gap:6px;padding:2px 6px 4px}
.album .tx{flex:1;min-width:0}
.album .t{font-family:var(--display);font-size:13.5px;font-weight:750;letter-spacing:-.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.album .s{font-size:11px;color:var(--muted)}
.album .s.warn{color:var(--accent)}
.album.add .cover{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--accent);border:1.5px dashed var(--line-2);background:transparent}
.album.add .cover svg{width:30px;height:30px}
.album.add .cover b{font-size:12px;font-weight:700;color:var(--text)}
.switch.sm{width:36px;height:22px}
.switch.sm::after{width:16px;height:16px}
.switch.sm[aria-checked="true"]::after{transform:translateX(14px)}
.dialog .opt .oi{width:34px;height:34px;border-radius:11px;background:var(--raise-2);display:grid;place-items:center;color:var(--accent);flex:none}
.dialog .opt .oi svg{width:18px;height:18px}
.dialog .opt.warn span:last-child{color:var(--danger)}

/* Secciones de carpetas */
.srcsec{margin-bottom:16px}
.srcsec.off .albums{opacity:.4;filter:grayscale(1)}
.srchead{display:flex;align-items:center;gap:8px;margin:0 0 10px}
.srchead .ic{width:32px;height:32px;border-radius:10px;background:var(--raise-2);display:grid;place-items:center;color:var(--accent);flex:none}
.srchead .ic svg{width:17px;height:17px}
.srchead .tx{flex:1;min-width:0}
.srchead .t{font-family:var(--display);font-size:16px;font-weight:800;letter-spacing:-.3px;display:flex;align-items:center;gap:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.srchead .s{font-size:11px;color:var(--muted)}
.srchead .s.warn{color:var(--accent)}
.iconbtn.sm{width:32px;height:32px}
.tag-st{font-family:var(--sans);font-size:9.5px;font-weight:700;letter-spacing:.3px;padding:2px 7px;border-radius:8px;background:var(--raise-2);color:var(--text-2)}
.tag-st.on{background:var(--accent-soft);color:var(--accent)}
.tag-st.ok{color:var(--muted)}
.album .meta,.album .tx{display:flex}
.album .tx{flex-direction:column}
.banner b{font-weight:800}

/* Borrar */
.clean{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:10px 12px;border-radius:16px;background:var(--raise);border:1px solid var(--line);margin-bottom:8px;transition:transform .12s}
.clean:active{transform:scale(.98)}
.clean:disabled{opacity:.45}
.clean .ic{width:34px;height:34px;border-radius:11px;background:var(--raise-2);display:grid;place-items:center;color:var(--accent);flex:none}
.clean .ic svg{width:18px;height:18px}
.clean .tx{flex:1;min-width:0;display:flex;flex-direction:column}
.clean .t{font-size:13px;font-weight:700}
.clean .s{font-size:10.5px;color:var(--muted);line-height:1.3;margin-top:2px}
.clean .strip{display:flex;flex:none}
.clean .strip img{width:26px;height:26px;border-radius:7px;object-fit:cover;box-shadow:0 0 0 2px var(--glass);margin-left:-8px}
.clean .n{font-size:13px;font-weight:800;min-width:28px;text-align:right;color:var(--text)}
.ph.pick .mark{position:absolute;top:6px;right:6px;width:22px;height:22px;border-radius:50%;border:1.5px solid rgba(255,255,255,.85);background:rgba(0,0,0,.25);display:grid;place-items:center;color:#fff}
.ph.pick .mark svg{width:13px;height:13px}
.ph.pick.on .mark{background:var(--danger);border-color:var(--danger)}
.ph.pick:not(.on) img{opacity:.45;filter:saturate(.4)}

/* Persona */
.hero{display:flex;flex-direction:column;align-items:center;text-align:center;padding:4px 0 6px;position:relative}
.hero .back{position:absolute;left:-6px;top:-2px}
.hero .avatar{width:84px;height:84px}
.hero .name-in{margin-top:12px;width:100%;max-width:230px;text-align:center;background:transparent;border:0;border-bottom:1px dashed var(--line-2);
  font-family:var(--display);font-weight:780;letter-spacing:-.45px;font-size:21px;line-height:1.25;padding:2px 4px;color:var(--text)}
.hero .name-in::placeholder{color:var(--muted)}
.hero .sub{font-size:11.5px;color:var(--muted);margin-top:6px}
.faces-stack{display:flex;justify-content:center;margin-bottom:4px}
.faces-stack img{width:56px;height:56px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 3px var(--bg);margin-left:-14px}
.faces-stack img:first-child{margin-left:0}
.actions{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:14px 0 16px}
.act{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:10.5px;font-weight:600;color:var(--text-2)}
.act span.i{width:44px;height:44px;border-radius:15px;display:grid;place-items:center;background:var(--raise-2);color:var(--accent);transition:transform .12s}
.act:active span.i{transform:scale(.92)}
.act svg{width:19px;height:19px}

/* Listas tipo ajustes */
.group{border-radius:18px;background:var(--raise);border:1px solid var(--line);overflow:hidden;margin-bottom:12px}
.item{display:flex;align-items:center;gap:12px;padding:12px 14px;min-height:56px}
.item+.item{border-top:1px solid var(--line)}
.item .ic{width:34px;height:34px;border-radius:11px;background:var(--raise-2);display:grid;place-items:center;color:var(--accent);flex:none}
.item .ic svg{width:18px;height:18px}
.item .tx{flex:1;min-width:0}
.item .t{font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.item .s{font-size:11.5px;color:var(--muted);margin-top:1px}
.item .s.warn{color:var(--accent)}
.item.off .tx{opacity:.55}
.item.stack{flex-direction:column;align-items:stretch;gap:10px}
.mini-actions{display:flex;gap:6px;flex-wrap:wrap;padding:0 14px 12px}
.mini-actions .chip{height:30px;font-size:11.5px}
.switch{width:44px;height:26px;border-radius:13px;background:var(--raise-2);border:1px solid var(--line-2);position:relative;flex:none;transition:background .2s}
.switch::after{content:"";position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:var(--text-2);transition:transform .22s cubic-bezier(.2,.9,.3,1.2),background .2s}
.switch[aria-checked="true"]{background:var(--accent);border-color:transparent}
.switch[aria-checked="true"]::after{transform:translateX(18px);background:var(--accent-ink)}
.seg{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:4px;padding:3px;border-radius:14px;background:var(--raise-2)}
.seg button{height:34px;border-radius:11px;font-size:11.5px;font-weight:700;color:var(--text-2);display:flex;align-items:center;justify-content:center;gap:5px}
.seg button[aria-pressed="true"]{background:var(--glass);color:var(--text);box-shadow:0 1px 4px rgba(0,0,0,.2)}
input[type=range]{width:100%;accent-color:var(--accent);height:26px}
.range-l{display:flex;justify-content:space-between;font-size:10.5px;color:var(--muted)}

.banner{display:flex;align-items:center;gap:10px;padding:10px 10px 10px 14px;border-radius:16px;background:var(--accent-soft);margin-bottom:12px}
.banner p{flex:1;min-width:0;font-size:11.5px;line-height:1.4;color:var(--text)}
.banner .btn{height:32px;font-size:11.5px;padding:0 12px;flex:none}

/* Bóveda */
.vault{display:flex;flex-direction:column;align-items:center;text-align:center;padding:0}
.vault .lock{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent);margin-bottom:8px}
.vault .lock svg{width:20px;height:20px}
.vault h3{font-family:var(--display);font-weight:780;letter-spacing:-.45px;font-size:19px;margin-bottom:2px}
.vault .note{font-size:11.5px;max-width:32ch}
.pins{display:flex;gap:12px;margin:12px 0 14px}
.pins i{width:12px;height:12px;border-radius:50%;border:1.5px solid var(--line-2);transition:background .15s,transform .15s}
.pins i.on{background:var(--accent);border-color:var(--accent);transform:scale(1.1)}
.pins.shake{animation:shake .35s}
@keyframes shake{25%{transform:translateX(-8px)}50%{transform:translateX(7px)}75%{transform:translateX(-4px)}}
.keypad{display:grid;grid-template-columns:repeat(3,56px);gap:8px 18px}
.key{width:56px;height:56px;border-radius:50%;background:var(--raise-2);font-size:22px;font-weight:500;display:grid;place-items:center}
.key:active{background:var(--accent-soft)}
.key.ghost{background:transparent;font-size:12px;font-weight:700;color:var(--text-2)}
.key svg{width:22px;height:22px}

/* Visor */
.viewer{position:fixed;inset:0;z-index:2147483003;background:#050506;display:flex;flex-direction:column;color:#F3F0EA;animation:fade .2s}
@keyframes fade{from{opacity:0}}
.viewer .top{display:flex;align-items:center;gap:6px;padding:calc(8px + env(safe-area-inset-top)) 8px 6px}
.viewer .top .t{flex:1;min-width:0;text-align:center;font-size:12px;color:#B4AEA4}
.viewer .top .iconbtn{color:#F3F0EA}
.viewer .top .iconbtn.on{color:#E4C894}
.viewer .stage{flex:1;position:relative;display:grid;place-items:center;overflow:hidden;touch-action:pan-y}
.viewer .stage .wrap{position:relative;max-width:100%;max-height:100%;transition:transform .2s}
.viewer .stage img{max-width:100vw;max-height:calc(100dvh - 190px);display:block}
.viewer .box{position:absolute;border:1.5px solid #E4C894;border-radius:10px;box-shadow:0 0 0 9999px rgba(0,0,0,.28)}
.viewer .nav-arrow{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.08);display:grid;place-items:center;color:#fff}
.viewer .nav-arrow.l{left:8px} .viewer .nav-arrow.r{right:8px}
.viewer .nav-arrow svg{width:20px;height:20px}
.viewer .acts{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:6px;padding:10px 12px calc(14px + env(safe-area-inset-bottom))}
.viewer .acts button{height:60px;border-radius:16px;background:rgba(255,255,255,.06);font-size:10.5px;font-weight:600;color:#B4AEA4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px}
.viewer .acts svg{width:20px;height:20px;color:#E4C894}

/* Recuerdo (presentación) */
.show{position:fixed;inset:0;z-index:2147483003;background:#000;color:#fff;overflow:hidden;animation:fade .3s}
.show .layer{position:absolute;inset:0;opacity:0;transition:opacity 1.2s ease}
.show .layer.on{opacity:1}
.show .layer img{width:100%;height:100%;object-fit:cover;animation:kb 7s ease-out forwards}
.show .layer:nth-child(2) img{animation-name:kb2}
@keyframes kb{from{transform:scale(1.02) translate(0,0)}to{transform:scale(1.14) translate(-2%,-2%)}}
@keyframes kb2{from{transform:scale(1.14) translate(2%,1%)}to{transform:scale(1.02) translate(0,0)}}
.show .veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.55),transparent 28%,transparent 62%,rgba(0,0,0,.7))}
.show .cap{position:absolute;left:24px;right:24px;bottom:calc(36px + env(safe-area-inset-bottom))}
.show .cap h2{font-family:var(--display);font-weight:780;letter-spacing:-.45px;font-size:32px;line-height:1}
.show .cap p{font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:rgba(255,255,255,.7);margin-top:8px}
.show .ctl{position:absolute;top:calc(10px + env(safe-area-inset-top));right:10px;display:flex;gap:6px}
.show .ctl .iconbtn{color:#fff;background:rgba(0,0,0,.3)}
.show .bars{position:absolute;top:calc(4px + env(safe-area-inset-top));left:12px;right:12px;display:flex;gap:3px}
.show .bars i{flex:1;height:2px;border-radius:1px;background:rgba(255,255,255,.25);overflow:hidden}
.show .bars i b{display:block;height:100%;width:0;background:#fff}
.show .bars i.done b{width:100%}
.show .bars i.now b{animation:bar var(--dur,4s) linear forwards}
.show.paused .bars i.now b{animation-play-state:paused}
@keyframes bar{to{width:100%}}

/* Diálogo y aviso */
.dialog{position:fixed;inset:0;z-index:2147483004;display:grid;place-items:center;background:var(--scrim);padding:20px;animation:fade .15s}
.dialog .card{width:100%;max-width:340px;background:var(--glass);-webkit-backdrop-filter:blur(30px);backdrop-filter:blur(30px);border:1px solid var(--line-2);border-radius:24px;padding:22px 20px 18px;box-shadow:var(--shadow)}
.dialog h3{font-family:var(--display);font-weight:780;letter-spacing:-.45px;font-size:19px;line-height:1.1;margin-bottom:8px}
.dialog .note{margin-bottom:18px}
.dialog .list{max-height:44dvh;overflow:auto;margin:0 -8px 14px}
.dialog .opt{display:flex;align-items:center;gap:12px;padding:8px;border-radius:14px;width:100%;text-align:left}
.dialog .opt:active{background:var(--raise-2)}
.dialog .opt .avatar{width:40px;height:40px}
.dialog .opt span{font-size:13.5px;font-weight:700}
.toast{position:absolute;z-index:5;left:50%;bottom:84px;transform:translate(-50%,12px);opacity:0;width:max-content;max-width:calc(100% - 28px);text-align:center;
  background:var(--text);color:var(--bg);font-size:12px;font-weight:700;line-height:1.35;padding:10px 14px;border-radius:16px;
  transition:opacity .2s,transform .25s cubic-bezier(.2,.9,.3,1.2);pointer-events:none;box-shadow:0 10px 30px rgba(0,0,0,.35)}
.toast.on{opacity:1;transform:translate(-50%,0)}

@media (prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important;animation:none!important}}
`;
