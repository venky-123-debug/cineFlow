const express = require("express")
const fs = require("fs").promises
const app = express.Router()
const errorhandler = require("../scripts/error")
const utilities = require("../scripts/utils")
const upload = require("../middleware/upload")
const crypto = require("crypto")

let uploadDir = process.env.UPLOADS_PATH || "UPLOADS/"
if (!uploadDir.endsWith("/") && !uploadDir.endsWith("\\")) {
  uploadDir += "/"
}

// POST /upload - upload a single file (image)
app.post("/upload", upload.single("file"), async (req, res) => {
  let response = { success: false }
  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN") throw "Admin access only"

    if (!req.file) throw "No file provided"

    // Calculate SHA-256 hash of the buffer
    const fileHash = crypto.createHash("sha256").update(req.file.buffer).digest("hex")

    // Ensure the uploads directory exists
    await fs.mkdir(uploadDir, { recursive: true })

    const filePath = `${uploadDir}${fileHash}`

    try {
      // Check if the file already exists
      await fs.access(filePath)
      console.log(`File already exists with hash ${fileHash}. Reusing same image.`)
    } catch (err) {
      // File does not exist, write the buffer to disk
      await fs.writeFile(filePath, req.file.buffer)
      console.log(`Saved new file with hash ${fileHash}`)
    }

    response.success = true
    response.data = {
      fileHash,
      imageUrl: `/api/files/${fileHash}`,
    }
  } catch (error) {
    response = await errorhandler(error, response)
  } finally {
    res.json(response)
  }
})

async function findMovieFile(fileHash) {
  const entries = await fs.readdir(uploadDir)
  const match = entries.find((entry) => {
    const name = entry.toLowerCase()
    return (
      name === `${fileHash.toLowerCase()}` ||
      name.startsWith(`${fileHash.toLowerCase()}.`) ||
      name.startsWith(`${fileHash.toLowerCase()}_`)
    )
  })

  return match || null
}

app.get("/:fileHash", async (req, res) => {
  let response = { success: false }

  try {
    if (!req.headers["access-token"]) throw "No token"
    const tokenData = await utilities.verifyToken(req.headers["access-token"], process.env.JWT_SECRET)
    if (tokenData.role !== "ADMIN" && tokenData.role !== "USER") throw "Invalid access"

    const fileHash = req.params.fileHash
    const filename = await findMovieFile(fileHash)

    if (!filename) throw "File not found"

    const filePath = `${uploadDir}${filename}`

    // Manually extract file extension without using path module
    const dotIndex = filename.lastIndexOf(".")
    const ext = dotIndex !== -1 ? filename.slice(dotIndex).toLowerCase() : ""
    const mimeType =
      ext === ".png" ? "image/png" : ext === ".gif" ? "image/gif" : ext === ".webp" ? "image/webp" : "image/jpeg"

    if (req.query.format === "dataUrl") {
      const buffer = await fs.readFile(filePath)
      const base64 = buffer.toString("base64")
      response.success = true
      response.data = {
        fileHash,
        filename,
        mimeType,
        dataUrl: `data:${mimeType};base64,${base64}`,
      }
      return res.json(response)
    }

    // Directly serve the file using res.sendFile with a root option, avoiding the path module
    res.set("Content-Type", mimeType)
    return res.sendFile(filename, { root: uploadDir })
  } catch (error) {
    response = await errorhandler(error, response)
    return res.json(response)
  }
})

module.exports = app
