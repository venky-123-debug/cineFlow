const jwt = require("jsonwebtoken")

module.exports.emailAddressPattern = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)*$/i

module.exports.verifyToken = (token, secret) => {
  return new Promise((resolve, reject) => {
    console.log({ token, secret })

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
