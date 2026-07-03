const multer = require("multer")
const path = require("path")
const fs = require("fs")

// Configure storage in-memory
const storage = multer.memoryStorage()

// File filter to only accept images
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"]

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error("Only image files are allowed (jpeg, png, gif, webp)"), false)
  }
}

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
})

module.exports = upload
