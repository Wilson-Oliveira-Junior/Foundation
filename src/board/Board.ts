import Phaser from 'phaser';

export type BoardConfig = {
  scene: Phaser.Scene;
  centerX: number;
  centerY: number;
  rings?: number; // how many concentric rings until center
  spacesPerTrack?: number; // approx spaces per player's track
  players: number; // number of players (2-6)
  radius?: number; // outer radius
};

export default class Board {
  scene: Phaser.Scene;
  cfg: BoardConfig;
  graphics: Phaser.GameObjects.Graphics;

  constructor(cfg: BoardConfig) {
    this.cfg = { rings: 4, spacesPerTrack: 25, radius: 300, ...cfg };
    this.scene = cfg.scene;
    this.graphics = this.scene.add.graphics();
  }

  // returns list of positions for each player track: array[playerIndex] = [{x,y}, ...]
  generateTracks() {
    const { players, centerX, centerY, radius, rings, spacesPerTrack } = this.cfg;
    const tracks: { x: number; y: number }[][] = [];

    for (let p = 0; p < players; p++) {
      const angleOffset = (2 * Math.PI * p) / players;
      const path: { x: number; y: number }[] = [];

      for (let i = 0; i < spacesPerTrack!; i++) {
        // distribute points along a spiral-ish path from edge to center
        const t = i / (spacesPerTrack! - 1); // 0..1
        const r = radius! * (1 - t * 0.85); // shrink radius toward center
        const theta = angleOffset + (t * Math.PI * 1.6); // wind toward center
        const x = centerX + r * Math.cos(theta);
        const y = centerY + r * Math.sin(theta);
        path.push({ x, y });
      }
      tracks.push(path);
    }
    return tracks;
  }

  drawPlaceholder() {
    this.graphics.clear();
    this.graphics.lineStyle(2, 0xffffff, 0.6);

    const tracks = this.generateTracks();
    tracks.forEach((path, idx) => {
      const color = Phaser.Display.Color.HSLToColor(idx / tracks.length, 0.6, 0.5).color;
      path.forEach((p, i) => {
        // draw space
        this.graphics.fillStyle(color, 1);
        this.graphics.fillCircle(p.x, p.y, 16);
        this.graphics.lineStyle(2, 0x000000, 0.6);
        this.graphics.strokeCircle(p.x, p.y, 16);
        if (i < path.length - 1) {
          const next = path[i + 1];
          this.graphics.lineStyle(4, color, 0.35);
          this.graphics.beginPath();
          this.graphics.moveTo(p.x, p.y);
          this.graphics.lineTo(next.x, next.y);
          this.graphics.closePath();
          this.graphics.strokePath();
        }
      });
    });

    // draw center (joia)
    const { centerX, centerY } = this.cfg;
    this.graphics.fillStyle(0x22aa22, 1);
    this.graphics.fillCircle(centerX, centerY, 40);
    this.graphics.lineStyle(3, 0x000000, 0.6);
    this.graphics.strokeCircle(centerX, centerY, 40);
  }
}
