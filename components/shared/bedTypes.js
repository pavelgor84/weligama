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
 * - must be an array (null/undefined → empty)
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
