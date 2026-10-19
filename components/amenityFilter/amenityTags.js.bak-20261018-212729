// -------------------------------------------------------------------------- //
// Single source of truth for the amenities filter tags.                     //
// Field names match the Restate schema (models/Restate.js) and the shared    //
// property state (components/shared/defaultPropertyState.js):                //
//   ac: Boolean, parking: Boolean, view: String (free text, e.g. "Ocean")    //
// `view` is free text in the admin form, so the tag values below are a       //
// curated list of the values actually used; matching is case-insensitive     //
// both client-side and server-side (see utils/filters.js).                   //
// -------------------------------------------------------------------------- //

// Header filter shows only the most popular views.
// Full view list (incl. Road) lives in the admin forms' View dropdowns.
export const VIEW_TAGS = [
  'Beach', 'Mountain', 'Garden',
]

// Room count filter tags: "Rooms 1", "Rooms 2".
const ROOM_COUNT_OPTIONS = [1, 2]

// Universal bed filter tags. Each tag describes a requirement:
//   count   — minimum number of beds required
//   bedType — 'any' (every bed counts) or one value from the schema enum in
//             models/Restate.js: King size | Double bed | Single bed |
//             Bunk bed | Children bed (matching is case-insensitive)
//   scope   — 'room'     = all required beds must be in ONE room
//             'property' = beds may be spread across any rooms of the property
// Adding a future bed tag (e.g. "One King size") = one more entry here.
const BED_TAGS = [
  { id: 'beds:2', label: 'Two separate beds', type: 'beds', count: 2, bedType: 'any', scope: 'room' },
]

export const AMENITY_TAGS = [
  { id: 'ac', label: 'A/C', field: 'ac', type: 'boolean' },
  { id: 'parking', label: 'Parking', field: 'parking', type: 'boolean' },
  ...ROOM_COUNT_OPTIONS.map((n) => ({ id: `rooms:${n}`, label: `Rooms ${n}`, field: 'availableRooms', type: 'number', value: n })),
  ...BED_TAGS,
  ...VIEW_TAGS.map((v) => ({ id: `view:${v}`, label: v, field: 'view', type: 'string', value: v })),
]

/**
 * Build the URL search-params for the /api route from selected tag ids.
 * e.g. ['ac', 'view:Ocean', 'view:City'] -> { ac: 'true', view: 'Ocean,City' }
 */
export function buildAmenityParams(selectedIds) {
  const params = {}
  for (const id of selectedIds || []) {
    const tag = AMENITY_TAGS.find((t) => t.id === id)
    if (!tag) continue
    if (tag.type === 'boolean') {
      params[tag.field] = 'true'
    } else if (tag.type === 'number') {
      // Room filters: send as ?availableRooms=N
      params[tag.field] = tag.value.toString()
    } else if (tag.type === 'beds') {
      // Bed filters: ?beds=<count>:<bedType>:<scope>, e.g. beds=2:any:room
      params.beds = `${tag.count}:${tag.bedType}:${tag.scope}`
    } else {
      params[tag.field] = params[tag.field] ? `${params[tag.field]},${tag.value}` : tag.value
    }
  }
  return params
}

/**
 * Bed filter gate. True when at least one room of the property holds >= count
 * beds of the given type ('any' = every bed counts). Mirrors the server-side
 * $expr predicate in utils/filters.js, so already-loaded markers gate
 * instantly without a re-fetch.
 */
function matchesBeds(prop, tag) {
  const rooms = Array.isArray(prop.rooms_info) ? prop.rooms_info : []
  const type = String(tag.bedType ?? 'any').toLowerCase()
  return rooms.some((room) => {
    const beds = Array.isArray(room?.beds) ? room.beds : []
    const count = type === 'any'
      ? beds.length
      : beds.filter((b) => String(b ?? '').trim().toLowerCase() === type).length
    return count >= tag.count
  })
}

/**
 * Client-side gate for already-loaded properties (same pattern as the price
 * gate in page.js). Returns true when the property matches every selected tag.
 */
export function matchesAmenities(prop, selectedIds) {
  if (!selectedIds || selectedIds.length === 0) return true
  return selectedIds.every((id) => {
    const tag = AMENITY_TAGS.find((t) => t.id === id)
    if (!tag) return true
    if (tag.type === 'boolean') return prop[tag.field] === true
    if (tag.type === 'number') {
      // Room filters: property must have >= N available rooms
      return Number(prop[tag.field]) >= tag.value
    }
    if (tag.type === 'beds') return matchesBeds(prop, tag)
    // view — case-insensitive, trimmed
    return String(prop[tag.field] ?? '').trim().toLowerCase() === tag.value.toLowerCase()
  })
}
