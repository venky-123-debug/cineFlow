const mongoose = require("mongoose")

const seatSchema = new mongoose.Schema({
  seatNumber: String, // e.g., "A1", "B5"
  category: {
    // PREMIUM, STANDARD, ECONOMY
    type: String,
    enum: ["PREMIUM", "STANDARD", "ECONOMY"],
    default: "STANDARD",
  },
  price: Number, // Price for this specific seat
  status: {
    // AVAILABLE, BOOKED, LOCKED
    type: String,
    enum: ["AVAILABLE", "BOOKED", "LOCKED"],
    default: "AVAILABLE",
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    default: null,
  },
})

const showSchema = new mongoose.Schema({
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie",
    required: true,
  },
  theatreId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Theatre",
    required: true,
  },
  screenNumber: { type: Number, required: true },
  showTime: { type: Date, required: true },
  showDate: { type: Date, required: true },

  // Seat layout matrix: rows and columns
  totalRows: { type: Number, default: 12 }, // A-L rows
  seatsPerRow: { type: Number, default: 15 }, // 15 seats per row
  availableSeats: { type: Number, required: true },

  // Detailed seat information
  seats: [seatSchema],

  // Ticket categories with pricing
  ticketCategories: {
    PREMIUM: {
      basePrice: Number,
      section: String, // e.g., "Middle rows"
    },
    STANDARD: {
      basePrice: Number,
      section: String, // e.g., "Back & Front rows"
    },
    ECONOMY: {
      basePrice: Number,
      section: String, // e.g., "Extreme front & back"
    },
  },

  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.models.Show || mongoose.model("Show", showSchema)
