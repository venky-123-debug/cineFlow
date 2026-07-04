const jwt = require("jsonwebtoken")

module.exports.emailAddressPattern = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)*$/i

module.exports.verifyToken = (token, secret) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        console.log(err)

        reject("Invalid token")
      } else resolve(decoded)
    })
  })
}
module.exports.generateToken = (payload, secret, expiresIn = 86400) => {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, secret, { expiresIn }, (err, token) => {
      if (err) reject("Token generation failed")
      else resolve(token)
    })
  })
}

module.exports.cleanMongoDocument = (doc) => {
  const cleanedDoc = doc._doc ? { ...doc._doc } : { ...doc }
  cleanedDoc.id = cleanedDoc._id.toString()
  delete cleanedDoc._id
  delete cleanedDoc.__v
  return cleanedDoc
}

module.exports.generateSeatMatrix = (rows, seatsPerRow) => {
  const seats = []
  const rowLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").slice(0, rows)

  // Define seat categories based on position
  const premiumRows = [5, 6, 7] // Middle rows are premium

  // Middle rows are premium

  rowLetters.forEach((row, rowIndex) => {
    for (let col = 1; col <= seatsPerRow; col++) {
      let category = "ECONOMY"

      if (premiumRows.includes(rowIndex)) {
        category = "PREMIUM"
      } else if (rowIndex >= 3 && rowIndex <= 8) {
        category = "STANDARD"
      }

      seats.push({
        seatNumber: row + col,
        category: category,
        price: category === "PREMIUM" ? 250 : category === "STANDARD" ? 200 : 150,
        status: "AVAILABLE",
      })
    }
  })

  return seats
}
