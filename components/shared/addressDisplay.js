// Shared display helper for property cards (and any other surface).
// The card address is built from city + street + house number only —
// region/district/postalCode are stored for search but not shown.
// Fallback: documents without an address (or with none of the three
// display parts) render as the literal word "Address".

const DISPLAY_PARTS = ['city', 'street', 'houseNumber']

/**
 * @param {object|undefined|null} address — the doc.address subdocument
 * @returns {string} e.g. "Weligama, Galle Road, 12" or "Address"
 */
export function formatAddress(address) {
    if (!address || typeof address !== 'object') return 'Address'

    const parts = DISPLAY_PARTS
        .map((key) => (address[key] != null ? String(address[key]).trim() : ''))
        .filter(Boolean)

    return parts.length ? parts.join(', ') : 'Address'
}
