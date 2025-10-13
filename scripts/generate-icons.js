import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BACKGROUND_COLOR = '#2b2b2b';
const LOGO_PATH = join(__dirname, '../public/images/logo.jpg');
const ICONS_DIR = join(__dirname, '../public/icons');

// Ensure icons directory exists
mkdirSync(ICONS_DIR, { recursive: true });

async function generateIcon(size) {
  console.log(`Generating ${size}x${size} icon...`);
  
  // Create background
  const background = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BACKGROUND_COLOR
    }
  })
  .png()
  .toBuffer();

  // Load and resize logo to fit within the icon with padding
  const logoPadding = Math.floor(size * 0.15); // 15% padding on each side
  const logoSize = size - (logoPadding * 2);
  
  const logo = await sharp(LOGO_PATH)
    .resize(logoSize, logoSize, { 
      fit: 'inside',
      withoutEnlargement: false 
    })
    .toBuffer();

  // Get logo metadata to center it
  const logoMetadata = await sharp(logo).metadata();
  const logoWidth = logoMetadata.width;
  const logoHeight = logoMetadata.height;
  
  // Calculate position to center the logo
  const left = Math.floor((size - logoWidth) / 2);
  const top = Math.floor((size - logoHeight) / 2);

  // Composite logo on background
  await sharp(background)
    .composite([{
      input: logo,
      top: top,
      left: left
    }])
    .png()
    .toFile(join(ICONS_DIR, `icon-${size}.png`));

  console.log(`✓ Generated icon-${size}.png`);
}

async function main() {
  try {
    console.log('Generating PWA icons with logo on #2b2b2b background...\n');
    
    await generateIcon(192);
    await generateIcon(512);
    
    console.log('\n✓ All icons generated successfully!');
    console.log('Icons saved to public/icons/');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

main();
