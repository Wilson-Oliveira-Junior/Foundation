import { Tile } from './Tile';

export default class BoardGenerator {
  generate(players = 2): Tile[][] {
    // simple ring tracks generator (placeholder)
    const tracks: Tile[][] = [];
    const types = require('../board/TileTypes').TileType;
    for (let p = 0; p < players; p++) {
      const track: Tile[] = [];
      for (let i = 0; i < 12; i++) {
        // assign simple alternating types for variety
        const t = i % 5;
        const tileType = [types.KNOWLEDGE, types.CHALLENGE, types.MYSTERY, types.SHORTCUT, types.TRAP][t];
        track.push({ id: `${p}-${i}`, x: 0, y: 0, state: ("UNKNOWN" as any), type: tileType, artifact: null } as any);
      }
      tracks.push(track);
    }
    return tracks;
  }
}
