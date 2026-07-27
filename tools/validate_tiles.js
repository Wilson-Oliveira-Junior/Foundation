#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const ASSETS_DIR = path.resolve(__dirname, '..', 'tiles');
const EXPECTED = [
  'tile_straight.png',
  'tile_corner.png',
  'tile_corner_reverse.png',
  'tile_cross.png',
  'tile_t.png',
  'tile_start.png',
  'tile_goal.png',
  'tile_normal.png',
  'tile_success.png',
  'tile_fail.png',
  'tile_reward.png',
  'tile_event.png',
  'cornerstone.png',
  'pedestal.png'
];

function listFiles(dir) {
  try { return fs.readdirSync(dir); } catch (e) { return []; }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function analyze(filePath) {
  try {
    const img = await loadImage(filePath);
    return { width: img.width, height: img.height };
  } catch (e) {
    return { error: String(e) };
  }
}

async function makeThumb(srcPath, destPath, size=128) {
  try {
    const img = await loadImage(srcPath);
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,size,size);
    ctx.drawImage(img, 0, 0, size, size);
    const out = fs.createWriteStream(destPath);
    const stream = canvas.createPNGStream();
    await new Promise((res,rej)=>{
      stream.pipe(out);
      out.on('finish', res);
      out.on('error', rej);
    });
    return true;
  } catch (e) {
    return false;
  }
}

async function run() {
  console.log('Assets dir:', ASSETS_DIR);
  const pngDir = path.join(ASSETS_DIR);
  const thumbsDir = path.join(ASSETS_DIR, 'thumbs');
  ensureDir(thumbsDir);

  const files = listFiles(pngDir).filter(f => f.toLowerCase().endsWith('.png'));

  const missing = EXPECTED.filter(x => !files.includes(x));
  const extra = files.filter(f => !EXPECTED.includes(f) && f !== 'thumbs' );

  const report = { files: {}, missing, extra };

  for (const f of files) {
    const full = path.join(pngDir, f);
    const info = await analyze(full);
    report.files[f] = info;
    const thumbPath = path.join(thumbsDir, f);
    await makeThumb(full, thumbPath);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    expected: EXPECTED,
    files: report.files,
  };

  fs.writeFileSync(path.join(ASSETS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('Report written to', path.join(ASSETS_DIR, 'manifest.json'));
  if (missing.length) console.log('Missing files:', missing.join(', '));
  if (extra.length) console.log('Extra files:', extra.join(', '));
}

run().catch(err=>{ console.error(err); process.exit(1); });
