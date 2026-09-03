const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Full "Weeon Ops" wordmark faithful to the marketing-site Logo.tsx:
//   - Space Grotesk (bold for Weeon, medium for Ops)
//   - 3-stop gradient: #5b21b6 -> #4f46e5 -> #2563eb (90deg)
//   - smile arc from Logo.tsx: viewBox 0 0 100 26, path M 8 4 Q 50 34 92 4,
//     strokeWidth 9, positioned at left:27% right:35% (so it spans ~27%..65%
//     of the Weeon span) and sits just under the baseline.
// "Ops" is plain text that follows the brand color for light surfaces (#1c2540).

const fontSrc = "C:/Users/eduar/AppData/Local/Temp/kilo/logo-probe/SpaceGrotesk.ttf";

// Fall back if the downloaded font isn't found.
const fontExists = fs.existsSync(fontSrc);
const fontFace = fontExists
  ? `<style>@font-face{font-family:"SG";src:local("SG"), url("file:///${fontSrc.replace(/\\/g, "/")}") format("truetype");}</style>`
  : "";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="96" viewBox="0 0 360 96">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#5b21b6"/>
      <stop offset="0.42" stop-color="#4f46e5"/>
      <stop offset="1" stop-color="#2563eb"/>
    </linearGradient>
    ${fontFace}
  </defs>
  <text x="12" y="64" font-family="SG, Arial, Helvetica, sans-serif" font-weight="700" font-size="48" letter-spacing="0" fill="url(#g)">Weeon</text>
  <text x="170" y="64" font-family="SG, Arial, Helvetica, sans-serif" font-weight="500" font-size="48" letter-spacing="0" fill="#1c2540">Ops</text>
  <!-- Smile scaled to span ~27%..65% of "Weeon" width, below baseline -->
  <path d="M 33 78 Q 80 88 127 78" fill="none" stroke="url(#g)" stroke-width="9" stroke-linecap="round"/>
</svg>`;

const out = path.join(__dirname, "..", "public", "email", "logo-wordmark.png");
sharp(Buffer.from(svg))
  .png()
  .resize(720, 192)
  .toFile(out)
  .then(() => {
    console.log("wrote", out, fs.statSync(out).size, "bytes (font:", fontExists, ")");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
