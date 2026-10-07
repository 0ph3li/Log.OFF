/* =========================================================
   LOG.OFF — letgo.js (let it go)
   ========================================================= */
(() => {
  const { $, $$, motion, fine, store, chars, toast } = window.L;
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------- hero: the warped title ---------- */
  const titleSpans = $$('.lg-title > span');
  const WARP = { scaleY: [1.35, 1, 1.35], rotateY: [28, 0, -28] };
  gsap.set(titleSpans, { transformPerspective: 500, scaleY: (i) => WARP.scaleY[i], rotateY: (i) => WARP.rotateY[i] });
  L.ready(() => {
    if (!motion) return;
    gsap.from(titleSpans, { scaleY: .1, opacity: 0, rotateY: (i) => [70, 0, -70][i], duration: 1.4, stagger: .12, ease: 'expo.out' });
    // the further you scroll, the more it stretches, like it's being pulled away
    gsap.to(titleSpans, { scaleY: (i) => WARP.scaleY[i] * 1.5, rotateY: (i) => WARP.rotateY[i] * 1.4, y: -40, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.from('.lg-hero-figure', { y: 120, rotate: 10, opacity: 0, duration: 1.4, ease: 'expo.out', delay: .3 });
    gsap.to('.lg-hero-figure', { y: -60, rotate: -3, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
  });

  /* ---------- the ritual ---------- */
  const steps = $$('#steps li');
  const setStep = (n) => steps.forEach((s, i) => { s.classList.toggle('on', i === n); s.classList.toggle('done', i < n); });
  const paper = $('#paper'), text = $('#paperText'), countEl = $('#paperCount');
  const toCrumple = $('#toCrumple'), crumpleBtn = $('#crumpleBtn'), ring = $('#crumpleRing'), crumpleLabel = $('#crumpleLabel');
  const ball = $('#ball'), ballHint = $('#ballHint'), goneMsg = $('#goneMsg'), desk = $('#desk'), sea = $('#sea'), splash = $('#splash');
  const map = $('#crumpleMap');
  $('#paperDate').textContent = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
  text.addEventListener('input', () => (countEl.textContent = text.value.length));
  let note = '';

  // step 1 → 2
  toCrumple.addEventListener('click', () => {
    note = text.value.trim().replace(/\s+/g, ' ');
    if (!note) { text.focus(); toast('write something first. anything.'); return; }
    text.readOnly = true;
    toCrumple.hidden = true; crumpleBtn.hidden = false;
    setStep(1);
    if (motion) gsap.from(crumpleBtn, { scale: .6, opacity: 0, duration: .6, ease: 'back.out(2)' });
    crumpleBtn.focus();
  });

  // step 2: hold to crumple
  let holding = false, p = 0, crumpled = false, last = 0;
  function applyCrumple() {
    paper.classList.toggle('crumpling', p > 0);
    paper.style.setProperty('--w', p.toFixed(3));
    map.setAttribute('scale', (p * 70).toFixed(1));
    const j = holding ? rnd(-1, 1) * p * 4 : 0;
    gsap.set(paper, { scale: 1 - p * .55, rotate: -1.5 + p * 22 + j, borderRadius: `${p * 48}%`, x: j * 2 });
    ring.style.strokeDashoffset = 182.2 * (1 - p);
  }
  function crumpleLoop(now) {
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (crumpled) return;
    p = holding ? Math.min(1, p + dt / 2.2) : Math.max(0, p - dt / .6);
    applyCrumple();
    if (p >= 1) { finishCrumple(); return; }
    if (holding || p > 0) requestAnimationFrame(crumpleLoop);
  }
  const startHold = (e) => {
    if (e) e.preventDefault();
    if (crumpled || holding) return;
    holding = true; crumpleLabel.textContent = 'keep holding…';
    last = performance.now(); requestAnimationFrame(crumpleLoop);
  };
  const stopHold = () => { if (!holding) return; holding = false; if (!crumpled) crumpleLabel.textContent = p > .5 ? 'almost. again.' : 'hold to crumple'; };
  crumpleBtn.addEventListener('pointerdown', startHold);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => crumpleBtn.addEventListener(ev, stopHold));
  crumpleBtn.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) startHold(e); });
  crumpleBtn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') stopHold(); });
  crumpleBtn.addEventListener('contextmenu', (e) => e.preventDefault());

  function finishCrumple() {
    crumpled = true; holding = false;
    crumpleBtn.hidden = true;
    const dr = desk.getBoundingClientRect(), pr = paper.getBoundingClientRect();
    const bx = pr.left + pr.width / 2 - dr.left - 65, by = pr.top + pr.height / 2 - dr.top - 65;
    gsap.set(ball, { left: 0, top: 0, marginTop: 0, x: bx, y: by, rotate: 0, scale: 1, opacity: 1 });
    const showBall = () => {
      paper.hidden = true; ball.hidden = false; ballHint.hidden = false;
      setStep(2); sea.classList.add('target'); ball.focus({ preventScroll: true });
    };
    if (motion) {
      gsap.timeline({ onComplete: showBall })
        .to(paper, { scale: .18, rotate: 200, borderRadius: '50%', duration: .45, ease: 'power3.in' })
        .set(paper, { opacity: 0 })
        .add(() => { ball.hidden = false; })
        .from(ball, { scale: .2, rotate: -200, duration: .7, ease: 'elastic.out(1, .45)' });
    } else showBall();
  }

  // step 3: drag and throw
  let drag = null, trail = [];
  const pos = () => ({ x: gsap.getProperty(ball, 'x'), y: gsap.getProperty(ball, 'y') });
  ball.addEventListener('pointerdown', (e) => {
    if (ball.dataset.flying) return;
    e.preventDefault(); ball.setPointerCapture(e.pointerId);
    const p0 = pos(); drag = { sx: e.clientX, sy: e.clientY, x: p0.x, y: p0.y };
    trail = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
    ball.style.cursor = 'grabbing';
    if (motion) gsap.to(ball, { scale: 1.1, duration: .2 });
  });
  ball.addEventListener('pointermove', (e) => {
    if (!drag) return;
    gsap.set(ball, { x: drag.x + e.clientX - drag.sx, y: drag.y + e.clientY - drag.sy, rotate: (e.clientX - drag.sx) * .4 });
    trail.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (trail.length > 6) trail.shift();
    const s = sea.getBoundingClientRect();
    sea.classList.toggle('hover', e.clientX > s.left && e.clientX < s.right && e.clientY > s.top && e.clientY < s.bottom);
  });
  const release = (e) => {
    if (!drag) return;
    drag = null; ball.style.cursor = '';
    const a = trail[0], b = trail[trail.length - 1];
    const dt = Math.max(16, b.t - a.t), vx = (b.x - a.x) / dt, vy = (b.y - a.y) / dt;
    const speed = Math.hypot(vx, vy);
    const s = sea.getBoundingClientRect(), br = ball.getBoundingClientRect();
    const over = e.clientX > s.left && e.clientX < s.right && e.clientY > s.top && e.clientY < s.bottom;
    const toSea = { x: s.left + s.width / 2 - (br.left + br.width / 2), y: s.top + s.height * .6 - (br.top + br.height / 2) };
    const aimed = (vx * toSea.x + vy * toSea.y) > 0;
    if (over || (speed > .5 && aimed)) throwIt();
    else if (speed > .5) { toast('wrong way. the sea\'s over there →'); comeBack(); }
    else { if (motion) gsap.to(ball, { scale: 1, duration: .3 }); }
  };
  ball.addEventListener('pointerup', release);
  ball.addEventListener('pointercancel', release);
  ball.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); throwIt(); } });

  function comeBack() {
    if (motion) gsap.to(ball, { x: 40, y: desk.offsetHeight / 2 - 65, rotate: 0, scale: 1, duration: .9, ease: 'elastic.out(1, .5)' });
  }
  function throwIt() {
    if (ball.dataset.flying) return;
    ball.dataset.flying = '1';
    const dr = desk.getBoundingClientRect(), s = sea.getBoundingClientRect();
    // landing spot: somewhere in the water, relative to the desk (where the ball lives)
    const lx = s.left + s.width * rnd(.35, .65) - dr.left - 65, ly = s.top + s.height * rnd(.5, .7) - dr.top - 65;
    const p0 = pos();
    const peak = Math.min(p0.y, ly) - rnd(120, 200);
    const land = () => {
      ball.hidden = true; ballHint.hidden = true; sea.classList.remove('target', 'hover');
      splashAt(lx + 65 + dr.left - s.left, ly + 65 + dr.top - s.top);
      saveNote(); goneMsg.hidden = false;
      steps.forEach((st) => { st.classList.remove('on'); st.classList.add('done'); });
      if (motion) gsap.from(goneMsg, { y: 30, opacity: 0, duration: .8, ease: 'expo.out', delay: .3 });
      toast('gone. you don\'t have to carry it anymore.');
    };
    if (motion) {
      const o = { t: 0 };
      gsap.to(o, {
        t: 1, duration: 1.1, ease: 'power1.in',
        onUpdate() {
          const t = o.t, u = 1 - t;
          gsap.set(ball, { x: u * u * p0.x + 2 * u * t * ((p0.x + lx) / 2) + t * t * lx, y: u * u * p0.y + 2 * u * t * peak + t * t * ly, rotate: t * 720, scale: 1 - t * .7 });
        },
        onComplete: land,
      });
    } else land();
  }
  function splashAt(x, y) {
    if (!motion) return;
    for (let i = 0; i < 3; i++) {
      const r = document.createElement('i'); r.style.left = x + 'px'; r.style.top = y + 'px'; splash.appendChild(r);
      gsap.fromTo(r, { scale: .2, opacity: 1 }, { scale: 6 + i * 3, opacity: 0, duration: 1.4, delay: i * .18, ease: 'power2.out', onComplete: () => r.remove() });
    }
    for (let i = 0; i < 12; i++) {
      const d = document.createElement('b'); d.style.left = x + 'px'; d.style.top = y + 'px'; splash.appendChild(d);
      const a = rnd(-Math.PI * .9, -Math.PI * .1), v = rnd(40, 110);
      gsap.timeline({ onComplete: () => d.remove() })
        .to(d, { x: Math.cos(a) * v, y: Math.sin(a) * v, duration: .35, ease: 'power2.out' })
        .to(d, { y: '+=' + rnd(60, 110), opacity: 0, duration: .45, ease: 'power2.in' });
    }
  }
  $('#again').addEventListener('click', () => {
    crumpled = false; p = 0; delete ball.dataset.flying;
    goneMsg.hidden = true; ball.hidden = true;
    paper.hidden = false; paper.classList.remove('crumpling'); map.setAttribute('scale', 0);
    gsap.set(paper, { clearProps: 'all' });
    text.readOnly = false; text.value = ''; countEl.textContent = 0;
    toCrumple.hidden = false; crumpleLabel.textContent = 'hold to crumple'; ring.style.strokeDashoffset = 182.2;
    setStep(0);
    if (motion) gsap.from(paper, { y: 60, rotate: 8, opacity: 0, duration: .8, ease: 'expo.out' });
    text.focus({ preventScroll: true });
  });

  /* ---------- the wall ---------- */
  const OTHERS = [
    '3am scrolling', 'being perfect', 'his spotify', 'read receipts', 'the group chat', 'comparing myself to her',
    'my screen time report', 'waiting for a reply', 'checking who viewed it', 'the algorithm\'s opinion of me',
    'the version of me from 2019', 'drafts i never sent', 'being "fine"', 'the 5am alarm', 'a guy called luca',
    'my follower count', 'saying yes to everything', 'the fear of missing out', 'refreshing', 'my ex\'s new girlfriend\'s instagram',
    'never being bored', 'a grudge from year 9',
  ];
  const wall = $('#wallList');
  function saveNote() {
    const mine = store.get('letgo', []);
    mine.push(note); store.set('letgo', mine.slice(-30));
    renderWall(true);
  }
  function renderWall(fresh) {
    const mine = store.get('letgo', []).slice().reverse();
    wall.innerHTML = '';
    const items = [...mine.map((t) => ({ t, mine: true })), ...OTHERS.map((t) => ({ t, mine: false }))];
    items.forEach((it, i) => {
      const li = document.createElement('li');
      li.textContent = it.t;
      if (it.mine) li.className = 'mine';
      const age = it.mine ? 0 : i / items.length;               // older notes fade into the sea
      li.style.setProperty('--r', ((i * 37) % 9 - 4) + 'deg');
      li.style.setProperty('--fs', (16 + ((i * 13) % 5) * 5) + 'px');
      li.style.setProperty('--b', (age * age * 3.2).toFixed(2) + 'px');
      li.style.setProperty('--o', (1 - age * .55).toFixed(2));
      wall.appendChild(li);
    });
    $('#wallCount').textContent = (2431 + items.length).toLocaleString('en');
    $('#wallMine').textContent = mine.length;
    if (fresh && motion && mine.length) gsap.from(wall.firstElementChild, { scale: 1.6, rotate: -20, opacity: 0, duration: .9, ease: 'back.out(2)' });
  }
  renderWall(false);
  if (motion) gsap.from('#wallList li', { y: 40, opacity: 0, rotate: () => rnd(-20, 20), stagger: { each: .03, from: 'random' }, duration: .8, ease: 'back.out(1.6)', scrollTrigger: { trigger: '#wallList', start: 'top 80%' } });

  /* ---------- the questions you're avoiding: a deck you swipe ---------- */
  const QUESTIONS = [
    'when was the last time you were bored on purpose?',
    'who would you call if you couldn\'t text?',
    'what are you scrolling away from?',
    'if nobody could see it, would you still do it?',
    'what did you want to be before you wanted to be seen?',
    'who are you when your phone is dead?',
    'what do you check first in the morning, and why?',
    'which app would you delete if nobody would notice?',
    'whose life are you watching instead of living yours?',
    'what would you do with four extra hours a day?',
    'when did you last finish a thought without interruption?',
    'what are you afraid you\'ll find in the silence?',
    'who do you miss that you still follow?',
    'what would you say if you didn\'t have to post it?',
  ];
  const FOOTS = ['take your time.', 'nobody\'s reading.', 'out loud is allowed.', 'there\'s no wrong answer. there\'s an honest one.'];
  const deckEl = $('#deck'), yesEl = $('#askYes'), noEl = $('#askNo');
  let queue = QUESTIONS.map((q, i) => ({ q, n: i + 1, skipped: 0 }));
  let yes = 0, no = 0, busy = false;
  function card(item) {
    const el = document.createElement('article');
    el.className = 'q-card';
    el.innerHTML = `<p class="q-n mono"><span>question <b>${String(item.n).padStart(2, '0')}</b> / ${QUESTIONS.length}</span></p><p class="q-text"></p><p class="q-foot"></p><span class="q-verdict v-yes">answered</span><span class="q-verdict v-no">skipped</span>`;
    $('.q-text', el).textContent = item.q;
    $('.q-foot', el).textContent = item.skipped ? 'it came back. they always do.' : FOOTS[item.n % FOOTS.length];
    if (item.skipped) { const st = document.createElement('span'); st.className = 'q-stamp'; st.textContent = `skipped ×${item.skipped}`; el.appendChild(st); }
    return el;
  }
  function renderDeck(animateIn) {
    deckEl.innerHTML = '';
    if (!queue.length) {
      deckEl.innerHTML = '<div class="deck-done"><p class="script">that\'s all.</p><p class="mono">you answered every one. that wasn\'t nothing.</p></div>';
      if (motion) gsap.from('.deck-done', { scale: .9, opacity: 0, duration: .8, ease: 'back.out(2)' });
      return;
    }
    queue.slice(0, 3).forEach((item, i) => {
      const el = card(item); if (i) el.classList.add('back-' + i);
      deckEl.appendChild(el);
    });
    const top = deckEl.firstElementChild;
    if (animateIn && motion) gsap.from(top, { scale: .95, y: 14, duration: .4, ease: 'power3.out' });
    bindDrag(top);
  }
  function decide(dir) {
    if (busy || !queue.length) return;
    busy = true;
    const top = deckEl.firstElementChild, item = queue.shift();
    if (dir > 0) { yes++; yesEl.textContent = yes; }
    else { no++; noEl.textContent = no; item.skipped++; queue.push(item); toast(item.skipped > 1 ? 'again? it\'ll be back.' : 'skipped. it\'ll come back.'); }
    store.set('questions', { yes, no });
    const done = () => { busy = false; renderDeck(true); };
    if (motion) {
      gsap.set($(dir > 0 ? '.v-yes' : '.v-no', top), { opacity: 1 });
      gsap.to(top, { x: dir * (innerWidth * .6), y: -40, rotate: dir * 28, opacity: 0, duration: .5, ease: 'power2.in', onComplete: done });
    } else done();
  }
  function bindDrag(el) {
    let sx = null, dx = 0;
    const yesV = $('.v-yes', el), noV = $('.v-no', el);
    el.addEventListener('pointerdown', (e) => { sx = e.clientX; dx = 0; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', (e) => {
      if (sx === null) return;
      dx = e.clientX - sx;
      gsap.set(el, { x: dx, rotate: dx / 18 });
      yesV.style.opacity = Math.max(0, Math.min(1, dx / 120));
      noV.style.opacity = Math.max(0, Math.min(1, -dx / 120));
    });
    const up = () => {
      if (sx === null) return; sx = null;
      if (Math.abs(dx) > 110) decide(dx > 0 ? 1 : -1);
      else { gsap.to(el, { x: 0, rotate: 0, duration: .6, ease: 'elastic.out(1, .5)' }); yesV.style.opacity = 0; noV.style.opacity = 0; }
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }
  $('#askDone').addEventListener('click', () => decide(1));
  $('#askSkip').addEventListener('click', () => decide(-1));
  let askVisible = false;
  new IntersectionObserver(([e]) => (askVisible = e.isIntersecting), { threshold: .4 }).observe($('#questions'));
  addEventListener('keydown', (e) => {
    if (!askVisible || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (e.key === 'ArrowRight') decide(1);
    if (e.key === 'ArrowLeft') decide(-1);
  });
  renderDeck(false);
  if (motion) gsap.from('.deck', { y: 80, rotate: -6, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '#questions', start: 'top 70%' } });

  /* ---------- breathe: 4 in, 7 hold, 8 out ---------- */
  const core = $('.lung-core'), word = $('#lungWord'), sec = $('#lungSec'), btn = $('#breatheBtn'), countB = $('#breathCount');
  let tl = null;
  const phase = (label, secs, props) => {
    const t = gsap.timeline();
    t.add(() => { word.textContent = label; });
    const o = { s: secs };
    t.to(core, { ...props, duration: secs, ease: 'sine.inOut' }, '<');
    t.to(o, { s: 0, duration: secs, ease: 'none', onUpdate: () => (sec.textContent = Math.ceil(o.s) + 's') }, '<');
    return t;
  };
  btn.addEventListener('click', () => {
    if (tl) { tl.kill(); tl = null; gsap.to(core, { scale: 1, duration: .8 }); word.textContent = 'ready'; sec.innerHTML = '&nbsp;'; btn.textContent = 'start breathing'; return; }
    let rounds = 0; countB.textContent = 0;
    btn.textContent = 'stop';
    tl = gsap.timeline({
      onComplete: () => { tl = null; word.textContent = 'lighter?'; sec.innerHTML = '&nbsp;'; btn.textContent = 'again'; toast('three rounds. nothing to post. well done.'); store.set('breaths', store.get('breaths', 0) + 3); },
    });
    for (let i = 0; i < 3; i++) {
      tl.add(phase('breathe in', 4, { scale: 1.85 }))
        .add(phase('hold', 7, { scale: 1.9 }))
        .add(phase('let it go', 8, { scale: 1 }))
        .add(() => { rounds++; countB.textContent = rounds; });
    }
  });

  /* ---------- the guide ---------- */
  if (motion) {
    $$('.guide-list li').forEach((li) => {
      gsap.from($('.g-n', li), { yPercent: 100, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: li, start: 'top 88%' } });
      gsap.from($('p', li), { x: 80, opacity: 0, duration: 1.1, ease: 'expo.out', delay: .08, scrollTrigger: { trigger: li, start: 'top 88%' } });
    });
  }

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
