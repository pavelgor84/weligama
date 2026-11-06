const { Schema, model, models } = require("mongoose");

const propertySchema = new Schema({
    mail: String,
    phone: String,
    name: String,
    // Structured address. country is an ISO 3166-1 alpha-2 code ("LK", "IT").
    // maxlengths enforce the same caps as components/shared/addressValidation.js
    // server-side — Mongoose rejects oversized values on create/update.
    address: {
        country: { type: String, maxlength: 2 },
        region: { type: String, maxlength: 80 },
        city: { type: String, maxlength: 80 },
        district: { type: String, maxlength: 80 },
        street: { type: String, maxlength: 100 },
        houseNumber: { type: String, maxlength: 20 },
        postalCode: { type: String, maxlength: 16 },
    },
    coordinates: [Number, Number],  // GeoJSON array format for map markers
    bedroom: Number,
    bath: Number,
    ac: Boolean,
    view: String,
    floor: Number,
    parking: Boolean,
    price: Number,
    available: Boolean,
    numRooms: Number,
    availableRooms: Number,
    occupied_rooms: [String],
    description: String,
    images: [{
        src: String,
        width: Number,
        height: Number,
        alt: String,
        public_id: String,
    }],
    rooms:
        [[{
            room_number: String,
            src: String,
            width: Number,
            height: Number,
            alt: String,
            public_id: String,
        }]],
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
        // Per-room additional amenities — array of ids from
        // components/shared/roomAmenityCatalog.js (e.g. "appliances.tv").
        // Shape guard only; strict id validation lives in the API routes
        // (isValidAmenities) — same split of duties as beds.
        amenities: {
            type: [String],
            validate: {
                validator: (v) => Array.isArray(v) && v.length <= 29,
                message: 'Maximum 29 room amenities allowed',
            },
        },
    }]

})
propertySchema.index({ coordinates: "2dsphere" });

const Restate = models?.Restate || model('Restate', propertySchema)
export default Restate
//module.exports = model('Restate', propertySchema)