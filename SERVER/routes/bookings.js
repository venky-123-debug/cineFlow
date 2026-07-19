const express = require("express")
const app = express.Router()
const Booking = require("../models/booking")
const Show = require("../models/show")
const User = require("../models/user")
const utilities = require("../scripts/utils")
const errorhandler = require("../scripts/error")
const Razorpay = require("razorpay")
const crypto = require("crypto")
const { sendTicketEmail } = require("../scripts/email")

require("dotenv").config()
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

//  CREATE ORDER (Frontend calls this)
app.post("/", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)

    const { showId, seats, totalAmount } = req.body
    if (!showId || !seats || !totalAmount) throw "Missing required fields"

    const show = await Show.findById(showId)
    if (!show) throw "Show not found"

    // Verify seats are not already booked in the DB
    if (show.seats && show.seats.length > 0) {
      const bookedSeats = show.seats.filter(s => s.status === "BOOKED").map(s => s.seatNumber)
      for (const seat of seats) {
        if (bookedSeats.includes(seat)) {
          throw `Seat ${seat} is already booked`
        }
      }
    }

    // Verify user holds the Redis locks for these seats in the Hash
    const redisClient = require("../config/redis")
    const hashKey = `show:${showId}:locks`
    const locks = (await redisClient.hGetAll(hashKey)) || {}
    const now = Date.now()

    for (const seat of seats) {
      const lockData = locks[seat]
      if (lockData) {
        const [lockedBy, expiresAtStr] = lockData.split(":")
        const expiresAt = parseInt(expiresAtStr, 10)
        if (expiresAt < now || lockedBy !== tokenData.id) {
          throw `Seat ${seat} lock has expired or is locked by another user`
        }
      } else {
        throw `Seat ${seat} is not locked by you`
      }
    }

    // Create Razorpay Order
    const options = {
      amount: Math.round(totalAmount * 100), // in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: tokenData.id,
        showId: showId,
        seats: seats.join(","),
      },
    }

    const order = await razorpay.orders.create(options)

    // Save PENDING booking in MongoDB ledger immediately to resolve client-webhook race condition
    await new Booking({
      userId: tokenData.id,
      showId,
      seats,
      totalAmount,
      orderId: order.id,
      status: "PENDING",
    }).save()

    response.success = true
    response.data = {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    }
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  VERIFY PAYMENT + CREATE BOOKING
app.post("/verify-payment", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"

    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, showId, seats, totalAmount } = req.body

    // Verify required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) throw "Missing payment details"
    if (!showId || !seats || !totalAmount) throw "Missing booking details"

    // Verify Razorpay signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body).digest("hex")

    if (expectedSignature !== razorpay_signature) throw "Invalid payment signature"

    // Check if show exists
    const show = await Show.findById(showId)
    if (!show) throw "Show not found"

    const ticketId = `TICKET_${Date.now()}`

    // Idempotent conditional transition: only transition status from PENDING to CONFIRM
    const booking = await Booking.findOneAndUpdate(
      { orderId: razorpay_order_id, status: "PENDING" },
      { $set: { status: "CONFIRM", paymentId: razorpay_payment_id, ticketId } },
      { new: true }
    )

    if (!booking) {
      // If the webhook got here first, return the already processed confirmed booking
      const existingConfirmed = await Booking.findOne({ orderId: razorpay_order_id, status: "CONFIRM" })
      if (!existingConfirmed) {
        throw "Booking not found or already processed"
      }
      response.success = true
      response.data = utilities.cleanMongoDocument(existingConfirmed)
      return
    }

    // Ensure seat layout is initialized
    if (!show.seats || show.seats.length === 0) {
      const generatedSeats = utilities.generateSeatMatrix(show.totalRows || 12, show.seatsPerRow || 15)
      await Show.findByIdAndUpdate(showId, { $set: { seats: generatedSeats } })
    }

    // Update show seat count & update individual seat statuses to "BOOKED" and bookedBy
    await Show.updateOne(
      { _id: showId },
      { 
        $inc: { availableSeats: -seats.length },
        $set: { 
          "seats.$[elem].status": "BOOKED", 
          "seats.$[elem].bookedBy": tokenData.id 
        } 
      },
      { 
        arrayFilters: [{ "elem.seatNumber": { $in: seats } }] 
      }
    )

    // Clear Redis seat locks from the Hash
    const redisClient = require("../config/redis")
    await redisClient.hDel(`show:${showId}:locks`, seats)

    // Send ticket email
    const user = await User.findById(tokenData.id).lean()
    const populatedShow = await Show.findById(showId)
      .populate("movieId")
      .populate("theatreId")
      .lean()

    if (user && populatedShow) {
      // Trigger async send email
      sendTicketEmail({
        email: user.email,
        movieTitle: populatedShow.movieId?.title || "Movie Show",
        theatreName: populatedShow.theatreId?.name || "Theatre",
        seats,
        showTime: populatedShow.showTime,
        ticketId,
      })
    }

    response.success = true
    response.data = utilities.cleanMongoDocument(booking)
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  RAZORPAY WEBHOOK (Important)
app.post("/webhook", async (req, res) => {
  let response = { success: false }
  try {
    const signature = req.headers["x-razorpay-signature"]
    const webhookBody = JSON.stringify(req.body)

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(webhookBody)
      .digest("hex")

    if (signature !== expectedSignature) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature" })
    }

    const event = req.body

    if (event.event === "payment.captured" || event.event === "payment.succeeded" || event.event === "order.paid") {
      const payment = event.payload.payment.entity
      const orderId = payment.order_id
      
      const ticketId = `TICKET_${Date.now()}`
      const booking = await Booking.findOneAndUpdate(
        { orderId, status: "PENDING" },
        { $set: { status: "CONFIRM", paymentId: payment.id, ticketId } },
        { new: true }
      )
      if (booking) {

        const show = await Show.findById(booking.showId)
        if (show) {
          // Ensure seat layout is initialized
          if (!show.seats || show.seats.length === 0) {
            const generatedSeats = utilities.generateSeatMatrix(show.totalRows || 12, show.seatsPerRow || 15)
            await Show.findByIdAndUpdate(booking.showId, { $set: { seats: generatedSeats } })
          }

          // Update available seats and set status to BOOKED
          await Show.updateOne(
            { _id: booking.showId },
            {
              $inc: { availableSeats: -booking.seats.length },
              $set: {
                "seats.$[elem].status": "BOOKED",
                "seats.$[elem].bookedBy": booking.userId
              }
            },
            {
              arrayFilters: [{ "elem.seatNumber": { $in: booking.seats } }]
            }
          )

          // Clear Redis seat locks from the Hash
          const redisClient = require("../config/redis")
          await redisClient.hDel(`show:${booking.showId}:locks`, booking.seats)

          // Send email
          const user = await User.findById(booking.userId).lean()
          const populatedShow = await Show.findById(booking.showId)
            .populate("movieId")
            .populate("theatreId")
            .lean()

          if (user && populatedShow) {
            sendTicketEmail({
              email: user.email,
              movieTitle: populatedShow.movieId?.title || "Movie Show",
              theatreName: populatedShow.theatreId?.name || "Theatre",
              seats: booking.seats,
              showTime: populatedShow.showTime,
              ticketId: booking.ticketId,
            })
          }
        }
      }
    }

    response.success = true
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.status(200).json(response) // Always return 200 for webhooks
  }
})

// GET MY BOOKINGS (user)
app.get("/my-bookings", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)

    const bookings = await Booking.find({ userId: tokenData.id })
      .populate({ path: "showId", populate: [{ path: "movieId" }, { path: "theatreId" }] })
      .sort({ createdAt: -1 })
      .lean()

    const data = bookings.map(b => ({
      ...utilities.cleanMongoDocument(b),
      movieId: b.showId?.movieId ? utilities.cleanMongoDocument(b.showId.movieId) : null,
      showId: b.showId ? {
        ...utilities.cleanMongoDocument(b.showId),
        theatreId: b.showId.theatreId ? utilities.cleanMongoDocument(b.showId.theatreId) : null,
        movieId: undefined,
      } : null,
    }))

    response.success = true
    response.data = data
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

// GET BOOKING STATS (admin)
app.get("/stats", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)

    const totalBookings = await Booking.countDocuments({ status: "CONFIRM" })
    const revenueAgg = await Booking.aggregate([
      { $match: { status: "CONFIRM" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ])
    const totalRevenue = revenueAgg[0]?.total || 0

    const recentBookings = await Booking.find({ status: "CONFIRM" })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({ path: "showId", populate: [{ path: "movieId" }, { path: "theatreId" }] })
      .populate("userId", "name email")
      .lean()

    response.success = true
    response.data = {
      totalBookings,
      totalRevenue,
      recentBookings: recentBookings.map(b => utilities.cleanMongoDocument(b)),
    }
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

// GET ALL BOOKINGS (admin)
app.get("/", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)

    const { page = 1, limit = 20, status = "", search = "" } = req.query
    const query = {}
    if (status) query.status = status

    const bookings = await Booking.find(query)
      .populate({ path: "showId", populate: [{ path: "movieId" }, { path: "theatreId" }] })
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean()

    const total = await Booking.countDocuments(query)

    response.success = true
    response.data = {
      bookings: bookings.map(b => utilities.cleanMongoDocument(b)),
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    }
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

module.exports = app

