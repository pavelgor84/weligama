const { Schema, model, models } = require("mongoose");

const propertySchema = new Schema({
    mail: String,
    phone: String,
    name: String,
    coordinates: String,
    bedroom: Number,
    bath: Number,
    ac: String,
    view: String,
    floor: Number,
    parking: String,
    price: Number,
    available: String,
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
        [{
            room_number: String,
            src: String,
            width: Number,
            height: Number,
            alt: String,
            public_id: String,
        }],
    rooms_info: {
        type: Schema.Types.Mixed,
        default: {}
    }

})

const Restate = models?.Restate || model('Restate', propertySchema)
export default Restate
//module.exports = model('Restate', propertySchema)