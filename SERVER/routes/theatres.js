const express = require("express")
const app = express.Router()
const Theatre = require("../models/theatre")
const Show = require("../models/show")
const Movie = require("../models/movie")
const Booking = require("../models/booking")
const utilities = require("../scripts/utils")
const errorhandler = require("../scripts/error")

//  GET ALL THEATRES
app.get("/", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN" && tokenData.role !== "USER") throw "Invalid access"

    // Filters, sorting and pagination
    const { city, name, minSeats, maxSeats, sortBy, sortOrder, page, limit } = req.query

    const query = {}
    if (city) query.city = { $regex: city, $options: "i" }
    if (name) query.name = { $regex: name, $options: "i" }
    if (minSeats || maxSeats) {
      query.totalSeats = {}
      if (minSeats) query.totalSeats.$gte = parseInt(minSeats, 10)
      if (maxSeats) query.totalSeats.$lte = parseInt(maxSeats, 10)
      if (Object.keys(query.totalSeats).length === 0) delete query.totalSeats
    }

    const sortField = sortBy || "createdAt"
    const sortDirection = sortOrder === "asc" ? 1 : -1
    const sortObj = { [sortField]: sortDirection }

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10))

    const totalCount = await Theatre.countDocuments(query)
    const totalPages = Math.ceil(totalCount / limitNum)

    const theatres = await Theatre.find(query)
      .lean()
      .sort(sortObj)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)

    for (let i = 0; i < theatres.length; i++) {
      theatres[i] = utilities.cleanMongoDocument(theatres[i])
    }

    response.success = true
    response.data = {
      data: theatres,
      page: pageNum,
      limit: limitNum,
      totalPages,
      totalCount,
    }
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  GET UNIQUE CITIES
app.get("/cities", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN" && tokenData.role !== "USER") throw "Invalid access"

    const cities = await Theatre.distinct("city")
    response.success = true
    response.data = cities
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  GET SINGLE THEATRE
app.get("/:id", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN" && tokenData.role !== "USER") throw "Invalid access"

    let theatre = await Theatre.findById(req.params.id).lean()
    if (!theatre) throw "Theatre not found"

    response.success = true
    response.data = utilities.cleanMongoDocument(theatre)
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  ADMIN: CREATE THEATRE
app.post("/", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN") throw "Admin access only"

    const { name, location, city, totalSeats, screens, amenities } = req.body

    if (!name || !location || !city || !totalSeats) throw "Name, location, city and totalSeats are required"
    if (totalSeats <= 0) throw "Total seats must be greater than 0"
    let thisTheatre = await Theatre.findOne({ name, location, city }).lean()
    if (thisTheatre) throw "Theatre already exists"

    thisTheatre = await new Theatre({
      name,
      location,
      city,
      totalSeats,
      screens: screens || 1,
      amenities: amenities || [],
    }).save()

    response.success = true
    response.data = utilities.cleanMongoDocument(thisTheatre)
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  ADMIN: UPDATE THEATRE
app.patch("/:id", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN") throw "Admin access only"

    const updatedTheatre = await Theatre.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).lean()

    if (!updatedTheatre) throw "Theatre not found"

    response.success = true
    response.data = utilities.cleanMongoDocument(updatedTheatre)
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

    const deletedTheatre = await Theatre.findByIdAndDelete(req.params.id).lean()
    if (!deletedTheatre) throw "Theatre not found"

    // Find shows that belonged to this theatre
    const showsInTheatre = await Show.find({ theatreId: deletedTheatre._id }).lean()
    const showIds = showsInTheatre.map((s) => s._id)
    const affectedMovieIds = Array.from(new Set(showsInTheatre.map((s) => String(s.movieId))))

    // Delete bookings for those shows
    let deletedBookingsCount = 0
    if (showIds.length > 0) {
      const delBookings = await Booking.deleteMany({ showId: { $in: showIds } })
      deletedBookingsCount = delBookings.deletedCount || 0
    }

    // Delete the shows in this theatre
    const delShowsRes = await Show.deleteMany({ theatreId: deletedTheatre._id })
    const deletedShowsCount = delShowsRes.deletedCount || 0

    // For each affected movie, delete the movie only if it has no other shows remaining
    const deletedMovies = []
    for (const movieId of affectedMovieIds) {
      const remainingShows = await Show.countDocuments({ movieId })
      if (remainingShows === 0) {
        const delMovie = await Movie.findByIdAndDelete(movieId).lean()
        if (delMovie) deletedMovies.push(utilities.cleanMongoDocument(delMovie))
      }
    }

    response.success = true
    response.data = {
      theatre: utilities.cleanMongoDocument(deletedTheatre),
      deletedShowsCount,
      deletedBookingsCount,
      deletedMovies,
    }
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

module.exports = app
