const express = require("express")
const app = express.Router()
const User = require("../models/User")
const { v4: uuidv4 } = require("uuid")
const SHA256 = require("crypto-js/sha256")
const utilities = require("../scripts/utils")
const errorhandler = require("../scripts/error")

app.post("/user/signup", async (req, res) => {
  let response = { success: false }
  try {
    const { name, email, password, role } = req.body

    if (!name) throw "Name is required"
    if (!email) throw "Email is required"
    if (!password) throw "Password is required"
    if (!role || role !== "USER") throw "Invalid role"
    if (!utilities.emailAddressPattern.test(email)) throw "Invalid email address"

    let thisUser = await User.findOne({ email, role }).lean()
    if (thisUser && thisUser.role === "USER") throw "Email already exists"
    if (thisUser) {
      let data = utilities.cleanMongoDocument(thisUser)
      delete data.password
      response.data = data
    } else {
      let newUser = await new User({
        name,
        email,
        password: SHA256(password).toString(),

        role: "USER",
      }).save()

      let data = utilities.cleanMongoDocument(newUser)
      delete data.password
      response.data = data
    }
    response.success = true
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

app.post("/admin/register", async (req, res) => {
  let response = { success: false }
  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password) throw "All fields are required"
    if (!role || role !== "ADMIN") throw "Invalid role"
    if (!utilities.emailAddressPattern.test(email)) throw "Invalid email address"

    let existingUser = await User.findOne({ email, role }).lean()
    if (existingUser) {
      let data = utilities.cleanMongoDocument(existingUser)
      delete data.password
      response.data = data
    } else {
      let newUser = await new User({
        name,
        email,
        password: SHA256(password).toString(),
        role,
      }).save()
      let data = utilities.cleanMongoDocument(newUser)
      delete data.password
      response.data = data
    }

    response.success = true
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

app.post("/login", async (req, res) => {
  let response = { success: false }
  try {
    const { email, password } = req.body

    if (!email) throw "Email is required"
    if (!password) throw "Password is required"

    if (!utilities.emailAddressPattern.test(email)) throw "Invalid email address"

    let thisUser = await User.findOne({ email }, { role: 1, password: 1 }).lean()
    if (!thisUser) throw "Invalid credentials"

    const hashedPassword = SHA256(password).toString()
    if (thisUser.password !== hashedPassword) throw "Invalid credentials"
    let data = utilities.cleanMongoDocument(thisUser)
    let tokenData = {
      id: data.id,
      role: data.role,
    }

    let token = await utilities.generateToken(tokenData, process.env.JWT_SECRET, process.env.JWT_EXPIRATION)
    // delete data.password
    response.success = true
    response.token = token
    // response.data = data
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

module.exports = app
