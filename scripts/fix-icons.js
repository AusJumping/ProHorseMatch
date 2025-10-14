import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BACKGROUND_COLOR = { r: 43, g: 43, b: 43, alpha: 1 }; // #2b2b2b solid
const LOGO_PATH = join(__dirname, '../public/images/logo.jpg');
const ICONS_DIR = join(__dirname, '../public/icons');

async function generateIcon(size, filename) {
  console.log(`Generating ${filename}...`);
  
  const logoPadding = Math.floor(size * 0.15);
  const logoSize = size - (logoPadding * 2);
  
  // Load and resize logo
  const logo = await sharp(LOGO_PATH)
    .resize(logoSize, logoSize, { 
      fit: 'inside',
      withoutEnlargement: false,
      background: BACKGROUND_COLOR
    })
    .toBuffer();

  // Get logo dimensions
  const logoMetadata = await sharp(logo).metadata();
  const left = Math.floor((size - logoMetadata.width) / 2);
  const top = Math.floor((size - logoMetadata.height) / 2);

  // Create solid background with logo
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: BACKGROUND_COLOR
    }
  })
  .composite([{
    input: logo,
    top: top,
    left: left
  }])
  .flatten({ background: BACKGROUND_COLOR }) // Ensure no transparency
  .png({ compressionLevel: 9, palette: false })
  .toFile(join(ICONS_DIR, filename));

  console.log(`✓ Generated ${filename}`);
}

async function main() {
  try {
    console.log('Regenerating PWA icons with solid background...\n');
    
    await generateIcon(180, 'apple-touch-icon.png');
    await generateIcon(192, 'icon-192.png');
    await generateIcon(512, 'icon-512.png');
    
    console.log('\n✓ All icons regenerated successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
