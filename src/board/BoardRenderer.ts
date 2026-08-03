import { Tile } from './Tile';
import Phaser from 'phaser';

export default class BoardRenderer {
  constructor(private scene: Phaser.Scene) {}

  // accept tracks as array of tracks to determine neighbor relationships
  drawTracks(tracks: Tile[][], model?: any) {
    const tex = this.scene.textures;
    const available: string[] = this.scene.registry.get('availableTileKeys') || [];
    // 'straight' now doubles as the base/fallback path tile
    const hasNeutral = tex.exists('straight') || available.includes('straight');
    // debug log available keys and texture keys (temporary)
    // eslint-disable-next-line no-console
    console.log('[BoardRenderer] availableTileKeys:', available);
    // eslint-disable-next-line no-console
    console.log('[BoardRenderer] textures keys:', Object.keys(this.scene.textures.list || {}));
    // iterate tracks preserving ordering so we can inspect prev/next tiles for shape detection
    tracks.forEach((track) => {
      track.forEach((t, idx) => {
      // pick a tile type from available keys, prefer specific direction tiles if present
      let imageKey: string | null = null;
      // try to render based on model state if provided
      if (model) {
        const tileObj = model.getTile ? model.getTile(t.id) : null;
        const state = tileObj ? tileObj.state : null;
        if (state) {
          if (state === 'UNKNOWN') imageKey = 'neutral_tile';
          else if (state === 'DISCOVERED' || state === 'SUCCESS') imageKey = 'Revelado';
          else if (state === 'EVENT') imageKey = 'Evento';
          else if (state === 'REWARD') imageKey = 'Recompensa';
          else if (state === 'BLOCKED' || state === 'FAIL') imageKey = 'Bloqueado';
        }
      }
      // if no state-driven key, infer shape from neighbors
      if (!imageKey) {
        const prev = track[idx - 1];
        const next = track[idx + 1];
        if (prev && next && prev.x !== undefined && prev.y !== undefined && next.x !== undefined && next.y !== undefined && t.x !== undefined && t.y !== undefined) {
          // vectors
          const v1 = { x: t.x - prev.x, y: t.y - prev.y };
          const v2 = { x: next.x - t.x, y: next.y - t.y };
          // compute angles
          const a1 = Math.atan2(v1.y, v1.x);
          const a2 = Math.atan2(v2.y, v2.x);
          const diff = Math.abs(((a2 - a1 + Math.PI) % (2 * Math.PI)) - Math.PI);
          // small diff -> straight, large diff -> curve
          if (diff < 0.3) imageKey = 'straight';
          else imageKey = 'curve';
        }
      }
      // try direct tile id key
      const direct = `tile-${t.id}`;
      if (tex.exists(direct)) imageKey = direct;
      if (!imageKey) {
        // attempt to pick path-shaped tiles from the available list.
        const candidates = available.filter(k => /curve|straight|cross|diagonal|t-intersection|tile|neutral/i.test(k));
        if (candidates.length > 0) {
          imageKey = candidates[idx % candidates.length];
        }
      }
      if (!imageKey && hasNeutral) imageKey = 'straight';
      if (imageKey) {
        // normalize to lower-case keys (BootScene registers lowercase keys)
        imageKey = String(imageKey).toLowerCase();
        if (!tex.exists(imageKey) && available.includes(imageKey) === false) {
          // try to find a case-insensitive match in available keys
          const match = available.find(k => k.toLowerCase() === imageKey);
          if (match) imageKey = match;
        }
        // final safety: ensure texture exists, otherwise fallback to neutral/straight
        if (!tex.exists(imageKey)) {
          if (tex.exists('neutral_tile') || available.includes('neutral_tile')) imageKey = 'neutral_tile';
         
          else if (tex.exists('straight') || available.includes('straight')) imageKey = 'straight';
          else imageKey = null as any;
        }
          // avoid adding duplicate image at same tile position
          const imgName = `tile_${t.x}_${t.y}`;
          if (this.scene.children.getByName(imgName)) return;

          const img = this.scene.add.image(t.x!, t.y!, imageKey).setName(imgName);
          // center image on tile
          img.setOrigin(0.5, 0.5);
        // prefer using natural image size if available
        try {
          const source = this.scene.textures.get(imageKey).getSourceImage() as HTMLImageElement;
          const naturalW = source?.width || 128;
          const naturalH = source?.height || 128;
          // desired tile footprint (max dimension) in pixels
          const desired = 72;
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
          img.setDisplaySize(desired, desired);
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
