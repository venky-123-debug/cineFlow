const express = require("express")
const mongoose = require("mongoose")
const app = express.Router()
const Movie = require("../models/Movie")
const utilities = require("../scripts/utils")
const errorhandler = require("../scripts/error")
const upload = require("../middleware/upload")

//  GET ALL MOVIES
app.get("/", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN" && tokenData.role !== "USER") throw "Invalid access"
    const { page = 1, limit = 10, genre, search, language } = req.query

    const query = {}

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

    const { title, description, duration, genre, poster, trailerUrl, releaseDate, language, rating, censorRating } = req.body

    if (!title || !description || !duration || !language) throw "Title, description, duration and language are required"
    if (rating && (rating < 0 || rating > 10)) throw "Rating must be between 0 and 10"
    
    let thisMovie = await Movie.findOne({ title }).lean()
    if (thisMovie) throw "Movie already exists"

    // Handle banner upload
    let bannerUrl = null
    if (req.file) {
      bannerUrl = `/uploads/movies/${req.file.filename}`
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
    // Delete uploaded file if there's an error
    if (req.file) {
      const fs = require("fs")
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err)
      })
    }
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

    // Create URL path for the uploaded image
    const bannerUrl = `/uploads/movies/${req.file.filename}`

    // Update movie with banner URL
    let updatedMovie = await Movie.findByIdAndUpdate(id, { $set: { banner: bannerUrl } }, { new: true }).lean()

    if (!updatedMovie) throw "Movie not found"

    updatedMovie = utilities.cleanMongoDocument(updatedMovie)
    response.success = true
    response.data = {
      movie: updatedMovie,
      bannerUrl: bannerUrl,
      message: "Banner uploaded successfully",
    }
  } catch (error) {
    // Delete uploaded file if there's an error
    if (req.file) {
      const fs = require("fs")
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err)
      })
    }
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

module.exports = app
