# Bed Types per Room — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Let owners add typed beds (King size / Double bed / Single bed / Bunk bed / Children bed) to each room, max 15 per room, constrained in frontend and server side.

**Architecture:** Beds live inside the existing `rooms_info` subdocument as a new `beds: [String]` array — no new API route, no new collection. The admin forms render an "Add the bed" button + dropdown per room; the server validates length (≤15) and membership (one of the 5 types) on every write path that touches `rooms_info`.

**Tech Stack:** Next.js 14 App Router, React 18 client components, Mongoose 8, CSS modules. No new dependencies.

---

## Current context / assumptions

- DB document (`/home/kali/Documents/document.json`): property doc has `rooms_info: [{ info, id }]` and `bedroom` (total bedroom count). Beds are stored per room inside `rooms_info[i].beds`.
- Existing caps to mirror: `MAX_ROOMS = 10` in `app/api/upload/route.js:10`, `app/api/add_images/route.js:10`, `app/api/upload_room/route.js:9`, `app/api/delete/route.js:9`; `MAX_IMAGES = 15` in the same files. New cap: `MAX_BEDS_PER_ROOM = 15`.
- Write paths that touch `rooms_info`:
  - `POST /api/upload` (`app/api/upload/route.js`) — create; `Restate.create(obj_props)` (line 67).
  - `POST /api/add_images` (`app/api/add_images/route.js`) — info update via `INFO_FIELDS` allowlist + `$set` (lines 14-18, 55-66, 80).
  - `POST /api/delete` (`app/api/delete/route.js`) — image delete also `$set`s `rooms_info` from the client body (line 38).
- Read path: `POST /api/get_data_edit` returns the whole doc, so `beds` comes back automatically; `adminEdit.normalize()` must map it to a safe array.
- The edit page's per-room "Save" button references `form="info_form"` (`components/adminEdit/adminEdit.js:288`) but **no form with that id exists** — the button currently does nothing. We fix this as part of the feature (beds need a save path in edit mode).
- Bed type strings are stored exactly as: `"King size"`, `"Double bed"`, `"Single bed"`, `"Bunk bed"`, `"Children bed"` (the request's "Bbunk bed" is treated as a typo for "Bunk bed" — see Open questions).
- Backup rule (user preference): every modified file gets a `.bak` copy before editing.

**Files likely to change:**

| File | Change |
|---|---|
| `components/shared/bedTypes.js` (new) | Shared `BED_TYPES`, `MAX_BEDS_PER_ROOM`, `isValidBeds()` |
| `components/shared/defaultPropertyState.js` | `beds: []` default for new rooms |
| `models/Restate.js` | Schema: `rooms_info: [{ info, id, beds }]` + enum + max 15 |
| `app/api/upload/route.js` | Server-side beds validation on create |
| `app/api/add_images/route.js` | Add `beds` handling to INFO_FIELDS path + validation |
| `app/api/delete/route.js` | Validate `rooms_info` (incl. beds) before `$set` |
| `components/adminMenu/adminMenu.js` | Bed UI in room section (add form) |
| `components/adminEdit/adminEdit.js` | Bed UI in room section (edit form) + fix `info_form` submit |
| `app/(info)/list/page.js` | Optional display of beds on public listing (see Open questions) |

No changes needed: `app/api/upload_room/route.js`, `app/api/get_data_edit/route.js`, `app/api/delete_asset/route.js`.

---

## Task 1: Shared bed constants + validation helper

**Objective:** Single source of truth for bed types, the cap, and a reusable validator (used by both API routes).

**Files:**
- Create: `components/shared/bedTypes.js` (backup rule N/A — new file)

**Step 1: Write the file**

```js
// components/shared/bedTypes.js
// Shared bed-type constants for the admin UI and API validation.
// Stored values are exactly these strings (case-sensitive).

export const BED_TYPES = [
    'King size',
    'Double bed',
    'Single bed',
    'Bunk bed',
    'Children bed',
]

// Maximum beds per room — mirrored in models/Restate.js and API routes.
export const MAX_BEDS_PER_ROOM = 15

/**
 * Validate a per-room beds array:
 * - must be an array (or null/undefined → empty)
 * - length <= MAX_BEDS_PER_ROOM
 * - every entry is one of BED_TYPES
 * Returns { ok: true, beds } or { ok: false, error }.
 */
export function isValidBeds(beds) {
    if (beds == null) return { ok: true, beds: [] }
    if (!Array.isArray(beds)) return { ok: false, error: 'beds must be an array' }
    if (beds.length > MAX_BEDS_PER_ROOM) {
        return { ok: false, error: `Maximum ${MAX_BEDS_PER_ROOM} beds per room allowed.` }
    }
    for (const bed of beds) {
        if (!BED_TYPES.includes(bed)) {
            return { ok: false, error: 'Invalid bed type: ' + bed }
        }
    }
    return { ok: true, beds }
}
```

**Step 2: Verify import works in both contexts**

The file uses ESM `export`. It is imported from client components (bundled by webpack — fine) and from API route files (Next.js compiles route handlers as ESM — `app/api/upload/route.js` already uses `import` syntax, so a plain `import { isValidBeds } from '@/components/shared/bedTypes'` works in both).

Run: `npm run lint`
Expected: no new errors.

**Step 3: Commit**

```bash
git add components/shared/bedTypes.js
git commit -m "feat: shared bed types constants and validator"
```

---

## Task 2: Mongoose schema — beds field with enum + cap

**Objective:** Persist `beds` per room; let the DB reject invalid values as a last line of defense.

**Files:**
- Modify: `models/Restate.js:36` (backup first: `cp models/Restate.js models/Restate.js.bak`)

**Step 1: Backup, then edit**

Replace:

```js
    rooms_info: [{ info: String, id: Number }]
```

with:

```js
    rooms_info: [{
        info: String,
        id: Number,
        beds: {
            type: [String],
            enum: ['King size', 'Double bed', 'Single bed', 'Bunk bed', 'Children bed'],
            validate: {
                validator: (v) => Array.isArray(v) && v.length <= 15,
                message: 'Maximum 15 beds per room allowed',
            },
        },
    }]
```

Notes:
- `type: [String]` + `enum` on the element type is standard Mongoose for a capped string array; existing docs without `beds` read as `undefined` (no migration needed).
- The explicit length validator is redundant with the API checks but is the "server-side constraint" backstop — keep it.

**Step 2: Verify**

Run: `npm run build`
Expected: build succeeds (schema change is runtime, but this catches syntax errors).

**Step 3: Commit**

```bash
git add models/Restate.js
git commit -m "feat: rooms_info schema gains beds array (enum + max 15)"
```

---

## Task 3: Default state — new rooms start with `beds: []`

**Objective:** Add-form room objects carry the field so controlled rendering and submission are consistent.

**Files:**
- Modify: `components/shared/defaultPropertyState.js` (backup first)

**Step 1: Backup, then edit**

In `handleAddPerson` (`components/adminMenu/adminMenu.js:30`) the room object is created inline: `{ info: '', id: Date.now() }`. Change it to:

```js
{ info: '', id: Date.now(), beds: [] }
```

(`defaultPropertyState.js` itself needs no change — it only defines top-level defaults; `rooms_info` starts as `[]`.)

**Step 2: Verify**

Run: `npm run lint`
Expected: passes.

**Step 3: Commit**

```bash
git add components/adminMenu/adminMenu.js
git commit -m "feat: new rooms initialize with empty beds array"
```

---

## Task 4: Server-side validation on `/api/upload` (create)

**Objective:** Reject create payloads with >15 beds per room or unknown bed types.

**Files:**
- Modify: `app/api/upload/route.js` (backup first)

**Step 1: Backup, then edit**

Add import at top:

```js
import { isValidBeds } from '@/components/shared/bedTypes'
```

After the existing `MAX_ROOMS` check (after line 38), add:

```js
    // Server-side beds validation: per-room array, max 15, known types only
    if (Array.isArray(obj_props.rooms_info)) {
        for (const room of obj_props.rooms_info) {
            const bedCheck = isValidBeds(room?.beds)
            if (!bedCheck.ok) {
                return NextResponse.json({ success: false, error: bedCheck.error }, { status: 400 })
            }
        }
    }
```

**Step 2: Verify manually**

Start dev server (`npm run dev`), then from a logged-in admin session or with a quick script against the running app:

```bash
curl -X POST http://localhost:3000/api/upload \
  -F 'prop={"mail":"x","name":"T","rooms_info":[{"info":"a","id":1,"beds":["King size"]}],"images":[]}' 
```
Expected: 200 (or the normal flow). Repeat with `"beds":["Queen"]` → 400 `Invalid bed type: Queen`. Repeat with 16 beds → 400 `Maximum 15 beds per room allowed.`

**Step 3: Commit**

```bash
git add app/api/upload/route.js
git commit -m "feat: validate beds server-side on property create"
```

---

## Task 5: Server-side validation on `/api/add_images` (edit info)

**Objective:** The edit path's `INFO_FIELDS` allowlist currently drops anything not listed — add per-room `beds` handling so edited beds persist, validated.

**Files:**
- Modify: `app/api/add_images/route.js` (backup first)

**Step 1: Backup, then edit**

Add import:

```js
import { isValidBeds } from '@/components/shared/bedTypes'
```

In the info-update branch (after the `MAX_ROOMS` check at line 66), add:

```js
            // Server-side beds validation for edited rooms_info
            if (Array.isArray(updateFields.rooms_info)) {
                for (const room of updateFields.rooms_info) {
                    const bedCheck = isValidBeds(room?.beds)
                    if (!bedCheck.ok) {
                        return NextResponse.json({ error: bedCheck.error }, { status: 400 })
                    }
                }
            }
```

`rooms_info` is already in `INFO_FIELDS` (line 17), so `$set` persists the whole array including `beds` — no allowlist change needed.

**Step 2: Verify manually**

With a property existing, POST to `/api/add_images` as its owner with `prop` JSON containing `_id` and one room's `beds: ["Double bed", "Single bed"]`. Expected: 200; re-fetch via `/api/get_data_edit` shows the beds. Then send `beds: ["Queen"]` → 400.

**Step 3: Commit**

```bash
git add app/api/add_images/route.js
git commit -m "feat: validate and persist beds on info update"
```

---

## Task 6: Server-side validation on `/api/delete` (image delete)

**Objective:** The delete route `$set`s `rooms_info` from the client body (`app/api/delete/route.js:38`) — a bypass path for bad bed data. Validate before writing.

**Files:**
- Modify: `app/api/delete/route.js` (backup first)

**Step 1: Backup, then edit**

Add import:

```js
import { isValidBeds } from '@/components/shared/bedTypes'
```

After the existing `MAX_ROOMS` check (lines 42-45), add:

```js
        if (Array.isArray(updateFields.rooms_info)) {
            for (const room of updateFields.rooms_info) {
                const bedCheck = isValidBeds(room?.beds)
                if (!bedCheck.ok) {
                    return NextResponse.json({ error: bedCheck.error }, { status: 400 })
                }
            }
        }
```

**Step 2: Verify manually**

Delete a room image with a payload whose `rooms_info` contains an invalid bed → 400; normal delete still works.

**Step 3: Commit**

```bash
git add app/api/delete/route.js
git commit -m "feat: validate beds on image-delete path"
```

---

## Task 7: AdminMenu (add form) — bed UI in room section

**Objective:** In each added room card, show the current beds, an "Add the bed" button + dropdown of the 5 types, per-bed remove buttons; cap at 15 with alert.

**Files:**
- Modify: `components/adminMenu/adminMenu.js` (backup first)
- Modify: `components/adminMenu/admin_menu.module.css` (backup first — new classes only)

**Step 1: Backup both files.**

**Step 2: Add state + handlers** in `AdminMenu`:

```js
import { BED_TYPES, MAX_BEDS_PER_ROOM } from '../shared/bedTypes'

// pending bed type per room index (dropdown selection before clicking the button)
const [bedSelects, setBedSelects] = useState({})
```

Handlers:

```js
    const handleAddBed = (e, index) => {
        e.preventDefault()
        const type = bedSelects[index]
        if (!type) return
        setProperty(prevState => {
            const newForms = [...prevState.rooms_info]
            const current = newForms[index].beds || []
            if (current.length >= MAX_BEDS_PER_ROOM) {
                alert('Maximum ' + MAX_BEDS_PER_ROOM + ' beds per room allowed.')
                return prevState
            }
            newForms[index] = { ...newForms[index], beds: [...current, type] }
            return { ...prevState, rooms_info: newForms }
        })
        setBedSelects(prev => ({ ...prev, [index]: '' }))
    }

    const handleRemoveBed = (e, index, bedIndex) => {
        e.preventDefault()
        setProperty(prevState => {
            const newForms = [...prevState.rooms_info]
            const beds = [...(newForms[index].beds || [])]
            beds.splice(bedIndex, 1)
            newForms[index] = { ...newForms[index], beds }
            return { ...prevState, rooms_info: newForms }
        })
    }

    const handleBedSelectChange = (e, index) => {
        setBedSelects(prev => ({ ...prev, [index]: e.target.value }))
    }
```

**Step 3: Render the bed block** inside each room card (`property.rooms_info.map`, after the description textarea, before the delete-room container — around line 321):

```jsx
<div className={styles.beds_block}>
    <h3 className={styles.section_title}>Beds in this room</h3>
    {(form.beds || []).length > 0 && (
        <ul className={styles.beds_list}>
            {(form.beds || []).map((bed, bedIndex) => (
                <li key={bedIndex} className={styles.bed_item}>
                    <span>{bed}</span>
                    <button className={styles.bed_remove_btn} onClick={(e) => handleRemoveBed(e, index, bedIndex)}>x</button>
                </li>
            ))}
        </ul>
    )}
    <div className={styles.add_bed_row}>
        <select
            className={styles.text_input}
            value={bedSelects[index] || ''}
            onChange={(e) => handleBedSelectChange(e, index)}
            disabled={(form.beds || []).length >= MAX_BEDS_PER_ROOM}
        >
            <option value="">Select bed type</option>
            {BED_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
            ))}
        </select>
        <button
            className={styles.roomButton}
            onClick={(e) => handleAddBed(e, index)}
            disabled={!bedSelects[index] || (form.beds || []).length >= MAX_BEDS_PER_ROOM}
        >
            Add the bed
        </button>
    </div>
</div>
```

**Step 4: CSS** — append to `admin_menu.module.css`:

```css
.beds_block {
    margin-top: 1rem;
}
.beds_list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
.bed_item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #eff6ff;
    border-radius: 0.375rem;
    padding: 0.375rem 0.75rem;
}
.bed_remove_btn {
    background: none;
    border: none;
    color: #d7113d;
    font-size: 1rem;
    cursor: pointer;
}
.add_bed_row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    margin-top: 0.75rem;
}
```

**Step 5: Verify in browser** (`npm run dev` → `/admin`): add a room, pick "King size", click "Add the bed" — chip appears; repeat to 15 — dropdown + button disable and alert on overflow attempt; remove a bed; save property; confirm `rooms_info[i].beds` persisted (check via `/api/get_data_edit` or DB).

**Step 6: Commit**

```bash
git add components/adminMenu/adminMenu.js components/adminMenu/admin_menu.module.css
git commit -m "feat: add bed selection UI to admin add-form room section"
```

---

## Task 8: AdminEdit (edit form) — bed UI + fix broken per-room Save

**Objective:** Same bed UI in the edit page's room cards; make the existing "Save" button actually submit by adding `id="info_form"` to the main form.

**Files:**
- Modify: `components/adminEdit/adminEdit.js` (backup first)
- Modify: `components/adminEdit/admin_edit.module.css` (backup first — same new classes as Task 7, copied into this module)

**Step 1: Backup both files.**

**Step 2: State + handlers** (mirror Task 7):

```js
import { BED_TYPES, MAX_BEDS_PER_ROOM } from '../shared/bedTypes'

const [bedSelects, setBedSelects] = useState({})
```

```js
    const handleAddBed = (e, index) => {
        e.preventDefault()
        const type = bedSelects[index]
        if (!type) return
        setProperty(prevState => {
            const newForms = [...(prevState.rooms_info || [])]
            if (!newForms[index]) return prevState
            const current = newForms[index].beds || []
            if (current.length >= MAX_BEDS_PER_ROOM) {
                alert('Maximum ' + MAX_BEDS_PER_ROOM + ' beds per room allowed.')
                return prevState
            }
            newForms[index] = { ...newForms[index], beds: [...current, type] }
            return { ...prevState, rooms_info: newForms }
        })
        setBedSelects(prev => ({ ...prev, [index]: '' }))
    }

    const handleRemoveBed = (e, index, bedIndex) => {
        e.preventDefault()
        setProperty(prevState => {
            const newForms = [...(prevState.rooms_info || [])]
            if (!newForms[index]) return prevState
            const beds = [...(newForms[index].beds || [])]
            beds.splice(bedIndex, 1)
            newForms[index] = { ...newForms[index], beds }
            return { ...prevState, rooms_info: newForms }
        })
    }

    const handleBedSelectChange = (e, index) => {
        setBedSelects(prev => ({ ...prev, [index]: e.target.value }))
    }
```

**Step 3: `normalize()`** — add (around line 203):

```js
            rooms_info: Array.isArray(obj.rooms_info)
                ? obj.rooms_info.map(r => ({ ...r, beds: Array.isArray(r.beds) ? r.beds : [] }))
                : [],
```

(replaces the existing `rooms_info` line).

**Step 4: Fix the Save button target.** The per-room Save button (`adminEdit.js:288`) uses `form="info_form"` but no such form exists. Add `id="info_form"` to the main form element (line 468):

```jsx
<form id='submit_form' id="info_form" ...>
```

— i.e. change it to a single id that the button references: use `id="info_form"` (keep `submit_form` if anything else references it — check first with `search_files("submit_form")`; if only the right-side submit button uses it, give the form both ids via two elements is invalid HTML, so pick one: keep `id='submit_form'` and change the per-room buttons to `form="submit_form"` instead). **Decision:** change the per-room Save buttons from `form="info_form"` to `form="submit_form"` — one-line fix, no form id change.

**Step 5: Render the bed block** in each room card (inside the `rooms` map, after the description textarea, before the Save button):

Same JSX as Task 7 Step 3, using `property.rooms_info[index]?.beds || []` for the list and the same handlers with `index`.

**Step 6: CSS** — append the same `.beds_block / .beds_list / .bed_item / .bed_remove_btn / .add_bed_row` classes to `admin_edit.module.css`.

**Step 7: Verify in browser** (`npm run dev` → `/admin/edit`): select a property, add/remove beds in a room, click Save — expect POST to `/api/add_images`, then `fetch_data()` reload shows the beds. Also confirm the existing room-description Save now works (it was dead before).

**Step 8: Commit**

```bash
git add components/adminEdit/adminEdit.js components/adminEdit/admin_edit.module.css
git commit -m "feat: bed selection UI in admin edit room section; fix per-room save"
```

---

## Task 9: (Optional) Display beds on the public listing

**Objective:** Show bed types on the public property page so the data is actually visible to users.

**Files:**
- Modify: `app/(info)/list/page.js` (backup first) — where `rooms_info[index].info` is rendered (line 53).

**Step 1: Backup, then render** after the room info div:

```jsx
{asset.rooms_info[index]?.beds?.length > 0 && (
    <div className={styles.room_beds}>Beds: {asset.rooms_info[index].beds.join(', ')}</div>
)}
```

Plus a small `.room_beds` class in that page's CSS module.

**Step 2: Verify** on the public page for a property with beds.

**Step 3: Commit**

```bash
git add app/\(info\)/list/page.js
git commit -m "feat: show room bed types on public listing"
```

> Skip this task if you only want the data stored for now — say so and it stays out of scope.

---

## Tests / validation (whole feature)

No test framework exists in the repo (`package.json` has no test script), so validation is manual + lint/build:

1. `npm run lint` — clean.
2. `npm run build` — succeeds.
3. Add flow: create property with 2 rooms, beds [King size] and [Double bed, Children bed] → DB doc shows `rooms_info[i].beds`.
4. Edit flow: change a room's beds on `/admin/edit`, Save → DB updated.
5. Cap enforcement (frontend): 16th add blocked by disabled controls + alert.
6. Cap enforcement (server): `curl` to `/api/upload` and `/api/add_images` with 16 beds → 400; unknown type → 400.
7. Bypass path: `/api/delete` payload with bad `rooms_info.beds` → 400, no write.
8. Regression: room image upload (`/api/upload_room`), property image delete, occupied toggle still work.

---

## Risks, tradeoffs, open questions

1. **"Bbunk bed" vs "Bunk bed"** — the request lists `"Bbunk bed"`; I assume it's a typo for "Bunk bed". If the literal string is required, change one entry in `BED_TYPES` (Task 1) and the schema enum (Task 2) — everything else is driven from those two places.
2. **Edit-page Save was broken before this feature** (`form="info_form"` targets nothing). Fixing it changes behavior: clicking per-room Save now posts the whole property info payload, not just the room description. That matches the original intent (the button was always `type="submit"`) but is a behavior change — flagging it explicitly.
3. **No migration needed** for existing docs: missing `beds` reads as `undefined`; UI normalizes to `[]`.
4. **`occupied_rooms` / `numRooms` interplay:** beds do not affect room counts; no change there.
5. **Enum duplication:** bed type strings live in 3 places (`bedTypes.js`, schema enum, CSS/JSX via import). The schema enum is the only true duplicate — acceptable for 5 stable strings; if types become configurable later, move to a DB collection.
6. **Validation on `Restate.create`:** Mongoose casts/validates subdocument arrays, so an invalid enum value throws → caught by the existing try/catch in `/api/upload` (returns 500). The explicit API check returns a cleaner 400 first; the schema is the backstop.
