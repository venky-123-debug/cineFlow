const mongoose = require("mongoose")

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  genre: [{ type: String }],
  poster: { type: String },
  trailerUrl: { type: String },
  rating: { type: Number, default: 0 },
  releaseDate: { type: Date },
  language: { type: String, default: "English" },
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Movie", movieSchema)
