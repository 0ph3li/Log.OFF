/* =========================================================
   LOG.OFF — privacy.js (what this device remembers)
   reads every "lo-" key in this browser and says what it is, in words.
   ========================================================= */
(() => {
  const { $, $$, motion, fine, chars, fmt, toast } = window.L;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const big = (v) => `<span class="big">${esc(v)}</span>`;
  const date = (iso) => new Date(iso + 'T12:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

  /* ---------- what each key means, in human ---------- */
  const KNOWN = {
    visits: ['times you came here', (v) => big(v), 'home'],
    esc: ['times you pressed esc too early', (v) => big(v), 'every page'],
    loggedoff: ['times you logged off', (v) => big(v), 'every page'],
    relapses: ['relapses (the konami code)', (v) => big(v), 'every page'],
    letgo: ['things you threw into the sea', (v) => `<ul>${v.slice().reverse().map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`, 'let it go'],
    name: ['your name (not your username)', (v) => `<span class="big">${esc(v)}</span>`, 'program · check in'],
    booking: ['your ticket', (v) => `${esc(v.name)} · week of ${esc(v.week)} · room ${esc(v.room)} · feeling ${esc(v.mood)}`, 'check in'],
    'stub-torn': ['you tore off the stub', () => 'yes. you kept it, we hope.', 'check in'],
    reaches: ['reaches for the sealed bag', (v) => big(v) + 'the average guest: 43', 'program · day 1'],
    'phantom-checks': ['pockets checked for nothing', (v) => big(v), 'program · day 2'],
    'bored-best': ['longest you stayed bored', (v) => big(fmt(Math.floor(v)).slice(3)), 'program · day 3'],
    ideas: ['ideas that arrived while you did nothing', (v) => big(v), 'program · day 3'],
    'not-filmed': ['sunsets you didn\'t film', () => big('1'), 'program · day 4'],
    letters: ['letters you posted', (v) => big(v.length) + v.map((l) => 'to ' + esc(l.to)).join(', '), 'program · day 6'],
    putdown: ['times you put the phone down', (v) => big(v), 'home'],
    'seen-her': ['you waited for her to load', () => 'yes. she noticed.', 'home'],
    breaths: ['breaths taken on purpose', (v) => big(v), 'let it go'],
    questions: ['questions you scrolled past, then didn\'t', (v) => `${big(v.yes + ' / ' + v.no)}answered / avoided`, 'let it go'],
    postcards: ['postcards to the help desk', (v) => big(v), 'faq'],
    'broke-glass': ['times you broke the glass', (v) => big(v), 'faq'],
  };
  function describe(key, raw) {
    let v; try { v = JSON.parse(raw); } catch (e) { v = raw; }
    if (key.startsWith('time-')) return ['screen time on this site, ' + date(key.slice(5)), big(fmt(+v || 0)), 'every page'];
    const k = KNOWN[key];
    if (k) { try { return [k[0], k[1](v), k[2]]; } catch (e) { /* shape changed: show it raw */ } }
    return ['something else it kept', esc(typeof v === 'object' ? JSON.stringify(v) : v), '—'];
  }

  /* ---------- read everything ---------- */
  const cardsEl = $('#cards'), empty = $('#empty');
  function read() {
    const out = [];
    try {
      Object.keys(localStorage).filter((k) => k.startsWith('lo-')).sort().forEach((k) => out.push({ store: 'local', key: k, raw: localStorage.getItem(k) }));
      Object.keys(sessionStorage).filter((k) => k.startsWith('lo-')).forEach((k) => out.push({ store: 'session', key: k, raw: sessionStorage.getItem(k) }));
    } catch (e) { /* storage blocked: then it remembers nothing, which is also fine */ }
    return out;
  }
  let lastSig = null;
  function render(animate) {
    const items = read();
    const sig = items.map((i) => i.key + '=' + i.raw).join('|');
    if (sig === lastSig) return; lastSig = sig;
    const local = items.filter((i) => i.store === 'local');
    $('#memCount').textContent = local.length;
    const bytes = local.reduce((n, i) => n + i.key.length + (i.raw || '').length, 0) * 2;
    $('#memSize').textContent = bytes > 1024 ? (bytes / 1024).toFixed(1) + ' KB' : bytes + ' B';
    const sessionNote = items.some((i) => i.store === 'session');
    cardsEl.innerHTML = local.map((i, n) => {
      const key = i.key.slice(3), [label, value, where] = describe(key, i.raw);
      return `<li class="card" data-key="${esc(i.key)}" style="--r:${(((n * 37) % 5) - 2) * .8}deg">
        <p class="card-key"><b>${esc(i.key)}</b><span>${esc(where)}</span></p>
        <p class="card-label">${esc(label)}</p>
        <div class="card-value">${value}</div>
        <button class="card-forget" data-cursor="forget">forget this</button>
      </li>`;
    }).join('') + (sessionNote ? `<li class="card session"><p class="card-key"><b>session · lo-visit, lo-seen</b></p>
        <p class="card-label">this visit</p><div class="card-value">that you're here right now, and that you've seen the loader once. it forgets itself when you close the tab.</div></li>` : '');
    empty.hidden = local.length > 0;
    $$('.card-forget', cardsEl).forEach((b) => b.addEventListener('click', () => forgetCard(b.closest('.card'))));
    if (animate && motion) gsap.from($$('.card', cardsEl), { y: 40, rotate: () => rnd(-8, 8), opacity: 0, stagger: .05, duration: .8, ease: 'back.out(1.5)' });
  }

  /* ---------- forgetting: the card collapses into bits ---------- */
  function bits(el) {
    if (!motion) return;
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 18; i++) {
      const b = document.createElement('i'); b.className = 'bit';
      b.style.left = rnd(r.left, r.right) + 'px'; b.style.top = rnd(r.top, r.bottom) + 'px';
      b.style.background = ['#0d0c0d', '#ff1f8f', '#2f62ff', '#d8c7e6'][i % 4];
      document.body.appendChild(b);
      gsap.to(b, { x: rnd(-80, 80), y: rnd(-120, 40), rotate: rnd(-180, 180), scale: 0, duration: rnd(.6, 1.1), ease: 'power2.out', onComplete: () => b.remove() });
    }
  }
  function forgetCard(card, silent) {
    return new Promise((done) => {
      const key = card.dataset.key;
      try { localStorage.removeItem(key); } catch (e) { /* nothing */ }
      if (key.startsWith('lo-time-')) document.dispatchEvent(new CustomEvent('L:forget'));
      const finish = () => { card.remove(); lastSig = null; render(false); done(); };
      if (motion) {
        bits(card);
        gsap.timeline({ onComplete: finish })
          .to(card, { scaleY: .02, filter: 'blur(4px)', duration: .25, ease: 'power3.in' })
          .to(card, { scaleX: 0, opacity: 0, duration: .2, ease: 'power3.in' });
      } else finish();
      if (!silent) toast('forgotten.');
    });
  }

  /* ---------- forget everything: hold for three seconds ---------- */
  const btn = $('#forgetAll'), ring = $('#forgetRing'), label = $('#forgetLabel');
  let holding = false, p = 0, last = 0, busy = false;
  function loop(now) {
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    p = holding ? Math.min(1, p + dt / 3) : Math.max(0, p - dt / .6);
    ring.style.strokeDashoffset = 182.2 * (1 - p);
    if (motion) gsap.set(btn, { x: holding ? rnd(-1, 1) * p * 4 : 0 });
    if (p >= 1) { forgetAll(); return; }
    if (holding || p > 0) requestAnimationFrame(loop);
  }
  const start = (e) => { if (e) e.preventDefault(); if (busy || holding) return; holding = true; label.textContent = 'keep holding…'; last = performance.now(); requestAnimationFrame(loop); };
  const stop = () => { if (!holding) return; holding = false; if (!busy) label.textContent = p > .5 ? 'almost. again.' : 'hold to forget everything'; };
  btn.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, stop));
  btn.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e); });
  btn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') stop(); });
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  async function forgetAll() {
    busy = true; holding = false;
    label.textContent = 'forgetting…';
    const cards = $$('.card:not(.session)', cardsEl);
    for (const c of cards) { forgetCard(c, true); await new Promise((r) => setTimeout(r, motion ? 90 : 0)); }
    try {
      Object.keys(localStorage).filter((k) => k.startsWith('lo-')).forEach((k) => localStorage.removeItem(k));
      Object.keys(sessionStorage).filter((k) => k.startsWith('lo-')).forEach((k) => sessionStorage.removeItem(k));
    } catch (e) { /* nothing */ }
    document.dispatchEvent(new CustomEvent('L:forget'));
    setTimeout(() => {
      lastSig = null; render(false);
      label.textContent = 'forgotten. like a story after 24 hours.';
      ring.style.strokeDashoffset = 182.2; p = 0; busy = false;
      toast('this device remembers nothing about you now.', 3200);
      L.lenis ? L.lenis.scrollTo('#memory', { offset: -60 }) : $('#memory').scrollIntoView();
    }, 500);
  }

  render(false);
  // things keep being remembered while you read (screen time ticks): refresh quietly
  setInterval(() => { if (!busy) render(false); }, 2500);
  if (motion) gsap.from('#cards', { y: 60, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '#cards', start: 'top 85%' } });
  if (motion) $$('.articles li').forEach((li) => {
    gsap.from($('.a-n', li), { yPercent: 100, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: li, start: 'top 88%' } });
    gsap.from($('div', li), { x: 60, opacity: 0, duration: 1, ease: 'expo.out', delay: .06, scrollTrigger: { trigger: li, start: 'top 88%' } });
  });

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
