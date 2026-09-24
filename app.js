/* LiveWall — collection site */

const $ = (sel, el = document) => el.querySelector(sel);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ICON_BASE = 'assets/macos/dock/';
const DOCK_ITEMS = [
  { name: 'Finder', icon: 'finder.png' },
  { name: 'Launchpad', icon: 'launchpad.png' },
  { name: 'App Store', icon: 'appstore.png' },
  { name: 'Safari', icon: 'safari.png' },
  { name: 'Messages', icon: 'messages.png' },
  { name: 'Mail', icon: 'mail.png' },
  { name: 'Maps', icon: 'maps.png' },
  { name: 'Photos', icon: 'photos.png' },
  { name: 'FaceTime', icon: 'facetime.png' },
  { name: 'Calendar', icon: 'calendar.png' },
  { name: 'Contacts', icon: 'contacts.png' },
  { name: 'Reminders', icon: 'reminders.png' },
  { name: 'Notes', icon: 'notes.png' },
  { name: 'Music', icon: 'music.png' },
  { name: 'TV', icon: 'tv.png' },
  { name: 'Podcasts', icon: 'podcasts.png' },
  { name: 'System Settings', icon: 'settings.png' },
  { sep: true },
  { name: 'Trash', icon: 'trash.png' },
];

const PLAY_SVG = '<svg viewBox="0 0 12 14" width="11" height="13" fill="currentColor" aria-hidden="true"><path d="M1.5.9 11.4 7 1.5 13.1z"/></svg>';
const DL_SVG = '<svg viewBox="0 0 14 15" width="13" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 1.2v8.4"/><path d="M3.7 6.4 7 9.7l3.3-3.3"/><path d="M1.4 13.6h11.2"/></svg>';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hexA = (hex, a) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#ffffff');
  return m ? `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${a})` : `rgba(255,255,255,${a})`;
};

let DATA = null;
let cur = 0;
let lastFocus = null;
let hintT = 0;
let pauseT = 0;
const videoLayers = [];

const nav = $('#nav');
const grid = $('#grid');
const collectionMeta = $('#collectionMeta');
const pv = $('#pv');
const pvDesktop = $('#pvDesktop');
const pvVideos = $('#pvVideos');
const pvBar = $('#pvBar');
const pvName = $('#pvName');
const pvCount = $('#pvCount');
const pvDot = $('#pvDot');
const pvDownload = $('#pvDownload');
const pvHideUI = $('#pvHideUI');
const pvHideLabel = $('#pvHideLabel');
const pvClose = $('#pvClose');
const pvPrev = $('#pvPrev');
const pvNext = $('#pvNext');
const diFile = $('#diFile');
const diFileName = $('#diFileName');
const diDrive = $('#diDrive');
const dock = $('#dock');
const mbClock = $('#mbClock');

init();

function init() {
  buildDock();
  startClock();
  wireModal();
  $('#year').textContent = new Date().getFullYear();
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 8), { passive: true });
  nav.classList.toggle('scrolled', window.scrollY > 8);
  loadData();
}

async function loadData() {
  try {
    const res = await fetch('wallpapers.json', { cache: 'no-cache' });
    DATA = await res.json();
  } catch (err) {
    console.error('Could not load wallpapers.json', err);
    return;
  }
  renderCards();
  const m = location.hash.match(/^#preview=([\w-]+)$/);
  if (m) {
    const i = DATA.wallpapers.findIndex(w => w.slug === m[1]);
    if (i >= 0) openPreview(i);
  }
}

/* ── Menu bar clock ──────────────────────────────────────── */

function startClock() {
  const tick = () => {
    const d = new Date();
    const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', '');
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    mbClock.textContent = `${day} ${time}`;
  };
  tick();
  setInterval(tick, 10000);
}

/* ── Cards ───────────────────────────────────────────────── */

function renderCards() {
  const list = DATA.wallpapers;
  collectionMeta.textContent = `${list.length} wallpaper${list.length > 1 ? 's' : ''} · free 4K downloads`;
  grid.innerHTML = '';

  list.forEach((w, i) => {
    const card = document.createElement('article');
    card.className = 'card reveal';
    card.style.transitionDelay = `${i * 90}ms`;
    card.style.setProperty('--glowc', hexA(w.accent, 0.32));
    card.innerHTML = `
      <div class="thumb" role="button" tabindex="0" aria-label="Preview ${esc(w.title)} on a Mac desktop">
        <img class="poster" src="${w.poster}" alt="${esc(w.title)} — still frame">
        <video muted loop playsinline preload="none" data-src="${w.preview}" poster="${w.poster}"></video>
        <div class="thumb-cta"><span class="cta-pill">${PLAY_SVG}Preview on a Mac desktop</span></div>
      </div>
      <div class="card-info">
        <h3 class="card-title">${esc(w.title)}</h3>
        <p class="card-sub">${esc(w.subtitle)}</p>
        <p class="card-meta">${w.resolution} · ${w.duration} seamless loop · silent · ${w.size}</p>
        <div class="card-actions">
          <button class="btn btn-primary btn-sm" type="button">Preview desktop</button>
          <a class="btn btn-glass btn-sm" href="${w.download}" download="${w.downloadName}">${DL_SVG}Download 4K</a>
        </div>
      </div>`;

    const thumb = card.querySelector('.thumb');
    thumb.addEventListener('click', () => openPreview(i));
    thumb.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPreview(i); }
    });
    card.querySelector('.card-actions .btn-primary').addEventListener('click', () => openPreview(i));

    lazyVideo(card.querySelector('video'));
    grid.appendChild(card);
  });

  initReveal();
}

function lazyVideo(v) {
  const thumb = v.closest('.thumb');
  const start = () => {
    if (!v.src) { v.src = v.dataset.src; v.load(); }
    if (!v.dataset.fade) {
      v.dataset.fade = '1';
      v.addEventListener('canplay', () => v.classList.add('on'), { once: true });
      setTimeout(() => v.classList.add('on'), 1500);
    }
    const p = v.play();
    if (p) p.catch(() => {});
  };
  const stop = () => { if (!v.paused) v.pause(); };

  const io = new IntersectionObserver(entries => {
    entries.forEach(en => en.isIntersecting ? (reduceMotion ? null : start()) : stop());
  }, { rootMargin: '300px 0px' });
  io.observe(v);

  if (reduceMotion) {
    thumb.addEventListener('mouseenter', start);
    thumb.addEventListener('mouseleave', stop);
  }
}

function initReveal() {
  const els = document.querySelectorAll('.reveal:not(.in)');
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.1 });
  els.forEach(el => io.observe(el));
}

/* ── Dock ────────────────────────────────────────────────── */

function buildDock() {
  DOCK_ITEMS.forEach(item => {
    if (item.sep) {
      const s = document.createElement('div');
      s.className = 'dock-sep';
      dock.appendChild(s);
      return;
    }
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dock-item';
    b.setAttribute('aria-label', item.name);
    b.innerHTML = `<span class="tip">${item.name}</span><img src="${ICON_BASE}${item.icon}" alt="" draggable="false">`;
    b.addEventListener('click', () => bounce(b));
    dock.appendChild(b);
  });
  scaleDock();
  window.addEventListener('resize', scaleDock);
}

const MAG_RANGE = 115;
const MAG_MAX = 0.55;

dock.addEventListener('pointermove', e => {
  if (reduceMotion) return;
  dock.querySelectorAll('.dock-item').forEach(el => {
    const r = el.getBoundingClientRect();
    const d = Math.abs(e.clientX - (r.left + r.width / 2));
    const f = Math.max(0, 1 - d / MAG_RANGE);
    const s = 1 + MAG_MAX * f * f;
    el.style.transform = `translateY(${-(s - 1) * 30}px) scale(${s})`;
  });
}, { passive: true });

dock.addEventListener('pointerleave', () => {
  dock.querySelectorAll('.dock-item').forEach(el => { el.style.transform = ''; });
});

function bounce(el) {
  if (reduceMotion) return;
  el.classList.remove('dock-bounce');
  void el.offsetWidth;
  el.classList.add('dock-bounce');
  el.addEventListener('animationend', () => el.classList.remove('dock-bounce'), { once: true });
}

function scaleDock() {
  if (pv.hidden) return; /* nothing to measure while the preview is closed */
  dock.style.transform = 'translateX(-50%)';
  const needed = dock.scrollWidth + 8;
  const avail = Math.min(window.innerWidth - 16, 1400);
  const s = Math.min(1, avail / needed);
  if (s < 1) dock.style.transform = `translateX(-50%) scale(${s})`;
}

/* ── Preview modal ───────────────────────────────────────── */

function wireModal() {
  $('#heroPreview').addEventListener('click', () => openPreview(0));
  pvClose.addEventListener('click', closePreview);
  pvPrev.addEventListener('click', () => show(cur - 1));
  pvNext.addEventListener('click', () => show(cur + 1));
  pvHideUI.addEventListener('click', () => {
    const hidden = pv.classList.toggle('no-ui');
    pvHideLabel.textContent = hidden ? 'Show interface' : 'Hide interface';
  });

  diFile.addEventListener('click', e => { e.stopPropagation(); selectIcon(diFile); });
  diDrive.addEventListener('click', e => { e.stopPropagation(); selectIcon(diDrive); });
  diFile.addEventListener('dblclick', () => { if (DATA) triggerDownload(DATA.wallpapers[cur]); });
  pvDesktop.addEventListener('click', e => { if (!e.target.closest('.dicon')) selectIcon(null); });

  document.addEventListener('keydown', e => {
    if (pv.hidden) return;
    if (e.key === 'Escape') closePreview();
    else if (e.key === 'ArrowLeft') show(cur - 1);
    else if (e.key === 'ArrowRight') show(cur + 1);
  });
}

function selectIcon(el) {
  [diDrive, diFile].forEach(x => x.classList.toggle('sel', x === el));
}

function triggerDownload(w) {
  const a = document.createElement('a');
  a.href = w.download;
  a.download = w.downloadName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function ensureVideos() {
  if (videoLayers.length || !DATA) return;
  DATA.wallpapers.forEach(w => {
    const v = document.createElement('video');
    v.muted = true;
    v.loop = true;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.preload = 'none';
    v.src = w.preview;
    pvVideos.appendChild(v);
    videoLayers.push(v);
  });
}

function openPreview(i = 0) {
  if (!DATA) return;
  lastFocus = document.activeElement;
  pv.hidden = false;
  pv.classList.remove('closing', 'hint-hidden');
  document.body.classList.add('pv-open');
  ensureVideos();
  scaleDock();
  show(i);
  requestAnimationFrame(() => requestAnimationFrame(() => pv.classList.add('open')));
  pvClose.focus({ preventScroll: true });
  clearTimeout(hintT);
  hintT = setTimeout(() => pv.classList.add('hint-hidden'), 8000);
}

function closePreview() {
  if (pv.hidden) return;
  pv.classList.add('closing');
  pv.classList.remove('open');
  document.body.classList.remove('pv-open');
  videoLayers.forEach(v => v.pause());
  setTimeout(() => {
    pv.hidden = true;
    pv.classList.remove('closing');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }, 280);
  history.replaceState(null, '', location.pathname + location.search);
}

function show(i) {
  const list = DATA.wallpapers;
  cur = ((i % list.length) + list.length) % list.length;
  const w = list[cur];

  videoLayers.forEach((v, k) => {
    const on = k === cur;
    v.classList.toggle('active', on);
    if (on) {
      v.preload = 'auto';
      if (!v.dataset.ready) { v.dataset.ready = '1'; v.load(); }
      const p = v.play();
      if (p) p.catch(() => {});
    }
  });
  clearTimeout(pauseT);
  pauseT = setTimeout(() => {
    videoLayers.forEach((v, k) => { if (k !== cur && !v.paused) v.pause(); });
  }, 1100);

  pv.style.setProperty('--acc', w.accent || '#ff9e2c');
  pvName.textContent = w.title;
  pvCount.textContent = `${cur + 1} of ${list.length}`;
  pvDownload.href = w.download;
  pvDownload.setAttribute('download', w.downloadName);
  diFileName.textContent = w.downloadName;

  try { history.replaceState(null, '', `#preview=${w.slug}`); } catch (e) { /* file:// */ }
}
