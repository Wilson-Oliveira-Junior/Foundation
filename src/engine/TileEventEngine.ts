import { TileType } from '../board/TileTypes';

export default class TileEventEngine {
  constructor() {}

  handleTileEvent(playerId: string, def: any, scene: any) {
    // def.type determines event
    switch (def?.type) {
      case TileType.SHORTCUT:
        // simple: advance player one extra step
        scene.add.text(20, 180, `${playerId} encontrou um atalho! Avança 1 casa.`, { color: '#ff0' });
        return { action: 'advance', steps: 1 };
      case TileType.TRAP:
        scene.add.text(20, 180, `${playerId} caiu numa armadilha! Perde movimento.`, { color: '#f00' });
        return { action: 'loseMovement' };
      case TileType.MYSTERY:
        scene.add.text(20, 180, `${playerId} encontrou um mistério...`, { color: '#a0f' });
        return { action: 'mystery' };
      default:
        return { action: 'none' };
    }
  }
}
