const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const rateLimit = require("express-rate-limit")
const path = require("path")

const connectDB = require("./config/db")
const redisClient = require("./config/redis")

const Booking = require("./models/booking")
const api = require("./routes/api")
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
      const query = { status: "PENDING" }
      if (orderId) {
        query.orderId = orderId
      } else if (paymentEntity.id) {
        query.paymentId = paymentEntity.id
      } else if (paymentLinkId) {
        query.paymentId = paymentLinkId
      }

      if (query.orderId || query.paymentId) {
        const ticketId = uuidv4()
        booking = await Booking.findOneAndUpdate(
          query,
          { $set: { status: "CONFIRM", paymentId: paymentEntity.id || paymentLinkId, ticketId } },
          { new: true }
        )
      }

      if (booking) {
        console.log(`Webhook: Confirming booking ${booking._id} for payment ${orderId || paymentEntity.id}`)

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
                "seats.$[elem].bookedBy": booking.userId,
              },
            },
            {
              arrayFilters: [{ "elem.seatNumber": { $in: booking.seats } }],
            },
          )
        }

        // Clear Redis seat locks from the Hash
        const redisClient = require("./config/redis")
        await redisClient.hDel(`show:${booking.showId}:locks`, booking.seats)

        // Send email
        const User = require("./models/user")
        const user = await User.findById(booking.userId).lean()
        const populatedShow = await Show.findById(booking.showId).populate("movieId").populate("theatreId").lean()

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
        console.log(` Webhook: No booking found for orderId=${orderId}, paymentId=${paymentEntity.id}`)
      }
    } catch (err) {
      console.error("Error processing Razorpay webhook:", err)
    }
  }

  res.json({ received: true })
})

app.use(express.json({ limit: "10mb" }))

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   message: "Too many requests from this IP",
// })
// app.use(limiter)

app.use("/", api)

app.get("/", (req, res) => {
  res.json({ success: true, message: "CineFlow Movie Booking API is running" })
})

const { startScheduler } = require("./scripts/scheduler")

const start = async () => {
  try {
    await connectDB()
    await redisClient.connect()
    console.log("Redis Connected")
    startScheduler()
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  } catch (error) {
    console.error(error)
  }
}

start()
