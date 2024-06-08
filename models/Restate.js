const { Schema, model, models } = require("mongoose");

const propertySchema = new Schema({
    mail: String,
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
    images: [{
        src: String,
        widht: Number,
        height: Number,
        alt: String,
        public_id: String,
    }]
})

const Restate = models?.Restate || model('Restate', propertySchema)
export default Restate
//module.exports = model('Restate', propertySchema)