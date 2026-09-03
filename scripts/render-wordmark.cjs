const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Mirror the in-app "Weeon Ops" wordmark: gradient "Weeon" with the smile
// arc under the "ee" + dark "Ops". Rasterized for email (clients can't do
// background-clip:text or inline SVG reliably).
// Short, shallow, symmetric smile arc centered under the "ee" — mirrors the
// app logo (viewBox 0 0 100 26, path "M 8 4 Q 50 34 92 4") scaled to width.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="96" viewBox="0 0 360 96">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#5e25cc"/>
      <stop offset="1" stop-color="#2b59ff"/>
    </linearGradient>
  </defs>
  <text x="12" y="64" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="46" letter-spacing="-1" fill="url(#g)">Weeon</text>
  <text x="182" y="64" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="46" letter-spacing="-1" fill="#161d2b">Ops</text>
  <!-- "ee" sits around x=57..104; a short arc (width ~44) centered at x=80 -->
  <path d="M 60 76 Q 80 88 100 76" fill="none" stroke="url(#g)" stroke-width="9" stroke-linecap="round"/>
</svg>`;

const out = path.join(__dirname, "..", "public", "email", "logo-wordmark.png");
sharp(Buffer.from(svg))
  .png()
  .resize(720, 192)
  .toFile(out)
  .then(() => {
    console.log("wrote", out, fs.statSync(out).size, "bytes");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
