# LOG.OFF

> *you were never the user. you were the product.*

**LOG.OFF** is a concept website for a fictional retreat: **seven days in a white house with no signal**, for people who can't press esc. No screens, no stories, just you, the sea, and the boring, beautiful middle of the afternoon.

The site does the detox *to you*. Every page starts **loud and online** (alarm red, pixelated faces, notifications sliding in, cursors falling out of your pointer) and gets **quieter the further you scroll**: the pings stop, the signal bars drop, the grain fades, your social battery recharges, and the page ends almost white. Only then does the esc key work.

Personal portfolio project · concept, design & code by **ghostly.grl** ♥

---

## Pages

| Page | File | What's inside |
|---|---|---|
| **Home** | `index.html` | *pls help i cant **esc***: letters that drop in and lean away from your cursor, a portrait that only comes into focus if you **stop moving**, a live **receipt** that prints itself (barcode: *you are the product*), a manifesto where words come into focus, get highlighted, and then the unimportant ones **blur out**, *unsure? so are we.* with a portrait that sharpens and a word that puts itself together, the **seven-day program** sliding sideways on 3D cards (each day with fewer pixels), a phone with an **endless feed** you have to *hold to put down* (it fights back, then switches off like an old tv), *let it all go* (your words stretch and float away letter by letter), a guestbook of reviews you can **pick up and move**, and **free**: where esc finally works. |
| **The program** | `program.html` | *seven days. less every day.* A calendar strip that empties itself, then one chapter per day, each with less colour, border and pixels than the one before, a timetable and a small ritual: a **sealed bag** that won't open (reaches counted, average guest: 43), **phantom vibrations** that shake the page while you read, a **boredom clock** that only moves while you do nothing (after ten seconds an idea arrives), a **viewfinder** over the sunset that refuses to film, **name stickers** that reject usernames, a **letter** that folds, gets stamped and arrives in four days, and day seven: almost white. A rail on the left keeps count of the day. |
| **The house** | `retreat.html` | *a white house with no signal.* On cobalt. **The walk**: a pinned map where the road draws itself as you scroll and a signal widget drops from 5G to *no service* while the km to the house count down. **The rooms**: a floor plan you can click (or arrow through); each room swaps its photo with a wipe. **The lockers**: twelve pink lockers whose doors swing open on what's inside, one of them yours (it uses the name you gave on the program page), and a pile of notifications that keeps growing. **In / not in your room**, with the missing things crossed out. **Seven house rules** that fill pink on hover. *The door is open.* |
| **Check in** | `check-in.html` | *check in.* On hot pink. A five-step form with a **ticket that builds itself** beside it: your name (usernames get refused) and an honest mood, a week (the next eight mondays, one already full), a room (six are taken by giulia, nico, ama…), **the vow** (five promises to tick and a **signature pad**), and **hand it over**: drag your phone into the pink bag and it zips shut. Then the ticket gets stamped *checked in*, confetti, and a **stub you can tear off**. It remembers you on this device; *cancel and start again* forgets. |
| **Let it go** | `let-go.html` | *let it all go*, warped like the poster and stretching as you scroll. **The ritual** in three steps: write it on a lined note, **hold to crumple** it (the paper wrinkles, shrinks and rolls into a ball), then **drag and throw** the ball into the sea (or press enter): it flies in an arc and splashes. **The wall**: every note thrown from the rocks, yours in pink, the oldest ones blurring away. **The questions you're avoiding**: a deck of fourteen uncomfortable questions you swipe (right: answered, left: skipped, and skipped ones come back stamped *skipped ×2*). **Breathe**: a 4-7-8 breathing circle, three rounds. **How to let go (a guide)** in five steps. Notes are shared with the *let it all go* section on the home. |
| **FAQ** | `faq.html` | *you have questions. we have a landline.* On ink. A sticky **search** that filters and highlights as you type, topic chips and sixteen answers in an accordion. **Break glass**: an emergency box you crack twice and shatter on the third hit; behind it, the landline. **We answer by post**: a postcard that gets postmarked and flies off (we'll write back in about five weeks). |
| **What this device remembers** | `privacy.html` | The privacy page, honestly. On lilac. **The memory, live**: every `lo-` key in this browser shown as an index card, in words (*"times you pressed esc too early: 3"*, *"things you threw into the sea"*, *"your ticket"*…), refreshing as screen time ticks; each card can be **forgotten** and collapses into bits. **Forget everything**: hold the big button for three seconds. **The small print, in large print**: seven short articles (no server, no cookies, no analytics, what the CDNs see, how to forget). |

---

## Motion

- **Smooth scroll** with Lenis, synced to ScrollTrigger.
- **Pixel transitions**: after the loader, and between pages, the screen dissolves in black and pink squares.
- **Cursor**: a pink dot that grows into a label (*not yet*, *hold*, *drag*, *bye ♡*) over things you can touch; buttons are **magnetic**.
- **Text**: headings slide up line by line out of a mask; kickers **scramble** into place like a bad connection; big words are split into letters and animated one by one.
- **Images**: a little parallax inside every frame; some are revealed by a grid of squares lifting off in random order.
- **Hero**: letters fall in, lean away from the pointer, shake when you press esc, and come apart as you scroll away.
- **Receipt**: prints line by line, barcode last, with a little stutter.
- **Program**: pinned horizontal scroll with a progress bar; each card turns to face you as it arrives and tilts toward the pointer.
- **Phone**: the feed speeds up and the phone buzzes harder while you hold; when you let go of it for good, it squashes to a line, then a dot.
- **Let it go**: the title stretches into place; your words stretch, then float off letter by letter.
- **Guestbook**: reviews drop in like stickers and can be dragged around.
- **Tape**: speeds up and leans in the direction you scroll.
- **Log off**: the page switches off like a crt, then white light and a constellation that draws itself.
- **Nav**: hides when you scroll down, comes back when you scroll up; links roll over to pink.

## Details

- **Noise** — `main.js` turns scroll progress into a `--noise` variable (1 at the top, 0 at the bottom). It drives the grain, the notification rate, the cursor trail, the signal bars and the battery in the nav.
- **Pixel slots** — `L.pixel(slot).set(cols)` draws a canvas mosaic over a photo (or over a placeholder silhouette while the photo is missing). Higher number = sharper.
- **Pings** — fake notifications you can swipe away; ignored ones get counted on the receipt.
- **The esc key** — pressing Escape anywhere earns a gentle *not yet*; on the last section it logs you off.
- **Tab title** — the opposite of every app: leave the tab and it says *you left. proud of you ♡*.
- **Easter eggs** — the Konami code triggers a **relapse**; the console has `logoff.help()`.
- **Performance and access** — loops only run when their section is on screen, reveals have a failsafe, and reduced motion turns the extra motion off (no smooth scroll, no custom cursor, no transitions).

---

## Design

**Palette** — paper `#f6f4f1`, ink `#0d0c0d`, graphite `#6b6a6c`, hot pink `#ff1f8f` (*free*), alarm `#ff3352` (*pls help i cant esc*), cobalt `#2f62ff` (*unsure?*), lilac `#d8c7e6`, blush `#ffd3e6`, mist `#c9d3dd`.

**Type** — Inter Tight (very tight poster grotesk), Instrument Serif italic (the soft voice), Pinyon Script (handwriting), Space Mono (captions, receipts), VT323 (pixels).

The moodboard is in `VIBES/`.

---

## Images

Every photo is a **slot**: drop a file in `img/` with the name written on the placeholder and it appears. Until then a dashed frame shows the filename and what the picture should be. Each page has its own folder.

**`img/INDEX/`** (home)

| File | Where | Ratio |
|---|---|---|
| `hero.jpg` | hero portrait (pixelated, sharpens when you stay still) | 3:4 |
| `receip.jpg` | behind the receipt (shown in b&w) | 4:3 |
| `unsure.jpg` | *unsure?* portrait (pixelated, sharpens on scroll) | 4:5 |
| `day-1.jpg` … `day-7.jpg` | the seven days (also used on the program page; `day-7` is behind *free*) | 4:5 |
| `feed-1.jpg` … `feed-4.jpg` | posts inside the phone | 1:1 |
| `guest-1.jpg` | polaroid in the guestbook | 1:1 |

**`img/PROGRAM/`** (the program)

| File | Where | Ratio |
|---|---|---|
| `hero.jpg` | the first morning, by the sea wall | 4:5 |
| `07.jpg` | day seven, *free* written across the sky | 4:3 |

**`img/RETREAT/`** (the house)

| File | Where | Ratio |
|---|---|---|
| `hero.jpg` | the house on the cliff | 4:5 |
| `room-1.jpg`, `room-3.jpg` … `room-6.jpg` | lockers, reading room, bedrooms, clock room, roof | 1:1 |
| `door-open.jpg` | the long table, by the fire (room 2) | 1:1 |

**`img/LET-GO/`** (let it go)

| File | Where | Ratio |
|---|---|---|
| `hero.jpg` | framed hero photo (also behind *let it all go* on the home) | 4:3 |
| `sea.jpg` | the sea you throw the note into | 1:1 |

**`img/FAQ/`** (faq)

| File | Where | Ratio |
|---|---|---|
| `hero.jpg` | the help desk record player | 1:1 |
| `landline.jpg` | the landline in the hall, behind the broken glass | 3:4 |

**`img/CHECK-IN/`** (check in) — **missing** for now

| File | Where | Ratio |
|---|---|---|
| `hero.jpg` | a bag by the door, ready to go | 4:5 |

**`img/PRIVACY/`** (what this device remembers) — **missing** for now

| File | Where | Ratio |
|---|---|---|
| `hero.jpg` | a notebook with pages torn out | 4:5 |

---

## Built with

- Plain **HTML, CSS and JavaScript**, no framework, no build step
- [GSAP 3](https://gsap.com/) + ScrollTrigger + Draggable
- [Lenis](https://lenis.darkroom.engineering/) for smooth scrolling
- Google Fonts

## Run it locally

```bash
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Notes

- **Nothing is sent anywhere.** Screen time, visits, what you let go and how many times you tried to escape live only in your own `localStorage`, under keys starting with `lo-`. `logoff.forget()` in the console wipes it all.

<sub>LOG.OFF is a fictional retreat. Moodboard images belong to their respective owners and are used as a personal, non-commercial reference.</sub>

```
   *    /\_/\      +
       ( o.o )   <3  ghostly.grl
   +    > ^ <          *
```
