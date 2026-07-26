import { TileState } from './Tile';

export enum TileType {
  KNOWLEDGE = 'KNOWLEDGE',
  CHALLENGE = 'CHALLENGE',
  MYSTERY = 'MYSTERY',
  SHORTCUT = 'SHORTCUT',
  TRAP = 'TRAP',
}

export type TileDefinition = {
  id: string;
  type: TileType;
  params?: any;
  artifact?: string | null; // rune id or similar
  state?: TileState;
};
