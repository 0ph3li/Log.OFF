/* =========================================================
   LOG.OFF — home.js
   ========================================================= */
(() => {
  const { $, $$, motion, fine, store, pixel, chars, stats, fmt, toast } = window.L;
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------- 01 · hero: letters drop in, then fall apart as you leave ---------- */
  const heroChars = $$('.hero-title [data-chars]').flatMap((el) => chars(el));
  L.ready(() => {
    if (!motion) return;
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from(heroChars, { yPercent: 120, rotateX: -90, transformPerspective: 600, rotate: () => rnd(-12, 12), duration: 1.3, stagger: .045 })
      .from('#heroEsc', { y: -160, rotate: -25, opacity: 0, duration: 1.1, ease: 'bounce.out' }, '-=.9')
      .from('.hero-meta, .hero-note, .hero-scroll', { opacity: 0, y: 14, duration: .8, stagger: .08 }, '-=.8')
      .from('.hero-figure', { clipPath: 'inset(100% 0 0 0)', duration: 1.3, ease: 'expo.inOut' }, .2)
      .from('.hero .star', { scale: 0, rotate: -180, duration: 1, ease: 'back.out(3)', stagger: .2 }, '-=.6');

    // leaving the hero: the letters lose their grip
    gsap.to(heroChars, {
      y: () => rnd(-260, -60), x: () => rnd(-60, 60), rotate: () => rnd(-50, 50), opacity: .15, ease: 'none', stagger: .01,
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: .8 },
    });
    gsap.to('.hero-figure', { yPercent: 18, rotate: 4, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
  });

  // letters lean away from the pointer
  if (motion && fine) {
    const movers = heroChars.map((c) => ({ c, y: gsap.quickTo(c, 'y', { duration: .5, ease: 'power3' }), s: gsap.quickTo(c, 'scaleY', { duration: .5, ease: 'power3' }) }));
    $('#hero').addEventListener('pointermove', (e) => {
      if (scrollY > 40) return;
      movers.forEach((m) => {
        const r = m.c.getBoundingClientRect();
        const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        const f = Math.max(0, 1 - d / 260);
        m.y(-f * 26); m.s(1 + f * .18);
      });
    });
    $('#hero').addEventListener('pointerleave', () => movers.forEach((m) => { m.y(0); m.s(1); }));
  }

  /* ---------- 01 · hero: the portrait comes into focus when you slow down ----------
     it sharpens on its own in a couple of seconds; moving the mouse fast scrambles it a little,
     and it settles again as soon as you calm down. */
  const heroSlot = $('[data-pixel="hero"]');
  const heroPix = pixel(heroSlot);
  const meter = $('#holdMeter'), cap = $('#holdCap');
  const CAPS = ['slow down. let it load.', 'almost…', 'there she is.'];
  let still = 0, heroVisible = true, seen = false, lx = null, ly = null;
  addEventListener('pointermove', (e) => {
    if (lx !== null && heroVisible) {
      const speed = Math.hypot(e.clientX - lx, e.clientY - ly);
      if (speed > 18) still = Math.max(seen ? .45 : 0, still - speed / 900);   // only fast moves scramble her
    }
    lx = e.clientX; ly = e.clientY;
  }, { passive: true });
  new IntersectionObserver(([e]) => (heroVisible = e.isIntersecting)).observe($('#hero'));
  L.ready(() => {
    let last = performance.now();
    (function tick(now) {
      const dt = Math.min(.1, ((now || performance.now()) - last) / 1000); last = now || performance.now();
      if (heroVisible) {
        still = Math.min(1, still + dt / (seen ? .7 : 2));          // two seconds the first time, then quicker
        heroPix.set(6 + Math.pow(still, 2) * 170);
        meter.style.width = (still * 100).toFixed(1) + '%';
        cap.textContent = still >= 1 ? CAPS[2] : still > .6 ? CAPS[1] : CAPS[0];
        if (still === 1 && !seen) { seen = true; store.set('seen-her', true); }
      }
      requestAnimationFrame(tick);
    })();
  });
  heroPix.set(6);

  /* the decorative esc key: not yet */
  const heroEsc = $('#heroEsc');
  heroEsc.addEventListener('click', () => {
    heroEsc.classList.remove('nope'); void heroEsc.offsetWidth; heroEsc.classList.add('nope');
    if (motion) gsap.fromTo(heroChars, { y: 0 }, { y: () => rnd(-14, 14), rotate: () => rnd(-6, 6), duration: .08, repeat: 5, yoyo: true, ease: 'none', onComplete: () => gsap.to(heroChars, { y: 0, rotate: 0, duration: .4 }) });
    L.escAttempt();
  });

  /* ---------- 02 · receipt ---------- */
  const d = new Date();
  $('#rDate').textContent = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() + ' · ' + d.toTimeString().slice(0, 5);
  const visits = store.get('visits', 1);
  $('#statVisits').textContent = visits;
  $('#rCode').textContent = `0 ${String(51125 + visits).padStart(5, '0')} ${String(Date.now() % 100000).padStart(5, '0')} 5`;

  // barcode drawn from the words "you are the product"
  (function barcode() {
    const svg = $('#barcode'); const word = 'YOU ARE THE PRODUCT';
    let x = 4, out = '';
    for (let i = 0; x < 214; i++) {
      const c = word.charCodeAt(i % word.length) * (i + 7);
      const w = 1 + (c % 3), gap = 1 + ((c >> 2) % 3);
      const long = i < 3 || (i > 30 && i < 33) || x > 205;
      out += `<rect x="${x}" y="0" width="${w}" height="${long ? 56 : 48}" fill="#0d0c0d"/>`;
      x += w + gap;
    }
    svg.innerHTML = out;
  })();

  const R = { time: $('#rTime'), tabs: $('#rTabs'), scroll: $('#rScroll'), cursor: $('#rCursor'), pings: $('#rPings'), esc: $('#rEsc') };
  const bigSec = $('#statSec'), bigM = $('#statMeters');
  const PX_PER_M = 3780;   // ~96 dpi
  const set = (el, v) => {
    if (el.textContent === v) return;
    el.textContent = v;
    const li = el.parentElement; li.classList.remove('bump'); void li.offsetWidth; li.classList.add('bump');
    setTimeout(() => li.classList.remove('bump'), 500);
  };
  function updateReceipt() {
    set(R.time, fmt(stats.sec));
    set(R.tabs, String(stats.tabs));
    set(R.scroll, (stats.scrollPx / PX_PER_M).toFixed(1) + ' m');
    set(R.cursor, (stats.cursorPx / PX_PER_M).toFixed(1) + ' m');
    set(R.pings, String(stats.pings));
    set(R.esc, String(stats.esc));
    bigSec.textContent = stats.sec;
    bigM.textContent = (stats.scrollPx / PX_PER_M).toFixed(1);
  }
  document.addEventListener('L:tick', updateReceipt);
  updateReceipt();

  if (motion) {
    // it prints: line by line, with a little stutter, then the barcode
    gsap.timeline({ scrollTrigger: { trigger: '#receipt', start: 'top 60%' } })
      .fromTo('#receiptPaper', { clipPath: 'inset(0 0 100% 0)', y: -60 }, { clipPath: 'inset(0 0 -20px 0)', y: 0, duration: 2, ease: 'steps(16)' })
      .from('.r-lines li', { opacity: 0, x: -10, stagger: .12, duration: .3 }, .4)
      .from('#barcode rect', { scaleY: 0, stagger: .006, duration: .3, ease: 'power2.out' }, 1.3)
      .fromTo('#receiptPaper', { rotate: -4 }, { rotate: -7, duration: .15, yoyo: true, repeat: 1, ease: 'power1.inOut' }, 2);
    gsap.fromTo('.receipt-sec .h-big', { '--strike': 0 }, { '--strike': 1, duration: .8, ease: 'power3.inOut', scrollTrigger: { trigger: '.receipt-sec .h-big', start: 'top 70%' }, delay: .6 });
    gsap.to('.tape-photo', { yPercent: -12, rotate: 6, ease: 'none', scrollTrigger: { trigger: '#receipt', scrub: true } });
  }

  /* ---------- 03 · manifesto: words come into focus, get highlighted, then the unimportant ones blur out ---------- */
  const mf = $('#mfText');
  (function split(node) {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span'); s.className = 'w'; s.textContent = part;
          if (node.tagName === 'EM') s.classList.add('key');
          frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) { split(n); n.replaceWith(...n.childNodes); }
    });
  })(mf);
  if (motion) {
    const words = $$('.w', mf), keys = $$('.w.key', mf);
    gsap.timeline({ scrollTrigger: { trigger: '#manifesto', start: 'top 75%', end: 'bottom 40%', scrub: .6 } })
      .fromTo(words, { opacity: .1, filter: 'blur(10px)', y: 20 }, { opacity: 1, filter: 'blur(0px)', y: 0, stagger: .05, duration: .4, ease: 'none' })
      .to(keys, { '--hl': 1, duration: .6, stagger: .1, ease: 'none' }, '+=.1')
      .to(words.filter((w) => !w.classList.contains('key')), { opacity: .28, filter: 'blur(2.5px)', duration: 1.2, ease: 'none' }, '+=.2');
  }

  /* ---------- 04 · unsure?: the portrait gets clearer, the word puts itself together ---------- */
  const unsurePix = pixel($('[data-pixel="unsure"]'));
  unsurePix.set(6);
  if (motion) {
    const o = { c: 6 };
    gsap.to(o, {
      c: 170, ease: 'power2.in', onUpdate: () => unsurePix.set(o.c),
      scrollTrigger: { trigger: '#unsure', start: 'top 70%', end: 'bottom 60%', scrub: true },
    });
    gsap.from(chars($('.unsure-word')), {
      x: () => rnd(-200, 200), y: () => rnd(-160, 160), rotate: () => rnd(-90, 90), opacity: 0, ease: 'power2.out', stagger: .03,
      scrollTrigger: { trigger: '#unsure', start: 'top 80%', end: 'center 55%', scrub: 1 },
    });
    gsap.from('.facts div', { xPercent: -8, opacity: 0, stagger: .1, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: '.facts', start: 'top 80%' } });
  } else unsurePix.set(170);

  /* ---------- 05 · program: horizontal on desktop, cards turn to face you ---------- */
  if (motion) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', () => {
      const days = $('#days');
      const dist = () => Math.max(0, days.scrollWidth - innerWidth);
      const slide = gsap.to(days, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '#program', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .6, invalidateOnRefresh: true },
      });
      gsap.to('#programBar', { scale: 1, ease: 'none', scrollTrigger: { trigger: '#program', start: 'top top', end: () => '+=' + dist(), scrub: true } });
      $$('.day').forEach((day) => {
        gsap.fromTo(day, { rotateY: -35, z: -120, opacity: .4 }, {
          rotateY: 0, z: 0, opacity: 1, ease: 'power2.out',
          scrollTrigger: { trigger: day, containerAnimation: slide, start: 'left 100%', end: 'left 55%', scrub: true },
        });
      });
    });
    mm.add('(max-width: 860px)', () => {
      gsap.from('.day', { y: 60, opacity: 0, stagger: .06, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: '#days', start: 'top 85%' } });
    });
    // hover: the card tilts toward the pointer
    if (fine) $$('.day').forEach((day) => {
      const rx = gsap.quickTo(day, 'rotationX', { duration: .5, ease: 'power3' });
      const ry = gsap.quickTo(day, 'rotationY', { duration: .5, ease: 'power3' });
      day.addEventListener('pointermove', (e) => {
        const r = day.getBoundingClientRect();
        rx(-((e.clientY - r.top) / r.height - .5) * 14); ry(((e.clientX - r.left) / r.width - .5) * 14);
      });
      day.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  /* ---------- 06 · the feed that never ends, until you put it down ---------- */
  const feed = $('#feedCol'), phone = $('#phone');
  [...feed.children].forEach((p) => { const c = p.cloneNode(true); c.setAttribute('aria-hidden', 'true'); feed.appendChild(c); });
  $$('.slot', feed).forEach((s) => { if (!s.classList.contains('has-img')) L.fillSlot(s); });
  const tvLine = document.createElement('i'); tvLine.className = 'tv-line'; $('.phone-screen', phone).appendChild(tvLine);
  let fy = 0, speed = 0.7, holdP = 0, holding = false, done = false, feedVisible = false, offT = 0, offStart = 0;
  new IntersectionObserver(([e]) => (feedVisible = e.isIntersecting)).observe(phone);
  const ring = $('#holdRing'), label = $('#holdLabel'), sub = $('#holdSub'), btn = $('#holdBtn');
  const RING = 182.2;
  function frame() {
    if (feedVisible && !done) {
      const half = feed.scrollHeight / 2;
      fy -= speed * (1 + holdP * 6) * (L.reduced ? 0 : 1);    // the feed fights back: it speeds up while you hold
      if (-fy > half) fy += half;
      feed.style.transform = `translate3d(0,${fy}px,0)`;
      // and the phone buzzes harder the closer you get
      if (motion) phone.style.transform = holdP > 0 ? `translate(${rnd(-1, 1) * holdP * 5}px, ${rnd(-1, 1) * holdP * 5}px) rotate(${rnd(-1, 1) * holdP * 2}deg) scale(${1 - holdP * .04})` : '';
    }
    if (!done) {
      holdP = holding ? Math.min(1, holdP + 1 / 180) : Math.max(0, holdP - 1 / 40);
      ring.style.strokeDashoffset = RING * (1 - holdP);
      if (holdP === 1) putDown();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  function putDown() {
    done = true; holding = false; phone.style.transform = '';
    label.textContent = 'pick it back up';
    sub.textContent = 'you did it. the feed is still going. you just aren\'t.';
    store.set('putdown', store.get('putdown', 0) + 1);
    const off = () => phone.classList.add('off');
    if (motion) {
      // switch off like an old tv: squash to a line, the line to a dot, then dark
      gsap.timeline({ onComplete: off })
        .to(feed, { scaleY: .006, duration: .22, ease: 'power4.in' })
        .to(tvLine, { scaleX: 1, duration: .01 }, '<.18')
        .to(tvLine, { scaleX: 0, opacity: 0, duration: .35, ease: 'power3.in' })
        .add(off, '-=.15');
    } else off();
    offStart = Date.now();
    offT = setInterval(() => { const s = Math.floor((Date.now() - offStart) / 1000); $('#offTime').textContent = fmt(s).slice(3) + ' offline'; }, 1000);
  }
  function pickUp() {
    done = false; holdP = 0; phone.classList.remove('off'); clearInterval(offT);
    if (motion) { gsap.set(tvLine, { scaleX: 0, opacity: 1 }); gsap.fromTo(feed, { scaleY: .006 }, { scaleY: 1, duration: .8, ease: 'elastic.out(1, .5)' }); }
    label.textContent = 'hold to put it down';
    sub.textContent = 'back already? ' + fmt(Math.floor((Date.now() - offStart) / 1000)).slice(3) + ' offline. that\'s a start.';
  }
  const start = (e) => { if (e) e.preventDefault(); if (done) { pickUp(); return; } holding = true; label.textContent = 'keep holding…'; };
  const stop = () => {
    if (!holding) return; holding = false;
    if (!done) { label.textContent = holdP > .5 ? 'almost. again.' : 'hold to put it down'; }
  };
  btn.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, stop));
  btn.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e); });
  btn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') stop(); });
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  if (motion) gsap.from(phone, { y: 120, rotate: -8, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '#feed', start: 'top 70%' } });

  /* ---------- 07 · let it all go ---------- */
  const OTHERS = ['3am scrolling', 'being perfect', 'his spotify', 'read receipts', 'the group chat', 'comparing', 'my screen time report', 'waiting for a reply', 'checking who viewed it', 'the algorithm\'s opinion of me'];
  const chips = $('#letgoChips');
  const mine = store.get('letgo', []);
  function renderChips() {
    chips.innerHTML = '';
    mine.slice(-4).reverse().forEach((t) => { const li = document.createElement('li'); li.className = 'mine'; li.textContent = t; chips.appendChild(li); });
    OTHERS.slice(0, 8 - Math.min(4, mine.length)).forEach((t) => { const li = document.createElement('li'); li.textContent = t; chips.appendChild(li); });
  }
  renderChips();
  const input = $('#letgoInput'), fly = $('#letgoFly');
  $('#letgoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const t = input.value.trim().replace(/\s+/g, ' ');
    if (!t) { input.focus(); toast('nothing? lucky you.'); return; }
    input.value = '';
    mine.push(t); store.set('letgo', mine.slice(-30));
    const w = document.createElement('span'); w.textContent = t; fly.appendChild(w);
    const after = () => { w.remove(); renderChips(); if (motion) gsap.from(chips.firstElementChild, { scale: 0, rotate: -20, duration: .6, ease: 'back.out(2.5)' }); };
    if (motion) {
      // the words stretch, then come apart letter by letter and float off
      const cs = chars(w);
      gsap.timeline({ onComplete: after })
        .from(cs, { y: 60, opacity: 0, stagger: .02, duration: .4, ease: 'back.out(2)' })
        .to(cs, { scaleY: 2.6, transformOrigin: '50% 100%', stagger: .015, duration: .5, ease: 'power2.inOut' })
        .to(cs, {
          y: () => -rnd(innerHeight * .4, innerHeight * .9), x: () => rnd(-160, 160), rotate: () => rnd(-120, 120), scaleY: 1,
          opacity: 0, filter: 'blur(6px)', duration: () => rnd(1.2, 2), ease: 'power2.in', stagger: { each: .03, from: 'random' },
        }, '-=.1');
    } else after();
    toast('gone. you don\'t have to carry it anymore.');
  });
  if (motion) {
    gsap.fromTo('.letgo-title > span', { scaleY: .2, opacity: 0, rotateY: (i) => [60, 0, -60][i] }, {
      scaleY: (i) => [1.35, 1, 1.35][i], rotateY: (i) => [28, 0, -28][i], transformPerspective: 500, opacity: 1, stagger: .12, ease: 'expo.out',
      scrollTrigger: { trigger: '#letgo', start: 'top 70%', end: 'center 60%', scrub: 1 },
    });
    gsap.fromTo('.letgo-bg .slot', { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: '#letgo', scrub: true } });
  }

  /* ---------- 08 · guestbook: stickers that drop in and can be moved ---------- */
  const cards = $$('.gb-card');
  if (motion) {
    gsap.from(cards, {
      y: -140, scale: 1.25, rotate: () => rnd(-25, 25), opacity: 0, duration: 1, ease: 'bounce.out', stagger: .15,
      scrollTrigger: { trigger: '#gbGrid', start: 'top 80%' },
    });
    if (window.Draggable) {
      let z = 10;
      cards.forEach((card) => {
        Draggable.create(card, {
          type: 'x,y', zIndexBoost: false,
          onPress() { card.style.zIndex = ++z; card.classList.add('lifted'); gsap.to(card, { scale: 1.06, rotate: 0, duration: .3, ease: 'power3' }); },
          onRelease() { card.classList.remove('lifted'); gsap.to(card, { scale: 1, rotate: rnd(-5, 5), duration: .6, ease: 'elastic.out(1, .4)' }); },
        });
      });
    }
  }

  /* ---------- 09 · free: the word puts itself together, the esc key finally works ---------- */
  const free = $('#free');
  let freeVisible = false;
  new IntersectionObserver(([e]) => {
    freeVisible = e.isIntersecting;
    document.body.classList.toggle('quiet', freeVisible);
  }, { threshold: .25 }).observe(free);
  L.onEsc = () => { if (!freeVisible) return false; L.logoff(); return true; };
  $('#freeEsc').addEventListener('click', () => L.logoff());
  if (motion) {
    gsap.from(chars($('.free-word')), {
      yPercent: (i) => [-140, 120, -100, 140][i % 4], rotate: () => rnd(-40, 40), opacity: 0, ease: 'expo.out', stagger: .08, duration: 1.4,
      scrollTrigger: { trigger: '.free-photo', start: 'top 70%' },
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
