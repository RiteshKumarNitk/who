import sharp from "sharp";
import { mkdirSync } from "fs";

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUT = "public/icons";

mkdirSync(OUT, { recursive: true });

// Create a simple WHO logo: blue circle with white text
const svgLogo = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.45}" fill="#008dc9"/>
  <text x="${size / 2}" y="${size / 2}" text-anchor="middle" dominant-baseline="central"
        fill="white" font-family="Arial, sans-serif" font-weight="bold"
        font-size="${size * 0.4}">WHO</text>
</svg>`;

async function main() {
  for (const size of SIZES) {
    await sharp(Buffer.from(svgLogo(size)))
      .resize(size, size)
      .png()
      .toFile(`${OUT}/icon-${size}x${size}.png`);
    console.log(`Generated icon-${size}x${size}.png`);
  }
  console.log("All icons generated.");
}

main().catch(console.error);
