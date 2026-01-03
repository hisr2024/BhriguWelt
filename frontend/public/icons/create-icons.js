const fs = require('fs');

// Create a simple SVG icon that can be used as placeholder
const createSVG = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00d9ff;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#b794f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ff1b6d;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#gradient)"/>
  <text x="50%" y="50%" font-size="${size * 0.5}" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-weight="bold">ॐ</text>
</svg>`;
};

// For now, just create a simple README to explain the icons setup
const readme = `# PWA Icons

These icons are placeholders for the PWA. 

To generate proper icons:
1. Create a master icon (512x512) with your app logo
2. Use an online tool like https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
3. Replace these placeholder files with the generated icons

The app currently uses SVG-based placeholder icons with the Om symbol and gradient background.
`;

fs.writeFileSync('README.md', readme);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
sizes.forEach(size => {
  const svg = createSVG(size);
  fs.writeFileSync(`icon-${size}x${size}.svg`, svg);
  console.log(`Created icon-${size}x${size}.svg`);
});

console.log('\nNote: SVG icons created. For production, convert these to PNG using:');
console.log('- Online tools like CloudConvert');
console.log('- Or use a tool like sharp/jimp if you add them as dependencies');
