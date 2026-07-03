const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const rateLimit = require("express-rate-limit")

const connectDB = require("./config/db")
const redisClient = require("./config/redis")

const authRoutes = require("./routes/auth")
const movieRoutes = require("./routes/movies")
const theatreRoutes = require("./routes/theatres")
const showRoutes = require("./routes/shows")
const bookingRoutes = require("./routes/bookings")
const Booking = require("./models/booking")
const Show = require("./models/show")
const crypto = require("crypto")
const { v4: uuidv4 } = require("uuid")

dotenv.config()

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || ""
const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
app.use(cors())
app.use(morgan("dev"))

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"))

app.get("/razorpay/redirect", (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_payment_link_id,
    razorpay_payment_link_reference_id,
    razorpay_payment_link_status,
  } = req.query
  res.send(`
    <html>
      <body>
        <h1>Payment completed</h1>
        <p>Payment ID: ${razorpay_payment_id || "N/A"}</p>
        <p>Link ID: ${razorpay_payment_link_id || "N/A"}</p>
        <p>Reference ID: ${razorpay_payment_link_reference_id || "N/A"}</p>
        <p>Status: ${razorpay_payment_link_status || "N/A"}</p>
        <p>Webhook will also notify the server separately.</p>
      </body>
    </html>
  `)
})

// Razorpay webhook verification and event handling.
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const rawBody = req.body
  const signature = req.headers["x-razorpay-signature"]

  if (webhookSecret) {
    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex")
    if (signature !== expectedSignature) {
      console.log("Razorpay webhook signature verification failed")
      return res.status(400).send("Webhook signature verification failed")
    }
  }

  let event
  try {
    event = JSON.parse(rawBody.toString())
  } catch (err) {
    console.log("Invalid webhook payload", err)
    return res.status(400).send("Invalid payload")
  }

  const eventType = event.event || ""
  const paymentEntity = event.payload?.payment?.entity || {}
  const paymentLinkEntity = event.payload?.payment_link?.entity || {}
  const orderId = paymentEntity.order_id || event.payload?.order?.entity?.id
  const paymentLinkId = paymentLinkEntity.id

  if (["payment.captured", "payment.authorized", "order.paid", "payment_link.paid"].includes(eventType)) {
    try {
      let booking = null
      // Try to find by orderId first
      if (orderId) {
        booking = await Booking.findOne({ orderId: orderId })
      }
      // Fallback to paymentId (Razorpay payment ID)
      if (!booking && paymentEntity.id) {
        booking = await Booking.findOne({ paymentId: paymentEntity.id })
      }
      // Fallback to paymentLinkId
      if (!booking && paymentLinkId) {
        booking = await Booking.findOne({ paymentId: paymentLinkId })
      }

      if (booking) {
        console.log(`Webhook: Confirming booking ${booking._id} for payment ${orderId || paymentEntity.id}`)
        booking.status = "CONFIRM"
        booking.ticketId = booking.ticketId || uuidv4()
        await booking.save()

        const show = await Show.findById(booking.showId)
        if (show) {
          const utilities = require("./scripts/utils")
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
        }

        // Clear Redis seat locks
        const redisClient = require("./config/redis")
        for (const seat of booking.seats) {
          const key = `lock:show:${booking.showId}:seat:${seat}`
          await redisClient.del(key)
        }

        // Send email
        const User = require("./models/user")
        const user = await User.findById(booking.userId).lean()
        const populatedShow = await Show.findById(booking.showId)
          .populate("movieId")
          .populate("theatreId")
          .lean()

        if (user && populatedShow) {
          const { sendTicketEmail } = require("./scripts/email")
          sendTicketEmail({
            email: user.email,
            movieTitle: populatedShow.movieId?.title || "Movie Show",
            theatreName: populatedShow.theatreId?.name || "Theatre",
            seats: booking.seats,
            showTime: populatedShow.showTime,
            ticketId: booking.ticketId,
          })
        }

        console.log(`Webhook: Booking confirmed with ticket ${booking.ticketId}`)
      } else {
        console.log(`⚠️ Webhook: No booking found for orderId=${orderId}, paymentId=${paymentEntity.id}`)
      }
    } catch (err) {
      console.error("Error processing Razorpay webhook:", err)
    }
  }

  res.json({ received: true })
})

app.use(express.json({ limit: "10mb" }))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP",
})
app.use(limiter)

app.use("/api/auth", authRoutes)
app.use("/api/movies", movieRoutes)
app.use("/api/theatres", theatreRoutes)
app.use("/api/shows", showRoutes)
app.use("/api/bookings", bookingRoutes)

app.get("/", (req, res) => {
  res.json({ success: true, message: "CineFlow Movie Booking API is running" })
})

const start = async () => {
  await connectDB()
  await redisClient.connect()
  console.log("Redis Connected")
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

start()
