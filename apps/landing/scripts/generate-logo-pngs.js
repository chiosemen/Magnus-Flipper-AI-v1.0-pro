const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { name: 'logo-social-400', size: 400 },
  { name: 'logo-social-800', size: 800 },
  { name: 'logo-social-1200', size: 1200 },
];

async function generatePNGs() {
  const svgPath = path.join(__dirname, '../public/logo-social-square.svg');

  if (!fs.existsSync(svgPath)) {
    console.error('Error: logo-social-square.svg not found');
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(svgPath);

  console.log('Generating PNG versions from logo-social-square.svg...\n');

  for (const { name, size } of sizes) {
    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(__dirname, `../public/${name}.png`));

      console.log(`✓ Generated: ${name}.png (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${name}.png:`, error.message);
    }
  }

  console.log('\n✓ PNG generation complete!');
  console.log('\nGenerated files:');
  console.log('- logo-social-400.png  (for Twitter/social media)');
  console.log('- logo-social-800.png  (for high-res displays)');
  console.log('- logo-social-1200.png (for Open Graph images)');
}

generatePNGs().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
