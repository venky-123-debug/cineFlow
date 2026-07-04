const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: false },
  role: { type: String, index: true, enum: ["USER", "ADMIN"], default: "USER" },
  provider: { type: String, enum: ["LOCAL", "GOOGLE"], default: "LOCAL" },
  googleId: { type: String, index: true, sparse: true },
  avatar: { type: String },
})

module.exports = mongoose.model("User", userSchema)
