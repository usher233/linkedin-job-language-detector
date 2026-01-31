const { createCanvas } = require('canvas');
const fs = require('fs');

const sizes = [16, 32, 48, 128];

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#0a66c2';
  ctx.fillRect(0, 0, size, size);
  
  ctx.beginPath();
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  
  ctx.fillStyle = '#0a66c2';
  ctx.font = `bold ${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('L', centerX, centerY);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`icons/icon-${size}.png`, buffer);
  console.log(`Created icon-${size}.png`);
});

console.log('All icons created successfully!');
