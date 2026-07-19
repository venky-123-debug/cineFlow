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
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN" && tokenData.role !== "USER") throw "Invalid access"

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

//  GET SHOWS SCHEDULE
app.get("/schedule", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN" && tokenData.role !== "USER") throw "Invalid access"

    const { movieId, city, date } = req.query

    if (!movieId) throw "movieId is required"
    if (!city) throw "city is required"

    // Find all theatres in the selected city
    const theatres = await Theatre.find({ city: { $regex: city, $options: "i" } }).lean()
    const theatreIds = theatres.map((t) => t._id)

    // Build show query
    const showQuery = {
      movieId: movieId,
      theatreId: { $in: theatreIds },
    }

    // Filter by date if provided (defaulting to today's date if omitted)
    const targetDate = date ? new Date(date) : new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Using both showDate and showTime range to ensure match
    showQuery.$or = [
      { showDate: { $gte: startOfDay, $lte: endOfDay } },
      { showTime: { $gte: startOfDay, $lte: endOfDay } },
    ]

    // Find shows sorted by show time
    const shows = await Show.find(showQuery).lean().sort({ showTime: 1 })

    // Group shows by theatre
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
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN" && tokenData.role !== "USER") throw "Invalid access"

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

    const show = await Show.findById(id).populate("movieId", "title").populate("theatreId", "name location city").lean()

    if (!show) throw "Show not found"

    // Generate seat matrix if not exists
    if (!show.seats || show.seats.length === 0) {
      show.seats = utilities.generateSeatMatrix(show.totalRows || 12, show.seatsPerRow || 15)
    }

    // Get active Redis locks for this show using Hash HGETALL (O(K) where K is number of locks)
    const redisClient = require("../config/redis")
    const locks = (await redisClient.hGetAll(`show:${id}:locks`)) || {}
    const lockedSeats = new Set()
    const now = Date.now()

    for (const [seatNum, lockData] of Object.entries(locks)) {
      if (lockData) {
        const [lockedBy, expiresAtStr] = lockData.split(":")
        const expiresAt = parseInt(expiresAtStr, 10)
        if (expiresAt > now) {
          lockedSeats.add(seatNum)
        }
      }
    }

    // Apply locks dynamically to the seats returned
    show.seats = show.seats.map((seat) => {
      if (lockedSeats.has(seat.seatNumber) && seat.status !== "BOOKED") {
        return { ...seat, status: "LOCKED" }
      }
      return seat
    })

    // Group seats by status and category
    const seatStatus = {
      available: 0,
      booked: 0,
      locked: 0,
      byCategory: {
        PREMIUM: { available: 0, booked: 0, locked: 0 },
        STANDARD: { available: 0, booked: 0, locked: 0 },
        ECONOMY: { available: 0, booked: 0, locked: 0 },
      },
    }

    show.seats.forEach((seat) => {
      const statusKey = seat.status.toLowerCase()
      if (seatStatus[statusKey] !== undefined) {
        seatStatus[statusKey]++
      }
      if (
        seat.category &&
        seatStatus.byCategory[seat.category] &&
        seatStatus.byCategory[seat.category][statusKey] !== undefined
      ) {
        seatStatus.byCategory[seat.category][statusKey]++
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
      availableSeats: show.seats.filter((s) => s.status === "AVAILABLE").length,
      ticketCategories: show.ticketCategories,
    }
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  USER: LOCK SEATS FOR 10 MINUTES
app.post("/:id/lock", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "USER") throw "User access only"

    const { id } = req.params
    const { seats } = req.body

    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      throw "Seats are required and must be an array"
    }

    const show = await Show.findById(id)
    if (!show) throw "Show not found"

    // Check if any of these seats are already booked in the database
    if (show.seats && show.seats.length > 0) {
      const bookedSeats = show.seats.filter((s) => s.status === "BOOKED").map((s) => s.seatNumber)

      for (const seat of seats) {
        if (bookedSeats.includes(seat)) {
          throw `Seat ${seat} is already booked`
        }
      }
    }

    const redisClient = require("../config/redis")
    const hashKey = `show:${id}:locks`
    const now = Date.now()
    const lockDuration = Number(process.env.SEAT_LOCK_DURATION || 600) * 1000 // In milliseconds
    const newExpiresAt = now + lockDuration

    await redisClient.executeIsolated(async (isolatedClient) => {
      await isolatedClient.watch(hashKey)

      const locks = (await isolatedClient.hGetAll(hashKey)) || {}
      for (const seat of seats) {
        const lockData = locks[seat]
        if (lockData) {
          const [lockedBy, expiresAtStr] = lockData.split(":")
          const expiresAt = parseInt(expiresAtStr, 10)
          if (expiresAt > now && lockedBy !== tokenData.id) {
            throw `Seat ${seat} is currently locked by another user`
          }
        }
      }

      const multi = isolatedClient.multi()
      for (const seat of seats) {
        multi.hSet(hashKey, seat, `${tokenData.id}:${newExpiresAt}`)
      }
      const results = await multi.exec()
      if (results === null) {
        throw "Concurrency conflict: Someone else updated seat locks. Please try again."
      }
    })

    response.success = true
    response.message = "Seats locked successfully for 10 minutes"
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  ADMIN: BULK CREATE SHOWS (multiple dates × multiple times)
app.post("/bulk", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN") throw "Admin access only"

    const { movieId, theatreId, screenNumber, price, availableSeats, dates, times } = req.body

    if (!movieId || !theatreId || !price) throw "movieId, theatreId and price are required"
    if (!dates || !Array.isArray(dates) || dates.length === 0) throw "At least one date is required"
    if (!times || !Array.isArray(times) || times.length === 0) throw "At least one time slot is required"

    // Validate movie and theatre exist
    const movieExists = await Movie.findById(movieId)
    if (!movieExists) throw "Movie not found"
    const theatreExists = await Theatre.findById(theatreId)
    if (!theatreExists) throw "Theatre not found"

    const seatsCount = availableSeats || theatreExists.totalSeats
    const screenNum = screenNumber || 1

    const created = []
    const skipped = []
    const errors = []

    for (const dateStr of dates) {
      for (const timeStr of times) {
        try {
          // Build combined datetime  e.g.  "2026-07-10T18:30:00"
          const showDateTime = new Date(`${dateStr}T${timeStr}:00`)
          if (isNaN(showDateTime.getTime())) {
            errors.push(`Invalid date/time: ${dateStr} ${timeStr}`)
            continue
          }

          // Check for duplicate show at same theatre + screen + datetime
          const duplicate = await Show.findOne({
            theatreId,
            screenNumber: screenNum,
            showTime: showDateTime,
          })

          if (duplicate) {
            skipped.push(`${dateStr} ${timeStr} (duplicate)`)
            continue
          }

          const newShow = await new Show({
            movieId,
            theatreId,
            screenNumber: screenNum,
            showTime: showDateTime,
            showDate: new Date(dateStr),
            price,
            availableSeats: seatsCount,
          }).save()

          created.push(utilities.cleanMongoDocument(newShow))
        } catch (innerErr) {
          errors.push(`${dateStr} ${timeStr}: ${innerErr.message || innerErr}`)
        }
      }
    }

    response.success = true
    response.data = { created, skipped, errors }
    response.message = `Created ${created.length} shows. Skipped ${skipped.length} duplicates. ${errors.length} errors.`
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  ADMIN: CREATE SHOW (single)
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
    if (!movieExists) throw "Movie not found"

    const theatreExists = await Theatre.findById(theatreId)
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
