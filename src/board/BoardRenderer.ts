import { Tile } from './Tile';
import Phaser from 'phaser';

export default class BoardRenderer {
  constructor(private scene: Phaser.Scene) {}

  // accept tracks as array of tracks to determine neighbor relationships
  drawTracks(tracks: Tile[][], model?: any) {
    const tex = this.scene.textures;
    // prefer registry-provided available keys, but fall back to texture list when empty
    let available: string[] = this.scene.registry.get('availableTileKeys') || [];
    if (!available || !available.length) {
      available = Object.keys(this.scene.textures.list || {});
    }
    // build canonical mapping from normalized name -> actual loaded key
    const canonicalMap: Record<string,string> = {};
    const availableNorm: string[] = [];
    for (const k of available) {
      const low = k.toLowerCase();
      canonicalMap[low] = k;
      canonicalMap[low.replace(/[-_]/g, '')] = k;
      availableNorm.push(low.replace(/[-_]/g, ''));
    }
    const hasNeutral = availableNorm.includes('straight') || availableNorm.includes('neutral') || availableNorm.includes('neutraltile') || tex.exists('straight');

    // debug
    // eslint-disable-next-line no-console
    console.log('[BoardRenderer] availableTileKeys:', available);
    // eslint-disable-next-line no-console
    console.log('[BoardRenderer] textures keys:', Object.keys(this.scene.textures.list || {}));

    // color palette per track for debug overlay
    const trackColors = [0xff7043, 0x29b6f6, 0x66bb6a, 0xab47bc, 0xffca28, 0x8d6e63];

    // reorder tracks by spatial proximity to ensure prev/next reflect actual path
    const reorderTrackByProximity = (track: Tile[]) => {
      if (!track || track.length <= 2) return track.slice();
      const remaining = track.slice();
      // start at top-left-most tile (min x+y) to be deterministic for non-circular paths
      remaining.sort((a,b) => ((a.x||0)+(a.y||0)) - ((b.x||0)+(b.y||0)));
      const start = remaining.shift()!;
      const ordered: Tile[] = [start];
      // initial previous direction: to the right
      let prevDir = { x: 1, y: 0 };
      while (remaining.length) {
        const last = ordered[ordered.length-1];
        let bestIdx = 0;
        let bestScore = Infinity;
        for (let i = 0; i < remaining.length; i++) {
          const r = remaining[i];
          const vx = (r.x||0) - (last.x||0);
          const vy = (r.y||0) - (last.y||0);
          const dist = Math.hypot(vx, vy) || 1e-6;
          const dir = { x: vx / dist, y: vy / dist };
          // prefer small angular change from prevDir, then shorter distance
          const dot = prevDir.x * dir.x + prevDir.y * dir.y;
          const angleDiff = Math.acos(Math.max(-1, Math.min(1, dot)));
          const score = angleDiff * 1000 + dist; // weight angle higher
          if (score < bestScore) { bestScore = score; bestIdx = i; }
        }
        const picked = remaining.splice(bestIdx, 1)[0];
        // update prevDir
        const nx = (picked.x||0) - (last.x||0);
        const ny = (picked.y||0) - (last.y||0);
        const nd = Math.hypot(nx, ny) || 1e-6;
        prevDir = { x: nx / nd, y: ny / nd };
        ordered.push(picked);
      }
      return ordered;
    };

    for (const rawTrack of tracks) {
      const track = reorderTrackByProximity(rawTrack);
      for (let idx = 0; idx < track.length; idx++) {
        const t = track[idx];
        let imageKey: string | null = null;

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

        // if no explicit state, infer shape from neighbors (straight, curve, cross)
        if (!imageKey) {
          const prev = track[idx - 1];
          const next = track[idx + 1];
          if (prev && next && prev.x !== undefined && prev.y !== undefined && next.x !== undefined && next.y !== undefined && t.x !== undefined && t.y !== undefined) {
            const v1 = { x: prev.x - t.x, y: prev.y - t.y };
            const v2 = { x: next.x - t.x, y: next.y - t.y };
            const a1 = Math.atan2(v1.y, v1.x);
            const a2 = Math.atan2(v2.y, v2.x);
            const diff = Math.abs(((a2 - a1 + Math.PI) % (2 * Math.PI)) - Math.PI);
            const isStraight = diff < 0.4 || Math.abs(diff - Math.PI) < 0.4;
            if (isStraight) {
              imageKey = 'straight';
            } else {
              imageKey = 'curve';
            }
            // compute rotation: average direction of incoming and outgoing
            let dir1 = Math.atan2(t.y - prev.y, t.x - prev.x);
            let dir2 = Math.atan2(next.y - t.y, next.x - t.x);
            // normalize across PI boundary
            if (Math.abs(dir1 - dir2) > Math.PI) {
              if (dir1 < dir2) dir1 += 2 * Math.PI; else dir2 += 2 * Math.PI;
            }
            (t as any).__rotation = (dir1 + dir2) / 2;
          } else {
            imageKey = 'neutral_tile';
          }
        }

        // If a state produced a neutral tile earlier, but geometry indicates a curve,
        // force selection of a curve asset below (override neutral fallback).
        try {
          let inferredShape: string | null = null;
          const prev = track[idx - 1];
          const next = track[idx + 1];
          if (prev && next && imageKey && /neutral|tile|revelado|evento|recompensa|bloqueado/i.test(String(imageKey))) {
            const v1 = { x: prev.x - t.x, y: prev.y - t.y };
            const v2 = { x: next.x - t.x, y: next.y - t.y };
            const a1 = Math.atan2(v1.y, v1.x);
            const a2 = Math.atan2(v2.y, v2.x);
            const diff = Math.abs(((a2 - a1 + Math.PI) % (2 * Math.PI)) - Math.PI);
            const isStraightGuess = diff < 0.4 || Math.abs(diff - Math.PI) < 0.4;
            if (!isStraightGuess) {
              // prefer canonical curve keys
              if (canonicalMap['curve-90-right']) imageKey = canonicalMap['curve-90-right'];
              else if (canonicalMap['curve-90-left']) imageKey = canonicalMap['curve-90-left'];
              else if (canonicalMap['curve-180']) imageKey = canonicalMap['curve-180'];
              else {
                // pick any available curve-like key
                const anyCurve = available.find(k => /curve|corner|turn|t-intersection|intersection|cruzamento/i.test(k));
                if (anyCurve) imageKey = anyCurve;
                else imageKey = null as any; // mark missing so debug marker shows
              }
              // set inferred shape for debug rendering when asset missing
              if (imageKey === null) {
                // determine 90 vs 180 vs t-intersection by cross/dot
                const vIn = v1; const vOut = v2;
                const cross = vIn.x * vOut.y - vIn.y * vOut.x;
                const dot = vIn.x * vOut.x + vIn.y * vOut.y;
                const mag = Math.hypot(vIn.x, vIn.y) * Math.hypot(vOut.x, vOut.y) || 1;
                const isOpp = dot < -0.7 * mag;
                if (isOpp) inferredShape = 'curve-180';
                else if (cross < 0) inferredShape = 'curve-90-right';
                else inferredShape = 'curve-90-left';
              }
            }
          }
        } catch (e) {}

        const direct = `tile-${t.id}`;
        if (tex.exists(direct)) imageKey = direct;

        if (!imageKey) {
          // pick candidates from available keys
          let candidates = available.filter(k => /curve|straight|cross|diagonal|t-intersection|tile|neutral/i.test(k));
          if (imageKey === 'curve') {
            // determine specific curve variant based on neighbor geometry and
            // select ONLY from curve/intersection assets (never fall back to neutral)
            let selectedVariant: string | null = null;
            try {
              const p = prev!, n = next!;
              const vIn = { x: p.x - t.x, y: p.y - t.y };
              const vOut = { x: n.x - t.x, y: n.y - t.y };
              const cross = vIn.x * vOut.y - vIn.y * vOut.x;
              const dot = vIn.x * vOut.x + vIn.y * vOut.y;
              const mag = Math.hypot(vIn.x, vIn.y) * Math.hypot(vOut.x, vOut.y) || 1;
              const isOpposite = dot < -0.7 * mag;
              if (isOpposite) selectedVariant = 'curve-180';
              else if (cross < 0) selectedVariant = 'curve-90-right';
              else selectedVariant = 'curve-90-left';
            } catch (e) { selectedVariant = null; }
            // if canonical key exists, use it directly
            if (selectedVariant && canonicalMap[selectedVariant]) {
              imageKey = canonicalMap[selectedVariant];
            } else {
              // search available keys for curve/intersection candidates
              const curveCandidates = available.filter(k => /curve|corner|turn|t-intersection|intersection|cruzamento|cruve/i.test(k));
              if (curveCandidates.length) {
                imageKey = curveCandidates[0];
              } else {
                // no curve asset available; leave null so fallback rendering shows placeholder
                imageKey = null as any;
              }
            }
          } else if (imageKey === 'straight') {
            const preferred = ['neutral-tile','tile-neutral','straight','inicio(base)'.toLowerCase()];
            const found = preferred.map(p => canonicalMap[p]).filter(Boolean);
            if (found.length) candidates = found as string[];
            else {
              const straightCandidates = candidates.filter(k => /straight|tile|neutral|inicio|base/i.test(k));
              if (straightCandidates.length) candidates = straightCandidates;
            }
          }
          if (candidates.length > 0) imageKey = candidates[idx % candidates.length];
        }

        // If imageKey was inferred as 'curve' earlier, we already attempted to choose
        // a curve asset. If a curve-like geometry was detected but no curve asset
        // exists, we will render a debug marker so you can see the expected curve.
        if (imageKey === null) {
          // draw debug indicator (magenta) where we expected a curve asset
          this.scene.add.circle(t.x!, t.y!, 10, 0xff00ff).setDepth(Math.round(t.y || 0) + 1);
          continue;
        }

        if (imageKey) {
          // normalize requested key and resolve against canonicalMap
          const norm = String(imageKey).toLowerCase();
          const normNoSep = norm.replace(/[-_]/g, '');
          if (canonicalMap[norm]) imageKey = canonicalMap[norm];
          else if (canonicalMap[normNoSep]) imageKey = canonicalMap[normNoSep];
          else {
            // try case-insensitive available match
            const match = available.find(k => k.toLowerCase() === norm || k.toLowerCase().replace(/[-_]/g, '') === normNoSep);
            if (match) imageKey = match;
          }
          // final fallback to known canonical names
          if (!tex.exists(imageKey)) {
            if (canonicalMap['neutral_tile']) imageKey = canonicalMap['neutral_tile'];
            else if (canonicalMap['straight']) imageKey = canonicalMap['straight'];
            else imageKey = null as any;
          }
        }

        if (imageKey) {
          // debug: log which texture is chosen for this tile
          // eslint-disable-next-line no-console
          console.log('[BoardRenderer] choose imageKey for', t.id, '=>', imageKey);
          const imgName = `tile_${t.x}_${t.y}`;
          if (this.scene.children.getByName(imgName)) continue;
          const img = this.scene.add.image(t.x!, t.y!, imageKey).setName(imgName);
          img.setOrigin(0.5, 0.5);
          try {
            const source = this.scene.textures.get(imageKey).getSourceImage() as HTMLImageElement;
            const naturalW = source?.width || 128;
            const naturalH = source?.height || 128;
            const desired = 65;
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
            img.setDisplaySize(65, 65);
          }
          img.setDepth(Math.round(t.y || 0));
          img.setPipeline('TextureTintPipeline');
          // apply rotation hint if available and image is a curve variant
          try {
            const variant = String(imageKey).toLowerCase();
            const rot = (t as any).__rotation;
            if (rot !== undefined && /curve|turn|corner|t-intersection/.test(variant)) {
              // rotate sprite so its logical forward direction aligns with computed rotation
              // many assets are drawn pointing right (0 rad); adjust accordingly
              img.rotation = rot - Math.PI / 2;
            }
          } catch (e) {
            // ignore rotation failures
          }
        } else {
          // draw small debug overlay showing inferred shape and track color
          const trackIndex = (t.id && typeof t.id === 'string' && t.id.split('-').length>0) ? parseInt(String(t.id).split('-')[0],10) : 0;
          const col = trackColors[trackIndex % trackColors.length] || 0x666666;
          this.scene.add.circle(t.x!, t.y!, 10, col, 0.6).setDepth(Math.round(t.y || 0));
          // small center dot for clarity
          this.scene.add.circle(t.x!, t.y!, 3, 0x000000).setDepth(Math.round(t.y || 0)+1);
          // if we inferred a specific curve shape but asset missing, draw an overlay icon
          if (typeof inferredShape === 'string') {
            let markerColor = 0xff00ff; // default magenta
            if (inferredShape.includes('90-right')) markerColor = 0xff9800;
            else if (inferredShape.includes('90-left')) markerColor = 0x29b6f6;
            else if (inferredShape.includes('180')) markerColor = 0x9c27b0;
            // draw a small square rotated to hint direction
            const sq = this.scene.add.rectangle(t.x!, t.y!, 20, 20, markerColor, 0.85).setDepth(Math.round(t.y || 0)+2);
            // rotate hint based on neighbors if available
            try {
              const prev = track[idx - 1];
              const next = track[idx + 1];
              if (prev && next) {
                const dir1 = Math.atan2(prev.y - t.y, prev.x - t.x);
                const dir2 = Math.atan2(next.y - t.y, next.x - t.x);
                let r = (dir1 + dir2) / 2;
                sq.rotation = r - Math.PI/2;
              }
            } catch(e){}
          }
        }
      }
    }
  }
}
