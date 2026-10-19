# Detailed Amenities Filter Window ("more..") Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add a "more.." button to the right of the header amenities pill row that opens a modal with ALL filter pills (header pills + per-room amenities from `roomAmenityCatalog.js`) grouped by type, with Clear / X / Apply controls; Apply commits the selection and the map refetches/filters markers accordingly.

**Architecture:** The modal keeps a local *draft* selection (opened seeded from the live `selectedAmenities`), so X/Escape discards changes and only **Apply** writes back via a new `applyAmenities(ids)` method on `FilterContext`. Room-amenity ids get end-to-end support: client param builder (`buildAmenityParams`), client-side marker gate (`matchesAmenities`), and server Mongoose query (`utils/filters.js` → `rooms_info.$elemMatch.amenities.$all`). The existing fetch/refetch machinery in `app/(home)/page.js` is reused with one fix to the refetch condition.

**Tech Stack:** Next.js App Router, React client components, CSS modules, Mongoose (existing 2dsphere + projection already includes `rooms_info`).

**Existing context (verified by reading code):**
- `app/header.js` renders `<PriceFilter />` + `<AmenityFilter />` inside `.filterRow`. Desktop: centered flex row (`gap:12px`). Mobile: `.filterRow { display: contents }` and `AmenityFilter .wrap` is `position:absolute; left:16px; right:16px; top:62px`.
- `components/amenityFilter/AmenityFilter.js` renders `AMENITY_TAGS` pills, toggling via `useFilter()` (`selectedAmenities`, `toggleAmenity`, `resetAmenities`).
- `components/amenityFilter/amenityTags.js` — single source of truth: `AMENITY_TAGS` (ac, parking, rooms:N, beds tags, view tags), `buildAmenityParams(ids)` → URL params, `matchesAmenities(prop, ids)` → client-side gate.
- `components/shared/roomAmenityCatalog.js` — `AMENITY_CATEGORIES` (6 categories, 29 ids like `appliances.tv`); stored per room in `rooms_info[].amenities`.
- `utils/filters.js` — `FILTER_WHITELIST` maps URL params → Mongoose clauses.
- `app/api/route.js` — projection already includes `rooms_info: 1` (needed for client-side gating; no change needed).
- `app/(home)/page.js` — `fetchWithinBounds` builds the query from `buildAmenityParams(selectedAmenitiesRef.current)`; `marks` useMemo gates loaded markers via `matchesAmenities`; effect on `[maxPrice, selectedAmenities]` refetches (force=true) only when price widened or `selectedAmenities.length < prev.length`.

**Files to change:**
- Modify: `app/context/FilterContext.js`
- Modify: `components/amenityFilter/amenityTags.js`
- Modify: `utils/filters.js`
- Modify: `app/header.js`
- Modify: `components/amenityFilter/AmenityFilter.module.css` (mobile row width only)
- Modify: `app/(home)/page.js` (refetch condition only)
- Create: `components/amenityFilter/DetailedAmenityFilter.js`
- Create: `components/amenityFilter/DetailedAmenityFilter.module.css`
- Create: `components/amenityFilter/AmenityFilterArea.js`
- Create: `components/amenityFilter/AmenityFilterArea.module.css`

**Backups (per project convention):** before each modification, `cp <file> <file>.bak` — do this once per file at the start of its task.

---

### Task 1: Add `applyAmenities` to FilterContext

**Objective:** Give the modal a way to commit a whole selection list at once (the header row keeps using `toggleAmenity`).

**Files:**
- Modify: `app/context/FilterContext.js`

**Step 1: Backup** — `cp app/context/FilterContext.js app/context/FilterContext.js.bak`

**Step 2: Implement** — add after `resetAmenities`:

```js
  // Whole-list commit used by the detailed filter modal (Apply button).
  const applyAmenities = useCallback((ids) => {
    const list = Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : []
    setSelectedAmenities([...new Set(list)])
  }, [])
```

and include it in the memoized value:

```js
  const value = useMemo(
    () => ({ maxPrice, setMaxPrice: setMaxPriceClamped, selectedAmenities, toggleAmenity, resetAmenities, applyAmenities }),
    [maxPrice, setMaxPriceClamped, selectedAmenities, toggleAmenity, resetAmenities, applyAmenities]
  )
```

Also add `applyAmenities: () => {},` to the default context object at the top.

**Step 3: Verify** — `npm run lint` passes; no other file references it yet (compile check only).

---

### Task 2: Extend amenityTags.js with room-amenity tags

**Objective:** Make `buildAmenityParams` and `matchesAmenities` understand the 29 per-room amenity ids, without changing what the header row displays.

**Files:**
- Modify: `components/amenityFilter/amenityTags.js`

**Step 1: Backup** — `cp components/amenityFilter/amenityTags.js components/amenityFilter/amenityTags.js.bak`

**Step 2: Implement**

Top of file, after existing imports/definitions:

```js
import { AMENITY_CATEGORIES } from '@/components/shared/roomAmenityCatalog'

// Per-room amenity pills (source: roomAmenityCatalog.js). Ids are namespaced
// per category, so e.g. 'appliances.hair_dryer' and 'bathroom.hair_dryer'
// are two distinct pills.
export const ROOM_AMENITY_TAGS = AMENITY_CATEGORIES.flatMap((cat) =>
  cat.items.map((item) => ({ id: item.id, label: item.label, type: 'roomAmenity' }))
)

// Every filterable tag — header tags + room amenities.
const ALL_TAGS = [...AMENITY_TAGS, ...ROOM_AMENITY_TAGS]
```

In `buildAmenityParams`, change the lookup to `ALL_TAGS.find(...)` and add a branch before the final `else`:

```js
    } else if (tag.type === 'roomAmenity') {
      // Room amenities: ?roomAmenities=appliances.tv,appliances.air_conditioning
      params.roomAmenities = params.roomAmenities
        ? `${params.roomAmenities},${tag.id}`
        : tag.id
    } else {
```

Rewrite `matchesAmenities` so room-amenity ids are checked as a GROUP (a property matches when at least one room contains ALL selected room amenities), while general tags keep their per-tag checks:

```js
export function matchesAmenities(prop, selectedIds) {
  if (!selectedIds || selectedIds.length === 0) return true

  const generalTags = []
  const roomAmenityIds = []
  for (const id of selectedIds) {
    const tag = ALL_TAGS.find((t) => t.id === id)
    if (!tag) continue
    if (tag.type === 'roomAmenity') roomAmenityIds.push(id)
    else generalTags.push(tag)
  }

  for (const tag of generalTags) {
    if (tag.type === 'boolean') {
      if (prop[tag.field] !== true) return false
    } else if (tag.type === 'number') {
      if (Number(prop[tag.field]) < tag.value) return false
    } else if (tag.type === 'beds') {
      if (!matchesBeds(prop, tag)) return false
    } else {
      // view — case-insensitive, trimmed
      if (String(prop[tag.field] ?? '').trim().toLowerCase() !== tag.value.toLowerCase()) return false
    }
  }

  if (roomAmenityIds.length > 0) {
    const rooms = Array.isArray(prop.rooms_info) ? prop.rooms_info : []
    return rooms.some((room) => {
      const has = new Set(Array.isArray(room?.amenities) ? room.amenities : [])
      return roomAmenityIds.every((id) => has.has(id))
    })
  }

  return true
}
```

**Step 3: Verify** — `npm run lint`. Quick node sanity check (optional):
`node -e "import('./components/amenityFilter/amenityTags.js').then(m => console.log(Object.keys(m.buildAmenityParams(['ac','appliances.tv'])), m.matchesAmenities({ac:true, rooms_info:[{amenities:['appliances.tv']}]}, ['ac','appliances.tv'])))"`
Expected: `{ ac: 'true', roomAmenities: 'appliances.tv' }` and `true`.

---

### Task 3: Server-side `roomAmenities` filter in utils/filters.js

**Objective:** `?roomAmenities=a,b` → Mongoose clause "at least one room has ALL of these amenities".

**Files:**
- Modify: `utils/filters.js`

**Step 1: Backup** — `cp utils/filters.js utils/filters.js.bak`

**Step 2: Implement**

Import at top:

```js
import { ALL_AMENITY_IDS } from '@/components/shared/roomAmenityCatalog'
```

Add to `FILTER_WHITELIST`:

```js
  // Per-room amenities — ?roomAmenities=appliances.tv,appliances.air_conditioning
  // (tag source: components/amenityFilter/amenityTags.js, ROOM_AMENITY_TAGS)
  roomAmenities: { field: 'rooms_info', op: 'roomAmenities', type: 'string' },
```

In `buildFilterQuery`, add a branch right after the `beds` branch:

```js
    // Room amenities — comma-separated catalog ids. Match when at least one
    // room's amenities array contains ALL of them ($all inside $elemMatch).
    // Unknown ids are dropped so junk params can't pollute the query.
    if (def.op === 'roomAmenities') {
      const ids = String(raw)
        .split(',')
        .map((s) => s.trim())
        .filter((s) => ALL_AMENITY_IDS.has(s))
      if (ids.length > 0) {
        filter.rooms_info = { $elemMatch: { amenities: { $all: ids } } }
      }
      continue
    }
```

**Step 3: Verify** — `npm run lint`. Manual API check later in Task 7.

---

### Task 4: Create the DetailedAmenityFilter modal component

**Objective:** Modal with grouped pills (general groups + catalog categories), Clear, X, Apply; draft state so X/Escape discards.

**Files:**
- Create: `components/amenityFilter/DetailedAmenityFilter.js`
- Create: `components/amenityFilter/DetailedAmenityFilter.module.css`

**Step 1: Component** — full file:

```jsx
"use client"

import { useEffect, useState } from 'react'
import { useFilter } from '@/app/context/FilterContext'
import { AMENITY_TAGS } from './amenityTags'
import { AMENITY_CATEGORIES } from '@/components/shared/roomAmenityCatalog'
import styles from './DetailedAmenityFilter.module.css'

// Header pills grouped by tag type (same order as the header row).
const GENERAL_GROUPS = [
  { label: 'Property', match: (t) => t.type === 'boolean' },
  { label: 'Rooms',    match: (t) => t.type === 'number' },
  { label: 'Beds',     match: (t) => t.type === 'beds' },
  { label: 'Views',    match: (t) => t.type === 'string' },
]

export default function DetailedAmenityFilter({ open, onClose }) {
  const { selectedAmenities, applyAmenities } = useFilter()
  // Draft selection — only becomes real on Apply.
  const [draft, setDraft] = useState([])

  // Seed the draft from the live selection each time the modal opens.
  useEffect(() => {
    if (open) setDraft([...selectedAmenities])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Escape closes without applying (same as the X button).
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const toggle = (id) =>
    setDraft((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const handleClear = () => setDraft([])
  const handleApply = () => { applyAmenities(draft); onClose() }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Detailed amenities filter">
      <div className={styles.card}>
        <button className={styles.close} onClick={onClose} aria-label="Close filter">×</button>
        <h2 className={styles.title}>Amenities</h2>

        <div className={styles.body}>
          {GENERAL_GROUPS.map((g) => {
            const tags = AMENITY_TAGS.filter(g.match)
            if (tags.length === 0) return null
            return (
              <section key={g.label} className={styles.group}>
                <h3 className={styles.groupTitle}>{g.label}</h3>
                <div className={styles.pillRow}>
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      className={draft.includes(tag.id) ? styles.pillOn : styles.pill}
                      onClick={() => toggle(tag.id)}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </section>
            )
          })}

          {AMENITY_CATEGORIES.map((cat) => (
            <section key={cat.label} className={styles.group}>
              <h3 className={styles.groupTitle}>{cat.label}</h3>
              <div className={styles.pillRow}>
                {cat.items.map((item) => (
                  <button
                    key={item.id}
                    className={draft.includes(item.id) ? styles.pillOn : styles.pill}
                    onClick={() => toggle(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className={styles.footer}>
          <button className={styles.clearBtn} onClick={handleClear}>Clear</button>
          <button className={styles.applyBtn} onClick={handleApply}>Apply</button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: CSS** — `DetailedAmenityFilter.module.css`:

```css
/* Full-screen overlay above the header (z-index 10) and map (z-index 20). */
.overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
}

.card {
    position: relative;
    width: min(600px, 100%);
    max-height: 82vh;
    display: flex;
    flex-direction: column;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
}

/* X — right-upper corner of the window. */
.close {
    position: absolute;
    top: 8px;
    right: 10px;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: #555;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
}

.close:hover {
    background: #eee;
    color: #000;
}

.title {
    margin: 0;
    padding: 16px 20px 4px;
    font-size: 18px;
    color: #181A18;
}

.body {
    overflow-y: auto;
    padding: 8px 20px 16px;
}

.group {
    margin-top: 14px;
}

.groupTitle {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #666;
}

.pillRow {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.pill,
.pillOn {
    min-height: 34px;
    padding: 7px 13px;
    border-radius: 17px;
    border: 1px solid #ccc;
    background: #f4f4f4;
    color: #333;
    cursor: pointer;
    font: inherit;
    font-size: 13px;
    white-space: nowrap;
}

.pill:hover {
    background: #e8e8e8;
}

.pillOn,
.pillOn:hover {
    background: #0a6e8a;
    border-color: #0a6e8a;
    color: #fff;
}

/* Sticky footer so Clear/Apply stay reachable while the body scrolls. */
.footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 14px 20px;
    border-top: 1px solid #e5e5e5;
    background: #fff;
}

.clearBtn,
.applyBtn {
    min-height: 38px;
    padding: 8px 22px;
    border-radius: 19px;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
}

.clearBtn {
    border: 1px solid #ccc;
    background: #fff;
    color: #333;
}

.clearBtn:hover {
    background: #f0f0f0;
}

.applyBtn {
    border: 1px solid #0a6e8a;
    background: #0a6e8a;
    color: #fff;
}

.applyBtn:hover {
    background: #095d75;
}
```

**Step 3: Verify** — `npm run lint`. (Visual check happens in Task 7 once it's wired into the header.)

---

### Task 5: "more.." button + AmenityFilterArea wrapper, wire into header

**Objective:** "more.." button as the next separate element to the right of the amenities pill row; opens the modal. Header layout preserved on desktop and mobile.

**Files:**
- Create: `components/amenityFilter/AmenityFilterArea.js`
- Create: `components/amenityFilter/AmenityFilterArea.module.css`
- Modify: `app/header.js`
- Modify: `components/amenityFilter/AmenityFilter.module.css` (mobile row width only)

**Step 1: Backups** — `cp app/header.js app/header.js.bak` and `cp components/amenityFilter/AmenityFilter.module.css components/amenityFilter/AmenityFilter.module.css.bak`

**Step 2: Wrapper component** — owns the open state so `header.js` stays a server component:

```jsx
"use client"

import { useState } from 'react'
import AmenityFilter from './AmenityFilter'
import DetailedAmenityFilter from './DetailedAmenityFilter'
import styles from './AmenityFilterArea.module.css'

export default function AmenityFilterArea() {
  const [detailedOpen, setDetailedOpen] = useState(false)

  return (
    <>
      <AmenityFilter />
      <button className={styles.moreBtn} onClick={() => setDetailedOpen(true)}>more..</button>
      <DetailedAmenityFilter open={detailedOpen} onClose={() => setDetailedOpen(false)} />
    </>
  )
}
```

**Step 3: Wrapper CSS** — `AmenityFilterArea.module.css`:

```css
/* Desktop: in-flow flex item right after the pill row (.filterRow is a flex row). */
.moreBtn {
    min-height: 36px;
    padding: 8px 14px;
    border-radius: 18px;
    border: 1px solid #ccc;
    background: #fff;
    color: #0a6e8a;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    flex: 0 0 auto;
}

.moreBtn:hover {
    background: #eef3f5;
}

/* Mobile: .filterRow is display:contents, so position the button absolutely
   to the right of the pill row (which is left:16px / right:84px there). */
@media (max-width: 768px) {
    .moreBtn {
        position: absolute;
        right: 16px;
        top: 62px;
        z-index: 21;
    }
}
```

**Step 4: header.js** — swap the import and the element:

```jsx
import AmenityFilterArea from '@/components/amenityFilter/AmenityFilterArea'
...
            <div className={styles.filterRow}>
                <PriceFilter />
                <AmenityFilterArea />
            </div>
```

(remove the now-unused `AmenityFilter` import)

**Step 5: AmenityFilter.module.css mobile tweak** — make room for the button on mobile (inside the existing mobile styles, i.e. the base `.wrap` rule that applies to mobile; desktop overrides it already):

Change in `.wrap`:
```css
    right: 16px;
```
to
```css
    right: 92px; /* leave room for the "more.." button (absolute, right:16px) on mobile */
```
The desktop `@media (min-width: 769px)` block already resets `.wrap` to `position: relative; left:0; right:auto`, so this does not affect desktop.

**Step 6: Verify** — `npm run lint`; run dev server and confirm the button sits right of the pill row on both breakpoints (final visual pass in Task 7).

---

### Task 6: Fix the refetch condition in app/(home)/page.js

**Objective:** After Apply, the map must always show correct markers. The current effect only refetches when the selection *shrinks by count*; swapping pills of equal size (or adding room-amenity ids while removing header ids) leaves stale markers until the next pan/zoom.

**Files:**
- Modify: `app/(home)/page.js` (~lines 318–335, the `[maxPrice, selectedAmenities]` effect)

**Step 1: Backup** — `cp 'app/(home)/page.js' 'app/(home)/page.js.bak'` (note: a `.bak` already exists in this dir; if it does, use `page.js.bak-<timestamp>`).

**Step 2: Implement** — replace the narrowing check:

```js
    const priceWidened = maxPrice > prevPrice
    // Refetch whenever ANY previously-selected id was removed (the result set
    // may have widened or changed shape). Pure additions need no fetch — the
    // client-side gate in `marks` handles them instantly.
    const amenitiesNeedRefetch = prevAmenities.some((id) => !selectedAmenities.includes(id))
    if (prevPrice === maxPrice && !priceWidened && !amenitiesNeedRefetch) {
      // First run (or no change) — nothing to do.
      return
    }
```

Everything else in the effect stays as-is (`debouncedViewportFetch(bounds, true)` already clears `loadedIdsRef` + region caches).

**Step 3: Verify** — `npm run lint`. Behavior checked manually in Task 7 (swap one header pill for another, watch the Network tab).

---

### Task 7: Build, lint, and end-to-end verification

**Objective:** Prove the feature works against the real app and DB.

**Step 1: Static checks**
```bash
npm run lint
npm run build
```
Expected: both pass with no new errors.

**Step 2: Manual checklist** (dev server + a browser, with Network tab open):

1. Header: "more.." button renders immediately to the right of the amenities pill row — desktop (in the centered flex row) and mobile (absolute at the row's right end, pills not overlapping it).
2. Click "more.." → modal opens; X visible in the top-right corner. Groups shown: Property, Rooms, Beds, Views, then Furniture & Storage, Appliances & Electronics, Windows & Balcony, Bathroom, For Children, Safety & Privacy — each with its pills.
3. Toggle a few pills (e.g. "A/C" + "TV" + "Balcony"). Click **Clear** → all pills deselect. Re-toggle and click **X** (or press Escape) → modal closes and the header row selection is UNCHANGED (draft discarded).
4. Toggle "A/C" + "TV" (`appliances.tv`) again, click **Apply** → modal closes; header "A/C" pill now shows selected; Network tab shows the next viewport fetch URL containing `ac=true&roomAmenities=appliances.tv`; map markers update to matching properties only.
5. Select two room amenities that no single room has together (e.g. "Crib" + "Safe") → map shows only properties where ONE room contains both; verify against one property in the admin UI.
6. With a selection active, remove one pill from the header row directly → markers filter instantly (client gate) and, because an id was removed, a refetch fires for the current viewport.
7. Mobile viewport (devtools device mode): button placement, modal scroll, footer buttons reachable.

**Step 3: Optional API spot-check**
```bash
curl "http://localhost:3000/api?minLng=80.4&maxLng=80.5&minLat=5.9&maxLat=6.1&page=1&limit=5&roomAmenities=appliances.tv"
```
Expected: JSON array where every returned property has at least one `rooms_info` entry whose `amenities` includes `appliances.tv`.

---

## Risks, tradeoffs, open questions

- **Hair dryer exists twice** (`appliances.hair_dryer` and `bathroom.hair_dryer`) — by design the ids are namespaced, so they are two independent pills; selecting both requires one room to carry both ids. This matches how admin stores them. No action needed.
- **Modal draft semantics:** X/Escape discards all changes (spec: only Apply commits). Clear only empties the draft; it does not close the window and does not touch the live selection until Apply. If you'd rather have Clear also apply immediately, that's a one-line change in `handleClear`.
- **Always-refetch-on-removal (Task 6):** slightly more API load than before when deselecting pills (force refetch of current viewport), but it guarantees correct markers after any Apply/swap. Pure additions remain fetch-free.
- **No new dependencies, no schema changes.** `rooms_info` is already in the API projection, so client-side gating works without touching `app/api/route.js`.
- **Open question (default chosen):** "property matches" for room amenities = *at least one room has ALL selected amenities* (`$elemMatch + $all`). Alternative: every selected amenity may come from a different room — say the word and the clause becomes N separate `$elemMatch`-style clauses.
