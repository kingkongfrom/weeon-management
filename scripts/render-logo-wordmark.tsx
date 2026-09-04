import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { Logo } from "../components/logo";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "email", "logo-wordmark.png");
const tmpHtml = join(root, ".tmp-email-logo.html");

async function main() {
  const geistSans = join(root, "node_modules", "geist", "dist", "fonts", "geist-sans");
  const fontBlack = join(geistSans, "Geist-Black.ttf");

  const cssTemplate = await readFile(join(root, "scripts", "email-logo.css"), "utf8");
  const css = cssTemplate.replace(
    "FONT_BLACK",
    pathToFileURL(fontBlack).href,
  );

  const logoHtml = renderToStaticMarkup(createElement(Logo));
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>${css}</style>
  </head>
  <body>
    <div id="capture-wrap"><div id="capture">${logoHtml}</div></div>
  </body>
</html>`;

  await writeFile(tmpHtml, html);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 480, height: 160 });
    await page.goto(pathToFileURL(tmpHtml).href, { waitUntil: "networkidle" });

    const capture = page.locator("#capture-wrap");
    const screenshot = await capture.screenshot({ type: "png", omitBackground: true });

    const meta = await sharp(screenshot).metadata();
    const sourceWidth = meta.width ?? 1;
    const sourceHeight = meta.height ?? 1;
    const targetWidth = 360;
    const targetHeight = Math.max(
      1,
      Math.round((sourceHeight / sourceWidth) * targetWidth),
    );

    const png = await sharp(screenshot)
      .resize(targetWidth, targetHeight, { fit: "fill" })
      .png()
      .toBuffer();

    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, png);
    console.log(`wrote ${out} (${png.byteLength} bytes) from Logo component`);
  } finally {
    await browser.close();
    await unlink(tmpHtml).catch(() => undefined);
  }
}

main().catch(async (error) => {
  await unlink(tmpHtml).catch(() => undefined);
  try {
    await access(out);
  } catch {
    console.error(error);
    process.exit(1);
  }
  console.warn(
    `Skipped rendering logo wordmark (Playwright browser unavailable). ` +
      `Using existing committed asset: ${out}`,
  );
});
