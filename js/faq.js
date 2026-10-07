/* =========================================================
   LOG.OFF — faq.js
   ========================================================= */
(() => {
  const { $, $$, motion, fine, store, chars, toast } = window.L;
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------- hero ---------- */
  const faqChars = chars($('.f-title [data-chars]'));
  L.ready(() => {
    if (!motion) return;
    gsap.from(faqChars, { yPercent: 110, rotate: (i) => [-14, 8, -6][i], duration: 1.3, stagger: .1, ease: 'expo.out' });
    gsap.from('.f-hero .star', { scale: 0, rotate: -180, duration: 1, ease: 'back.out(3)', stagger: .2, delay: .4 });
    gsap.to(faqChars, { yPercent: (i) => [-20, 10, -30][i], ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
  });

  /* ---------- the questions ---------- */
  const QA = [
    ['before', 'what should i bring?', 'A book, a jumper, walking shoes, a notebook. Something to write with. <em>No laptop. Yes, even the small one.</em>'],
    ['before', 'can i bring a kindle?', 'No. A kindle is a screen with good intentions. We have a reading room full of paper books, each one left by a previous guest, with a note inside.'],
    ['before', 'how do i get there?', 'Train to the last town on the line, then bus 41 to the end of the road. From the bus stop it\'s a 2.4 km walk. You\'ll feel the bars leaving. The map is on <a class="text-link" href="retreat.html#walk">the house</a> page.'],
    ['before', 'how much does it cost?', 'Nothing. It\'s a fictional retreat. If it were real: less than a month of the subscriptions you forgot you have.'],
    ['phone', 'where does my phone go?', 'In a sealed pink bag, in a locker with your name on it, by the front door. Screen facing the wall. You get it back on the morning of day seven.'],
    ['phone', 'what if someone needs to reach me?', 'Give them the number of the landline. We answer it, write the message on paper, and slide it under your door at breakfast. If it\'s urgent, we come and find you.'],
    ['phone', 'what about work?', 'Set an out-of-office before you come. We have a template: <em>"I\'m offline until the 14th. It\'s not you. It\'s everyone."</em>'],
    ['phone', 'can i check it just once?', 'That\'s what everyone says. On day one. And day two. By day three you stop asking. No.'],
    ['phone', 'what about photos?', 'There are disposable cameras at the front desk, 27 shots each. We develop them after you leave and post them to you. You\'ll have forgotten half of what\'s on them. That\'s the best part.'],
    ['house', 'is there wifi?', 'No. There\'s a router in the cellar from 2009, unplugged, kept as a monument.'],
    ['house', 'are there clocks?', 'Plenty. The clock room is the only room with a screen, and the screen is a clock face. People sit there for half an hour at a time. Nobody knows why it\'s so calming.'],
    ['house', 'is it really quiet?', 'Except for the sea. And nico, room 4, who snores. We\'ve put him at the end of the corridor.'],
    ['house', 'can i leave early?', 'Yes. The door is never locked. One guest left on day five. She came back for day seven.'],
    ['after', 'what happens on day seven?', 'We can\'t tell you. Nobody has come back to describe it.'],
    ['after', 'what happens when i turn my phone back on?', 'About 1,204 notifications. You\'ll read nine of them. The rest can wait. They always could.'],
    ['after', 'will it last?', 'Some of it. The boredom muscle stays. One tuesday you\'ll catch yourself looking at the ceiling for ten minutes, and you\'ll smile.'],
  ];
  const CATS = { before: 'before you come', phone: 'the phone', house: 'the house', after: 'after' };
  const list = $('#qaList'), search = $('#faqSearch'), count = $('#faqCount'), empty = $('#qaEmpty');
  const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // highlight matches in plain text only (never inside the markup we wrote)
  const hl = (html, term) => {
    if (!term) return html;
    const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return html.split(/(<[^>]+>)/).map((part) => (part.startsWith('<') ? part : part.replace(re, '<mark>$1</mark>'))).join('');
  };
  let cat = 'all';
  function render(animate) {
    const term = search.value.trim().toLowerCase();
    const rows = QA.map((r, i) => ({ r, i })).filter(({ r }) =>
      (cat === 'all' || r[0] === cat) && (!term || (r[1] + ' ' + r[2].replace(/<[^>]+>/g, '')).toLowerCase().includes(term)));
    list.innerHTML = rows.map(({ r, i }) => `
      <li class="qa-item">
        <button class="qa-q" aria-expanded="false" aria-controls="qa-${i}" id="qa-q-${i}">
          <span class="qa-n">${String(i + 1).padStart(2, '0')}</span>
          <span>${hl(esc(r[1]), term)}<span class="qa-cat">${CATS[r[0]]}</span></span>
          <span class="qa-plus" aria-hidden="true"></span>
        </button>
        <div class="qa-a" id="qa-${i}" role="region" aria-labelledby="qa-q-${i}"><div class="qa-a-inner"><p>${hl(r[2], term)}</p></div></div>
      </li>`).join('');
    count.textContent = rows.length + (rows.length === 1 ? ' answer' : ' answers');
    empty.hidden = rows.length > 0;
    $$('.qa-q', list).forEach((b) => b.addEventListener('click', () => toggle(b)));
    if (term && rows.length && rows.length <= 2) toggle($('.qa-q', list), true);
    if (animate && motion) gsap.from($$('.qa-item', list), { y: 24, opacity: 0, stagger: .04, duration: .5, ease: 'power3.out' });
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  function toggle(btn, instant) {
    const item = btn.closest('.qa-item'), panel = $('.qa-a', item), open = !item.classList.contains('open');
    item.classList.toggle('open', open); btn.setAttribute('aria-expanded', open);
    if (motion && !instant) {
      gsap.to(panel, { height: open ? 'auto' : 0, duration: open ? .6 : .4, ease: open ? 'expo.out' : 'power3.inOut', onComplete: () => ScrollTrigger.refresh() });
      if (open) gsap.from($('p', panel), { y: 16, opacity: 0, duration: .6, ease: 'power3.out', delay: .08 });
    } else panel.style.height = open ? 'auto' : '0px';
  }
  let t;
  search.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => render(true), 140); });
  $$('.chip').forEach((c) => c.addEventListener('click', () => {
    cat = c.dataset.cat;
    $$('.chip').forEach((x) => { x.classList.toggle('on', x === c); x.setAttribute('aria-selected', x === c); });
    render(true);
  }));
  render(false);
  if (motion) gsap.from('.qa-item', { y: 40, opacity: 0, stagger: .05, duration: .8, ease: 'expo.out', scrollTrigger: { trigger: '#qaList', start: 'top 85%' } });

  /* ---------- break glass ---------- */
  const glass = $('#glass'), cracks = $('#cracks'), behind = $('#glassBehind');
  let hits = 0;
  function crack(x, y) {
    // a star of cracks from where you hit it, each one jagged
    const n = 7 + hits * 3;
    let d = '';
    for (let i = 0; i < n; i++) {
      let a = (i / n) * Math.PI * 2 + rnd(-.2, .2), px = x, py = y, len = rnd(60, 240);
      d += `M${px.toFixed(1)} ${py.toFixed(1)}`;
      for (let s = 0; s < 4; s++) { a += rnd(-.35, .35); px += Math.cos(a) * len / 4; py += Math.sin(a) * len / 4; d += ` L${px.toFixed(1)} ${py.toFixed(1)}`; }
    }
    // a ring around the impact
    d += ` M${x + 18} ${y} A18 18 0 1 1 ${x + 17.9} ${y - .1}`;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d); cracks.appendChild(path);
    if (motion) {
      const L = path.getTotalLength();
      gsap.fromTo(path, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: .35, ease: 'power3.out' });
      gsap.fromTo(glass, { x: -6 }, { x: 0, duration: .4, ease: 'elastic.out(1, .25)' });
    }
  }
  function shatter() {
    const r = glass.getBoundingClientRect(), box = glass.parentElement;
    glass.style.visibility = 'hidden';
    if (motion) {
      for (let i = 0; i < 18; i++) {
        const s = document.createElement('i'); s.className = 'shard';
        const w = rnd(40, 120), h = rnd(30, 100);
        s.style.width = w + 'px'; s.style.height = h + 'px';
        s.style.left = rnd(0, r.width - w) + 'px'; s.style.top = rnd(0, r.height - h) + 'px';
        s.style.clipPath = `polygon(${rnd(0, 40)}% 0, 100% ${rnd(0, 40)}%, ${rnd(60, 100)}% 100%, 0 ${rnd(50, 100)}%)`;
        box.appendChild(s);
        gsap.to(s, { y: rnd(300, 600), x: rnd(-120, 120), rotate: rnd(-180, 180), opacity: 0, duration: rnd(.9, 1.4), ease: 'power2.in', onComplete: () => s.remove() });
      }
      gsap.fromTo(behind.children, { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: .12, duration: .7, ease: 'power3.out', delay: .2, clearProps: 'opacity,transform' });
    }
    store.set('broke-glass', store.get('broke-glass', 0) + 1);
    toast('it\'s the landline. it was always the landline.');
  }
  glass.addEventListener('click', (e) => {
    const r = glass.getBoundingClientRect();
    const x = e.clientX ? (e.clientX - r.left) / r.width * 400 : 200, y = e.clientY ? (e.clientY - r.top) / r.height * 533 : 266;
    hits++;
    if (hits < 3) { crack(x, y); toast(hits === 1 ? 'again. harder.' : 'one more.'); }
    else shatter();
  });

  /* ---------- the postcard ---------- */
  const pc = $('#postcard'), note = $('#pcNote');
  const fmtD = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  $('#pmDate').textContent = fmtD(new Date());
  pc.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $('#pcQ').value.trim(), name = $('#pcName').value.trim() || 'someone';
    if (!q) { $('#pcQ').focus(); toast('a postcard with no question is just a postcard.'); return; }
    const back = new Date(); back.setDate(back.getDate() + 35);
    const sent = store.get('postcards', 0) + 1; store.set('postcards', sent);
    pc.classList.add('sent');
    const reset = () => {
      pc.reset(); pc.classList.remove('sent');
      note.innerHTML = `posted, ${esc(name)}. we'll write back by hand, around <b>${fmtD(back)}</b>. postcards sent: <b>${sent}</b>`;
    };
    if (motion) {
      gsap.timeline({ onComplete: reset })
        .to({}, { duration: .8 })
        .to(pc, { y: -40, rotate: -6, duration: .3, ease: 'power2.out' })
        .to(pc, { y: -innerHeight, rotate: 14, opacity: 0, duration: .7, ease: 'power3.in' })
        .set(pc, { y: 60, rotate: -1 })
        .to(pc, { y: 0, opacity: 1, duration: .7, ease: 'expo.out' });
    } else reset();
  });

  /* ---------- the end ---------- */
  if (motion) gsap.from(chars($('.f-cta-title')), { yPercent: 110, rotate: () => rnd(-20, 20), opacity: 0, stagger: .025, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.f-cta-title', start: 'top 90%' } });

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
