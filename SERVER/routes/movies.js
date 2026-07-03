const express = require("express")
const mongoose = require("mongoose")
const app = express.Router()
const Movie = require("../models/movie")
const Theatre = require("../models/theatre")
const Show = require("../models/show")
const utilities = require("../scripts/utils")
const errorhandler = require("../scripts/error")
const upload = require("../middleware/upload")
const crypto = require("crypto")
const fs = require("fs").promises
const path = require("path")

// Helper function to calculate file hash and save in uploads directory using fs.promises
async function handleBannerUpload(file) {
  if (!file) return null

  // Calculate SHA-256 hash of the buffer
  const fileHash = crypto.createHash("sha256").update(file.buffer).digest("hex")
  const ext = path.extname(file.originalname) || ".jpg"
  const filename = `${fileHash}${ext}`
  
  const uploadDir = path.join(__dirname, "../uploads/movies")
  // Ensure the uploads directory exists using fs.promises
  await fs.mkdir(uploadDir, { recursive: true })
  
  const filePath = path.join(uploadDir, filename)
  const relativeUrl = `/uploads/movies/${filename}`
  
  try {
    // Check if the file already exists using fs.promises.access
    await fs.access(filePath)
    console.log(`File already exists with hash ${fileHash}. Reusing same image.`)
  } catch (err) {
    // File does not exist, write the buffer to disk using fs.promises.writeFile
    await fs.writeFile(filePath, file.buffer)
    console.log(`Saved new file with hash ${fileHash}`)
  }

  return { filename, bannerUrl: relativeUrl, fileHash }
}

//  GET ALL MOVIES
app.get("/", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN" && tokenData.role !== "USER") throw "Invalid access"
    const { page = 1, limit = 10, genre, search, language, city } = req.query

    const query = {}

    // Filter by city (BookMyShow style: only movies with active shows in this city)
    if (city) {
      const theatres = await Theatre.find({ city: { $regex: city, $options: "i" } }).select("_id")
      const theatreIds = theatres.map((t) => t._id)
      const shows = await Show.find({ theatreId: { $in: theatreIds } }).select("movieId")
      const movieIds = shows.map((s) => s.movieId)
      query._id = { $in: movieIds }
    }

    // Search by title or description
    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    // Filter by genre
    if (genre) {
      query.genre = { $in: genre.split(",") }
    }

    // Filter by language
    if (language) {
      query.language = language
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const movies = await Movie.find(query).lean().sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
    for (let i = 0; i < movies.length; i++) {
      movies[i] = utilities.cleanMongoDocument(movies[i])
    }
    const totalMovies = await Movie.countDocuments(query)

    response.success = true
    response.data = {
      movies,
      pagination: {
        total: totalMovies,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalMovies / parseInt(limit)),
        hasNext: parseInt(page) * parseInt(limit) < totalMovies,
        hasPrev: parseInt(page) > 1,
      },
    }
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  GET SINGLE MOVIE
app.get("/:id", async (req, res) => {
  let response = { success: false }
  try {
    const { id } = req.params

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw "Invalid Movie ID format"
    }

    // Optional: Token check (you can remove if you want public access)
    if (req.headers["access-token"]) {
      const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
      if (tokenData.role !== "ADMIN" && tokenData.role !== "USER") {
        throw "Invalid access"
      }
    }

    let movie = await Movie.findById(id).lean()

    if (!movie) throw "Movie not found"

    movie = utilities.cleanMongoDocument ? utilities.cleanMongoDocument(movie) : movie

    response.success = true
    response.data = movie
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  ADMIN: CREATE MOVIE (with optional banner upload)
app.post("/", upload.single("banner"), async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN") throw "Admin access only"

    const { title, description, duration, genre, poster, trailerUrl, releaseDate, language, rating, censorRating } =
      req.body

    if (!title || !description || !duration || !language) throw "Title, description, duration and language are required"
    if (rating && (rating < 0 || rating > 10)) throw "Rating must be between 0 and 10"

    let thisMovie = await Movie.findOne({ title }).lean()
    if (thisMovie) throw "Movie already exists"

    // Handle banner upload using memory storage & file hashing with fs.promises
    let bannerUrl = null
    if (req.file) {
      const uploadResult = await handleBannerUpload(req.file)
      if (uploadResult) {
        bannerUrl = uploadResult.bannerUrl
      }
    }

    let newMovie = await new Movie({
      title,
      description,
      duration,
      genre: genre ? (Array.isArray(genre) ? genre : [genre]) : [],
      poster,
      banner: bannerUrl,
      trailerUrl,
      releaseDate,
      language: language || "Hindi",
      rating: rating || 0,
      censorRating: censorRating || "UA",
    }).save()

    newMovie = utilities.cleanMongoDocument(newMovie)
    response.success = true
    response.data = newMovie
    response.message = "Movie created successfully" + (bannerUrl ? " with banner" : "")
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  ADMIN: UPDATE MOVIE
app.patch("/:id", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN") throw "Admin access only"
    if (req.body.rating && (req.body.rating < 0 || req.body.rating > 10)) throw "Rating must be between 0 and 10"

    let updatedMovie = await Movie.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).lean()

    if (!updatedMovie) throw "Movie not found"

    updatedMovie = utilities.cleanMongoDocument(updatedMovie)
    response.success = true
    response.data = updatedMovie
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  ADMIN: UPLOAD MOVIE BANNER
app.post("/:id/upload-banner", upload.single("banner"), async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN") throw "Admin access only"

    if (!req.file) throw "No image file provided"

    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) throw "Invalid Movie ID"

    // Handle banner upload using memory storage & file hashing with fs.promises
    const uploadResult = await handleBannerUpload(req.file)
    if (!uploadResult) throw "File processing failed"

    // Update movie with banner URL
    let updatedMovie = await Movie.findByIdAndUpdate(id, { $set: { banner: uploadResult.bannerUrl } }, { new: true }).lean()

    if (!updatedMovie) throw "Movie not found"

    updatedMovie = utilities.cleanMongoDocument(updatedMovie)
    response.success = true
    response.data = {
      movie: updatedMovie,
      bannerUrl: uploadResult.bannerUrl,
      fileHash: uploadResult.fileHash,
      message: "Banner uploaded successfully",
    }
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

app.delete("/:id", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN") throw "Admin access only"

    let updatedMovie = await Movie.findByIdAndDelete(req.params.id).lean()

    if (!updatedMovie) throw "Movie not found"

    response.success = true
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

module.exports = app
