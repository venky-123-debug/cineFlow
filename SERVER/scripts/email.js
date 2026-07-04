const nodemailer = require("nodemailer")
const QRCode = require("qrcode")
const path = require("path")

// Safe loading of node-canvas
let canvasLib = null
try {
  canvasLib = require("canvas")
  console.log(" Node-canvas library loaded successfully.")
} catch (e) {
  console.warn(" Node-canvas is not installed or failed to compile. Falling back to SVG ticket generation.")
}

/**
 * Generates the ticket layout (using Canvas or SVG fallback) and sends it via email.
 */
async function sendTicketEmail({ email, movieTitle, theatreName, seats, showTime, ticketId }) {
  try {
    // 1. Generate QR Code containing ticket details
    const qrData = JSON.stringify({
      ticketId,
      theatre: theatreName,
      seats: seats.join(", "),
      showTime: new Date(showTime).toLocaleString(),
    })

    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      margin: 1,
      color: {
        dark: "#1e1e24",
        light: "#ffffff",
      },
    })

    const showTimeStr = new Date(showTime).toLocaleString()

    let attachment = null
    let emailHtml = ""

    // 2. Try drawing on Canvas if available
    if (canvasLib) {
      const { createCanvas, loadImage } = canvasLib
      const canvas = createCanvas(650, 300)
      const ctx = canvas.getContext("2d")

      // Background Gradient
      const gradient = ctx.createLinearGradient(0, 0, 650, 0)
      gradient.addColorStop(0, "#111827") // gray-900
      gradient.addColorStop(1, "#1f2937") // gray-800
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 650, 300)

      // Ticket Border / Ticket Cutouts
      ctx.strokeStyle = "#ef4444" // red-500
      ctx.lineWidth = 4
      ctx.strokeRect(10, 10, 630, 280)

      // Brand Title
      ctx.fillStyle = "#ef4444"
      ctx.font = "bold 24px sans-serif"
      ctx.fillText("CINEFLOW TICKET", 40, 55)

      // Movie Title
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 20px sans-serif"
      ctx.fillText(movieTitle, 40, 105)

      // Details
      ctx.fillStyle = "#9ca3af" // gray-400
      ctx.font = "14px sans-serif"
      ctx.fillText("THEATRE", 40, 145)
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 16px sans-serif"
      ctx.fillText(theatreName, 40, 165)

      ctx.fillStyle = "#9ca3af"
      ctx.font = "14px sans-serif"
      ctx.fillText("SEATS", 40, 205)
      ctx.fillStyle = "#fbbf24" // amber-400
      ctx.font = "bold 18px sans-serif"
      ctx.fillText(seats.join(", "), 40, 225)

      ctx.fillStyle = "#9ca3af"
      ctx.font = "14px sans-serif"
      ctx.fillText("SHOWTIME", 40, 260)
      ctx.fillStyle = "#ffffff"
      ctx.font = "14px sans-serif"
      ctx.fillText(showTimeStr, 130, 260)

      // Embed QR Code
      const qrImage = await loadImage(qrCodeDataUrl)
      ctx.drawImage(qrImage, 450, 60, 150, 150)

      // Ticket ID footer
      ctx.fillStyle = "#6b7280" // gray-500
      ctx.font = "11px monospace"
      ctx.fillText(`ID: ${ticketId}`, 450, 230)

      const buffer = canvas.toBuffer("image/png")
      attachment = {
        filename: `ticket-${ticketId}.png`,
        content: buffer,
        cid: "ticketimage",
      }

      emailHtml = `
        <div style="font-family: sans-serif; background-color: #f3f4f6; padding: 30px; text-align: center;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #ef4444;">Your Ticket is Confirmed!</h2>
            <p style="color: #4b5563;">Thank you for booking with CineFlow. Your ticket details are attached below.</p>
            <div style="margin: 25px 0;">
              <img src="cid:ticketimage" alt="Movie Ticket" style="width: 100%; max-width: 550px; border-radius: 8px;" />
            </div>
            <p style="color: #9ca3af; font-size: 12px;">Enjoy your show!</p>
          </div>
        </div>
      `
    } else {
      // Fallback SVG Ticket embedded as PNG/SVG
      const svgTicket = `
        <svg width="650" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="650" height="300" fill="#111827" rx="12"/>
          <rect x="10" y="10" width="630" height="280" fill="none" stroke="#ef4444" stroke-width="3" rx="8"/>
          <text x="40" y="55" font-family="sans-serif" font-size="24" fill="#ef4444" font-weight="bold">CINEFLOW TICKET</text>
          <text x="40" y="105" font-family="sans-serif" font-size="20" fill="#ffffff" font-weight="bold">${movieTitle}</text>
          
          <text x="40" y="145" font-family="sans-serif" font-size="12" fill="#9ca3af">THEATRE</text>
          <text x="40" y="165" font-family="sans-serif" font-size="16" fill="#ffffff" font-weight="bold">${theatreName}</text>
          
          <text x="40" y="205" font-family="sans-serif" font-size="12" fill="#9ca3af">SEATS</text>
          <text x="40" y="225" font-family="sans-serif" font-size="18" fill="#fbbf24" font-weight="bold">${seats.join(", ")}</text>
          
          <text x="40" y="260" font-family="sans-serif" font-size="12" fill="#9ca3af">SHOWTIME</text>
          <text x="130" y="260" font-family="sans-serif" font-size="14" fill="#ffffff">${showTimeStr}</text>
          
          <image x="450" y="60" width="150" height="150" href="${qrCodeDataUrl}"/>
          <text x="450" y="230" font-family="monospace" font-size="10" fill="#6b7280">ID: ${ticketId}</text>
        </svg>
      `
      attachment = {
        filename: `ticket-${ticketId}.svg`,
        content: Buffer.from(svgTicket),
        cid: "ticketimage",
      }

      emailHtml = `
        <div style="font-family: sans-serif; background-color: #f3f4f6; padding: 30px; text-align: center;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #ef4444;">Your Ticket is Confirmed!</h2>
            <p style="color: #4b5563;">Thank you for booking with CineFlow. Your ticket details are attached below.</p>
            <div style="margin: 25px 0;">
              <img src="cid:ticketimage" alt="Movie Ticket" style="width: 100%; max-width: 550px;" />
            </div>
            <p style="color: #9ca3af; font-size: 12px;">Enjoy your show!</p>
          </div>
        </div>
      `
    }

    // 3. Configure Transporter (Gmail, SMTP or fallback Ethereal)
    let transporter
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: process.env.EMAIL_PORT === "465",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      })
    } else {
      console.log("No SMTP credentials found in .env. Creating test Ethereal account...")
      const testAccount = await nodemailer.createTestAccount()
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })
    }

    // 4. Send Email
    const mailOptions = {
      from: `"CineFlow Booking" <${process.env.EMAIL_USER || "no-reply@cineflow.com"}>`,
      to: email,
      subject: `CineFlow Ticket Confirmed: ${movieTitle}`,
      html: emailHtml,
      attachments: [attachment],
    }

    const info = await transporter.sendMail(mailOptions)
    console.log(` Email sent successfully to ${email}. Message ID: ${info.messageId}`)

    // If using Ethereal, log preview link
    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) {
      console.log(`Ethereal Email Preview URL: ${previewUrl}`)
      return { success: true, previewUrl }
    }

    return { success: true }
  } catch (error) {
    console.error("✗ Failed to send ticket email:", error)
    return { success: false, error: error.message }
  }
}

module.exports = { sendTicketEmail }
