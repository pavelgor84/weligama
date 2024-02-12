const { Schema, model, models } = require("mongoose");

const propertySchema = new Schema({
    title: String,
    coordinates: String,
    bedroom: Number,
    bath: Number,
    ac: Number,
    addons: {
        view: String,
        floor: Number,
        parking: Number

    },
    price: Number,
    available: Number,
    images: [{
        src: String,
        alt: String
    }]
})

const Restate = models?.Restate || model('Restate', propertySchema)
export default Restate
//module.exports = model('Restate', propertySchema)