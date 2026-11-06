// -------------------------------------------------------------------------- //
// Shared property defaults — matches Restate DB schema types exactly:      //
//   Number  → JavaScript number (0)                                         //
//   Boolean → JS boolean (false / true)                                     //
//   String  → JS string ('')                                                //
// Arrays are always initialised so spread/merge is safe.                     //
// -------------------------------------------------------------------------- //

const baseDefaults = {
    phone: '',
    name: '',
    // Structured address (matches models/Restate.js subdocument).
    // All parts optional — empty strings are dropped server-side.
    address: {
        country: '',   // ISO 3166-1 alpha-2 code from the dropdown
        region: '',
        city: '',
        district: '',
        street: '',
        houseNumber: '',
        postalCode: '',
    },
    coordinates: '',        // UI format "lat, lng" — transformed before DB write
    view: '',
    description: '',
}

const typedDefaults = {
    bedroom: 0,             // Number in Restate
    bath: 0,                // Number in Restate
    ac: false,              // Boolean in Restate  (not "Yes"/"No")
    floor: 0,               // Number in Restate
    parking: false,         // Boolean in Restate  (not "Yes"/"No")
    price: 0,               // Number in Restate   (not string)
    available: true,        // Boolean in Restate  (not "Yes"/"No")
    numRooms: 1,            // Number in Restate — available rooms; default 1 (base room)
}

const arrayDefaults = {
    rooms_info: [],         // [{ info: String, id: Number }]
}

/** Fresh property state for the ADD form. */
export function createAddProperty(mail) {
    return {
        mail: mail ?? '',
        ...baseDefaults,
        ...typedDefaults,
        ...arrayDefaults,
    }
}

/** Fresh property state for the EDIT form (before DB is loaded). */
export function createEditProperty(mail) {
    return {
        mail: mail ?? '',
        ...baseDefaults,
        ...typedDefaults,
        ...{ occupied_rooms: [] }, // edit-only field
    }
}

/** Empty placeholder — used when no properties exist in DB yet. */
export function createEmptyProperty() {
    return {
        mail: '',
        ...baseDefaults,
        ...typedDefaults,
        rooms_info: [],
        occupied_rooms: [],
    }
}
