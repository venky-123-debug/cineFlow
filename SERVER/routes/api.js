const express = require("express")
const app = express.Router()

const authRoutes = require("./auth")
const movieRoutes = require("./movies")
const theatreRoutes = require("./theatres")
const showRoutes = require("./shows")
const bookingRoutes = require("./auth")
const fileRoutes = require("./file")

app.use("/api/auth", authRoutes)
app.use("/api/movies", movieRoutes)
app.use("/api/theatres", theatreRoutes)
app.use("/api/shows", showRoutes)
app.use("/api/bookings", bookingRoutes)
app.use("/api/files", fileRoutes)

module.exports = app
