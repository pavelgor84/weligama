const { Schema, model, models } = require("mongoose");

const propertySchema = new Schema({
    title: String,
    bedroom: String,
    bath: String,
    ac: String,
    addons: [{ view: String }, { floor: String }, { parking: String }],
    price: Number,
    available: String
})

const Restate = models?.Restate || model('Restate', propertySchema)
export default Restate