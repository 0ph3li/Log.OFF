/* =========================================================
   LOG.OFF — checkin.js
   five steps, one ticket. everything stays in this browser.
   ========================================================= */
(() => {
  const { $, $$, motion, fine, store, chars, toast } = window.L;
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------- hero ---------- */
  const titleChars = chars($('.c-title [data-chars]'));
  L.ready(() => {
    if (!motion) return;
    gsap.from(titleChars, { yPercent: 120, rotate: () => rnd(-25, 25), duration: 1.2, stagger: .05, ease: 'expo.out' });
    gsap.from('.c-hero .star', { scale: 0, rotate: -180, duration: 1, ease: 'back.out(3)', stagger: .2, delay: .4 });
  });

  /* ---------- state + the ticket ---------- */
  const S = { name: '', mood: '', week: '', room: '', vow: false, signed: false, phone: false };
  const T = { name: $('#tName'), mood: $('#tMood'), week: $('#tWeek'), room: $('#tRoom') };
  const setT = (k, v) => {
    if (T[k].textContent === v) return;
    T[k].textContent = v || '—';
    T[k].classList.add('flash'); setTimeout(() => T[k].classList.remove('flash'), 600);
    if (motion) gsap.fromTo(T[k], { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: .4, ease: 'power3.out' });
  };
  const setCheck = (id, on, label) => { const el = $(id); el.classList.toggle('ok', on); el.textContent = (on ? '● ' : '○ ') + label; };
  function barcode(seed) {
    let x = 2, out = '', h = 0;
    for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    for (let i = 0; x < 256; i++) {
      h = (h * 1103515245 + 12345) >>> 0;
      const w = 1 + (h % 3), gap = 1 + ((h >> 3) % 3);
      out += `<rect x="${x}" y="0" width="${w}" height="${i % 9 === 0 ? 44 : 38}" fill="#0d0c0d"/>`;
      x += w + gap;
    }
    $('#tBarcode').innerHTML = out;
  }
  barcode('LOG.OFF');

  /* ---------- steps ---------- */
  const steps = $$('.step'), next = $('#next'), back = $('#back'), progress = $('#progress'), stepOf = $('#stepOf');
  let cur = 1;
  function show(n, dir = 1, silent = false) {
    const from = steps[cur - 1], to = steps[n - 1];
    cur = n;
    progress.style.width = (n / 5 * 100) + '%';
    stepOf.textContent = `step ${n} / 5`;
    back.disabled = n === 1;
    next.innerHTML = n === 5 ? 'check in ✓' : 'next <span class="arrow">→</span>';
    if (motion && from !== to) {
      gsap.to(from, { x: -40 * dir, opacity: 0, duration: .25, ease: 'power2.in', onComplete: () => {
        from.classList.remove('on'); gsap.set(from, { clearProps: 'all' });
        to.classList.add('on');
        gsap.fromTo(to, { x: 40 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: .5, ease: 'expo.out', clearProps: 'transform' });
        gsap.from($$('.step-title, .field, .chips, .weeks > *, .rooms-pick > *, .vows li, .sign, .handover', to), { y: 20, opacity: 0, stagger: .03, duration: .5, ease: 'power3.out' });
      } });
    } else { steps.forEach((s) => s.classList.toggle('on', s === to)); }
    const focusable = $('input, button.chip, button.week, button.room-btn:not(:disabled), .phone-token', to);
    if (focusable && !silent) setTimeout(() => focusable.focus({ preventScroll: true }), motion ? 320 : 0);
  }
  const nope = (msg) => {
    toast(msg);
    if (motion) gsap.fromTo(steps[cur - 1], { x: -10 }, { x: 0, duration: .5, ease: 'elastic.out(1, .2)' });
  };
  function valid(n) {
    if (n === 1) {
      const name = $('#fName').value.trim();
      if (!name) return nope('we need a name. your real one.'), false;
      if (/[@_#0-9]|\.(com|it|net)|xx|official|real/i.test(name)) return nope('that\'s a username. try the name your mum uses.'), false;
      if (!S.mood) return nope('how are you? honestly. pick one.'), false;
    }
    if (n === 2 && !S.week) return nope('pick a week. any week. it\'ll be the right one.'), false;
    if (n === 3 && !S.room) return nope('pick a room. they\'re all quiet.'), false;
    if (n === 4) {
      if (!S.vow) return nope('all five promises. even the sunset one.'), false;
      if (!S.signed) return nope('sign it. a scribble counts.'), false;
    }
    if (n === 5 && !S.phone) return nope('the phone goes in the bag. drag it.'), false;
    return true;
  }
  next.addEventListener('click', () => { if (!valid(cur)) return; if (cur < 5) show(cur + 1, 1); else finish(); });
  back.addEventListener('click', () => { if (cur > 1) show(cur - 1, -1); });
  show(1, 1, true);

  // 1 · name + mood
  const fName = $('#fName');
  fName.value = store.get('name', '');
  const syncName = () => { S.name = fName.value.trim().toLowerCase(); setT('name', S.name); barcode(S.name || 'LOG.OFF'); };
  fName.addEventListener('input', syncName); if (fName.value) syncName();
  fName.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); next.click(); } });
  const radios = (group, key, tkey) => $$('[role="radio"]', group).forEach((b) => b.addEventListener('click', () => {
    if (b.disabled) return;
    $$('[role="radio"]', group).forEach((x) => x.setAttribute('aria-checked', x === b));
    S[key] = b.dataset.v; setT(tkey, b.dataset.label || b.dataset.v);
    if (motion) gsap.fromTo(b, { scale: .9 }, { scale: 1, duration: .5, ease: 'back.out(3)' });
  }));
  radios($('#moods'), 'mood', 'mood');

  // 2 · weeks: the next eight mondays
  const weeksEl = $('#weeks');
  const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
  for (let i = 0; i < 8; i++) {
    const wk = new Date(d); wk.setDate(d.getDate() + i * 7);
    const label = wk.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const left = i === 2 ? 0 : ((i * 7 + 3) % 6) + 1;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'week'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
    b.dataset.v = label; b.disabled = left === 0;
    b.innerHTML = `<b>${label}</b><span>${left ? left + ' rooms left' : 'full. sorry.'}</span>`;
    weeksEl.appendChild(b);
  }
  radios(weeksEl, 'week', 'week');

  // 3 · rooms
  const TAKEN = { 1: 'giulia', 2: 'ama', 4: 'nico', 7: 'lea', 9: 'sami', 11: 'iris' };
  const roomsEl = $('#roomsPick');
  for (let r = 1; r <= 12; r++) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'room-btn'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
    b.dataset.v = String(r).padStart(2, '0'); b.dataset.label = 'room ' + b.dataset.v;
    b.disabled = !!TAKEN[r];
    b.setAttribute('aria-label', TAKEN[r] ? `room ${r}, taken by ${TAKEN[r]}` : `room ${r}, free`);
    b.innerHTML = `<b>${b.dataset.v}</b><span>${TAKEN[r] || ''}</span>`;
    roomsEl.appendChild(b);
  }
  radios(roomsEl, 'room', 'room');

  // 4 · vows + signature
  const vowBoxes = $$('#vows input');
  vowBoxes.forEach((c) => c.addEventListener('change', () => {
    S.vow = vowBoxes.every((x) => x.checked); setCheck('#tVow', S.vow, 'vow');
    if (c.checked && motion) gsap.fromTo(c.closest('li'), { x: 6 }, { x: 0, duration: .4, ease: 'elastic.out(1, .3)' });
  }));
  const pad = $('#signPad'), g = pad.getContext('2d');
  let drawing = false, lx = 0, ly = 0, inked = 0;
  function sizePad() {
    const r = pad.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    if (!r.width) return;
    pad.width = r.width * dpr; pad.height = r.height * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#0d0c0d'; g.lineWidth = 2.6;
  }
  new ResizeObserver(sizePad).observe(pad);
  const pt = (e) => { const r = pad.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  pad.addEventListener('pointerdown', (e) => { drawing = true; [lx, ly] = pt(e); pad.setPointerCapture(e.pointerId); });
  pad.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const [x, y] = pt(e);
    g.beginPath(); g.moveTo(lx, ly); g.quadraticCurveTo(lx, ly, (lx + x) / 2, (ly + y) / 2); g.lineTo(x, y); g.stroke();
    inked += Math.hypot(x - lx, y - ly); lx = x; ly = y;
    if (!S.signed && inked > 40) { S.signed = true; setCheck('#tSign', true, 'signed'); }
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => pad.addEventListener(ev, () => (drawing = false)));
  $('#signClear').addEventListener('click', () => { g.clearRect(0, 0, pad.width, pad.height); inked = 0; S.signed = false; setCheck('#tSign', false, 'signed'); });

  // 5 · hand over the phone
  const token = $('#phoneToken'), bag = $('#dropBag');
  $('#ptTime').textContent = new Date().toTimeString().slice(0, 5);
  function drop() {
    if (S.phone) return;
    S.phone = true; setCheck('#tPhone', true, 'phone in the bag');
    const t = token.getBoundingClientRect(), b = bag.getBoundingClientRect();
    const seal = () => { token.style.visibility = 'hidden'; bag.classList.add('sealed'); bag.classList.remove('over'); toast('sealed. see you in seven days, little guy.'); next.focus({ preventScroll: true }); };
    if (motion) {
      gsap.timeline({ onComplete: seal })
        .to(token, { x: `+=${b.left + b.width / 2 - (t.left + t.width / 2)}`, y: `+=${b.top + b.height / 2 - (t.top + t.height / 2)}`, rotate: 12, scale: .55, duration: .45, ease: 'power3.in' })
        .to(token, { y: '+=40', opacity: 0, duration: .25 })
        .fromTo('.db-zip', { scaleX: 0 }, { scaleX: 1, duration: .5, ease: 'power2.inOut' })
        .fromTo(bag, { rotate: -4 }, { rotate: 0, duration: .6, ease: 'elastic.out(1, .3)' }, '-=.2');
    } else { token.style.visibility = 'hidden'; seal(); }
  }
  if (motion && window.Draggable) {
    Draggable.create(token, {
      type: 'x,y',
      onDrag() { bag.classList.toggle('over', this.hitTest(bag, '30%')); },
      onRelease() {
        if (this.hitTest(bag, '30%')) { this.disable(); drop(); }
        else gsap.to(token, { x: 0, y: 0, rotate: 0, duration: .7, ease: 'elastic.out(1, .5)' });
      },
    });
  } else token.addEventListener('click', drop);
  token.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); drop(); } });

  /* ---------- done: the ticket prints, the stub tears ---------- */
  const form = $('#steps'), booked = $('#booked'), ticket = $('#ticket'), stub = $('#tStub');
  function confetti() {
    if (!motion) return;
    const r = ticket.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const COLS = ['#ff1f8f', '#ff3352', '#2f62ff', '#0d0c0d', '#ffd3e6'];
    for (let i = 0; i < 46; i++) {
      const c = document.createElement('i'); c.className = 'confetti';
      c.style.left = cx + 'px'; c.style.top = cy + 'px'; c.style.background = COLS[i % COLS.length];
      document.body.appendChild(c);
      const a = rnd(0, Math.PI * 2), v = rnd(120, 360);
      gsap.timeline({ onComplete: () => c.remove() })
        .to(c, { x: Math.cos(a) * v, y: Math.sin(a) * v - 80, rotate: rnd(-360, 360), duration: .7, ease: 'power3.out' })
        .to(c, { y: `+=${rnd(200, 400)}`, opacity: 0, duration: 1, ease: 'power2.in' });
    }
  }
  function enableTear() {
    if (!motion || !window.Draggable || store.get('stub-torn', false)) { if (store.get('stub-torn', false)) stub.style.visibility = 'hidden'; return; }
    Draggable.create(stub, {
      type: 'x', bounds: { minX: -10, maxX: 200 },
      onDrag() { gsap.set(stub, { rotate: this.x / 6 }); },
      onRelease() {
        if (this.x > 60) {
          this.disable(); store.set('stub-torn', true);
          gsap.to(stub, { x: '+=160', y: 380, rotate: 70, opacity: 0, duration: 1.1, ease: 'power2.in' });
          toast('keep it. it\'s the only screenshot you\'ll take this week.');
        } else gsap.to(stub, { x: 0, rotate: 0, duration: .6, ease: 'elastic.out(1, .4)' });
      },
    });
  }
  function showBooked(animate) {
    form.hidden = true; booked.hidden = false;
    progress.style.width = '100%'; stepOf.textContent = 'checked in';
    ticket.classList.add('done');
    if (animate && motion) {
      gsap.from(booked.children, { y: 30, opacity: 0, stagger: .1, duration: .8, ease: 'expo.out' });
      gsap.fromTo('#tStamp', { scale: 2.4, opacity: 0 }, { scale: 1, opacity: .9, duration: .5, ease: 'back.out(2)', delay: .2 });
      gsap.fromTo(ticket, { rotate: -2 }, { rotate: 3, duration: .12, yoyo: true, repeat: 3, onComplete: () => gsap.to(ticket, { rotate: -2, duration: .4 }) });
      confetti();
    }
    enableTear();
  }
  function finish() {
    if (!valid(5)) return;
    store.set('name', S.name);
    store.set('booking', { name: S.name, mood: S.mood, week: S.week, room: S.room, at: Date.now() });
    showBooked(true);
    L.lenis ? L.lenis.scrollTo('#form', { offset: -80 }) : $('#form').scrollIntoView();
  }
  $('#restart').addEventListener('click', () => {
    ['booking', 'stub-torn'].forEach((k) => { try { localStorage.removeItem('lo-' + k); } catch (e) { /* nothing */ } });
    location.reload();
  });

  // already checked in on this device? show the ticket straight away
  const saved = store.get('booking', null);
  if (saved) {
    Object.assign(S, saved, { vow: true, signed: true, phone: true });
    setT('name', saved.name); setT('mood', saved.mood); setT('week', saved.week); setT('room', 'room ' + saved.room);
    setCheck('#tVow', true, 'vow'); setCheck('#tSign', true, 'signed'); setCheck('#tPhone', true, 'phone in the bag');
    barcode(saved.name);
    showBooked(false);
  }

  if (motion) gsap.from(ticket, { y: 80, rotate: 8, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '#form', start: 'top 75%' } });

  /* ---------- footer: the big word arrives letter by letter, and jumps when you touch it ---------- */
  const ftChars = chars($('#ftWord'));
  if (motion) {
    gsap.from(ftChars, { yPercent: 100, opacity: 0, rotate: 10, stagger: .05, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '#ftWord', start: 'top 95%' } });
    if (fine) ftChars.forEach((c) => c.addEventListener('pointerenter', () => {
      if (gsap.isTweening(c)) return;
      gsap.timeline().to(c, { yPercent: -18, scaleY: 1.15, duration: .18, ease: 'power2.out' }).to(c, { yPercent: 0, scaleY: 1, duration: .7, ease: 'bounce.out' });
    }));
  }
})();
