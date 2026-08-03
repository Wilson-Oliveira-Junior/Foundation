export enum TileState {
  UNKNOWN = 'UNKNOWN',
  REVEALING = 'REVEALING',
  DISCOVERED = 'DISCOVERED',
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
  BLOCKED = 'BLOCKED',
  EVENT = 'EVENT',
  REWARD = 'REWARD',
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
