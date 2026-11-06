# Plan — remove the amenities "Reset" pill + fix the map column layout

Date: 2026-11-06 · Project: `/home/kali/Documents/weligama` (Next 14 app router)

---

## 1. Diagnosis

### 1.1 Reset pill

`components/amenityFilter/AmenityFilter.js:55-59` renders `Reset ({count})` at the end of the
pill strip whenever `selectedAmenities.length > 0`. Its only handler is
`resetAmenities` from `app/context/FilterContext.js:37`, which just does
`setSelectedAmenities([])` — exactly what clicking each selected pill does one by one.
`resetAmenities` has no other consumer (grep over `app/` + `components/`, `.bak` files ignored).

### 1.2 Map displacement (measured on the running dev server, 1512×900)

Root cause is `.right_block` in `app/page.module.css`:

```css
.main        { align-items: center; }
.right_block { width: 75%; height: 68vh; position: sticky; top: 30%; align-self: flex-start; }
```

`top: 30%` on a sticky element resolves against the viewport height, so the sticky column is
pushed down to `0.30 × 900 = 270 px` as soon as its containing block (`.main`) is tall enough to
allow the shift. `.main`'s height = the taller column = `.left_block`, so:

| cards in left column | `.right_block` top | map frame top | first card top |
|---|---|---|---|
| 1 (main 612 px tall) | 135 (clamped — no room to stick) | 139 | 145 |
| 2 (`main` 759 px) | **270** | 274 | 145 |
| 7 (`main` 2655 px) | **270** | 274 | 145 |

i.e. the map jumps ~135 px down the moment a second card exists, and it stays glued at 30 % of
the viewport while the page scrolls. Same class of bug on mobile (`top: 0` → the map slides under
the sticky header; today the mobile map is actually ~300 px taller than its 50 vh column and the
card strip overlaps it).

Secondary defects found while measuring:
- `width: 25% + 75% + 10px gap` > 100 % → the map column silently loses a few px to flex shrink;
- `.block` height `67.5vh` vs `.right_block` `68vh` (the 4 px `padding-top` was patching this);
- map column has no top/right/bottom breathing room and the map is a bare square canvas
  (no rounded corners, no white frame like the card).

---

## 2. Changes

### A. Remove the Reset pill (3 files, no behaviour loss)

**`components/amenityFilter/AmenityFilter.js`**
- destructure only `{ selectedAmenities, toggleAmenity }` from `useFilter()`;
- delete `const count = selectedAmenities.length`;
- delete the `{count > 0 && (<button className={styles.reset} …>)}` block.

**`components/amenityFilter/AmenityFilter.module.css`**
- delete `.reset` and `.reset:hover` (lines 56-74).

**`app/context/FilterContext.js`**
- drop `resetAmenities` from the default context value, the `useCallback` (line 37) and the
  `useMemo` value + deps (lines 46-47).

Nothing else reads `resetAmenities`. `DetailedAmenityFilter` keeps its own `applyAmenities`.
Selecting/deselecting pills keeps working through `toggleAmenity`.

### B. Map column layout — `app/page.module.css`

```css
.main {
  ...
  align-items: flex-start;          /* was: center — top-align both columns */

  /* Shared metrics (single source of truth, mirrored by the card in
     components/housesMenu/houses.module.css) */
  --gutter: 10px;                   /* = the card's own margin-top on the left column */
  --card-radius: 26px;              /* card outer radius  */
  --card-frame: 11px;               /* card white frame   */
  --header-h: 15vh;                 /* header is sticky with height:15% of the viewport */
}

.left_block {
  width: 25%;
  min-width: 0;                     /* shrink instead of overflowing */
  height: 100%;
  padding-left: 5px;
  z-index: 1;
}

.right_block {
  flex: 1 1 0;                      /* takes the rest: 25% + gap + rest = 100%, no shrink fight */
  min-width: 0;
  height: 68vh;
  padding: var(--gutter) var(--gutter) var(--gutter) 0;  /* top = card margin, right + bottom */
  position: sticky;
  top: var(--header-h);             /* == its own static position → zero jump, still follows scroll */
  align-self: flex-start;
}
```

`top: var(--header-h)` is the key: at rest the sticky element's flow position is already
`15vh` (main starts right under the header), so sticky can never displace it; when the page
scrolls it parks flush under the header instead of at 30 % of the viewport.

### C. White frame + rounded map — `app/page.module.css` (same file)

```css
.map_place {                        /* the white card frame, like .card_container */
  height: 100%;
  padding: var(--card-frame);       /* 11px gap between frame and map — as photo ↔ card */
  border-radius: var(--card-radius);/* 26px, same as the house card */
  background: #fff;
  box-shadow: 0 1px 2px rgba(17,21,30,.05), 0 26px 50px -20px rgba(17,21,30,.32);
}

.block {                            /* the "photo" of the card: clipped + rounded */
  width: 100%;
  height: 100%;
  border-radius: calc(var(--card-radius) - var(--card-frame)); /* 15px, concentric */
  overflow: hidden;                 /* clips the MapTiler canvas to the corners */
  background-color: cadetblue;
}
```

`.block` keeps `height: 100%`, so the map fills the frame instead of the old 67.5 vh mismatch.
MapTiler is not touched: its ResizeObserver re-sizes the canvas to the new container
(canvas 1081×570 in the 1512×900 test).

### D. Mobile (`@media (max-width: 768px)` / `max-width: 320px`) — same file

Same disease, so the same cure, minimum diff:

```css
.main       { --header-h: 15.6vh; flex-direction: column-reverse; gap: 0;
              height: auto; }        /* was 87% — the stack is taller than the viewport */
.left_block { width: 100%; display: flex; overflow-x: auto; white-space: nowrap; gap: 10px; }
.right_block{ position: static; flex: none; width: 100%; height: auto; padding: var(--gutter); }
.map_place  { height: auto; }        /* the map's height comes from .block */
.block      { height: 86vh; }        /* unchanged visible map height */
```

Effect: the map sits in normal flow (never displaced), the frame/radius/white border apply
there too, and the card strip no longer overlaps the map. `height: auto` makes the mobile page
scroll naturally instead of overflowing a fixed 87 % box.

---

## 3. Verification plan

1. `npm run build` — no build/lint regressions.
2. Browser at 1512×900 and 390×844 (dev server already running on :3000):
   - `Reset` string absent under `header`; clicking a pill selects, clicking again deselects;
     map markers still filter (`selectedAmenities` → `matchesAmenities`);
   - measure map frame vs first card top with 1 / 3 / 7 cards → identical (145 / 145 / 145);
   - right and bottom frame gaps = 10 px; inner canvas gaps = 11 px; corners clipped;
   - scroll the card list → map parks under the header, no sideways/vertical drift;
   - after a filter change the map still re-renders markers (no resize/offset blow-up).
3. Screenshots before/after for the report.

Measured result of the prototype CSS already applied in-browser (same numbers as above):
frame top = 145 = `card0.top` for 1, 3 and 7 cards; frame 1103×592 inside a 1113×612 column
(10 px on top/right/bottom), canvas 1081×570 (11 px frame).

---

## 4. Decisions baked into this plan (say the word to change any)

1. **Sticky kept.** The map still follows the page under the header (`top: 15vh`), it just no
   longer jumps. Alternative: `position: static` — map scrolls away with the cards.
2. **Card shadow added to the map frame** (one property) so the white frame matches the card,
   which you didn't ask for. Easy to drop.
3. **`--header-h` is coupled to the header's `height: 15%`.** If the header height changes, this
   var must follow (or I can switch both to a single `--header-h` in `globals.css`).
4. **Numbers duplicated in `page.module.css`.** Optional cleanup: make
   `houses.module.css` read `--card-radius` / `--card-frame` (with fallbacks) and set
   `--radius-media: calc(var(--card-radius) - var(--card-frame))`, so card and map frame can
   never drift apart.
5. **Not touched:** mobile card strip widths (cards shrink to ~70 px inside the horizontal
   strip — pre-existing, unrelated), map height 68 vh, map controls/attribution positions.

## 5. Out of scope / follow-ups worth a separate ticket

- mobile card strip: `min-width`/`flex: none` on `.card_container` so cards keep 416 px;
- map controls & attribution insets now sit inside a rounded frame (marginal, cosmetic).

---

## Addendum (2026-11-07, follow-up: map fills the column, uniform 10px gutters)

Backup of the file touched: `app/page.module.css.bak-20261107-004538`.

Measured before, at 1920×1200: card right edge 421, map frame left 486 → **65px** gap
(the 25%-wide card column absorbed 55px of slack plus the 10px flex gap); map frame
1409×796 ending at y=986, i.e. a 214px band below it; footer 17px, one 14px line.

Changes in `app/page.module.css`:
- `.main`: added `--card-w: 416px` (mirror of the card's `--card-w`) and
  `--footer-h: 17px` (the single-line footer under `<main>`).
- `.left_block`: `width: 25%` → `width: min(calc(var(--card-w) + var(--gutter)), 25%)`
  and `padding-left: 5px` → `var(--gutter)`. The card column is now exactly one card +
  one gutter wide, so all slack goes to the map and the card→map gap is `--gutter` at
  every desktop width.
- `.right_block`: `height: 68vh` → `height: calc(100vh - var(--header-h) - var(--footer-h))`
  — the column fills the viewport from under the header down to `--gutter` above the footer.

Measured after (1920×1200): card→map 10px, map→content edge 10px, map frame
1459×983 (canvas 1437×961, MapTiler resized itself), frame top 190 = first card top,
frame bottom 1173 (= 1200 − 17 footer − 10 gutter); scrolled to the end the gap to the
footer is exactly 10px. At 1512×900 and 1280×800 the same three gaps are 10/10/10.
With a single card the document is exactly 1200px tall (no scrollbar, no forced scroll).

Note: `--footer-h` is coupled to the footer line height (14px font → 17px) exactly like
`--header-h` is coupled to the header's `height: 15%`. If the footer text ever wraps or
its font changes, update the var.
