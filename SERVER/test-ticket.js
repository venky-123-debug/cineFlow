const QRCode = require('qrcode')
const sharp = require('sharp')
const fs = require('fs')

function escapeXml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function buildBarcode(seed, x0, y0, totalW, barH) {
  const bars = []
  let cx = x0
  const chars = seed.padEnd(20, '0')
  for (let i = 0; i < 40 && cx < x0 + totalW - 2; i++) {
    const charCode = chars.charCodeAt(i % chars.length)
    const w = (charCode % 3) + 1
    const gap = (i % 5 === 0) ? 2 : 1
    bars.push(`<rect x="${cx}" y="${y0}" width="${w}" height="${barH}" fill="#0a0520" opacity="${i % 7 === 0 ? 0.3 : 0.9}"/>`)
    cx += w + gap
  }
  return bars.join('')
}

function filmReelSvg(cx, cy, R) {
  const r = R * 0.42
  const rh = R * 0.10
  const holes = [0, 60, 120, 180, 240, 300].map(deg => {
    const rad = (deg * Math.PI) / 180
    const hx = cx + Math.cos(rad) * R * 0.67
    const hy = cy + Math.sin(rad) * R * 0.67
    return `<circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="${rh}" fill="none" stroke="#8b9cc8" stroke-width="2" opacity="0.18"/>`
  }).join('')
  return `
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="#1b2a5a" opacity="0.22"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#8b9cc8" stroke-width="2" opacity="0.18"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#122040" opacity="0.28"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#8b9cc8" stroke-width="1.5" opacity="0.15"/>
    <circle cx="${cx}" cy="${cy}" r="${R * 0.15}" fill="#0a1630" opacity="0.4"/>
    ${holes}
    ${[0, 60, 120, 180, 240, 300].map(deg => {
      const rad = (deg * Math.PI) / 180
      const x1 = (cx + Math.cos(rad) * r * 0.32).toFixed(1)
      const y1 = (cy + Math.sin(rad) * r * 0.32).toFixed(1)
      const x2 = (cx + Math.cos(rad) * r * 0.88).toFixed(1)
      const y2 = (cy + Math.sin(rad) * r * 0.88).toFixed(1)
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#8b9cc8" stroke-width="1.5" opacity="0.12"/>`
    }).join('')}`
}

function scalloppedEdge(x, y0, height, size = 12) {
  const steps = Math.floor(height / size)
  let d = `M ${x} ${y0}`
  for (let i = 0; i < steps; i++) {
    const mid = y0 + i * size + size / 2
    const end = y0 + (i + 1) * size
    const bumpX = i % 2 === 0 ? x - size * 0.6 : x + size * 0.6
    d += ` Q ${bumpX} ${mid} ${x} ${end}`
  }
  return d
}

async function generateTicket() {
  const ticketId = 'abc1234def567890xyz'
  const movieTitle = 'OPPENHEIMER'
  const theatreName = 'PVR: VR Mall, Whitefield'
  const seats = ['D4', 'D5', 'D6']
  const showTime = new Date('2025-08-15T19:30:00')

  const dateStr = showTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = showTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  const seatsStr = seats.join(', ')
  const shortId = ticketId.substring(0, 16).toUpperCase()

  const qrPayload = JSON.stringify({ ticketId, theatre: theatreName, seats: seatsStr, show: `${dateStr} ${timeStr}` })
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 130, margin: 2,
    color: { dark: '#0d1a3a', light: '#ffffff' },
  })

  const W = 820, H = 310
  const STUB_W = 200
  const MAIN_X = STUB_W
  const MAIN_W = W - STUB_W
  const CORNER = 18

  const barcodeEl = buildBarcode(shortId, 8, H - 64, STUB_W - 16, 40)
  const reelCX = MAIN_X + MAIN_W * 0.52
  const reelCY = H / 2
  const reelR = H * 0.46
  const seatLabel = seats.length === 1 ? '1 SEAT' : `${seats.length} SEATS`
  const scallop = scalloppedEdge(STUB_W, 0, H, 12)

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
     xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="gStub" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B0000"/>
      <stop offset="50%" stop-color="#B8173A"/>
      <stop offset="100%" stop-color="#8B0000"/>
    </linearGradient>
    <linearGradient id="gMain" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d1a3a"/>
      <stop offset="60%" stop-color="#0f2251"/>
      <stop offset="100%" stop-color="#0a1630"/>
    </linearGradient>
    <linearGradient id="gShine" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.00"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.12"/>
    </linearGradient>
    <linearGradient id="gFilm" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0a1020" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#0a1020" stop-opacity="0.9"/>
    </linearGradient>
    <clipPath id="ticketClip">
      <rect width="${W}" height="${H}" rx="${CORNER}" ry="${CORNER}"/>
    </clipPath>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <g clip-path="url(#ticketClip)">
    <!-- MAIN BODY -->
    <rect x="${MAIN_X}" y="0" width="${MAIN_W}" height="${H}" fill="url(#gMain)"/>
    <!-- Film strip bars -->
    <rect x="${MAIN_X}" y="0" width="${MAIN_W}" height="32" fill="url(#gFilm)"/>
    <rect x="${MAIN_X}" y="${H - 32}" width="${MAIN_W}" height="32" fill="url(#gFilm)"/>
    <!-- Film holes top + bottom -->
    ${Array.from({ length: 14 }, (_, i) => {
      const fx = MAIN_X + 18 + i * 44
      return `<rect x="${fx}" y="5" width="22" height="22" rx="3" fill="#1e3060" opacity="0.7"/>
              <rect x="${fx}" y="${H - 27}" width="22" height="22" rx="3" fill="#1e3060" opacity="0.7"/>`
    }).join('')}

    <!-- Film Reel Watermark -->
    ${filmReelSvg(reelCX, reelCY, reelR)}

    <!-- Brand -->
    <text x="${MAIN_X + 28}" y="74" font-family="Arial Black" font-size="11" font-weight="900" fill="#d4af37" letter-spacing="5" opacity="0.9">CINEFLOW</text>
    <text x="${MAIN_X + 28}" y="90" font-family="Arial" font-size="8" fill="#d4af37" opacity="0.5" letter-spacing="3">★ ★ ★ ★ ★</text>

    <!-- Movie Title -->
    <text x="${MAIN_X + 28}" y="144" font-family="Arial Black" font-size="32" font-weight="900" fill="#d4af37" letter-spacing="1" filter="url(#glow)">${escapeXml(movieTitle)}</text>

    <!-- Admit One -->
    <rect x="${MAIN_X + 28}" y="155" width="82" height="18" rx="9" fill="#d4af37" opacity="0.15"/>
    <rect x="${MAIN_X + 28}" y="155" width="82" height="18" rx="9" fill="none" stroke="#d4af37" stroke-width="0.8" opacity="0.5"/>
    <text x="${MAIN_X + 69}" y="168" font-family="Arial" font-size="9" font-weight="700" fill="#d4af37" letter-spacing="2" text-anchor="middle" opacity="0.9">ADMIT ONE</text>

    <!-- Divider -->
    <line x1="${MAIN_X + 28}" y1="184" x2="${MAIN_X + MAIN_W - 170}" y2="184" stroke="#d4af37" stroke-width="0.6" opacity="0.25"/>

    <!-- Date -->
    <text x="${MAIN_X + 28}" y="206" font-family="Arial" font-size="9" fill="#8b9cc8" letter-spacing="2">DATE</text>
    <text x="${MAIN_X + 28}" y="222" font-family="Arial Black" font-size="13" font-weight="900" fill="#ffffff">${escapeXml(dateStr)}</text>

    <!-- Time -->
    <text x="${MAIN_X + 28}" y="244" font-family="Arial" font-size="9" fill="#8b9cc8" letter-spacing="2">TIME</text>
    <text x="${MAIN_X + 28}" y="262" font-family="Arial Black" font-size="18" font-weight="900" fill="#d4af37">${timeStr.toUpperCase()}</text>

    <!-- Venue -->
    <text x="${MAIN_X + 240}" y="206" font-family="Arial" font-size="9" fill="#8b9cc8" letter-spacing="2">VENUE</text>
    <text x="${MAIN_X + 240}" y="222" font-family="Arial" font-size="13" font-weight="700" fill="#ffffff">${escapeXml(theatreName)}</text>

    <!-- Seats -->
    <text x="${MAIN_X + 240}" y="244" font-family="Arial" font-size="9" fill="#8b9cc8" letter-spacing="2">${seatLabel}</text>
    <text x="${MAIN_X + 240}" y="262" font-family="Arial Black" font-size="15" font-weight="900" fill="#d4af37">${escapeXml(seatsStr)}</text>

    <!-- QR Code -->
    <rect x="${W - 158}" y="${H / 2 - 70}" width="140" height="140" rx="8" fill="#ffffff" opacity="0.05"/>
    <image href="${qrDataUrl}" x="${W - 156}" y="${H / 2 - 68}" width="136" height="136"/>
    <text x="${W - 88}" y="${H / 2 + 82}" font-family="Courier New" font-size="7" fill="#8b9cc8" text-anchor="middle" letter-spacing="1">SCAN TO VERIFY</text>

    <!-- STUB -->
    <rect x="0" y="0" width="${STUB_W}" height="${H}" fill="url(#gStub)"/>
    <rect x="0" y="0" width="${STUB_W}" height="${H}" fill="url(#gShine)"/>

    <!-- Vertical brand text -->
    <text x="${STUB_W / 2 - 6}" y="${H - 52}" font-family="Arial Black" font-size="12" font-weight="900" fill="#ffffff" opacity="0.25" letter-spacing="4" transform="rotate(-90, ${STUB_W / 2 - 6}, ${H - 52})">CINEFLOW</text>
    <text x="${STUB_W / 2 + 10}" y="${H - 52}" font-family="Arial" font-size="9" fill="#ffffff" opacity="0.55" transform="rotate(-90, ${STUB_W / 2 + 10}, ${H - 52})">${escapeXml(dateStr)}</text>

    <!-- Barcode -->
    <rect x="8" y="${H - 72}" width="${STUB_W - 16}" height="48" rx="4" fill="#ffffff" opacity="0.08"/>
    ${barcodeEl}
    <text x="${STUB_W / 2}" y="${H - 14}" font-family="Courier New" font-size="7.5" fill="#ffffff" opacity="0.6" text-anchor="middle" letter-spacing="1">${shortId}</text>

    <!-- Ticket number top -->
    <text x="${STUB_W / 2}" y="50" font-family="Arial" font-size="9" fill="#ffffff" opacity="0.5" letter-spacing="1" text-anchor="middle">TICKET</text>
    <text x="${STUB_W / 2}" y="65" font-family="Courier New" font-size="8" fill="#ffffff" opacity="0.7" text-anchor="middle">#${shortId.substring(0, 8)}</text>

    <!-- Perforation line -->
    <path d="${scallop}" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.15"/>
    <line x1="${STUB_W}" y1="10" x2="${STUB_W}" y2="${H - 10}" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="5,4" opacity="0.2"/>
  </g>

  <!-- Outer border -->
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${CORNER}" ry="${CORNER}" fill="none" stroke="#1e3a6e" stroke-width="1.5"/>
</svg>`

  const png = await sharp(Buffer.from(svg)).png({ quality: 95 }).toBuffer()
  fs.writeFileSync('test-ticket-cinema.png', png)
  console.log('✓ Cinema ticket PNG written:', png.length, 'bytes → test-ticket-cinema.png')
}

generateTicket().catch(console.error)
