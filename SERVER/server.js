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
// const bookingRoutes = require("./routes/bookings")

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
app.use(cors())
app.use(morgan("combined"))
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
// app.use("/api/bookings", bookingRoutes)

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
