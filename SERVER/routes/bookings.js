const express = require("express")
const app = express.Router()
const Booking = require("../models/booking")
const Show = require("../models/show")
const utilities = require("../scripts/utils")
const errorhandler = require("../scripts/error")
const Razorpay = require("razorpay")
const crypto = require("crypto")

require("dotenv").config()
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

//  CREATE ORDER (Frontend calls this)
app.post("/", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)

    const { showId, seats, totalAmount } = req.body
    if (!showId || !seats || !totalAmount) throw "Missing required fields"

    const show = await Show.findById(showId)
    if (!show) throw "Show not found"

    // Create Razorpay Order
    const options = {
      amount: Math.round(totalAmount * 100), // in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: tokenData.id,
        showId: showId,
        seats: seats.join(","),
      },
    }

    const order = await razorpay.orders.create(options)

    response.success = true
    response.data = {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    }
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  VERIFY PAYMENT + CREATE BOOKING
app.post("/verify-payment", async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"

    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, showId, seats, totalAmount } = req.body

    // Verify required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) throw "Missing payment details"
    if (!showId || !seats || !totalAmount) throw "Missing booking details"

    // Verify Razorpay signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body).digest("hex")

    if (expectedSignature !== razorpay_signature) throw "Invalid payment signature"

    // Check if show exists
    const show = await Show.findById(showId)
    if (!show) throw "Show not found"

    // Create Booking with CONFIRM status (payment already verified)
    const booking = await new Booking({
      userId: tokenData.id,
      showId,
      seats,
      totalAmount,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id, // Store order ID for webhook reference
      status: "CONFIRM",
      ticketId: `TICKET_${Date.now()}`,
    }).save()

    // Update show seat count
    await Show.findByIdAndUpdate(showId, { $inc: { availableSeats: -seats.length } })

    // Clear Redis seat locks
    const redisClient = require("../config/redis")
    for (const seat of seats) {
      const key = `lock:show:${showId}:seat:${seat}`
      await redisClient.del(key)
    }

    response.success = true
    response.data = utilities.cleanMongoDocument(booking)
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

//  RAZORPAY WEBHOOK (Important)
app.post("/webhook", async (req, res) => {
  let response = { success: false }
  try {
    const signature = req.headers["x-razorpay-signature"]
    const webhookBody = JSON.stringify(req.body)

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(webhookBody)
      .digest("hex")

    if (signature !== expectedSignature) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature" })
    }

    const event = req.body

    if (event.event === "payment.captured" || event.event === "payment.succeeded") {
      const payment = event.payload.payment.entity
      const notes = payment.notes

      // Update booking status or create booking here
      console.log("Payment Successful:", payment.id, notes)
      // TODO: Update your Booking model here using notes
    }

    response.success = true
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.status(200).json(response) // Always return 200 for webhooks
  }
})

module.exports = app
