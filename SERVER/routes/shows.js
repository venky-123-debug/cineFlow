const express = require("express")
const app = express.Router()
const Show = require("../models/Show")
const Movie = require("../models/Movie")
const Theatre = require("../models/Theatre")
const utilities = require("../scripts/utils")
const errorhandler = require("../scripts/error")

//  GET ALL SHOWS (with filters)
app.get("/", async (req, res) => {
  let response = { success: false }
  try {
    const { movieId, theatreId, city } = req.query

    const query = {}

    if (movieId) query.movieId = movieId
    if (theatreId) query.theatreId = theatreId
    if (city) query["theatre.city"] = { $regex: city, $options: "i" } // if you populate theatre

    const shows = await Show.find(query)
      .populate("movieId", "title poster duration genre")
      .populate("theatreId", "name location city")
      .lean()
      .sort({ showTime: 1 })
    for (let show of shows) {
      show = utilities.cleanMongoDocument(show)
    }
    response.success = true
    response.data = shows
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  GET SINGLE SHOW
app.get("/:id", async (req, res) => {
  let response = { success: false }
  try {
    const show = await Show.findById(req.params.id)
      .populate("movieId", "title poster duration genre")
      .populate("theatreId", "name location city totalSeats")
      .lean()

    if (!show) throw "Show not found"

    response.success = true
    response.data = utilities.cleanMongoDocument(show)
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  ADMIN: CREATE SHOW
app.post("/", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"

    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN") throw "Admin access only"

    const { movieId, theatreId, screenNumber, showTime, price, availableSeats, showDate } = req.body

    if (!movieId || !theatreId || !showTime || !price || !showDate) {
      throw "movieId, theatreId, showTime, price and showDate are required"
    }

    // Validate movie and theatre exist
    const movieExists = await Movie.findById(movieId)
    const theatreExists = await Theatre.findById(theatreId)

    if (!movieExists) throw "Movie not found"
    if (!theatreExists) throw "Theatre not found"

    let newShow = await new Show({
      movieId,
      theatreId,
      screenNumber: screenNumber || 1,
      showTime,
      price,
      availableSeats: availableSeats || theatreExists.totalSeats,
      showDate,
    }).save()

    response.success = true
    response.data = utilities.cleanMongoDocument(newShow)
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  ADMIN: UPDATE SHOW
app.patch("/:id", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"

    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN") throw "Admin access only"

    const updatedShow = await Show.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).lean()

    if (!updatedShow) throw "Show not found"

    response.success = true
    response.data = utilities.cleanMongoDocument(updatedShow)
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

module.exports = app
