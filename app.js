/* ZamJam – comportamiento del sitio
   La estructura (menú, pie) vive en el HTML; este archivo solo añade interactividad. */
(() => {
'use strict';

/* ====== CONFIGURACIÓN: edita solo esto ======
   email:        correo de contacto de la organización.
   entradasUrl:  enlace de la web donde se compran las entradas (se abre en pestaña nueva).
                 Todos los botones con data-entradas apuntan aquí. */
const CONFIG = {
  email: 'GameJam.Zamora@gmail.com',
  entradasUrl: ''   // ← pega aquí el enlace, p. ej. 'https://tu-web-de-entradas.com/zamjam'
};

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

/* Imagen de reserva: si una foto no existe, se muestra la indicada en data-fallback */
$$('img[data-fallback]').forEach(img => {
  const usa = () => { if (img.dataset.done) return; img.dataset.done = '1'; img.classList.add('is-placeholder'); img.src = img.dataset.fallback; };
  img.addEventListener('error', usa);
  if (img.complete && img.naturalWidth === 0) usa();
});

/* Enlaces de contacto */
$$('a[data-mail]').forEach(a => { a.href = 'mailto:' + CONFIG.email; });

/* Botones de compra de entrada → web externa */
$$('a[data-entradas]').forEach(a => {
  if (CONFIG.entradasUrl) { a.href = CONFIG.entradasUrl; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  else a.addEventListener('click', e => { e.preventDefault(); console.warn('Falta configurar CONFIG.entradasUrl en app.js'); });
});

/* Enlace activo en el menú */
const pagina = location.pathname.split('/').pop() || 'index.html';
$$('.drawer nav a').forEach(a => {
  if (a.getAttribute('href') === pagina) a.setAttribute('aria-current', 'page');
});

/* ====== Cajón de navegación ====== */
const drawer = $('#menu'), scrim = $('.scrim'), menuBtn = $('.menu-btn'), closeBtn = $('.drawer-close');
if (drawer && menuBtn) {
  const setNav = open => {
    drawer.classList.toggle('open', open);
    scrim.classList.toggle('open', open);
    root.classList.toggle('nav-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    if (open) (drawer.querySelector('[aria-current]') || closeBtn).focus();
    else if (drawer.contains(document.activeElement)) menuBtn.focus();
  };
  menuBtn.addEventListener('click', () => setNav(!drawer.classList.contains('open')));
  closeBtn.addEventListener('click', () => setNav(false));
  scrim.addEventListener('click', () => setNav(false));
  drawer.addEventListener('click', e => { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', e => {
    if (!drawer.classList.contains('open')) return;
    if (e.key === 'Escape') return setNav(false);
    if (e.key === 'Tab') {                       // el foco no se escapa del cajón
      const f = $$(FOCUSABLE, drawer); const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

/* ====== Volver arriba ====== */
const totop = $('.totop');
if (totop) {
  const onScroll = () => totop.classList.toggle('show', scrollY > 700);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
}

/* ====== Cuenta atrás ====== */
const cd = $('[data-fecha]');
if (cd) {
  const objetivo = new Date(cd.dataset.fecha).getTime();
  const nums = $$('b', cd);
  const pl = (n, s, p) => n + ' ' + (n === 1 ? s : p);
  const tick = () => {
    if (isNaN(objetivo)) return;
    const d = objetivo - Date.now();
    if (d <= 0) {
      cd.innerHTML = '<div class="count-end">¡La jam ya está en marcha!</div>';
      clearInterval(timer); return;
    }
    const v = [Math.floor(d / 864e5), Math.floor(d / 36e5) % 24, Math.floor(d / 6e4) % 60];
    nums.forEach((b, i) => b.textContent = String(v[i]).padStart(2, '0'));
    cd.setAttribute('role', 'timer');
    cd.setAttribute('aria-label', 'Faltan ' + pl(v[0], 'día', 'días') + ', ' + pl(v[1], 'hora', 'horas') + ' y ' + pl(v[2], 'minuto', 'minutos'));
  };
  const timer = setInterval(tick, 3e4); tick();
}

/* ====== Galería: filtros + visor ====== */
const gal = $('.gal');
if (gal) {
  const items = $$('.ph', gal), chips = $$('.chip[data-f]'), count = $('#gal-count');
  const visibles = () => items.filter(p => !p.classList.contains('hide'));
  const actualizaCount = () => { if (count) count.textContent = 'Mostrando ' + visibles().length + ' de ' + items.length + ' fotos'; };
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => x.setAttribute('aria-pressed', x === c));
    items.forEach(p => p.classList.toggle('hide', c.dataset.f !== 'todas' && p.dataset.ed !== c.dataset.f));
    actualizaCount();
  }));
  actualizaCount();

  const lb = $('#lightbox');
  if (lb) {
    const stage = $('.lb-item', lb), cap = $('.lb-cap', lb), num = $('.lb-count', lb);
    let lista = [], i = 0, origen = null;
    const pinta = () => {
      const el = lista[i]; stage.textContent = '';
      const img = $('img', el);
      let nodo;
      if (img) { nodo = document.createElement('img'); nodo.src = img.dataset.full || img.src; nodo.alt = img.alt; }
      else { nodo = document.createElement('div'); nodo.className = el.className.replace('hide', ''); nodo.textContent = el.textContent; }
      stage.append(nodo);
      cap.textContent = el.dataset.caption || (img && img.alt) || '';
      num.textContent = (i + 1) + ' / ' + lista.length;
      const dl = $('.lb-dl', lb);                     // descarga: solo si hay foto real
      if (img) { dl.hidden = false; dl.href = nodo.src; dl.setAttribute('download', nodo.src.split('/').pop().split('?')[0] || 'zamjam-foto'); }
      else { dl.hidden = true; dl.removeAttribute('href'); }
    };
    const abre = el => {
      lista = visibles(); i = Math.max(0, lista.indexOf(el)); origen = el;
      pinta(); lb.hidden = false; root.classList.add('lb-open'); $('.lb-close', lb).focus();
    };
    const cierra = () => { lb.hidden = true; root.classList.remove('lb-open'); if (origen) origen.focus(); };
    const ve = d => { i = (i + d + lista.length) % lista.length; pinta(); };
    items.forEach(p => p.addEventListener('click', () => abre(p)));
    $('.lb-close', lb).addEventListener('click', cierra);
    $('.lb-prev', lb).addEventListener('click', () => ve(-1));
    $('.lb-next', lb).addEventListener('click', () => ve(1));
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-stage')) cierra(); });
    document.addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') cierra();
      else if (e.key === 'ArrowLeft') ve(-1);
      else if (e.key === 'ArrowRight') ve(1);
      else if (e.key === 'Tab') {
        const f = $$(FOCUSABLE, lb); const a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
    let x0 = null;                                  // deslizar en móvil
    lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => {
      if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) ve(dx < 0 ? 1 : -1);
    });
  }
}
/* Vídeo de la portada: se reproduce (sin sonido) al verse y se pausa al salir */
const vid = $('.ph.vid video');
if (vid && 'IntersectionObserver' in window) {
  vid.muted = true;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) vid.play().catch(() => {});
    else vid.pause();
  }, { threshold: 0.5 }).observe(vid);
}
})();
