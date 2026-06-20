const mongoose = require("mongoose")

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  showId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Show",
    required: true,
  },
  seats: [{ type: String, required: true }], // e.g., ["A1", "A2"]
  totalAmount: { type: Number, required: true },
  paymentId: { type: String }, // Stripe Payment Intent ID
  status: {
    type: String,
    enum: ["PENDING", "CONFIRM", "CANCEL"],
    default: "PENDING",
  },
  ticketId: { type: String, unique: true },
})

module.exports = mongoose.model("Booking", bookingSchema)
