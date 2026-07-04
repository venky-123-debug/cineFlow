const nodemailer = require("nodemailer")
const QRCode = require("qrcode")

/* ─────────────────────────────────────────────────────────────
   Utility: XML / HTML escaping
───────────────────────────────────────────────────────────── */
function escapeXml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/* ─────────────────────────────────────────────────────────────
   Build vertical barcode SVG rects from a seed string
───────────────────────────────────────────────────────────── */
function buildBarcode(seed, x0, y0, totalW, barH) {
  const bars = []
  let cx = x0
  const chars = seed.padEnd(20, "0")
  for (let i = 0; i < 40 && cx < x0 + totalW - 2; i++) {
    const charCode = chars.charCodeAt(i % chars.length)
    const w = (charCode % 3) + 1
    const gap = (i % 5 === 0) ? 2 : 1
    bars.push(`<rect x="${cx}" y="${y0}" width="${w}" height="${barH}" fill="#0a0520" opacity="${i % 7 === 0 ? 0.3 : 0.9}"/>`)
    cx += w + gap
  }
  return bars.join("")
}

/* ─────────────────────────────────────────────────────────────
   Build film-reel SVG path (watermark)
   Center cx,cy  outer radius R  inner hub r  holes rh
───────────────────────────────────────────────────────────── */
function filmReelSvg(cx, cy, R) {
  const r = R * 0.42
  const rh = R * 0.10
  // 6 spoke holes at 60-degree intervals
  const holes = [0, 60, 120, 180, 240, 300].map(deg => {
    const rad = (deg * Math.PI) / 180
    const hx = cx + Math.cos(rad) * R * 0.67
    const hy = cy + Math.sin(rad) * R * 0.67
    return `<circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="${rh}" fill="none" stroke="#8b9cc8" stroke-width="2" opacity="0.18"/>`
  }).join("")

  return `
    <!-- Film Reel watermark -->
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="#1b2a5a" opacity="0.22"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#8b9cc8" stroke-width="2" opacity="0.18"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#122040" opacity="0.28"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#8b9cc8" stroke-width="1.5" opacity="0.15"/>
    <circle cx="${cx}" cy="${cy}" r="${R * 0.15}" fill="#0a1630" opacity="0.4"/>
    ${holes}
    <!-- Spokes -->
    ${[0, 60, 120, 180, 240, 300].map(deg => {
      const rad = (deg * Math.PI) / 180
      const x1 = (cx + Math.cos(rad) * r * 0.32).toFixed(1)
      const y1 = (cy + Math.sin(rad) * r * 0.32).toFixed(1)
      const x2 = (cx + Math.cos(rad) * r * 0.88).toFixed(1)
      const y2 = (cy + Math.sin(rad) * r * 0.88).toFixed(1)
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#8b9cc8" stroke-width="1.5" opacity="0.12"/>`
    }).join("")}
  `
}

/* ─────────────────────────────────────────────────────────────
   Build zig-zag/scalloped path for the right edge of the stub
   Returns an SVG path string
───────────────────────────────────────────────────────────── */
function scalloppedEdge(x, y0, height, size = 10) {
  const steps = Math.floor(height / size)
  let d = `M ${x} ${y0}`
  for (let i = 0; i < steps; i++) {
    const mid = y0 + i * size + size / 2
    const end = y0 + (i + 1) * size
    // alternate inward / outward bumps
    const bumpX = i % 2 === 0 ? x - size * 0.6 : x + size * 0.6
    d += ` Q ${bumpX} ${mid} ${x} ${end}`
  }
  return d
}

/* ─────────────────────────────────────────────────────────────
   Main function: generates SVG ticket, converts to PNG, sends email
───────────────────────────────────────────────────────────── */
async function sendTicketEmail({ email, movieTitle, theatreName, seats, showTime, ticketId }) {
  try {
    /* ── 1. Derived data ── */
    const showTimeDate = new Date(showTime)
    const dateStr = showTimeDate.toLocaleDateString("en-IN", {
      weekday: "short", day: "numeric", month: "long", year: "numeric",
    })
    const timeStr = showTimeDate.toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", hour12: true,
    })
    const dayStr = showTimeDate.toLocaleDateString("en-IN", { weekday: "long" })
    const seatsStr = seats.join(", ")
    const shortId = ticketId ? ticketId.substring(0, 16).toUpperCase() : "CF-TICKET"

    /* ── 2. QR Code ── */
    const qrPayload = JSON.stringify({ ticketId, theatre: theatreName, seats: seatsStr, show: `${dateStr} ${timeStr}` })
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 130, margin: 2,
      color: { dark: "#0d1a3a", light: "#ffffff" },
    })

    /* ── 3. Ticket SVG ──
       Canvas: 820 × 310
       Left stub  : 0 → 190   (crimson / rose)
       Main body  : 190 → 820 (deep navy)
    ── */
    const W = 820, H = 310
    const STUB_W = 200   // stub width
    const MAIN_X = STUB_W
    const MAIN_W = W - STUB_W
    const CORNER = 18

    // Barcode
    const barcodeEl = buildBarcode(shortId, 8, H - 64, STUB_W - 16, 40)

    // Film reel centred on the right portion
    const reelCX = MAIN_X + MAIN_W * 0.52
    const reelCY = H / 2
    const reelR = H * 0.46

    // Seat count label
    const seatCount = seats.length
    const seatLabel = seatCount === 1 ? "1 SEAT" : `${seatCount} SEATS`

    // Scalloped edge path (right edge of stub → left edge of main)
    const scallop = scalloppedEdge(STUB_W, 0, H, 12)

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
     xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <!-- Stub gradient: deep crimson -->
    <linearGradient id="gStub" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#8B0000"/>
      <stop offset="50%"  stop-color="#B8173A"/>
      <stop offset="100%" stop-color="#8B0000"/>
    </linearGradient>
    <!-- Main body gradient: deep navy -->
    <linearGradient id="gMain" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#0d1a3a"/>
      <stop offset="60%"  stop-color="#0f2251"/>
      <stop offset="100%" stop-color="#0a1630"/>
    </linearGradient>
    <!-- Shine overlay on stub -->
    <linearGradient id="gShine" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="50%"  stop-color="#ffffff" stop-opacity="0.00"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.12"/>
    </linearGradient>
    <!-- Film strip gradient -->
    <linearGradient id="gFilm" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#0a1020" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#0a1020" stop-opacity="0.9"/>
    </linearGradient>
    <!-- Clip path for rounded outer ticket -->
    <clipPath id="ticketClip">
      <rect width="${W}" height="${H}" rx="${CORNER}" ry="${CORNER}"/>
    </clipPath>
    <!-- Clip for main section only -->
    <clipPath id="mainClip">
      <rect x="${MAIN_X}" y="0" width="${MAIN_W}" height="${H}"/>
    </clipPath>
    <!-- Clip for stub only -->
    <clipPath id="stubClip">
      <rect x="0" y="0" width="${STUB_W}" height="${H}"/>
    </clipPath>
    <!-- Drop shadow filter -->
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
    <!-- Glow for title -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- ═══════════════ OUTER SHAPE ═══════════════ -->
  <g clip-path="url(#ticketClip)" filter="url(#shadow)">

    <!-- ── MAIN BODY ── -->
    <rect x="${MAIN_X}" y="0" width="${MAIN_W}" height="${H}" fill="url(#gMain)"/>

    <!-- Film strip top bar -->
    <rect x="${MAIN_X}" y="0" width="${MAIN_W}" height="32" fill="url(#gFilm)"/>
    <rect x="${MAIN_X}" y="${H - 32}" width="${MAIN_W}" height="32" fill="url(#gFilm)"/>
    <!-- Film strip holes top -->
    ${Array.from({ length: 14 }, (_, i) => {
      const fx = MAIN_X + 18 + i * 44
      return `<rect x="${fx}" y="5" width="22" height="22" rx="3" fill="#1e3060" opacity="0.7"/>
              <rect x="${fx}" y="${H - 27}" width="22" height="22" rx="3" fill="#1e3060" opacity="0.7"/>`
    }).join("")}

    <!-- Film Reel Watermark -->
    ${filmReelSvg(reelCX, reelCY, reelR)}

    <!-- ── CINEFLOW Logo area ── -->
    <text x="${MAIN_X + 28}" y="74"
          font-family="'Arial Black', 'Segoe UI Black', Arial, sans-serif"
          font-size="11" font-weight="900" fill="#d4af37"
          letter-spacing="5" opacity="0.9">CINEFLOW</text>

    <!-- Decorative star row -->
    <text x="${MAIN_X + 28}" y="90"
          font-family="Arial" font-size="8" fill="#d4af37" opacity="0.5"
          letter-spacing="3">★ ★ ★ ★ ★</text>

    <!-- Movie Title (large) -->
    <text x="${MAIN_X + 28}" y="144"
          font-family="'Arial Black', 'Segoe UI Black', Arial, sans-serif"
          font-size="32" font-weight="900" fill="#d4af37"
          letter-spacing="1" filter="url(#glow)">${escapeXml(movieTitle.toUpperCase())}</text>

    <!-- ADMIT ONE badge -->
    <rect x="${MAIN_X + 28}" y="155" width="82" height="18" rx="9" fill="#d4af37" opacity="0.15"/>
    <rect x="${MAIN_X + 28}" y="155" width="82" height="18" rx="9" fill="none" stroke="#d4af37" stroke-width="0.8" opacity="0.5"/>
    <text x="${MAIN_X + 69}" y="168"
          font-family="Arial" font-size="9" font-weight="700" fill="#d4af37"
          letter-spacing="2" text-anchor="middle" opacity="0.9">ADMIT ONE</text>

    <!-- Divider -->
    <line x1="${MAIN_X + 28}" y1="184" x2="${MAIN_X + MAIN_W - 170}" y2="184"
          stroke="#d4af37" stroke-width="0.6" opacity="0.25"/>

    <!-- Date / Time block -->
    <text x="${MAIN_X + 28}" y="206"
          font-family="Arial" font-size="9" fill="#8b9cc8" letter-spacing="2">DATE</text>
    <text x="${MAIN_X + 28}" y="222"
          font-family="'Arial Black', Arial, sans-serif" font-size="13" font-weight="900"
          fill="#ffffff">${escapeXml(dateStr)}</text>

    <text x="${MAIN_X + 28}" y="244"
          font-family="Arial" font-size="9" fill="#8b9cc8" letter-spacing="2">TIME</text>
    <text x="${MAIN_X + 28}" y="260"
          font-family="'Arial Black', Arial, sans-serif" font-size="18" font-weight="900"
          fill="#d4af37">${timeStr.toUpperCase()}</text>

    <!-- Theatre -->
    <text x="${MAIN_X + 220}" y="206"
          font-family="Arial" font-size="9" fill="#8b9cc8" letter-spacing="2">VENUE</text>
    <text x="${MAIN_X + 220}" y="222"
          font-family="Arial" font-size="13" font-weight="700"
          fill="#ffffff">${escapeXml(theatreName.length > 28 ? theatreName.substring(0, 28) + "…" : theatreName)}</text>

    <!-- Seats -->
    <text x="${MAIN_X + 220}" y="244"
          font-family="Arial" font-size="9" fill="#8b9cc8" letter-spacing="2">${seatLabel}</text>
    <text x="${MAIN_X + 220}" y="262"
          font-family="'Arial Black', Arial, sans-serif" font-size="15" font-weight="900"
          fill="#d4af37">${escapeXml(seatsStr.length > 22 ? seatsStr.substring(0, 22) + "…" : seatsStr)}</text>

    <!-- QR Code -->
    <rect x="${W - 158}" y="${H / 2 - 70}" width="140" height="140" rx="8"
          fill="#ffffff" opacity="0.05"/>
    <image href="${qrDataUrl}" x="${W - 156}" y="${H / 2 - 68}" width="136" height="136"/>
    <text x="${W - 88}" y="${H / 2 + 82}"
          font-family="'Courier New', monospace" font-size="7" fill="#8b9cc8"
          text-anchor="middle" letter-spacing="1">SCAN TO VERIFY</text>

    <!-- ── STUB ── -->
    <rect x="0" y="0" width="${STUB_W}" height="${H}" fill="url(#gStub)"/>
    <rect x="0" y="0" width="${STUB_W}" height="${H}" fill="url(#gShine)"/>

    <!-- Stub: CINEFLOW vertical text -->
    <text x="${STUB_W / 2 - 6}" y="${H - 52}"
          font-family="'Arial Black', Arial, sans-serif"
          font-size="12" font-weight="900" fill="#ffffff" opacity="0.25"
          letter-spacing="4"
          transform="rotate(-90, ${STUB_W / 2 - 6}, ${H - 52})">CINEFLOW</text>

    <!-- Stub: date vertical -->
    <text x="${STUB_W / 2 + 10}" y="${H - 52}"
          font-family="Arial" font-size="9" fill="#ffffff" opacity="0.55"
          transform="rotate(-90, ${STUB_W / 2 + 10}, ${H - 52})">${escapeXml(dateStr)}</text>

    <!-- Barcode on stub -->
    <rect x="8" y="${H - 72}" width="${STUB_W - 16}" height="48" rx="4" fill="#ffffff" opacity="0.08"/>
    ${barcodeEl}
    <text x="${STUB_W / 2}" y="${H - 14}"
          font-family="'Courier New', monospace" font-size="7.5" fill="#ffffff" opacity="0.6"
          text-anchor="middle" letter-spacing="1">${shortId}</text>

    <!-- Stub ticket number top -->
    <text x="${STUB_W / 2}" y="50"
          font-family="Arial" font-size="9" fill="#ffffff" opacity="0.5"
          letter-spacing="1" text-anchor="middle">TICKET</text>
    <text x="${STUB_W / 2}" y="65"
          font-family="'Courier New', monospace" font-size="8" fill="#ffffff" opacity="0.7"
          text-anchor="middle">#${shortId.substring(0, 8)}</text>

    <!-- Scalloped / perforated tear edge (right side of stub) -->
    <path d="${scallop}" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.15" stroke-dasharray="none"/>
    <!-- Dashed perforation line -->
    <line x1="${STUB_W}" y1="10" x2="${STUB_W}" y2="${H - 10}"
          stroke="#ffffff" stroke-width="1.2" stroke-dasharray="5,4" opacity="0.2"/>

  </g>

  <!-- Outer border -->
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${CORNER}" ry="${CORNER}"
        fill="none" stroke="#1e3a6e" stroke-width="1.5"/>
</svg>`

    /* ── 4. SVG → PNG via sharp ── */
    let attachment
    try {
      const sharp = require("sharp")
      const pngBuffer = await sharp(Buffer.from(svg))
        .png({ quality: 95, compressionLevel: 6 })
        .toBuffer()

      attachment = {
        filename: `cineflow-ticket-${shortId}.png`,
        content: pngBuffer,
        contentType: "image/png",
        cid: "ticketimage",
      }
      console.log(`✓ Ticket PNG generated (${pngBuffer.length} bytes)`)
    } catch (sharpErr) {
      console.warn("⚠ sharp unavailable, falling back to SVG:", sharpErr.message)
      attachment = {
        filename: `cineflow-ticket-${shortId}.svg`,
        content: Buffer.from(svg),
        contentType: "image/svg+xml",
        cid: "ticketimage",
      }
    }

    /* ── 5. HTML Email body ── */
    const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>CineFlow Ticket</title>
</head>
<body style="margin:0;padding:0;background:#06030d;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(160deg,#06030d 0%,#0e0518 100%);">
  <tr><td align="center" style="padding:40px 16px;">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

    <!-- Brand Header -->
    <tr><td align="center" style="padding-bottom:32px;">
      <div style="font-size:28px;font-weight:900;letter-spacing:6px;color:#d4af37;">CINEFLOW</div>
      <div style="font-size:10px;color:#5a3060;letter-spacing:4px;margin-top:5px;">MOVIE BOOKING PLATFORM</div>
    </td></tr>

    <!-- Confirmed badge -->
    <tr><td align="center" style="padding-bottom:28px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#8B0000,#B8173A);
                  border-radius:50px;padding:10px 28px;">
        <span style="font-size:13px;font-weight:700;color:#fff;letter-spacing:3px;">✓ BOOKING CONFIRMED</span>
      </div>
    </td></tr>

    <!-- Ticket image -->
    <tr><td align="center" style="padding-bottom:24px;">
      <div style="background:#0d1a3a;border-radius:18px;padding:6px;
                  box-shadow:0 8px 40px rgba(180,23,58,0.2),0 2px 8px rgba(0,0,0,0.6);">
        <img src="cid:ticketimage" alt="CineFlow Ticket"
             style="width:100%;max-width:580px;border-radius:14px;display:block;"/>
      </div>
    </td></tr>

    <!-- Quick details card -->
    <tr><td>
      <div style="background:#0d0515;border:1px solid #1e0d30;border-radius:16px;
                  padding:28px 32px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom:20px;border-bottom:1px solid #1a0d28;">
              <div style="font-size:9px;color:#5a3060;letter-spacing:3px;margin-bottom:8px;">MOVIE</div>
              <div style="font-size:22px;font-weight:900;color:#d4af37;">${escapeHtml(movieTitle)}</div>
            </td>
          </tr>
          <tr><td style="padding-top:20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="33%" valign="top">
                  <div style="font-size:9px;color:#5a3060;letter-spacing:3px;margin-bottom:6px;">DATE</div>
                  <div style="font-size:13px;font-weight:700;color:#e8e8ff;">${escapeHtml(dateStr)}</div>
                </td>
                <td width="33%" valign="top">
                  <div style="font-size:9px;color:#5a3060;letter-spacing:3px;margin-bottom:6px;">TIME</div>
                  <div style="font-size:18px;font-weight:900;color:#d4af37;">${escapeHtml(timeStr)}</div>
                </td>
                <td width="34%" valign="top">
                  <div style="font-size:9px;color:#5a3060;letter-spacing:3px;margin-bottom:6px;">VENUE</div>
                  <div style="font-size:13px;font-weight:700;color:#e8e8ff;">${escapeHtml(theatreName)}</div>
                </td>
              </tr>
            </table>
          </td></tr>
          <tr><td style="padding-top:20px;border-top:1px solid #1a0d28;margin-top:20px;">
            <div style="font-size:9px;color:#5a3060;letter-spacing:3px;margin-bottom:10px;margin-top:20px;">SEATS (${seatCount})</div>
            <div>
              ${seats.map(s => `<span style="display:inline-block;background:rgba(180,23,58,0.12);
                border:1px solid #B8173A;border-radius:20px;padding:5px 16px;
                margin:3px;font-size:12px;font-weight:700;color:#d4af37;">${escapeHtml(s)}</span>`).join("")}
            </div>
          </td></tr>
        </table>
      </div>
    </td></tr>

    <!-- Note -->
    <tr><td align="center" style="padding-bottom:40px;">
      <p style="font-size:11px;color:#3a1840;margin:0;">
        Show this ticket at the entrance. Carry a valid ID proof.<br/>
        No cancellations or refunds after the show starts.
      </p>
    </td></tr>

    <!-- Footer -->
    <tr><td align="center">
      <div style="font-size:10px;color:#1e0d28;letter-spacing:2px;">
        © ${new Date().getFullYear()} CINEFLOW · Lights. Camera. Action.
      </div>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`

    /* ── 6. Transport ── */
    let transporter
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: process.env.EMAIL_PORT === "465",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      })
    } else {
      console.log("No SMTP credentials — creating Ethereal test account...")
      const testAccount = await nodemailer.createTestAccount()
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email", port: 587, secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      })
    }

    /* ── 7. Send ── */
    const info = await transporter.sendMail({
      from: `"CineFlow Booking" <${process.env.EMAIL_USER || "no-reply@cineflow.com"}>`,
      to: email,
      subject: `🎬 Your CineFlow Ticket — ${movieTitle}`,
      html: emailHtml,
      attachments: [attachment],
    })
    console.log(`✓ Email sent → ${email} | MsgID: ${info.messageId}`)

    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) {
      console.log(`Ethereal preview: ${previewUrl}`)
      return { success: true, previewUrl }
    }
    return { success: true }

  } catch (error) {
    console.error("✗ Failed to send ticket email:", error)
    return { success: false, error: error.message }
  }
}

module.exports = { sendTicketEmail }
