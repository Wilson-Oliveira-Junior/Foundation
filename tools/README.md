# Tile assets validator

This script scans `assets/tiles/`, checks for expected filenames, creates thumbnails and writes a `manifest.json`.

Dependencies:

- Node.js (16+)
- npm package `canvas`

Install dependencies and run:

```powershell
cd assets/tools
npm init -y
npm install canvas
node validate_tiles.js
```

Output:

- `assets/tiles/manifest.json` - generated report
- `assets/tiles/thumbs/` - 128x128 thumbnails
