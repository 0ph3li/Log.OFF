/* =========================================================
   LOG.OFF — retreat.js (the house)
   ========================================================= */
(() => {
  const { $, $$, motion, fine, store, chars, fillSlot, toast } = window.L;
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------- 01 · the walk: the road draws itself, the signal goes ---------- */
  const route = $('#route'), marks = $('#marks');
  const len = route.getTotalLength();
  const STOPS = [
    { f: 0, label: 'bus stop', km: '2.4', dx: 0, dy: 40 },
    { f: .27, label: 'last bar of signal', km: '1.7', dx: -40, dy: 44 },
    { f: .52, label: 'the gate', km: '1.1', dx: -120, dy: -44 },
    { f: .78, label: 'the lockers', km: '0.4', dx: -20, dy: 44 },
    { f: 1, label: 'the house', km: '0.0', dx: -150, dy: -10 },
  ];
  const NS = 'http://www.w3.org/2000/svg';
  STOPS.forEach((s) => {
    const p = route.getPointAtLength(len * s.f);
    const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'mark');
    g.innerHTML = `<circle cx="${p.x}" cy="${p.y}" r="9"/><text x="${p.x + s.dx}" y="${p.y + s.dy}">${s.label}</text><text class="km" x="${p.x + s.dx}" y="${p.y + s.dy + 22}">km ${s.km}</text>`;
    marks.appendChild(g); s.el = g;
  });
  const NETS = ['5G', '4G', '3G', 'E', 'no service'];
  const MSGS = [
    'you still have signal. enjoy it.',
    'one last story loads. slowly.',
    'a message tries to send. it doesn\'t.',
    '"E". nobody knows what E means.',
    'no service. the sea is louder now.',
  ];
  const sigNet = $('#sigNet'), sigBars = $$('#sigBars i'), sigKm = $('#sigKm'), sigMsg = $('#sigMsg');
  let lastStage = -1;
  function walkTo(p) {
    route.style.strokeDashoffset = len * (1 - p);
    const stage = Math.min(4, Math.floor(p * 5));
    sigKm.textContent = (2.4 * (1 - p)).toFixed(1);
    sigBars.forEach((b, i) => b.classList.toggle('off', i >= 5 - Math.round(p * 5)));
    STOPS.forEach((s) => s.el.classList.toggle('on', p >= s.f - .001));
    if (stage !== lastStage) {
      lastStage = stage;
      sigNet.textContent = NETS[stage]; sigNet.classList.toggle('none', stage === 4);
      sigMsg.textContent = MSGS[stage];
      if (motion) gsap.fromTo(sigNet, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: .35, ease: 'power3.out' });
    }
  }
  route.style.strokeDasharray = len;
  if (motion) {
    walkTo(0);
    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', () => {
      ScrollTrigger.create({
        trigger: '#walk', start: 'top top', end: '+=180%', pin: true, scrub: true,
        onUpdate: (self) => walkTo(self.progress),
      });
    });
    mm.add('(max-width: 900px)', () => {
      ScrollTrigger.create({ trigger: '.map', start: 'top 70%', end: 'bottom 30%', scrub: true, onUpdate: (self) => walkTo(self.progress) });
    });
    gsap.from('.mark', { scale: 0, transformOrigin: 'center', stagger: .1, duration: .6, ease: 'back.out(3)', scrollTrigger: { trigger: '#walk', start: 'top 60%' } });
  } else walkTo(1);

  /* ---------- 02 · the rooms ---------- */
  const ROOMS = [
    ['the lockers', 'RETREAT/room-1.jpg', 'Twelve pink lockers right by the door. You leave your phone here on the first morning, in a sealed bag, screen facing the wall. It stays here until day seven, collecting notifications nobody will ever read.'],
    ['the long table', 'RETREAT/door-open.jpg', 'One long table by the fire, candles instead of lamps, no head of the table. Dinner is at eight and lasts as long as it lasts. After, everyone ends up on the floor by the fireplace. Strangers become people here, usually by the second bottle of wine.'],
    ['the reading room', 'RETREAT/room-3.jpg', 'Floor-to-ceiling shelves, three armchairs and a window seat. Every book was left by a previous guest, with a note inside. You can take one home if you leave one behind.'],
    ['the bedrooms', 'RETREAT/room-4.jpg', 'Twelve small white rooms. A bed, a window, an alarm clock that ticks. The sockets are by the door, not by the bed, so there\'s nothing to scroll in the dark.'],
    ['the clock room', 'RETREAT/room-5.jpg', 'The only screen in the house is a big old clock on the wall. People come here to check the time and stay for half an hour. Nobody knows why it\'s so calming.'],
    ['the roof', 'RETREAT/room-6.jpg', 'Up the narrow stairs. Two old sofas, a blanket box, the whole sea. Everyone ends up here at seven for the sunset, and nobody films it.'],
  ];
  const rooms = $$('.room'), panel = $('#roomPanel'), photo = $('#roomPhoto');
  let current = -1;
  function showRoom(i, focus) {
    if (i === current) return;
    current = i;
    rooms.forEach((r, j) => { r.classList.toggle('active', j === i); r.setAttribute('aria-selected', j === i); r.setAttribute('tabindex', j === i ? 0 : -1); });
    if (focus) rooms[i].focus();
    const [title, img, text] = ROOMS[i];
    const slot = document.createElement('div');
    slot.className = 'slot'; slot.dataset.img = img; slot.dataset.alt = title;
    slot.innerHTML = `<span class="slot-label">${img}<small>${title} · 1:1</small></span>`;
    photo.appendChild(slot); fillSlot(slot);
    $('#roomN').textContent = `room ${String(i + 1).padStart(2, '0')} / 06`;
    $('#roomTitle').textContent = title;
    $('#roomText').textContent = text;
    const old = $$('.slot', photo).slice(0, -1);
    if (motion) {
      gsap.fromTo(slot, { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', duration: .8, ease: 'expo.inOut', onComplete: () => old.forEach((o) => o.remove()) });
      gsap.from(chars($('#roomTitle')), { yPercent: 100, opacity: 0, stagger: .02, duration: .6, ease: 'expo.out' });
      gsap.from('#roomText', { y: 14, opacity: 0, duration: .6, ease: 'power3.out', delay: .1 });
    } else old.forEach((o) => o.remove());
  }
  rooms.forEach((r, i) => {
    r.addEventListener('click', () => showRoom(i));
    r.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showRoom(i); }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); showRoom((i + 1) % rooms.length, true); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); showRoom((i + rooms.length - 1) % rooms.length, true); }
    });
  });
  showRoom(0);
  if (motion) gsap.from('.room rect', { scale: .6, opacity: 0, transformOrigin: 'center', stagger: .08, duration: .9, ease: 'back.out(2)', scrollTrigger: { trigger: '#plan', start: 'top 75%' } });

  /* ---------- 03 · the lockers ---------- */
  const you = store.get('name', '') || 'you';
  const LOCKERS = [
    ['giulia', '1,204 notifications', 'her mum has called four times. she\'s fine.'],
    ['nico', 'a phone with a cracked screen', 'and a charger, sulking.'],
    ['ama', 'a sealed bag', '312 likes on a photo she doesn\'t remember posting.'],
    [you, 'reserved', 'empty for now. bring a book.'],
    ['lea', '47 unread', 'all from the same group chat. all "omg".'],
    ['sami', 'a smartwatch too', 'nice try, sami.'],
    ['bea', 'a phone in a phone case in a bag', 'she really wanted to be sure.'],
    ['tommaso', 'two phones', 'one for work. one for "work".'],
    ['iris', '9% battery', 'it will die on day two. she won\'t notice.'],
    ['yuki', 'a polaroid', 'no phone. she came prepared.'],
    ['m.', 'a phone, face down', 'still buzzing. still face down.'],
    ['—', 'empty', 'the lockers are never all full. there\'s always room.'],
  ];
  const grid = $('#lockerGrid');
  LOCKERS.forEach(([name, what, note], i) => {
    const el = document.createElement('div');
    el.className = 'locker' + (name === you ? ' yours' : '');
    el.innerHTML = `
      <div class="locker-inside"><b></b><span></span></div>
      <button class="locker-door" aria-expanded="false" data-cursor="${name === you ? 'yours' : 'open'}">
        <span class="locker-no">${String(i + 1).padStart(2, '0')}</span><span></span><span class="locker-name"></span>
      </button>`;
    $('.locker-inside b', el).textContent = what;
    $('.locker-inside span', el).textContent = note;
    $('.locker-name', el).textContent = name;
    const door = $('.locker-door', el);
    let open = false;
    door.addEventListener('click', () => {
      open = !open; door.setAttribute('aria-expanded', open);
      if (motion) gsap.to(door, { rotateY: open ? -112 : 0, duration: open ? .9 : .6, ease: open ? 'elastic.out(1, .6)' : 'power3.in' });
      else door.style.transform = open ? 'rotateY(-112deg)' : '';
      if (open && name === you) toast(you === 'you' ? 'yours. tell us your name on the program page.' : `${you}, this one's yours.`);
    });
    grid.appendChild(el);
  });
  if (motion) gsap.from('.locker', { y: 80, opacity: 0, rotate: () => rnd(-6, 6), stagger: { each: .05, from: 'random' }, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: grid, start: 'top 80%' } });

  // the pile of notifications keeps growing while you watch
  const pileEl = $('#pile');
  let pile = 18442, pileOn = false;
  new IntersectionObserver(([e]) => (pileOn = e.isIntersecting)).observe($('#lockers'));
  setInterval(() => {
    if (!pileOn || document.hidden) return;
    pile += 1 + ((Math.random() * 4) | 0);
    pileEl.textContent = pile.toLocaleString('en');
  }, 700);

  /* ---------- 04 · in / not in your room ---------- */
  if (motion) {
    gsap.from('.inv-col:not(.not) .inv-list li', { x: -30, opacity: 0, stagger: .08, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: '.inv-grid', start: 'top 75%' } });
    gsap.from('.not .inv-list li', { x: 30, opacity: 0, stagger: .08, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: '.inv-grid', start: 'top 75%' } });
    gsap.fromTo('.not .inv-list span', { '--x': 0 }, { '--x': 1, stagger: .12, duration: .5, ease: 'power2.inOut', delay: .6, scrollTrigger: { trigger: '.inv-grid', start: 'top 70%' } });
  }

  /* ---------- 05 · house rules ---------- */
  if (motion) {
    $$('.rule-list li').forEach((li, i) => {
      gsap.from(li.children, { yPercent: 110, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: li, start: 'top 88%' } });
    });
  }

  /* ---------- the door ---------- */
  if (motion) gsap.from(chars($('.door-title')), { yPercent: 110, rotate: () => rnd(-20, 20), opacity: 0, stagger: .025, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.door-title', start: 'top 90%' } });

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
