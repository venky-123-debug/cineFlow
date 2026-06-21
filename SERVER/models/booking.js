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
  paymentId: { type: String }, // Payment provider order ID (Razorpay order id)
  status: {
    type: String,
    enum: ["PENDING", "CONFIRM", "CANCEL"],
    default: "PENDING",
  },
  ticketId: { type: String, unique: true }, // Unique ticket ID for confirmed bookings
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema)
