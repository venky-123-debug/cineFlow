const express = require("express")
const app = express.Router()
const Theatre = require("../models/Theatre")
const utilities = require("../scripts/utils")
const errorhandler = require("../scripts/error")

//  GET ALL THEATRES
app.get("/", async (req, res) => {
  let response = { success: false }
  try {
    const { city } = req.query
    const query = city ? { city: { $regex: city, $options: "i" } } : {}

    const theatres = await Theatre.find(query).lean().sort({ createdAt: -1 }).lean()
    for (let theatre of theatres) {
      theatre = utilities.cleanMongoDocument(theatre)
    }

    response.success = true
    response.data = theatres
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  GET SINGLE THEATRE
app.get("/:id", async (req, res) => {
  let response = { success: false }
  try {
    const theatre = await Theatre.findById(req.params.id).lean()
    if (!theatre) throw "Theatre not found"
    theatre = utilities.cleanMongoDocument(theatre)
    response.success = true
    response.data = theatre
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  ADMIN: CREATE THEATRE
app.post("/", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN") throw "Admin access only"

    const { name, location, city, totalSeats, screens, amenities } = req.body

    if (!name || !location || !city || !totalSeats) throw "Name, location, city and totalSeats are required"
    if (totalSeats <= 0) throw "Total seats must be greater than 0"
    let thisTheatre = await Theatre.findOne({ name, location, city }).lean()
    if (thisTheatre) throw "Theatre already exists"

    thisTheatre = await new Theatre({
      name,
      location,
      city,
      totalSeats,
      screens: screens || 1,
      amenities: amenities || [],
    }).save()

    response.success = true
    response.data = utilities.cleanMongoDocument(thisTheatre)
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  ADMIN: UPDATE THEATRE
app.patch("/:id", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN") throw "Admin access only"

    const updatedTheatre = await Theatre.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).lean()

    if (!updatedTheatre) throw "Theatre not found"

    response.success = true
    response.data = utilities.cleanMongoDocument(updatedTheatre)
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

module.exports = app
