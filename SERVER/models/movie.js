const mongoose = require("mongoose")

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  genre: [{ type: String }],
  poster: { type: String }, // URL to poster image
  banner: { type: String }, // URL to banner image (for upload)
  trailerUrl: { type: String },
  rating: { type: Number, default: 0 },
  releaseDate: { type: Date },
  language: { type: String, default: "English" },
  censorRating: { type: String, enum: ["U", "UA", "A", "S"], default: "UA" },
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.models.Movie || mongoose.model("Movie", movieSchema)
