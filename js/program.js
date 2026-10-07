/* =========================================================
   LOG.OFF — program.js
   ========================================================= */
(() => {
  const { $, $$, motion, fine, store, chars, fmt, toast } = window.L;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const inView = (el, cb, opts) => new IntersectionObserver(([e]) => cb(e.isIntersecting), opts).observe(el);

  /* ---------- hero: the calendar strip deals itself out ---------- */
  L.ready(() => {
    if (!motion) return;
    gsap.from('.strip li', { y: 60, rotate: () => rnd(-14, 14), opacity: 0, duration: 1, ease: 'back.out(1.7)', stagger: .07, delay: .3 });
    gsap.from('.p-hero .star', { scale: 0, rotate: -180, duration: 1, ease: 'back.out(3)', stagger: .2, delay: .6 });
  });

  /* ---------- the rail: which day you're on ---------- */
  const rail = $('#rail'), railNum = $('#railNum'), railLinks = $$('.rail-days a');
  const days = $$('.day-sec');
  if (motion) {
    days.forEach((sec, i) => {
      ScrollTrigger.create({
        trigger: sec, start: 'top 55%', end: 'bottom 55%',
        onToggle: (self) => {
          if (!self.isActive) return;
          railNum.textContent = String(i + 1).padStart(2, '0');
          railLinks.forEach((a, j) => { a.classList.toggle('now', j === i); a.classList.toggle('done', j < i); });
          gsap.fromTo(railNum, { yPercent: self.direction > 0 ? 60 : -60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .4, ease: 'power3.out' });
        },
      });
      // the giant number drifts slower than the page
      if (i < 6) gsap.fromTo($('.day-num', sec), { yPercent: 25 }, { yPercent: -25, ease: 'none', scrollTrigger: { trigger: sec, scrub: true } });
      // photos swing in, less every day
      const fig = $('.day-figure', sec);
      if (fig) gsap.from(fig, { y: 80, rotate: (i % 2 ? -1 : 1) * (12 - i * 1.6), opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: fig, start: 'top 85%' } });
      const rows = $$('.timetable li', sec);
      if (rows.length) gsap.from(rows, { x: -24, opacity: 0, stagger: .08, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: rows[0], start: 'top 85%' } });
    });
    ScrollTrigger.create({
      trigger: '#day-1', endTrigger: '#day-7', start: 'top 60%', end: 'top 40%',
      onToggle: (self) => rail.classList.toggle('on', self.isActive),
      onUpdate: (self) => gsap.set('#railBar', { scaleY: self.progress }),
    });
  } else rail.classList.add('on');

  /* ---------- day 01 · the sealed bag ---------- */
  const bag = $('#bag'), reachEl = $('#reachCount');
  let reaches = store.get('reaches', 0);
  reachEl.textContent = reaches;
  const BAG = ['sealed until day seven.', 'nope.', 'it\'s not going anywhere.', 'still sealed.', 'nothing new happened. we promise.', 'you\'re doing great. it\'s still sealed.'];
  bag.addEventListener('click', () => {
    reaches++; store.set('reaches', reaches); reachEl.textContent = reaches;
    toast(BAG[Math.min(reaches - 1, BAG.length - 1)]);
    if (reaches === 43) toast('43. exactly average. congratulations?', 3200);
    if (motion) gsap.timeline()
      .to(bag, { rotate: -7, duration: .07 }).to(bag, { rotate: 6, duration: .07 }).to(bag, { rotate: -4, duration: .07 })
      .to(bag, { rotate: 0, duration: .5, ease: 'elastic.out(1, .3)' })
      .fromTo(reachEl, { scale: 1.8 }, { scale: 1, duration: .5, ease: 'back.out(3)' }, 0);
  });

  /* ---------- day 02 · phantom vibrations ---------- */
  const day2 = $('#day-2'), buzzWord = $('#buzzWord'), buzzNote = $('#buzzNote');
  let d2 = false, lastBuzz = 0, checks = 0;
  inView(day2, (v) => (d2 = v), { threshold: .3 });
  function buzz() {
    if (d2 && !document.hidden) {
      lastBuzz = performance.now();
      buzzNote.textContent = 'did you feel that?';
      if (motion) {
        gsap.fromTo($('.day-body', day2), { x: 0 }, { x: () => rnd(-6, 6), duration: .05, repeat: 9, yoyo: true, ease: 'none', clearProps: 'x' });
        gsap.set(buzzWord, { x: rnd(-260, 0), y: rnd(-30, 60), rotate: rnd(-20, 20) });
        gsap.fromTo(buzzWord, { opacity: 1, scale: .6 }, { opacity: 0, scale: 1.4, duration: .9, ease: 'power2.out' });
      }
      if (navigator.vibrate) try { navigator.vibrate([60, 40, 60]); } catch (e) { /* not allowed */ }
    }
    setTimeout(buzz, rnd(6000, 11000));
  }
  setTimeout(buzz, 4000);
  $('#checkPocket').addEventListener('click', () => {
    checks++;
    const dt = (performance.now() - lastBuzz) / 1000;
    buzzNote.textContent = lastBuzz && dt < 3
      ? `you checked in ${dt.toFixed(1)}s. there's nothing there. there never was.`
      : `nothing. there's nothing there. (checks: ${checks})`;
    store.set('phantom-checks', store.get('phantom-checks', 0) + 1);
  });

  /* ---------- day 03 · boredom: a clock that only moves while you do nothing ---------- */
  const day3 = $('#day-3'), boredTime = $('#boredTime'), boredNote = $('#boredNote'), boredIdea = $('#boredIdea');
  const IDEAS = [
    'what if you called your grandma?', 'learn the names of three clouds.', 'write down the dream you had.',
    'a song, but only the chorus, hummed.', 're-arrange the books by colour.', 'go and look at the sea. that\'s it.',
    'you could start that thing. the one you keep not starting.', 'nap. a real one.',
  ];
  let d3 = false, bored = 0, lastInput = performance.now(), ideaShown = false, best = store.get('bored-best', 0);
  inView(day3, (v) => (d3 = v), { threshold: .35 });
  const poke = () => {
    lastInput = performance.now();
    if (bored > 1.5 && d3) { boredNote.textContent = 'you moved. boredom resets. it\'s hard, right?'; }
    if (bored > 0) { bored = 0; ideaShown = false; boredIdea.textContent = ''; }
  };
  ['pointermove', 'wheel', 'keydown', 'touchstart', 'scroll'].forEach((ev) => addEventListener(ev, poke, { passive: true }));
  setInterval(() => {
    const quiet = performance.now() - lastInput > 600;
    boredTime.classList.toggle('moving', !quiet);
    if (!d3 || !quiet || document.hidden) return;
    bored += .1;
    const s = Math.floor(bored);
    boredTime.textContent = fmt(s).slice(3);
    if (bored > best) { best = bored; if (s % 5 === 0) store.set('bored-best', best); }
    if (s === 3) boredNote.textContent = 'good. keep doing nothing.';
    if (s >= 10 && !ideaShown) {
      ideaShown = true;
      boredNote.textContent = 'there it is. something grew in the empty space:';
      boredIdea.textContent = IDEAS[(Math.random() * IDEAS.length) | 0];
      if (motion) gsap.from(chars(boredIdea), { y: 20, opacity: 0, rotate: () => rnd(-20, 20), stagger: .02, duration: .6, ease: 'back.out(2)' });
      store.set('ideas', store.get('ideas', 0) + 1);
    }
  }, 100);

  /* ---------- day 04 · the sunset you didn't film ---------- */
  const sunset = $('#sunset'), vf = $('#viewfinder'), vfTime = $('#vfTime'), cap = $('#sunsetCap');
  let filmed = false, vfStart = 0;
  if (fine) {
    const xTo = motion ? gsap.quickTo(vf, 'x', { duration: .4, ease: 'power3' }) : (v) => gsap.set(vf, { x: v });
    const yTo = motion ? gsap.quickTo(vf, 'y', { duration: .4, ease: 'power3' }) : (v) => gsap.set(vf, { y: v });
    sunset.addEventListener('pointerenter', () => { if (!filmed) { sunset.classList.add('aiming'); vfStart = performance.now(); } });
    sunset.addEventListener('pointerleave', () => sunset.classList.remove('aiming'));
    sunset.addEventListener('pointermove', (e) => {
      const r = sunset.getBoundingClientRect();
      xTo(e.clientX - r.left - vf.offsetWidth / 2); yTo(e.clientY - r.top - vf.offsetHeight / 2);
      vfTime.textContent = fmt(Math.floor((performance.now() - vfStart) / 1000));
    });
  } else sunset.style.cursor = 'auto';
  function noFilm() {
    toast('no.');
    if (filmed) return;
    filmed = true; sunset.classList.add('done'); sunset.classList.remove('aiming');
    cap.textContent = 'better, right?';
    $('#filmIt').textContent = 'just look';
    store.set('not-filmed', true);
    if (motion) gsap.fromTo(sunset, { scale: .97 }, { scale: 1, duration: 1.2, ease: 'elastic.out(1, .4)' });
  }
  sunset.addEventListener('click', noFilm);
  $('#filmIt').addEventListener('click', noFilm);

  /* ---------- day 05 · name stickers (no usernames) ---------- */
  const stickers = $('#stickers'), nameInput = $('#nameInput');
  function makeDraggable(el) {
    if (!motion || !window.Draggable) return;
    Draggable.create(el, {
      type: 'x,y', bounds: '#day-5',
      onPress() { gsap.to(el, { scale: 1.08, rotate: 0, duration: .25 }); el.style.zIndex = 5; },
      onRelease() { gsap.to(el, { scale: 1, rotate: rnd(-8, 8), duration: .6, ease: 'elastic.out(1, .4)' }); },
    });
  }
  function addSticker(name, animate) {
    $$('.sticker.mine', stickers).forEach((s) => s.remove());
    const el = document.createElement('div');
    el.className = 'sticker mine'; el.dataset.cursor = 'drag'; el.style.setProperty('--r', rnd(-6, 6).toFixed(1) + 'deg');
    el.innerHTML = '<b>HELLO</b><span>my name is</span><em></em>';
    $('em', el).textContent = name;
    stickers.prepend(el);
    makeDraggable(el);
    if (animate && motion) gsap.from(el, { y: -220, rotate: rnd(-40, 40), scale: 1.4, opacity: 0, duration: 1, ease: 'bounce.out' });
  }
  $$('.sticker', stickers).forEach(makeDraggable);
  const savedName = store.get('name', '');
  if (savedName) addSticker(savedName, false);
  $('#nameForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const n = nameInput.value.trim();
    if (!n) { nameInput.focus(); toast('everyone has a name. even you.'); return; }
    if (/[@_#0-9]|\.(com|it|net)|xx|official|real/i.test(n)) {
      toast('that\'s a username. try the name your mum uses.', 3200);
      if (motion) gsap.fromTo(nameInput, { x: -8 }, { x: 0, duration: .5, ease: 'elastic.out(1, .2)' });
      return;
    }
    const clean = n.toLowerCase();
    store.set('name', clean);
    addSticker(clean, true);
    nameInput.value = '';
    toast(`hi, ${clean}. nice to meet you. in person.`);
  });

  /* ---------- day 06 · a letter that takes four days ---------- */
  const letter = $('#letterForm'), letterNote = $('#letterNote'), countEl = $('#letterCount');
  let sent = store.get('letters', []);
  countEl.textContent = sent.length;
  const arrives = () => {
    const d = new Date(); d.setDate(d.getDate() + 4);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };
  $('#stampDate').textContent = arrives();
  letter.addEventListener('submit', (e) => {
    e.preventDefault();
    const to = $('#letterTo').value.trim() || 'someone', body = $('#letterBody').value.trim();
    if (!body) { $('#letterBody').focus(); toast('write something. anything. it doesn\'t have to be good.'); return; }
    const when = arrives();
    $('#stampDate').textContent = when;
    sent.push({ to, when: Date.now() }); store.set('letters', sent.slice(-20));
    letter.classList.add('sent');
    const reset = () => {
      letter.reset(); letter.classList.remove('sent');
      countEl.textContent = sent.length;
      letterNote.innerHTML = `posted to <b>${to.replace(/[<>&]/g, '')}</b>. it arrives on ${when}. letters you've sent from here: <b>${sent.length}</b>`;
    };
    if (motion) {
      gsap.timeline({ onComplete: reset })
        .to({}, { duration: .7 })
        .to(letter, { scaleY: .12, rotateX: 70, transformPerspective: 800, duration: .5, ease: 'power3.in' })
        .to(letter, { x: () => innerWidth * .6, y: -120, rotate: 18, opacity: 0, duration: .7, ease: 'power3.in' })
        .set(letter, { x: 0, y: 40, rotate: -1, rotateX: 0, scaleY: 1 })
        .to(letter, { y: 0, opacity: 1, duration: .6, ease: 'power3.out' });
    } else reset();
    toast('posted. no read receipts. ever.');
  });

  /* ---------- day 07 · almost nothing ---------- */
  const day7 = $('#day-7'), later = $('#d7Later');
  let d7 = false, laterT;
  inView(day7, (v) => {
    d7 = v;
    document.body.classList.toggle('quiet', v);
    clearTimeout(laterT);
    if (v) laterT = setTimeout(() => later.classList.add('on'), 5000);
  }, { threshold: .4 });
  L.onEsc = () => { if (!d7) return false; L.logoff(); return true; };
  // "free" writes itself across the sky, left to right, once
  if (motion) {
    gsap.timeline({ scrollTrigger: { trigger: '.d7-figure', start: 'top 70%' } })
      .from('.d7-figure', { y: 50, opacity: 0, duration: 1.1, ease: 'expo.out' })
      .fromTo('.free-big', { clipPath: 'inset(-20% 100% -20% 0)' }, { clipPath: 'inset(-20% 0% -20% 0)', duration: 1.8, ease: 'power2.inOut' }, '-=.5')
      .from('.free-big', { y: 14, duration: 1.8, ease: 'sine.out' }, '<');
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
