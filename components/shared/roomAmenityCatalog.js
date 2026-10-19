// -------------------------------------------------------------------------- //
// Shared per-room amenity catalog for the admin UI and API validation.      //
// Stored values are exactly the `id` strings below (case-sensitive).        //
// Ids are namespaced by category because some items exist in two            //
// categories (e.g. hair dryer: appliances vs bathroom) — storing labels     //
// would make grouping ambiguous on display.                                  //
// The category order and item order here IS the display structure.          //
// -------------------------------------------------------------------------- //

export const AMENITY_CATEGORIES = [
    {
        label: 'Furniture & Storage',
        items: [
            { id: 'furniture.wardrobe', label: 'Wardrobe' },
            { id: 'furniture.clothes_hangers', label: 'Clothes hangers' },
            { id: 'furniture.dresser', label: 'Dresser or shelves' },
            { id: 'furniture.bedside_tables', label: 'Bedside tables' },
            { id: 'furniture.luggage_rack', label: 'Luggage rack' },
            { id: 'furniture.mirror', label: 'Mirror' },
            { id: 'furniture.chair', label: 'Chair / armchair' },
            { id: 'furniture.desk', label: 'Desk' },
        ],
    },
    {
        label: 'Appliances & Electronics',
        items: [
            { id: 'appliances.air_conditioning', label: 'Air conditioning' },
            { id: 'appliances.tv', label: 'TV' },
            { id: 'appliances.hair_dryer', label: 'Hair dryer' },
            { id: 'appliances.refrigerator', label: 'Refrigerator (mini-bar)' },
            { id: 'appliances.electric_kettle', label: 'Electric kettle' },
            { id: 'appliances.fan', label: 'Fan' },
            { id: 'appliances.heater', label: 'Heater' },
            { id: 'appliances.power_strip', label: 'Power strip / extension cord' },
        ],
    },
    {
        label: 'Windows & Balcony',
        items: [
            { id: 'windows.balcony', label: 'Balcony' },
            { id: 'windows.terrace', label: 'Terrace' },
            { id: 'windows.blackout_curtains', label: 'Blackout curtains or blinds' },
        ],
    },
    {
        label: 'Bathroom',
        items: [
            { id: 'bathroom.private_bathroom', label: 'Private bathroom' },
            { id: 'bathroom.shower', label: 'Shower / bathtub' },
            { id: 'bathroom.hair_dryer', label: 'Hair dryer' },
            { id: 'bathroom.toiletries', label: 'Toiletries' },
            { id: 'bathroom.towels', label: 'Towels' },
            { id: 'bathroom.bathrobe_slippers', label: 'Bathrobe and slippers' },
        ],
    },
    {
        label: 'For Children',
        items: [
            { id: 'children.crib', label: 'Crib' },
            { id: 'children.high_chair', label: 'High chair' },
        ],
    },
    {
        label: 'Safety & Privacy',
        items: [
            { id: 'safety.door_lock', label: 'Door lock' },
            { id: 'safety.safe', label: 'Safe' },
        ],
    },
]

// Flat set of every valid amenity id — used for validation and for
// filtering unknown ids out of legacy DB documents.
export const ALL_AMENITY_IDS = new Set(
    AMENITY_CATEGORIES.flatMap((cat) => cat.items.map((item) => item.id))
)

// Maximum amenities per room — mirrored in models/Restate.js.
export const MAX_ROOM_AMENITIES = ALL_AMENITY_IDS.size

/**
 * Validate a per-room amenities array:
 * - must be an array (null/undefined → empty)
 * - length <= MAX_ROOM_AMENITIES
 * - every entry is a known id, no duplicates
 * Returns { ok: true, amenities } or { ok: false, error }.
 */
export function isValidAmenities(amenities) {
    if (amenities == null) return { ok: true, amenities: [] }
    if (!Array.isArray(amenities)) return { ok: false, error: 'amenities must be an array' }
    if (amenities.length > MAX_ROOM_AMENITIES) {
        return { ok: false, error: `Maximum ${MAX_ROOM_AMENITIES} room amenities allowed.` }
    }
    const seen = new Set()
    for (const id of amenities) {
        if (!ALL_AMENITY_IDS.has(id)) {
            return { ok: false, error: 'Invalid room amenity: ' + id }
        }
        if (seen.has(id)) {
            return { ok: false, error: 'Duplicate room amenity: ' + id }
        }
        seen.add(id)
    }
    return { ok: true, amenities }
}
