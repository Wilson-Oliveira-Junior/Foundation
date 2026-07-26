import { Tile, TileState } from './Tile';
import { TileDefinition } from './TileTypes';

export default class BoardModel {
  tiles: Map<string, Tile> = new Map();
  definitions: Map<string, TileDefinition> = new Map();

  setTile(tile: Tile) {
    this.tiles.set(tile.id, tile);
  }

  setDefinition(def: TileDefinition) {
    this.definitions.set(def.id, def);
  }

  getDefinition(id: string) {
    return this.definitions.get(id) || null;
  }

  getTile(id: string) {
    return this.tiles.get(id) || null;
  }

  setTileState(id: string, state: TileState) {
    const t = this.tiles.get(id);
    if (t) t.state = state;
  }
}
