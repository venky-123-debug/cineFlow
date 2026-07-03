const express = require("express")
const app = express.Router()
const Show = require("../models/show")
const Movie = require("../models/movie")
const Theatre = require("../models/theatre")
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
    if (city) {
      const theatres = await Theatre.find({ city: { $regex: city, $options: "i" } }).select("_id")
      const theatreIds = theatres.map((t) => t._id)
      query.theatreId = { $in: theatreIds }
    }

    const shows = await Show.find(query)
      .populate("movieId", "title poster duration genre")
      .populate("theatreId", "name location city")
      .lean()
      .sort({ showTime: 1 })
    for (let i = 0; i < shows.length; i++) {
      shows[i] = utilities.cleanMongoDocument(shows[i])
    }
    response.success = true
    response.data = shows
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  GET SHOWS SCHEDULE (BookMyShow Style: Movie -> City -> Date -> Theatres -> Shows)
app.get("/schedule", async (req, res) => {
  let response = { success: false }
  try {
    const { movieId, city, date } = req.query

    if (!movieId) throw "movieId is required"
    if (!city) throw "city is required"

    // 1. Find all theatres in the selected city
    const theatres = await Theatre.find({ city: { $regex: city, $options: "i" } }).lean()
    const theatreIds = theatres.map((t) => t._id)

    // 2. Build show query
    const showQuery = {
      movieId: movieId,
      theatreId: { $in: theatreIds },
    }

    // 3. Filter by date if provided (defaulting to today's date if omitted)
    const targetDate = date ? new Date(date) : new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Using both showDate and showTime range to ensure match
    showQuery.$or = [
      { showDate: { $gte: startOfDay, $lte: endOfDay } },
      { showTime: { $gte: startOfDay, $lte: endOfDay } }
    ]

    // 4. Find shows sorted by show time
    const shows = await Show.find(showQuery).lean().sort({ showTime: 1 })

    // 5. Group shows by theatre
    const theatreMap = {}
    theatres.forEach((t) => {
      theatreMap[t._id.toString()] = {
        ...utilities.cleanMongoDocument(t),
        shows: [],
      }
    })

    shows.forEach((s) => {
      const tId = s.theatreId.toString()
      if (theatreMap[tId]) {
        theatreMap[tId].shows.push(utilities.cleanMongoDocument(s))
      }
    })

    // Filter out theatres that do not have any shows for this movie on this date
    const schedule = Object.values(theatreMap).filter((t) => t.shows.length > 0)

    response.success = true
    response.data = schedule
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

//  GET SEAT STATUS FOR A SHOW (For frontend seat selection)
app.get("/:id/seats", async (req, res) => {
  let response = { success: false }
  try {
    const { id } = req.params

    const show = await Show.findById(id)
      .populate("movieId", "title")
      .populate("theatreId", "name location city")
      .lean()

    if (!show) throw "Show not found"

    // Generate seat matrix if not exists
    if (!show.seats || show.seats.length === 0) {
      show.seats = generateSeatMatrix(show.totalRows || 12, show.seatsPerRow || 15)
    }

    // Group seats by status and category
    const seatStatus = {
      available: 0,
      booked: 0,
      locked: 0,
      byCategory: {
        PREMIUM: { available: 0, booked: 0, locked: 0 },
        STANDARD: { available: 0, booked: 0, locked: 0 },
        ECONOMY: { available: 0, booked: 0, locked: 0 }
      }
    }

    show.seats.forEach(seat => {
      seatStatus[seat.status.toLowerCase()]++
      if (seat.category && seatStatus.byCategory[seat.category]) {
        seatStatus.byCategory[seat.category][seat.status.toLowerCase()]++
      }
    })

    response.success = true
    response.data = {
      showId: show._id,
      movie: show.movieId,
      theatre: show.theatreId,
      showTime: show.showTime,
      seats: show.seats,
      seatStatus: seatStatus,
      totalSeats: show.seats.length,
      availableSeats: show.availableSeats,
      ticketCategories: show.ticketCategories
    }
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

// Helper function to generate seat matrix
function generateSeatMatrix(rows, seatsPerRow) {
  const seats = []
  const rowLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").slice(0, rows)
  
  // Define seat categories based on position
  const premiumRows = [5, 6, 7] // Middle rows are premium
  
  rowLetters.forEach((row, rowIndex) => {
    for (let col = 1; col <= seatsPerRow; col++) {
      let category = "ECONOMY"
      
      if (premiumRows.includes(rowIndex)) {
        category = "PREMIUM"
      } else if (rowIndex >= 3 && rowIndex <= 8) {
        category = "STANDARD"
      }
      
      seats.push({
        seatNumber: row + col,
        category: category,
        price: category === "PREMIUM" ? 250 : category === "STANDARD" ? 200 : 150,
        status: "AVAILABLE"
      })
    }
  })
  
  return seats
}

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
