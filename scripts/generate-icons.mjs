import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../client/public');

mkdirSync(publicDir, { recursive: true });

function createPng(size) {
  const canvas = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#0b141a"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.28}" fill="#00a884"/>
  <ellipse cx="${size/2}" cy="${size/2}" rx="${size*0.18}" ry="${size*0.14}" fill="#0b141a"/>
</svg>`;
  return canvas;
}

// Write SVG-based icons (browsers accept SVG for apple-touch in some cases; PWA needs PNG)
// Minimal valid 1x1 PNG as fallback - we'll use sharp-free approach with data URI conversion via canvas in build
// For production, use proper PNG - generate simple colored PNG using raw bytes

function minimalPng(size) {
  // Pre-generated solid color PNG is complex; write SVG files and document ImageMagick alternative
  writeFileSync(join(publicDir, `icon-${size}.svg`), createPng(size));
}

[192, 512].forEach((s) => minimalPng(s));

console.log('SVG icons created. For PWA PNG icons, run:');
console.log('  npx sharp-cli resize 512 512 -i client/public/icon-512.svg -o client/public/pwa-512x512.png');
console.log('Or copy any 192x192 and 512x512 PNG to client/public/pwa-192x192.png and pwa-512x512.png');
