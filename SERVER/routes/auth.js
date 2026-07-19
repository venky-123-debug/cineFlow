const express = require("express")
const https = require("https")
const app = express.Router()
const User = require("../models/user")
const { v4: uuidv4 } = require("uuid")
const SHA256 = require("crypto-js/sha256")
const utilities = require("../scripts/utils")
const errorhandler = require("../scripts/error")

async function verifyGoogleIdToken(idToken) {
  if (!idToken) throw "Google ID token is required"
  if (!process.env.GOOGLE_CLIENT_ID) throw "Google OAuth is not configured"

  return new Promise((resolve, reject) => {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    https
      .get(url, (res) => {
        let data = ""
        res.on("data", (chunk) => {
          data += chunk
        })
        res.on("end", () => {
          try {
            const payload = JSON.parse(data)
            if (res.statusCode !== 200) {
              return reject(payload.error_description || "Invalid Google token")
            }
            if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
              return reject("Invalid Google client ID")
            }
            if (payload.email_verified !== true && payload.email_verified !== "true") {
              return reject("Google email is not verified")
            }
            resolve(payload)
          } catch (error) {
            reject("Invalid Google token response")
          }
        })
      })
      .on("error", reject)
  })
}

app.post("/admin/register", async (req, res) => {
  let response = { success: false }
  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password) throw "All fields are required"
    if (!role || role !== "ADMIN") throw "Invalid role"

    if (!utilities.emailAddressPattern.test(email)) throw "Invalid email address"

    let existingUser = await User.findOne({ email, role }).lean()
    if (existingUser) throw "Admin already exists, Cannot have more than one admin."

    let newUser = await new User({
      name,
      email,
      password: SHA256(password).toString(),
      role,
    }).save()

    let data = utilities.cleanMongoDocument(newUser)
    delete data.password
    response.data = data

    response.success = true
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})
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

app.post("/login", async (req, res) => {
  let response = { success: false }
  try {
    const { email, password } = req.body

    if (!email) throw "Email is required"
    if (!password) throw "Password is required"

    if (!utilities.emailAddressPattern.test(email)) throw "Invalid email address"

    let thisUser = await User.findOne({ email }, { role: 1, password: 1, name: 1 }).lean()
    if (!thisUser) throw "Not found"

    const hashedPassword = SHA256(password).toString()
    if (thisUser.password !== hashedPassword) throw "Invalid credentials"
    let data = utilities.cleanMongoDocument(thisUser)
    let tokenData = {
      id: data.id,
      role: data.role,
    }

    let token = await utilities.generateToken(tokenData, process.env.JWT_SECRET, Number(process.env.JWT_EXPIRATION))
    delete data.password
    response.success = true
    response.token = token
    response.data = data
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

app.post("/google", async (req, res) => {
  let response = { success: false }
  try {
    const { idToken, name, email, picture } = req.body
    const googleData = await verifyGoogleIdToken(idToken)

    const googleEmail = googleData.email || email
    if (!googleEmail) throw "Google email is required"
    if (!utilities.emailAddressPattern.test(googleEmail)) throw "Invalid email address"

    const googleName = googleData.name || name || googleEmail.split("@")[0]
    const googlePicture = googleData.picture || picture || null

    let thisUser = await User.findOne({ $or: [{ email: googleEmail }, { googleId: googleData.sub }] })

    if (!thisUser) {
      thisUser = await new User({
        name: googleName,
        email: googleEmail,
        password: SHA256(uuidv4()).toString(),
        role: "USER",
        provider: "GOOGLE",
        googleId: googleData.sub,
        avatar: googlePicture,
      }).save()
    } else {
      const updates = {}
      if (!thisUser.googleId) updates.googleId = googleData.sub
      if (!thisUser.provider) updates.provider = "GOOGLE"
      if (!thisUser.name && googleName) updates.name = googleName
      if (!thisUser.avatar && googlePicture) updates.avatar = googlePicture
      if (Object.keys(updates).length > 0) {
        thisUser = await User.findByIdAndUpdate(thisUser._id, { $set: updates }, { new: true })
      }
    }

    let data = utilities.cleanMongoDocument(thisUser)
    delete data.password

    let tokenData = {
      id: data.id,
      role: data.role,
    }

    let token = await utilities.generateToken(tokenData, process.env.JWT_SECRET, Number(process.env.JWT_EXPIRATION))

    response.success = true
    response.token = token
    response.data = data
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

// SEND OTP FOR PASSWORD RESET
app.post("/forgot-password", async (req, res) => {
  let response = { success: false }
  try {
    const { email } = req.body
    if (!email) throw "Email is required"
    if (!utilities.emailAddressPattern.test(email)) throw "Invalid email address"

    // Verify user or admin exists with this email
    const userExists = await User.exists({ email })
    if (!userExists) throw "User with this email does not exist"

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Store in Redis with a 10-minute expiry (600 seconds)
    const redisClient = require("../config/redis")
    await redisClient.setEx(`otp:${email}`, 600, otp)

    // Send email with nodemailer
    const { sendOtpEmail } = require("../scripts/email")
    const emailResult = await sendOtpEmail({ email, otp })

    response.success = true
    response.message = "OTP sent to email successfully"
    if (emailResult.previewUrl) {
      response.previewUrl = emailResult.previewUrl
    }
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

// VERIFY OTP AND RESET PASSWORD (FOR BOTH USER AND ADMIN)
app.post("/reset-password", async (req, res) => {
  let response = { success: false }
  try {
    const { email, otp, newPassword } = req.body
    if (!email || !otp || !newPassword) throw "Email, OTP, and newPassword are required"

    const redisClient = require("../config/redis")
    const storedOtp = await redisClient.get(`otp:${email}`)

    if (!storedOtp || storedOtp !== otp) {
      throw "Invalid or expired OTP"
    }

    // Hash the new password with SHA256 as used throughout the authentication system
    const hashedPassword = SHA256(newPassword).toString()

    // Update all matching user/admin profiles with this email
    const result = await User.updateMany({ email }, { $set: { password: hashedPassword } })
    if (result.matchedCount === 0) throw "User not found"

    // Delete OTP from Redis
    await redisClient.del(`otp:${email}`)

    response.success = true
    response.message = "Password reset successfully. You can now login with your new password."
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

module.exports = app
