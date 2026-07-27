const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', 'Foundation', 'src');
const FORBIDDEN = ['question', 'answer', 'challenge'];

function walk(dir, files=[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (p.endsWith('.ts') || p.endsWith('.js')) files.push(p);
  }
  return files;
}

const files = walk(ROOT);
const violations = [];
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8').toLowerCase();
  for (const token of FORBIDDEN) {
    if (txt.includes(token)) {
      // ignore engine files which are allowed
      if (f.includes(path.join('engine')) || f.includes(path.join('cornerstone')) || f.includes('player')) continue;
      violations.push({ file: f, token });
    }
  }
}

if (violations.length) {
  console.error('FOUNDATION GUARD: forbidden tokens found in source files:');
  for (const v of violations) console.error('- ', v.file, '->', v.token);
  process.exit(2);
} else {
  console.log('FOUNDATION GUARD: ok');
  process.exit(0);
}
