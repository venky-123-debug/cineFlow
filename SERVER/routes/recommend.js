const express = require("express")
const app = express.Router()
const Show = require("../models/show")
const utilities = require("../scripts/utils")
const errorhandler = require("../scripts/error")

// GET RECOMMENDED CONTIGUOUS SEATS
app.get("/:id", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN" && tokenData.role !== "USER") throw "Invalid access"

    const { id } = req.params
    const count = parseInt(req.query.count, 10) || 2
    const requestedCategory = (req.query.category || "STANDARD").toUpperCase()

    if (count <= 0) throw "Invalid seat count"

    const show = await Show.findById(id).lean()
    if (!show) throw "Show not found"

    // Generate seats if not exists
    let seats = show.seats || []
    if (seats.length === 0) {
      seats = utilities.generateSeatMatrix(show.totalRows || 12, show.seatsPerRow || 15)
    }

    // Get active Redis locks
    const redisClient = require("../config/redis")
    const locks = (await redisClient.hGetAll(`show:${id}:locks`)) || {}
    const now = Date.now()
    const lockedSeats = new Set()

    for (const [seatNum, lockData] of Object.entries(locks)) {
      if (lockData) {
        const [_, expiresAtStr] = lockData.split(":")
        const expiresAt = parseInt(expiresAtStr, 10)
        if (expiresAt > now) {
          lockedSeats.add(seatNum)
        }
      }
    }

    // Map and group seats by row
    const rowMap = {}
    seats.forEach((seat) => {
      // Determine actual seat status considering dynamic Redis locks
      let currentStatus = seat.status
      if (lockedSeats.has(seat.seatNumber) && currentStatus !== "BOOKED") {
        currentStatus = "LOCKED"
      }

      const rowMatch = seat.seatNumber.match(/^[A-Z]+/)
      const row = rowMatch ? rowMatch[0] : "A"
      const colMatch = seat.seatNumber.match(/\d+$/)
      const col = colMatch ? parseInt(colMatch[0], 10) : 1

      if (!rowMap[row]) {
        rowMap[row] = []
      }

      rowMap[row].push({
        seatNumber: seat.seatNumber,
        category: seat.category,
        price: seat.price,
        status: currentStatus,
        col,
      })
    })

    // Search for adjacent seats
    const candidates = []
    const totalRows = Object.keys(rowMap).length
    const seatsPerRow = show.seatsPerRow || 15

    const middleRowIndex = Math.floor(totalRows / 2)
    const middleCol = seatsPerRow / 2

    // Get ordered rows list
    const rowsList = Object.keys(rowMap).sort()

    rowsList.forEach((row, rowIndex) => {
      const rowSeats = rowMap[row].sort((a, b) => a.col - b.col)

      // Use a sliding window of size `count` to find contiguous available seats
      for (let i = 0; i <= rowSeats.length - count; i++) {
        const window = rowSeats.slice(i, i + count)

        // Check if all seats in the window are available, have contiguous columns, and match the category
        let isValid = true
        let categoryMatchCount = 0

        for (let w = 0; w < window.length; w++) {
          const seat = window[w]

          // Must be AVAILABLE
          if (seat.status !== "AVAILABLE") {
            isValid = false
            break
          }

          // Check if column sequence is contiguous (i.e. col(n) == col(n-1) + 1)
          if (w > 0 && seat.col !== window[w - 1].col + 1) {
            isValid = false
            break
          }

          if (seat.category === requestedCategory) {
            categoryMatchCount++
          }
        }

        if (isValid) {
          // Calculate closeness to screen center (score: lower is better)
          const avgCol = window.reduce((sum, s) => sum + s.col, 0) / count
          const colDistance = Math.abs(avgCol - middleCol)
          const rowDistance = Math.abs(rowIndex - middleRowIndex)

          // We weight category match heavily, then center positioning
          // If the requested category matches completely, give it a massive bonus
          const isCategoryMatch = categoryMatchCount === count
          const score = (isCategoryMatch ? 0 : 1000) + rowDistance * 15 + colDistance

          candidates.push({
            seats: window.map((s) => s.seatNumber),
            score,
            isCategoryMatch,
          })
        }
      }
    })

    // Sort candidates by score
    candidates.sort((a, b) => a.score - b.score)

    response.success = true
    if (candidates.length > 0) {
      response.data = {
        seats: candidates[0].seats,
        isCategoryMatch: candidates[0].isCategoryMatch,
      }
    } else {
      response.data = {
        seats: [],
        message: "No adjacent seats found",
      }
    }
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

module.exports = app
