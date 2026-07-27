import { Tile } from './Tile';
import { TileType } from './TileTypes';

export default class BoardGenerator {
  // generate tracks positioned in concentric rings around center
  generate(players = 2, centerX = 512, centerY = 384, outerRadius = 300): Tile[][] {
    const tracks: Tile[][] = [];
    const types = TileType;
    const rings = players; // one ring per player track
    const spacesPerTrack = 16;
    for (let p = 0; p < players; p++) {
      const track: Tile[] = [];
      // compute ring radius so inner rings are smaller for higher player indexes
      const ringFactor = 0.4 + 0.6 * ((players - p) / players);
      const r = outerRadius * ringFactor;
      for (let i = 0; i < spacesPerTrack; i++) {
        const angle = (i / spacesPerTrack) * Math.PI * 2 - Math.PI / 2; // start at top
        const x = Math.round(centerX + Math.cos(angle) * r);
        const y = Math.round(centerY + Math.sin(angle) * r);
        const t = i % 5;
        const tileType = [types.KNOWLEDGE, types.CHALLENGE, types.MYSTERY, types.SHORTCUT, types.TRAP][t];
        track.push({ id: `${p}-${i}`, x, y, state: ("UNKNOWN" as any), type: tileType, artifact: null } as any);
      }
      tracks.push(track);
    }
    return tracks;
  }
}
