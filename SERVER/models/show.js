const mongoose = require("mongoose")

const showSchema = new mongoose.Schema({
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie",
    required: true,
  },
  theatreId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Theatre",
    required: true,
  },
  screenNumber: { type: Number, required: true },
  showTime: { type: Date, required: true },
  price: { type: Number, required: true },
  showDate: { type: Date, required: true },
  availableSeats: { type: Number, required: true },
})

module.exports = mongoose.models.Show || mongoose.model("Show", showSchema)
