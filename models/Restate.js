const { Schema, model, models } = require("mongoose");

const propertySchema = new Schema({
    title: String,
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
        alt: String
    }]
})

const Restate = models?.Restate || model('Restate', propertySchema)
export default Restate
//module.exports = model('Restate', propertySchema)