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

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
app.use(cors())
app.use(morgan("combined"))

// Dodo Payments webhook verification and event handling.
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const rawBody = req.body
    const signature = req.headers["x-dodo-signature"] || req.headers["x-signature"]
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET || ""

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex")
      if (signature !== expectedSignature) {
        console.log("Dodo webhook signature verification failed")
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

    const eventType = event.type || event.event || ""
    const paymentData = event.data || event.payload || {}
    const paymentId = paymentData.id || event.id

    if (["payment.success", "payment.succeeded", "payment_intent.succeeded", "payment_successful"].includes(eventType)) {
      try {
        const booking = await Booking.findOne({ paymentId })
        if (booking) {
          booking.status = "CONFIRM"
          booking.ticketId = uuidv4()
          await booking.save()
          await Show.findByIdAndUpdate(booking.showId, { $inc: { availableSeats: -booking.seats.length } })
          const redisClient = require("./config/redis")
          for (const seat of booking.seats) {
            const key = `lock:show:${booking.showId}:seat:${seat}`
            await redisClient.del(key)
          }
        }
      } catch (err) {
        console.error("Error processing Dodo payment webhook:", err)
      }
    }

    res.json({ received: true })
  }
)

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
