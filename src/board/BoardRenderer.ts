import { Tile } from './Tile';
import Phaser from 'phaser';

export default class BoardRenderer {
  constructor(private scene: Phaser.Scene) {}

  drawTrack(track: Tile[]) {
    // draw tiles using loaded textures; fall back to neutral tile if specific not available
    const tex = this.scene.textures;
    const available: string[] = this.scene.registry.get('availableTileKeys') || [];
    const hasNeutral = tex.exists('neutral_tile') || available.includes('neutral_tile');
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
      if (!imageKey && hasNeutral) imageKey = 'neutral_tile';
      if (imageKey) {
          // avoid adding duplicate image at same tile position
          const imgName = `tile_${t.x}_${t.y}`;
          if (this.scene.children.getByName(imgName)) return;

          const img = this.scene.add.image(t.x!, t.y!, imageKey).setName(imgName);
          // ensure consistent display size and center
          img.setDisplaySize(240, 240);
          img.setOrigin(0.5, 0.5);
          // depth management: background (0) < tiles (10) < cornerstone (20)
          img.setDepth(10);
        // prefer using natural image size if available
        try {
          const source = this.scene.textures.get(imageKey).getSourceImage() as HTMLImageElement;
          const naturalW = source?.width || 128;
          const naturalH = source?.height || 128;
          // desired tile footprint (max dimension) in pixels
          const desired = 220;
          // preserve aspect ratio: scale so the larger side matches `desired`
          if (naturalW >= naturalH) {
            const scale = desired / naturalW;
            img.displayWidth = Math.max(1, Math.round(naturalW * scale));
            img.displayHeight = Math.max(1, Math.round(naturalH * scale));
          } else {
            const scale = desired / naturalH;
            img.displayWidth = Math.max(1, Math.round(naturalW * scale));
            img.displayHeight = Math.max(1, Math.round(naturalH * scale));
          }
        } catch (e) {
          img.setDisplaySize(96, 96);
        }
        // enforce final desired display size to avoid oversized sprites
        img.setDisplaySize(50, 50);
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
