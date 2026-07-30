import { Tile } from './Tile';
import Phaser from 'phaser';

export default class BoardRenderer {
  constructor(private scene: Phaser.Scene) {}

  drawTrack(track: Tile[]) {
    // draw tiles using loaded textures; fall back to neutral tile if specific not available
    const tex = this.scene.textures;
    const available: string[] = this.scene.registry.get('availableTileKeys') || [];
    const hasNeutral = tex.exists('tile-neutral') || available.includes('tile-neutral');
    track.forEach((t, idx) => {
      // pick a tile type from available keys, prefer specific direction tiles if present
      let imageKey: string | null = null;
      // try direct tile id key
      const direct = `tile-${t.id}`;
      if (tex.exists(direct)) imageKey = direct;
      if (!imageKey) {
        // attempt to pick directional tiles from available list (Curve, Cruve variants, etc.)
        const candidates = available.filter(k => /curve|cruve|tile|straight|line/i.test(k));
        if (candidates.length > 0) {
          imageKey = candidates[idx % candidates.length];
        }
      }
      if (!imageKey && hasNeutral) imageKey = 'tile-neutral';
      if (imageKey) {
        const img = this.scene.add.image(t.x!, t.y!, imageKey);
        // ensure sprite is centered on tile
        img.setOrigin(0.5, 0.5);
        // prefer using natural image size if available
        try {
          const source = this.scene.textures.get(imageKey).getSourceImage() as HTMLImageElement;
          const naturalW = source?.width || 128;
          const naturalH = source?.height || 128;
          // desired tile footprint (square) in pixels
          const desired = 180; // exact square footprint to match art
          // force display size to exact desired square for consistent placement
          img.setDisplaySize(desired, desired);
        } catch (e) {
          img.setDisplaySize(96, 96);
        }
        // set depth by Y so items render in correct order on an isometric/top-down board
        img.setDepth(Math.round(t.y || 0));
        img.setPipeline('TextureTintPipeline');
      } else {
        // last-resort primitive
        this.scene.add.circle(t.x!, t.y!, 16, 0x666666).setDepth(Math.round(t.y || 0));
      }
    });
  }
}
