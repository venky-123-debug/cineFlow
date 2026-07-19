const express = require("express")
const app = express.Router()

const authRoutes = require("./auth")
const movieRoutes = require("./movies")
const theatreRoutes = require("./theatres")
const showRoutes = require("./shows")
const bookingRoutes = require("./bookings")
const fileRoutes = require("./file")
const recommendRoutes = require("./recommend")

app.use("/api/auth", authRoutes)
app.use("/api/movies", movieRoutes)
app.use("/api/theatres", theatreRoutes)
app.use("/api/shows", showRoutes)
app.use("/api/bookings", bookingRoutes)
app.use("/api/files", fileRoutes)
app.use("/api/recommend", recommendRoutes)

module.exports = app
