// Shared address validation for the admin UI and API routes.
// Mirrors the bedTypes.js / roomAmenityCatalog.js pattern: one validator
// used server-side (upload, add_images) so oversized/invalid data is
// rejected before it reaches MongoDB.

import { isValidCountry } from './countries'

// Max lengths — must match models/Restate.js maxlengths and the
// maxLength attributes on the admin inputs.
export const ADDRESS_LIMITS = {
    country: 2,
    region: 80,
    city: 80,
    district: 80,
    street: 100,
    houseNumber: 20,
    postalCode: 16,
}

/**
 * Validate and normalize an address object (or null/undefined for legacy docs).
 * - trims every string field
 * - enforces ADDRESS_LIMITS per field
 * - country must be a valid ISO alpha-2 code when present
 * Returns { ok: true, address } where address is the cleaned object
 * (all-empty → {} so we don't store an empty subdocument),
 * or { ok: false, error }.
 */
export function isValidAddress(address) {
    if (address == null) return { ok: true, address: {} }
    if (typeof address !== 'object' || Array.isArray(address)) {
        return { ok: false, error: 'address must be an object' }
    }

    const clean = {}
    for (const [field, limit] of Object.entries(ADDRESS_LIMITS)) {
        const value = address[field]
        if (value == null || value === '') continue
        if (typeof value !== 'string') {
            return { ok: false, error: `address.${field} must be a string` }
        }
        const trimmed = value.trim()
        if (trimmed.length > limit) {
            return { ok: false, error: `address.${field} is too long (max ${limit} characters)` }
        }
        clean[field] = trimmed
    }

    if (clean.country && !isValidCountry(clean.country)) {
        return { ok: false, error: 'address.country must be a 2-letter ISO country code' }
    }

    return { ok: true, address: clean }
}
