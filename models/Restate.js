const { Schema, model, models } = require("mongoose");

const propertySchema = new Schema({
    mail: String,
    phone: String,
    name: String,
    coordinates: String,
    bedroom: Number,
    bath: Number,
    ac: Boolean,
    view: String,
    floor: Number,
    parking: Boolean,
    price: Number,
    available: Boolean,
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
    rooms_info: [{ info: String, id: Number }]

})

const Restate = models?.Restate || model('Restate', propertySchema)
export default Restate
//module.exports = model('Restate', propertySchema)