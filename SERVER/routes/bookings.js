const express = require("express")
const router = express.Router()
const utilities = require("../scripts/utils")
const errorhandler = require("../scripts/error")
const redisClient = require("../config/redis")
const Booking = require("../models/booking")
const Show = require("../models/show")
const axios = require("axios")
const qrcode = require("qrcode")
const { v4: uuidv4 } = require("uuid")
const DODO_API_URL = process.env.DODO_API_URL || "https://api.dodopayments.com"
const DODO_API_KEY = process.env.DODO_API_KEY || ""
const DODO_CALLBACK_URL = process.env.DODO_CALLBACK_URL || `${process.env.APP_URL || "http://localhost:6000"}/webhook`
const DODO_CURRENCY = process.env.CURRENCY || "INR"

// Helper to build redis lock key for a seat
const seatLockKey = (showId, seat) => `lock:show:${showId}:seat:${seat}`

// Acquire locks for seats (returns acquired keys list)
async function acquireSeatLocks(showId, seats, ownerId, ttl = process.env.SEAT_LOCK_DURATION || 300) {
  const acquired = []
  for (const seat of seats) {
    const key = seatLockKey(showId, seat)
    try {
      const res = await redisClient.set(key, ownerId.toString(), { NX: true, EX: ttl })
      if (res !== "OK") {
        // failed to acquire
        // release any previously acquired
        for (const k of acquired) await redisClient.del(k)
        return { ok: false, failedSeat: seat }
      }
      acquired.push(key)
    } catch (err) {
      for (const k of acquired) await redisClient.del(k)
      throw err
    }
  }
  return { ok: true, keys: acquired }
}

// Release locks
async function releaseSeatLocks(keys = []) {
  if (!keys || !keys.length) return
  await Promise.all(keys.map((k) => redisClient.del(k)))
}

// Create booking + PaymentIntent
router.post("/create", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    const userId = tokenData.id

    const { showId, seats } = req.body
    if (!showId || !seats || !Array.isArray(seats) || seats.length === 0) throw "showId and seats array required"

    const show = await Show.findById(showId)
    if (!show) throw "Show not found"

    if (seats.length > show.availableSeats) throw "Not enough seats available"

    // Check if any of the seats already booked (CONFIRM)
    const conflict = await Booking.findOne({ showId, seats: { $in: seats }, status: "CONFIRM" })
    if (conflict) throw `Seat(s) already booked: ${seats}`

    // Acquire redis locks per-seat
    const ownerId = uuidv4()
    const lock = await acquireSeatLocks(showId, seats, ownerId)
    if (!lock.ok) throw `Seat ${lock.failedSeat} is being held by someone else`

    // Create pending booking
    const totalAmount = show.price * seats.length
    let booking = await new Booking({
      userId,
      showId,
      seats,
      totalAmount,
      status: "PENDING",
    }).save()

    // Create Dodo payment order
    if (!DODO_API_KEY) throw "Dodo Payments not configured"
    const dodoBody = {
      amount: Math.round(totalAmount * 100),
      currency: DODO_CURRENCY,
      payment_method: "upi", // adjust according to Dodo supported payment methods
      description: `CineFlow booking ${booking._id}`,
      callback_url: DODO_CALLBACK_URL,
      metadata: {
        bookingId: booking._id.toString(),
        userId: userId.toString(),
      },
      customer: {
        id: userId.toString(),
      },
    }

    const dodoResponse = await axios.post(`${DODO_API_URL}/payments`, dodoBody, {
      headers: {
        Authorization: `Bearer ${DODO_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    const paymentData = dodoResponse.data
    if (!paymentData || !paymentData.id) throw "Dodo payment creation failed"

    booking.paymentId = paymentData.id
    await booking.save()

    response.success = true
    response.data = {
      paymentUrl: paymentData.payment_url || paymentData.redirect_url || paymentData.url,
      bookingId: booking._id,
    }
    response.locks = lock.keys
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

// Ticket rendering endpoint: returns simple HTML ticket with QR code
router.get("/ticket/:bookingId", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate("showId").lean()
    if (!booking) return res.status(404).send("Booking not found")
    if (booking.status !== "CONFIRM") return res.status(400).send("Booking not confirmed yet")

    const ticketToken = booking.ticketId || booking._id.toString()
    const qrData = `https://example.com/verify-ticket/${ticketToken}`
    const qrImg = await qrcode.toDataURL(qrData)

    const show = await Show.findById(booking.showId._id).populate("theatreId movieId").lean()

    const html = `
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Ticket - CineFlow</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; display:flex; align-items:center; justify-content:center; background:#f4f6f8; padding:20px }
          .ticket { width:700px; background:#fff; border-radius:12px; box-shadow:0 6px 18px rgba(0,0,0,0.08); overflow:hidden; display:flex }
          .left { padding:24px; flex:1 }
          .right { background:#0f1724; color:#fff; width:260px; padding:18px; display:flex; flex-direction:column; align-items:center; justify-content:space-between }
          h1 { margin:0; font-size:20px }
          .meta { margin-top:12px; color:#555 }
          .seats { margin-top:8px; font-weight:600 }
          .qr { background:#fff; padding:8px; border-radius:8px }
          .small { font-size:12px; color:#cbd5e1 }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="left">
            <h1>${booking.movieTitle || (show.movieId && show.movieId.title) || "Movie"}</h1>
            <div class="meta">${(show.theatreId && show.theatreId.name) || "Theatre"} — ${(show && show.showTime) || "Time"}</div>
            <div class="seats">Seats: ${booking.seats.join(", ")}</div>
            <div style="margin-top:18px">Booking ID: ${booking._id}</div>
            <div style="margin-top:8px" class="small">Present this ticket at the entrance.</div>
          </div>
          <div class="right">
            <div>
              <div style="font-size:12px; opacity:0.85">CineFlow Ticket</div>
              <div style="height:12px"></div>
              <div class="qr"><img src="${qrImg}" alt="QR Code" width="200"/></div>
            </div>
            <div style="font-size:11px; opacity:0.85">Powered by CineFlow</div>
          </div>
        </div>
      </body>
      </html>
    `

    res.setHeader("Content-Type", "text/html")
    res.send(html)
  } catch (err) {
    res.status(500).send("Server error")
  }
})

module.exports = router
