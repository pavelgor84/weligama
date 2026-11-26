// Shared "property info" extraction + validation for the admin API routes.
//
// Every route that persists property details (upload, add_images, delete,
// upload_room) must save the SAME set of editable fields. Before this module
// each route re-implemented it, and image routes silently dropped pending
// text edits (description / room descriptions) because they only wrote the
// image arrays — the client then re-fetched the stale text from the DB.
//
// images and rooms are image collections managed by dedicated push/splice
// operations and must never be $set from this helper.

import { isValidBeds } from "@/components/shared/bedTypes";
import { isValidAmenities } from "@/components/shared/roomAmenityCatalog";
import { isValidAddress } from "@/components/shared/addressValidation";

// Total rooms per property: max(1, added rooms)
export const MAX_ROOMS = 10;

// Editable property info fields. `mail` is intentionally excluded: ownership
// is derived from the session, never from client-supplied data.
export const INFO_FIELDS = [
    "phone", "name", "address", "coordinates", "bedroom", "bath", "ac",
    "view", "floor", "parking", "price", "available", "numRooms",
    "availableRooms", "occupied_rooms", "description", "rooms_info",
];

/**
 * Extract the info fields present on a client payload and validate them.
 * Returns { ok: true, updateFields } or { ok: false, error }.
 *
 * Coordinates may arrive as a UI "lat, lng" string; they are converted to the
 * GeoJSON [lng, lat] array the schema stores.
 */
export function extractInfoFields(obj_props) {
    const updateFields = {};
    for (const field of INFO_FIELDS) {
        if (obj_props?.[field] !== undefined) updateFields[field] = obj_props[field];
    }

    // Cap on the number of added rooms
    if (Array.isArray(updateFields.rooms_info) && updateFields.rooms_info.length > MAX_ROOMS) {
        return { ok: false, error: `Maximum ${MAX_ROOMS} rooms per property allowed.` };
    }

    // Per-room beds + amenities validation
    if (Array.isArray(updateFields.rooms_info)) {
        for (const room of updateFields.rooms_info) {
            const bedCheck = isValidBeds(room?.beds);
            if (!bedCheck.ok) return { ok: false, error: bedCheck.error };
            const amenityCheck = isValidAmenities(room?.amenities);
            if (!amenityCheck.ok) return { ok: false, error: amenityCheck.error };
        }
    }

    // Address: trim, cap lengths, ISO country code. All-empty parts → {}
    if (updateFields.address !== undefined) {
        const addressCheck = isValidAddress(updateFields.address);
        if (!addressCheck.ok) return { ok: false, error: addressCheck.error };
        updateFields.address = addressCheck.address;
    }

    // Defend against untransformed "lat, lng" strings from the client
    if (typeof updateFields.coordinates === 'string') {
        const coordStr = updateFields.coordinates.trim()
        if (coordStr === '') {
            // Untouched/empty coordinates (e.g. legacy doc) must not block an
            // unrelated update such as an image delete.
            updateFields.coordinates = []
        } else {
            const parts = coordStr.split(',');
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            if (parts.length >= 2 && !isNaN(lat) && !isNaN(lng)) {
                updateFields.coordinates = [lng, lat];
            } else {
                return { ok: false, error: 'Invalid coordinates' };
            }
        }
    }

    return { ok: true, updateFields };
}
