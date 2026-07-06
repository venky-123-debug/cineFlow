const mongoose = require("mongoose")

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  genre: [{ type: String }],
  banner: { type: String }, // URL to banner image (for upload)
  trailerUrl: { type: String },
  rating: { type: Number, default: 0 },
  releaseDate: { type: Date },
  language: { type: String, default: "English" },
  censorRating: { type: String, enum: ["U", "UA", "A", "S"], default: "UA" },
  cast: [
    {
      name: { type: String, required: true },
      character: { type: String, required: true },
      profilePic: { type: String }
    }
  ],
  crew: [
    {
      name: { type: String, required: true },
      role: { type: String, required: true },
      profilePic: { type: String }
    }
  ],
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.models.Movie || mongoose.model("Movie", movieSchema)
