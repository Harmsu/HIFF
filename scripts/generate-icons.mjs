import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const svgPath = join(__dirname, '../public/icons/icon.svg');
const outputDir = join(__dirname, '../public/icons');

const sizes = [192, 512];

async function generateIcons() {
  for (const size of sizes) {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(join(outputDir, `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }

  await sharp(svgPath)
    .resize(180, 180)
    .png()
    .toFile(join(outputDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');
}

generateIcons().catch(console.error);
