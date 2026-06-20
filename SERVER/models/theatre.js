const mongoose = require("mongoose")

const theatreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  city: { type: String, required: true },
  totalSeats: { type: Number, required: true },
  screens: { type: Number, default: 1 },
  amenities: [{ type: String }], // e.g., ["AC", "Recliner", "Parking"]
})

module.exports = mongoose.model("Theatre", theatreSchema)
