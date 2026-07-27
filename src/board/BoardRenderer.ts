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
        const img = this.scene.add.image(t.x!, t.y!, imageKey).setDepth(10);
        img.setOrigin(0.5, 0.5);
        // adjust scale to tile-friendly size (fit to approx 240px)
        try {
          const texFrame = this.scene.textures.get(imageKey).getSourceImage() as HTMLImageElement;
          const desired = 240; // target tile size in pixels
          const scale = desired / Math.max(1, texFrame.width);
          img.setScale(scale);
        } catch (e) {
          img.setScale(2.0);
        }
      } else {
        // last-resort primitive
        this.scene.add.circle(t.x!, t.y!, 16, 0x666666).setDepth(10);
      }
    });
  }
}
