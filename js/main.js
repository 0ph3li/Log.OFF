/* =========================================================
   LOG.OFF — main.js (shared by every page)
   Page scripts (home.js …) load after this file and use window.L.
   Everything the site remembers lives in localStorage under "lo-".
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (hasGsap && window.Draggable) gsap.registerPlugin(Draggable);
  const motion = hasGsap && !reduced;
  const root = document.documentElement;
  if (!motion) root.classList.add('no-motion');

  /* ---------- storage: never trust it, never need it ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('lo-' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('lo-' + k, JSON.stringify(v)); } catch (e) { /* private window */ } },
  };
  const session = {
    get(k) { try { return sessionStorage.getItem('lo-' + k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem('lo-' + k, v); } catch (e) { /* nothing */ } },
  };

  /* ---------- ready: things that should wait for the loader ---------- */
  const readyFns = [];
  let isReady = false;
  const ready = (fn) => (isReady ? fn() : readyFns.push(fn));

  /* ---------- smooth scroll (lenis), wired into ScrollTrigger ---------- */
  let lenis = null;
  if (motion && window.Lenis) {
    lenis = new Lenis({ lerp: .09, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.6 }) : scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' }));
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const t = a.getAttribute('href') === '#top' ? document.body : $(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault(); scrollToY(t === document.body ? 0 : t.getBoundingClientRect().top + scrollY - 70);
  }));

  /* ---------- text splitting ---------- */
  // characters: every letter becomes a .char (spaces stay as text so lines still wrap)
  function chars(el) {
    if (el._chars) return el._chars;
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        [...n.textContent].forEach((ch) => {
          if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span'); s.className = 'char'; s.textContent = ch;
          if (ch === '.') s.classList.add('dot');
          frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el);
    el._chars = $$('.char', el);
    return el._chars;
  }
  // lines: split at <br>, each line slides up out of its own mask
  function lines(el) {
    if (el._lines) return el._lines;
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map((p) => `<span class="split-line"><span>${p.trim()}</span></span>`).join('');
    el._lines = $$('.split-line > span', el);
    return el._lines;
  }

  /* ---------- image slots: load img/<name>, keep placeholder if missing ---------- */
  function fillSlot(slot) {
    const name = slot.dataset.img;
    if (slot.dataset.ratio) slot.style.setProperty('--ratio', slot.dataset.ratio);
    if (!name) return;
    const img = new Image();
    img.alt = slot.dataset.alt || '';
    img.decoding = 'async';
    img.onload = () => {
      slot.querySelectorAll(':scope > img').forEach((o) => o.remove());
      slot.prepend(img); slot.classList.add('has-img');
      slot.dispatchEvent(new CustomEvent('slot:load', { detail: img }));
      // a little parallax inside the frame
      if (motion && !slot.closest('.feed, .days')) {
        gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: slot, start: 'top bottom', end: 'bottom top', scrub: true } });
      }
    };
    img.src = 'img/' + name;
  }
  $$('.slot').forEach(fillSlot);

  /* ---------- pixel slots: a canvas mosaic of the photo (or of a fake one) ----------
     L.pixel(slot).set(cols) — cols = how many squares across. Big number = sharp. */
  function placeholderArt(w, h, seed) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#ffd3e6'); bg.addColorStop(.55, '#d8c7e6'); bg.addColorStop(1, '#c9d3dd');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    // a silhouette: head + shoulders, so the mosaic reads as "someone"
    g.fillStyle = seed % 2 ? '#2a1f24' : '#3b2a33';
    g.beginPath(); g.ellipse(w * .5, h * .34, w * .17, h * .15, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(w * .5, h * .95, w * .42, h * .38, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#e9b8a6';
    g.beginPath(); g.ellipse(w * .5, h * .37, w * .12, h * .11, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ff1f8f';
    g.fillRect(w * .08, h * .08, w * .06, w * .06);
    return c;
  }
  function pixel(slot) {
    if (slot._pix) return slot._pix;
    const out = document.createElement('canvas'); out.className = 'pix'; out.setAttribute('aria-hidden', 'true');
    slot.appendChild(out);
    const small = document.createElement('canvas');
    let src = null, cols = 8, raf = 0;
    const draw = () => {
      raf = 0;
      const r = slot.getBoundingClientRect();
      const W = Math.max(1, Math.round(r.width)), H = Math.max(1, Math.round(r.height));
      if (out.width !== W || out.height !== H) { out.width = W; out.height = H; }
      if (!src) src = placeholderArt(300, 400, slot.dataset.pixel ? slot.dataset.pixel.length : 1);
      const sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height;
      const s = Math.max(W / sw, H / sh), cw = W / s, ch = H / s;   // object-fit: cover
      const c = Math.max(2, Math.round(cols)), rows = Math.max(2, Math.round(c * H / W));
      small.width = c; small.height = rows;
      const g = small.getContext('2d');
      g.imageSmoothingEnabled = true;
      g.drawImage(src, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, c, rows);
      const o = out.getContext('2d');
      o.imageSmoothingEnabled = false;
      o.clearRect(0, 0, W, H);
      o.drawImage(small, 0, 0, c, rows, 0, 0, W, H);
      out.style.opacity = c >= 160 ? 0 : 1;   // fully sharp: show the real <img>
    };
    const api = {
      set(n) { cols = n; if (!raf) raf = requestAnimationFrame(draw); },
      get cols() { return cols; },
    };
    slot.addEventListener('slot:load', (e) => { src = e.detail; api.set(cols); });
    const img = slot.querySelector(':scope > img'); if (img && img.complete) src = img;
    new ResizeObserver(() => api.set(cols)).observe(slot);
    slot._pix = api;
    return api;
  }

  /* ---------- toast ---------- */
  const toastEl = $('#toast'); let toastT;
  function toast(msg, ms = 2600) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), ms);
  }

  /* ---------- the visit, counted (only on this device) ---------- */
  const stats = { sec: 0, scrollPx: 0, cursorPx: 0, tabs: 0, pings: 0, esc: 0 };
  if (!session.get('visit')) { session.set('visit', '1'); store.set('visits', store.get('visits', 0) + 1); }
  const today = new Date().toISOString().slice(0, 10);
  let dayTime = store.get('time-' + today, 0);
  const fmt = (s) => [s / 3600, (s % 3600) / 60, s % 60].map((n) => String(Math.floor(n)).padStart(2, '0')).join(':');
  const timeEl = $('#screenTime');
  setInterval(() => {
    if (document.hidden) return;
    stats.sec++; dayTime++;
    if (stats.sec % 5 === 0) store.set('time-' + today, dayTime);
    if (timeEl) timeEl.textContent = fmt(dayTime);
  // when a page makes this device forget, the counters start again from zero
  document.addEventListener('L:forget', () => { dayTime = 0; stats.sec = 0; if (timeEl) timeEl.textContent = fmt(0); });
    document.dispatchEvent(new CustomEvent('L:tick'));
  }, 1000);
  if (timeEl) timeEl.textContent = fmt(dayTime);

  let lastY = scrollY;
  addEventListener('scroll', () => { stats.scrollPx += Math.abs(scrollY - lastY); lastY = scrollY; }, { passive: true });

  /* ---------- noise: 1 at the top of the page, 0 at the bottom ---------- */
  const bars = $$('#bars i'), battery = $('#battery');
  let noise = 1;
  function readNoise() {
    const max = Math.max(1, root.scrollHeight - innerHeight);
    const p = Math.min(1, Math.max(0, scrollY / max));
    noise = 1 - p;
    root.style.setProperty('--noise', noise.toFixed(3));
    const on = Math.ceil(noise * 4 - .05);
    bars.forEach((b, i) => b.classList.toggle('off', i >= on));
    if (battery) battery.style.setProperty('--charge', (.12 + p * .88).toFixed(2));   // social battery recharges as you go
  }
  addEventListener('scroll', readNoise, { passive: true });
  addEventListener('resize', readNoise);
  readNoise();

  /* ---------- nav: hides when you scroll down, comes back when you scroll up ---------- */
  const topnav = $('#topnav');
  let navY = scrollY;
  const onScrollNav = () => {
    if (!topnav) return;
    topnav.classList.toggle('scrolled', scrollY > 40);
    const dy = scrollY - navY;
    if (Math.abs(dy) > 6) { topnav.classList.toggle('away', dy > 0 && scrollY > innerHeight * .6); navY = scrollY; }
  };
  addEventListener('scroll', onScrollNav, { passive: true }); onScrollNav();

  const menu = $('#menu'), burger = $('#burger');
  if (menu && burger) {
    $$('#navLinks a').forEach((a) => { const c = document.createElement('a'); c.href = a.getAttribute('href'); c.textContent = a.textContent; menu.appendChild(c); });
    const cta = $('.nav-cta'); if (cta) { const c = document.createElement('a'); c.href = cta.getAttribute('href'); c.textContent = 'Check in →'; menu.appendChild(c); }
    const setMenu = (open) => {
      menu.classList.toggle('open', open); menu.setAttribute('aria-hidden', !open);
      burger.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : '';
      if (lenis) open ? lenis.stop() : lenis.start();
      if (open && motion) gsap.from($$('a', menu), { yPercent: 120, opacity: 0, stagger: .05, duration: .8, ease: 'expo.out', delay: .2 });
    };
    burger.addEventListener('click', () => setMenu(true));
    $('#menuClose').addEventListener('click', () => setMenu(false));
    menu.addEventListener('click', (e) => { if (e.target.tagName === 'A') setMenu(false); });
  }

  /* ---------- cursor: a pink dot that becomes a label ---------- */
  const cursor = $('#cursor');
  if (cursor && fine && motion) {
    root.classList.add('has-cursor');
    const label = $('span', cursor);
    const xTo = gsap.quickTo(cursor, 'x', { duration: .35, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: .35, ease: 'power3' });
    addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.add('hide'));
    document.addEventListener('pointerenter', () => cursor.classList.remove('hide'));
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('[data-cursor], a, button, input');
      if (!t) { cursor.classList.remove('big', 'hide'); return; }
      if (t.tagName === 'INPUT') { cursor.classList.add('hide'); return; }
      cursor.classList.remove('hide');
      cursor.classList.add('big');
      label.textContent = t.dataset.cursor || (t.tagName === 'A' ? 'go' : 'click');
    });
  } else if (cursor) cursor.remove();

  /* ---------- magnetic buttons ---------- */
  if (fine && motion) {
    $$('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1, .4)' });
      const yTo = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1, .4)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .35);
        yTo((e.clientY - r.top - r.height / 2) * .35);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- pings: notifications that stop coming the further down you are ---------- */
  const PINGS = [
    ['♡', '#ff1f8f', 'likes', '23 people liked your photo'],
    ['@', '#2f62ff', 'mentions', 'someone tagged you in a memory'],
    ['!', '#ff3352', 'screen time', 'you were on your phone 6h 12m yesterday'],
    ['▶', '#0d0c0d', 'for you', 'a video you\'ll watch 4 times'],
    ['✉', '#7a5cff', 'group chat (47)', 'omg did u see what she posted'],
    ['%', '#ff8a00', 'battery', '12% · connect your charger'],
    ['◎', '#ff1f8f', 'story', 'your ex viewed your story'],
    ['$', '#00a86b', 'sale', 'last chance!!! things you don\'t need'],
    ['★', '#2f62ff', 'memories', 'you have 1,204 new memories'],
    ['?', '#0d0c0d', 'unknown', 'are u up?'],
  ];
  const pingsEl = $('#pings');
  let pingsOn = true;
  function ping() {
    if (!pingsEl || !pingsOn) return;
    if (pingsEl.children.length >= (innerWidth < 600 ? 1 : 3)) return;
    const [ic, col, title, text] = PINGS[(Math.random() * PINGS.length) | 0];
    const el = document.createElement('div');
    el.className = 'ping';
    el.innerHTML = `<span class="ping-icon" style="background:${col}">${ic}</span><div><b>${title}</b><span>${text}</span></div><time>now</time>`;
    pingsEl.prepend(el);
    let gone = false;
    const remove = (dir = 1, ignored = false) => {
      if (gone) return; gone = true;
      if (ignored) { stats.pings++; document.dispatchEvent(new CustomEvent('L:tick')); }
      if (motion) gsap.to(el, { x: 360 * dir, rotate: 8 * dir, opacity: 0, duration: .45, ease: 'power2.in', onComplete: () => el.remove() });
      else el.remove();
    };
    // swipe it away (or click)
    let sx = null;
    el.addEventListener('pointerdown', (e) => { sx = e.clientX; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', (e) => { if (sx !== null) { const dx = e.clientX - sx; el.style.translate = `${dx}px 0`; el.style.rotate = `${dx / 30}deg`; } });
    el.addEventListener('pointerup', (e) => { const dx = e.clientX - sx; sx = null; if (Math.abs(dx) < 6 || Math.abs(dx) > 60) remove(dx < 0 ? -1 : 1); else { el.style.translate = ''; el.style.rotate = ''; } });
    if (motion) gsap.from(el, { y: -30, opacity: 0, scale: .9, rotateX: -40, transformPerspective: 600, duration: .7, ease: 'back.out(1.8)' });
    setTimeout(() => remove(1, true), 5200 + Math.random() * 1500);
  }
  // the loop: chance of a ping depends on how online the page still is
  (function loop() {
    if (!document.hidden && noise > .35 && Math.random() < noise * .9) ping();
    setTimeout(loop, 2400 + (1 - noise) * 4000);
  })();

  /* ---------- cursor trail: little arrows falling out of the pointer ---------- */
  if (fine && !reduced) {
    let px = null, py = null, acc = 0;
    addEventListener('pointermove', (e) => {
      if (px !== null) { const d = Math.hypot(e.clientX - px, e.clientY - py); stats.cursorPx += d; acc += d; }
      px = e.clientX; py = e.clientY;
      if (acc < 26 || noise < .45 || document.body.classList.contains('quiet')) return;
      acc = 0;
      if (Math.random() > noise) return;
      const a = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      a.setAttribute('class', 'trail'); a.setAttribute('viewBox', '0 0 14 20'); a.setAttribute('aria-hidden', 'true');
      a.innerHTML = '<use href="#arrow"/>';
      a.style.left = px + 'px'; a.style.top = py + 'px';
      document.body.appendChild(a);
      a.animate([
        { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: .95 },
        { transform: `translate(${(Math.random() - .5) * 60}px, ${80 + Math.random() * 90}px) rotate(${(Math.random() - .5) * 90}deg) scale(.6)`, opacity: 0 },
      ], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.4,0,.8,.6)' }).onfinish = () => a.remove();
    }, { passive: true });
  }

  /* ---------- warning tape: speeds up and leans when you scroll ---------- */
  $$('[data-tape]').forEach((tape) => {
    const track = $('.tape-track', tape);
    const first = track.firstElementChild;
    while (track.scrollWidth < innerWidth * 2.5) track.appendChild(first.cloneNode(true));
    if (!motion) return;
    let x = 0, boost = 0, last = scrollY, dir = 1;
    gsap.ticker.add(() => {
      const v = scrollY - last; last = scrollY;
      if (Math.abs(v) > 1) dir = v > 0 ? 1 : -1;
      boost += (Math.min(60, Math.abs(v)) - boost) * .1;
      x -= (.6 + boost * .4) * dir;
      const w = first.offsetWidth + 40;
      if (-x > w) x += w; if (x > 0) x -= w;
      track.style.transform = `translate3d(${x}px,0,0) skewX(${-boost * .4 * dir}deg)`;
    });
  });

  /* ---------- scroll reveals (set up after the loader, so nothing plays behind it) ---------- */
  if (motion) ready(() => {
    // headings: each line slides up out of a mask, slightly rotated
    $$('[data-split]').forEach((el) => {
      gsap.from(lines(el), { yPercent: 115, rotate: 4, transformOrigin: '0 100%', duration: 1.2, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
    });
    // kickers: the letters scramble into place, like a bad connection
    const GLYPHS = '▣▢░▒▓#%@*+=/\\01';
    $$('[data-scramble]').forEach((el) => {
      const targets = [...el.childNodes].map((n) => ({ n: n.nodeType === 3 ? n : n.firstChild, text: n.textContent })).filter((t) => t.n);
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: () => {
          const o = { p: 0 };
          gsap.to(o, {
            p: 1, duration: 1, ease: 'none',
            onUpdate: () => targets.forEach((t) => {
              t.n.textContent = [...t.text].map((ch, i) => (ch === ' ' || i / t.text.length < o.p ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('');
            }),
          });
        },
      });
    });
    // images marked data-blocks: a grid of squares lifts off in random order
    $$('[data-blocks]').forEach((slot) => {
      const b = document.createElement('div'); b.className = 'blocks'; b.setAttribute('aria-hidden', 'true');
      const ratio = slot.getBoundingClientRect().height / Math.max(1, slot.getBoundingClientRect().width);
      const n = 6 * Math.max(3, Math.round(6 * ratio));
      for (let i = 0; i < n; i++) b.appendChild(document.createElement('i'));
      slot.appendChild(b);
      gsap.to($$('i', b), { scale: 0, duration: .5, ease: 'power2.in', stagger: { each: .012, from: 'random' }, scrollTrigger: { trigger: slot, start: 'top 75%' } });
    });
  });
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  $$('.reveal').forEach((el) => io.observe(el));
  setTimeout(() => $$('.reveal').forEach((el) => el.classList.add('in')), 9000);   // failsafe

  /* ---------- tab title: the opposite of every other app ---------- */
  const realTitle = document.title;
  const AWAY = ['you left. proud of you ♡', '(0) notifications', 'good. stay there.', 'go outside ☼', 'drink some water'];
  let backT;
  document.addEventListener('visibilitychange', () => {
    clearTimeout(backT);
    if (document.hidden) { stats.tabs++; document.title = AWAY[(Math.random() * AWAY.length) | 0]; }
    else { document.title = 'oh. you\'re back.'; backT = setTimeout(() => (document.title = realTitle), 2200); }
    document.dispatchEvent(new CustomEvent('L:tick'));
  });

  /* ---------- the esc key ---------- */
  const NOPE = ['nice try.', 'not yet. scroll.', 'the only way out is through.', 'esc works on day seven.', 'still here? good. keep going.', 'that key is decorative (for now).'];
  function escAttempt() {
    stats.esc++;
    store.set('esc', store.get('esc', 0) + 1);
    document.dispatchEvent(new CustomEvent('L:tick'));
    toast(NOPE[Math.min(stats.esc - 1, NOPE.length - 1)]);
  }
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if ($('#menu.open')) return;
    if ($('#logoff.on')) { hideLogoff(); return; }
    if (typeof L.onEsc === 'function' && L.onEsc() === true) return;   // a page can take over
    escAttempt();
  });

  /* ---------- log off: the page switches off like a tv, then white light and a little sky ---------- */
  const logoffEl = $('#logoff');
  let skyRaf = 0;
  function sky() {
    const c = $('#logoffSky'); if (!c) return;
    const g = c.getContext('2d');
    const dpr = Math.min(2, devicePixelRatio || 1);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const N = innerWidth < 600 ? 40 : 90;
    const t0 = performance.now() + 900;
    const stars = Array.from({ length: N }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: 2 + Math.random() * 6, p: Math.random() * 6, born: t0 + Math.random() * 2500 }));
    // the brightest nine get joined, like a constellation
    const links = stars.slice().sort((a, b) => b.r - a.r).slice(0, 9).sort((a, b) => a.x - b.x);
    const star = (x, y, r) => { g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill(); };
    const frame = (t) => {
      g.clearRect(0, 0, innerWidth, innerHeight);
      const k = Math.min(1, Math.max(0, (t - t0 - 1500) / 2500));
      // the line draws itself, star to star
      g.strokeStyle = 'rgba(255,31,143,.4)'; g.lineWidth = 1; g.beginPath();
      const upto = k * (links.length - 1);
      links.forEach((s, i) => {
        if (i === 0) { g.moveTo(s.x, s.y); return; }
        if (i - 1 > upto) return;
        const prev = links[i - 1], f = Math.min(1, upto - (i - 1));
        g.lineTo(prev.x + (s.x - prev.x) * f, prev.y + (s.y - prev.y) * f);
      });
      g.stroke();
      stars.forEach((s) => {
        const a = Math.min(1, Math.max(0, (t - s.born) / 900));
        g.fillStyle = `rgba(13,12,13,${a * (.45 + .4 * Math.sin(t / 700 + s.p))})`;
        star(s.x, s.y, s.r * a);
      });
      if (!reduced) skyRaf = requestAnimationFrame(frame);
    };
    skyRaf = requestAnimationFrame(frame);
  }
  function logoff() {
    if (!logoffEl) return;
    store.set('loggedoff', store.get('loggedoff', 0) + 1);
    pingsOn = false; if (pingsEl) pingsEl.innerHTML = '';
    if (motion) { root.style.setProperty('--crt-y', (scrollY + innerHeight / 2 - ($('main') ? $('main').offsetTop : 0)) + 'px'); document.body.classList.add('crt-off'); }
    if (lenis) lenis.stop();
    logoffEl.classList.add('on'); logoffEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    sky();
    if (motion) gsap.from('.logoff-inner > *', { y: 30, opacity: 0, filter: 'blur(10px)', stagger: .15, duration: 1.2, ease: 'expo.out', delay: 1.4 });
    setTimeout(() => $('#logoffBack') && $('#logoffBack').focus(), 1800);
  }
  function hideLogoff() {
    logoffEl.classList.remove('on'); logoffEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('crt-off');
    document.body.style.overflow = ''; cancelAnimationFrame(skyRaf); pingsOn = true;
    if (lenis) lenis.start();
    toast('welcome back. no judgement. (some judgement.)');
  }
  if (logoffEl) $('#logoffBack').addEventListener('click', hideLogoff);

  /* ---------- pixel transition: the page arrives and leaves in squares ---------- */
  function pixelLayer() {
    const layer = document.createElement('div'); layer.className = 'pixels'; layer.setAttribute('aria-hidden', 'true');
    const cols = innerWidth < 600 ? 6 : 12, size = innerWidth / cols, rows = Math.ceil(innerHeight / size);
    layer.style.setProperty('--cols', cols);
    layer.style.gridTemplateRows = `repeat(${rows}, ${size}px)`;
    for (let i = 0; i < cols * rows; i++) { const c = document.createElement('i'); if (Math.random() < .14) c.className = 'p'; layer.appendChild(c); }
    document.body.appendChild(layer);
    return layer;
  }
  function pixelsOut() {     // squares lift off and reveal the page
    if (!motion) return;
    const layer = pixelLayer();
    gsap.to($$('i', layer), { scale: 0, duration: .45, ease: 'power2.in', stagger: { each: .006, from: 'random' }, onComplete: () => layer.remove() });
  }
  function pixelsIn(done) {  // squares pop in and cover the page
    if (!motion) { done(); return; }
    const layer = pixelLayer();
    gsap.from($$('i', layer), { scale: 0, duration: .4, ease: 'back.out(2)', stagger: { each: .005, from: 'random' }, onComplete: done });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname || !/\.html$|\/$/.test(url.pathname)) return;
    e.preventDefault();
    pixelsIn(() => { location.href = a.href; });
  });
  addEventListener('pageshow', (e) => { if (e.persisted) $$('.pixels').forEach((p) => p.remove()); });

  /* ---------- loader: disconnecting… ---------- */
  const loader = $('#loader');
  const finish = () => {
    if (isReady) return; isReady = true;
    if (loader) loader.classList.add('done');
    pixelsOut();
    readyFns.forEach((f) => f());
    if (window.ScrollTrigger) { ScrollTrigger.sort(); ScrollTrigger.refresh(); }
  };
  if (loader && !reduced) {
    const grid = $('#loaderGrid'), count = $('#loaderCount'), msg = $('#loaderMsg');
    const cells = Array.from({ length: 64 }, () => grid.appendChild(document.createElement('i')));
    const order = cells.map((_, i) => i).sort(() => Math.random() - .5);
    const MSGS = ['closing 47 tabs', 'muting the group chat', 'unfollowing everyone (kidding)', 'hiding the charger', 'putting it face down', 'disconnecting'];
    const total = session.get('seen') ? 700 : 2100;
    session.set('seen', '1');
    const t0 = performance.now();
    (function step(t) {
      const p = Math.min(1, (t - t0) / total);
      const n = Math.floor(p * 64);
      for (let i = 0; i < n; i++) { const c = cells[order[i]]; if (!c.classList.contains('on')) { c.classList.add('on'); if (Math.random() < .12) c.classList.add('pink'); } }
      count.textContent = Math.round(p * 100);
      msg.textContent = MSGS[Math.min(MSGS.length - 1, Math.floor(p * MSGS.length))];
      if (p < 1) requestAnimationFrame(step); else setTimeout(finish, 250);
    })(t0);
    setTimeout(finish, total + 2500);   // failsafe if frames are throttled
  } else { if (loader) loader.remove(); requestAnimationFrame(finish); }

  /* ---------- konami: relapse ---------- */
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let kIdx = 0;
  function relapse() {
    store.set('relapses', store.get('relapses', 0) + 1);
    for (let i = 0; i < 8; i++) setTimeout(() => { if (pingsEl) { pingsEl.querySelectorAll('.ping').forEach((p, j) => j > 1 && p.remove()); } ping(); }, i * 180);
    if (motion) gsap.fromTo('main', { x: -8 }, { x: 0, duration: .5, ease: 'elastic.out(1, .2)' });
    toast('relapse detected. it happens. be kind to yourself.', 3600);
  }
  addEventListener('keydown', (e) => {
    kIdx = e.key === KONAMI[kIdx] ? kIdx + 1 : (e.key === KONAMI[0] ? 1 : 0);
    if (kIdx === KONAMI.length) { kIdx = 0; relapse(); }
  });

  /* ---------- for whoever opens the console ---------- */
  console.log(`%c
   *    /\\_/\\      +
       ( o.o )   <3  ghostly.grl
   +    > ^ <          *
`, 'color:#ff1f8f;font-family:monospace;font-size:13px');
  console.log('%cLOG.OFF%c  you opened the console. on a detox website. we\'re not mad, just disappointed.\ntype %clogoff.help()%c',
    'background:#ff1f8f;color:#fff;font-weight:bold;padding:2px 6px', 'color:inherit',
    'color:#ff1f8f;font-weight:bold', 'color:inherit');
  window.logoff = {
    help() { console.log('logoff.screentime()  ·  logoff.whoami()  ·  logoff.relapse()  ·  logoff.now()  ·  logoff.forget()'); return '♡'; },
    screentime() { return `today on this site: ${fmt(dayTime)}. that's ${Math.round(dayTime / 60)} minutes you could've spent lying on the floor.`; },
    whoami() { return 'someone who reads source code instead of sleeping. hi. go to bed.'; },
    relapse() { relapse(); return 'ok. just this once.'; },
    now() { logoff(); return 'bye ♡'; },
    forget() {
      try { Object.keys(localStorage).filter((k) => k.startsWith('lo-')).forEach((k) => localStorage.removeItem(k)); sessionStorage.clear(); } catch (e) { /* nothing */ }
      document.dispatchEvent(new CustomEvent('L:forget'));
      return 'forgotten. like a story after 24 hours.';
    },
  };

  window.L = { $, $$, reduced, motion, fine, store, fillSlot, pixel, chars, lines, toast, stats, fmt, ready, escAttempt, logoff, ping, get lenis() { return lenis; }, get noise() { return noise; }, onEsc: null };
})();
