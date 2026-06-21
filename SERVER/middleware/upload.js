const multer = require("multer")
const path = require("path")
const fs = require("fs")

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads/movies")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, "banner-" + uniqueSuffix + path.extname(file.originalname))
  },
})

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
