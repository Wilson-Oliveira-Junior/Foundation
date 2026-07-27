export enum TileState {
  UNKNOWN = 'UNKNOWN',
  DISCOVERED = 'DISCOVERED',
  AWAKENED = 'AWAKENED'
}

export type Tile = {
  id: string;
  trackIndex?: number;
  spaceIndex?: number;
  state: TileState;
  x?: number;
  y?: number;
  type?: string | number;
  artifact?: any;
};
