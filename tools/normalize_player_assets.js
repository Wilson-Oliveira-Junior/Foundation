const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'assets', 'players');
const mapping = [
  { patterns: [/player[_-]?one/i, /player[_-]?1/i, /^player1/i], target: 'player-1.png' },
  { patterns: [/player[_-]?two/i, /player[_-]?2/i, /^player2/i], target: 'player-2.png' },
  { patterns: [/player[_-]?three/i, /player[_-]?3/i, /^player3/i], target: 'player-3.png' },
  { patterns: [/player[_-]?four/i, /player[_-]?4/i, /^player4/i], target: 'player-4.png' },
  { patterns: [/player[_-]?five/i, /player[_-]?5/i, /^player5/i], target: 'player-5.png' },
  { patterns: [/player[_-]?six/i, /player[_-]?6/i, /^player6/i], target: 'player-6.png' }
];

function findMatches(files, patterns) {
  return files.filter(f => patterns.some(p => p.test(f)));
}

function main() {
  if (!fs.existsSync(dir)) {
    console.error('Players dir not found:', dir);
    process.exit(1);
  }
  const files = fs.readdirSync(dir);
  const actions = [];
  for (const m of mapping) {
    const matches = findMatches(files, m.patterns);
    if (matches.length === 0) continue;
    // pick first match
    const src = matches[0];
    const srcPath = path.join(dir, src);
    const targetPath = path.join(dir, m.target);
    if (srcPath === targetPath) continue;
    const backupPath = srcPath + '.bak';
    console.log(`Renaming ${src} -> ${m.target} (backup ${path.basename(backupPath)})`);
    fs.copyFileSync(srcPath, backupPath);
    fs.renameSync(srcPath, targetPath);
    actions.push({ from: src, to: m.target, backup: path.basename(backupPath) });
  }
  if (actions.length === 0) console.log('No files renamed (already normalized or no matches).');
  else console.log('Renamed files:', actions);
}

if (require.main === module) main();
