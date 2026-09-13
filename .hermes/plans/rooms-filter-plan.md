# Implementation Plan: Room Count Filter & Read-Only Room Display

## Goal
1. Show number of rooms as **read-only** in admin forms (user can't change it manually)
2. Auto-calculate from `1 + rooms_info.length` (default = 1 room)
3. When a room is marked "occupied" in edit mode, update available count
4. Add "Rooms 1", "Rooms 2", etc. filter tags to the amenity filter

---

## Current State

| Component | Status |
|-----------|--------|
| Schema (`models/Restate.js`) | Has `numRooms: Number` — but field name implies "available rooms", not "total rooms" |
| adminMenu.js (ADD) | Already shows read-only `1 + property.rooms_info.length`; already computes `numRooms` in submit |
| defaultPropertyState.js | Already has `numRooms: 1` default |
| adminEdit.js (EDIT) | **Missing** read-only room display; **missing** numRooms update on occupied toggle |
| amenityTags.js / AmenityFilter.js | **No** room count filter tags |
| API routes | **No** server-side filtering by rooms |
| page.js (home) | Client-side filter uses `matchesAmenities()` — needs room gate |

---

## Changes Required

### 1. Schema — Rename field for clarity + add availableRooms

**File:** `models/Restate.js`

Rename the existing `numRooms` to `totalRooms` (total rooms = base room + added rooms, never changes after creation) and add a new `availableRooms` field (decrements when rooms are marked occupied).

```diff
-    numRooms: Number,          // available rooms (total - occupied); used by the "rooms N" filter
+    totalRooms: Number,        // total rooms (base + added); immutable after creation; used by "rooms N" filter
+    availableRooms: Number,    // currently unoccupied rooms = totalRooms - occupied_rooms.length
```

**Rationale:** The current `numRooms` name is ambiguous. `totalRooms` makes it clear this is the physical room count. `availableRooms` is what actually matters for availability checks.

### 2. adminEdit.js — Add read-only room count + update on occupied toggle

**File:** `components/adminEdit/adminEdit.js`

#### 2a. Add read-only "Number of Rooms" display in the Spatial & Features section

Add after the "Number of Floors" input (around line 484), before the View input:

```jsx
<div>
    <label className={styles.input_label}>Number of Rooms</label>
    <input className={styles.text_input} type="number" readOnly
           value={1 + property.rooms_info.length}
           title="Updates automatically when you add rooms" />
</div>
```

#### 2b. Compute `totalRooms` and `availableRooms` in handleSubmit before save

In the `handleSubmit` function, after the coordinate transformation block (around line 130), add:

```js
// Calculate room counts for DB storage
add_occupied.totalRooms = 1 + add_occupied.rooms_info.length;
add_occupied.availableRooms = add_occupied.totalRooms - add_occupied.occupied_rooms.length;
```

This runs every time the user toggles an occupied checkbox (which calls `handleSubmit` at line 163).

#### 2c. Normalize `totalRooms` and `availableRooms` in the normalize function

Add to the `normalize` function (around line 180):

```js
totalRooms: obj.totalRooms ?? 1,
availableRooms: obj.availableRooms ?? 1,
```

### 3. adminMenu.js — No changes needed (already correct)

The ADD form already:
- Shows read-only `1 + property.rooms_info.length` (line 247)
- Computes `transformedProp.numRooms = 1 + property.rooms_info.length` in submit (line 130)

**Change:** Update the compute line to set both new fields:

```js
// Available rooms = base room + each added room (default 1)
transformedProp.totalRooms = 1 + property.rooms_info.length;
transformedProp.availableRooms = transformedProp.totalRooms; // no rooms occupied on creation
```

### 4. amenityTags.js — Add room count filter tags

**File:** `components/amenityFilter/amenityTags.js`

Add room count tags to `AMENITY_TAGS` array (support filters for rooms 1 through 5+):

```js
// Room count filter tags
const ROOM_COUNT_OPTIONS = [1, 2, 3, 4, 5]

export const AMENITY_TAGS = [
  { id: 'ac', label: 'A/C', field: 'ac', type: 'boolean' },
  { id: 'parking', label: 'Parking', field: 'parking', type: 'boolean' },
  ...ROOM_COUNT_OPTIONS.map((n) => ({ id: `rooms:${n}`, label: `Rooms ${n}`, field: 'availableRooms', type: 'number', value: n })),
  ...VIEW_TAGS.map((v) => ({ id: `view:${v}`, label: v, field: 'view', type: 'string', value: v })),
]
```

Update `buildAmenityParams` to handle number type:

```js
export function buildAmenityParams(selectedIds) {
  const params = {}
  for (const id of selectedIds || []) {
    const tag = AMENITY_TAGS.find((t) => t.id === id)
    if (!tag) continue
    if (tag.type === 'boolean') {
      params[tag.field] = 'true'
    } else if (tag.type === 'number') {
      // For room filters: use exact match param
      params[tag.field] = tag.value.toString()
    } else {
      params[tag.field] = params[tag.field] ? `${params[tag.field]},${tag.value}` : tag.value
    }
  }
  return params
}
```

Update `matchesAmenities` to handle number type:

```js
export function matchesAmenities(prop, selectedIds) {
  if (!selectedIds || selectedIds.length === 0) return true
  return selectedIds.every((id) => {
    const tag = AMENITY_TAGS.find((t) => t.id === id)
    if (!tag) return true
    if (tag.type === 'boolean') return prop[tag.field] === true
    if (tag.type === 'number') return Number(prop[tag.field]) >= tag.value
    // view — case-insensitive, trimmed
    return String(prop[tag.field] ?? '').trim().toLowerCase() === tag.value.toLowerCase()
  })
}
```

### 5. API route — Add server-side room filtering

**File:** `app/api/route.js` (the main listing endpoint used by the viewport fetch)

Add server-side filter for `availableRooms` in the query pipeline, similar to how `maxPrice` and amenity params are already handled. The client sends `?availableRooms=N` — the API should filter properties where `availableRooms >= N`.

### 6. page.js (home) — No changes needed

The existing `matchesAmenities()` call in the client-side filter at line 337 will automatically handle room filters since they're now part of `AMENITY_TAGS`. The `buildAmenityParams` call at line 213 will send room params to the API.

---

## Implementation Order

1. **Schema** — Rename field, add new field (models/Restate.js)
2. **adminEdit.js** — Add read-only display + compute rooms in submit
3. **adminMenu.js** — Update submit to set both totalRooms and availableRooms
4. **amenityTags.js** — Add room count tags + update helpers
5. **API route** — Add server-side filtering by availableRooms

---

## Notes

- Total rooms (`totalRooms`) is effectively immutable after creation — it only changes when rooms are added via the "Add room" button in adminMenu. In edit mode, rooms can't be deleted (only marked occupied), so totalRooms never decreases.
- Available rooms (`availableRooms`) = `totalRooms - occupied_rooms.length`. This is recalculated on every submit in adminEdit.js.
- The room filter uses `>=` semantics: clicking "Rooms 2" shows properties with 2+ available rooms (a property with 3 rooms satisfies both "Rooms 1", "Rooms 2", and "Rooms 3" filters).
