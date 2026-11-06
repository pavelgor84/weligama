# Header Redesign Implementation Plan

**Goal:** Halve the header height, strip the background image and the "Ceylon rooms" title block, switch to a flat #fcfcfc surface with a 1px #dedede bottom border, and move the currency pill down into the same row as the price + amenities filters (with a divider between currency and amenities).

**Architecture:** All changes are CSS/JSX in three files. The header container keeps its sticky positioning; the title block is deleted outright (no other code references it); the currency switcher's absolute position is changed only inside the desktop media query so the mobile stacked layout is untouched.

**Tech Stack:** Next.js App Router, CSS modules.

---

### Task 1: Backups

**Files:**
- `app/header.js` -> `app/header.js.bak-header-redesign`
- `components/header/header.module.css` -> `components/header/header.module.css.bak-header-redesign`
- `components/currencySwitcher/CurrencySwitcher.module.css` -> `components/currencySwitcher/CurrencySwitcher.module.css.bak-header-redesign`

```bash
cp app/header.js app/header.js.bak-header-redesign
cp components/header/header.module.css components/header/header.module.css.bak-header-redesign
cp components/currencySwitcher/CurrencySwitcher.module.css components/currencySwitcher/CurrencySwitcher.module.css.bak-header-redesign
```

### Task 2: `app/header.js` — remove the title block

Delete the whole `<div className={styles.title}>...</div>` (lines 15-22) and its nothing else. Result:

```jsx
import styles from '../components/header/header.module.css'
import CurrencySwitcher from '@/components/currencySwitcher/CurrencySwitcher'
import PriceFilter from '@/components/priceFilter/PriceFilter'
import AmenityFilterArea from '@/components/amenityFilter/AmenityFilterArea'

export default function Header() {
    return (
        <div className={styles.container}>
            <CurrencySwitcher />
            <div className={styles.filterRow}>
                <PriceFilter />
                <AmenityFilterArea />
            </div>
        </div>
    )
}
```

### Task 3: `components/header/header.module.css` — container restyle + title styles removed

New full file content:

```css
.container {
    margin: auto;
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fcfcfc;
    height: 15%;              /* was 30% — half the height */
    padding: 0px;             /* was 0 0 100px 0 */
    border-bottom: 1px solid #dedede;   /* new bottom line */
    /* removed: background url(./img/sunset_beach.jpg), rgba background-color,
       border-bottom-left/right-radius: 8px, color: rgb(207,204,204) */
}

/* Mobile: wrapper is transparent to layout (display: contents),
   children keep their own absolute positions. */
.filterRow {
    display: contents;
}

/* .title / .title_header / .title_text / .info_text — deleted entirely. */

@media (max-width: 768px) {
    .container {
        height: 15.6%; /* unchanged: mobile is a stacked price/amenities layout */
        padding: 0px;
    }
}

/* Desktop: price + amenities share one centered row at the header bottom,
   price button on the left. Currency pill (absolute, bottom: 12px) sits in
   this same row at the right. */
@media (min-width: 769px) {
    .filterRow {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        bottom: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 20;
    }

    /* Vertical divider between the currency pill and the amenities strip.
       filterRow's div children in order: PriceFilter .wrap, AmenityFilter .wrap
       (the "more.." button is a <button>, not matched). */
    .filterRow > div:nth-of-type(2) {
        border-left: 1px solid #dedede;
        padding-left: 12px;
    }
}
```

Notes:
- `height: 15%` = exactly half of the old `30%`.
- Mobile keeps `15.6%` (two stacked rows: price pill, then amenities strip) — halving it would break that layout.
- The divider is scoped to the desktop media query so it never appears in the mobile stacked layout.

### Task 4: `components/currencySwitcher/CurrencySwitcher.module.css` — align pill to the filter row (desktop only)

Change `.wrap`:

```css
.wrap {
    position: absolute;
    top: 14px;      /* mobile: unchanged, stays in the price-pill row */
    right: 16px;
    z-index: 20;
    font-size: 14px;
    font-weight: 600;
}

/* Desktop: drop into the same bottom row as .filterRow (bottom: 12px). */
@media (min-width: 769px) {
    .wrap {
        top: auto;
        bottom: 12px;
    }
}
```

Why desktop-only: on mobile the bottom-right corner is occupied by the "more.." button (top: 62px, right: 16px); moving the currency pill down there would collide with it.

### Task 5: Verify

```bash
npm run lint
npm run build
```

Manual check (dev server):
- Desktop: header ~half as tall; flat #fcfcfc background; no rounded corners; 1px #dedede line at the bottom; price pill, amenities strip, and currency pill all on one horizontal line; thin vertical #dedede divider between currency and amenities.
- Mobile: layout unchanged (price pill row + amenities strip), no divider, no collision with "more..".
