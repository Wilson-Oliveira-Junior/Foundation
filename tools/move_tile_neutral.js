const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'assets', 'Tile.png');
const destDir = path.join(root, 'assets', 'tiles');
const dest = path.join(destDir, 'tile-neutral.png');

if (!fs.existsSync(src)) {
  console.error('Source file not found:', src);
  process.exit(1);
}
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('Copied', src, '->', dest);
// keep original
