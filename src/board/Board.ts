import Phaser from 'phaser';
import BoardGenerator from './BoardGenerator';
import BoardModel from './BoardModel';
import BoardRenderer from './BoardRenderer';

export type BoardConfig = {
  scene: Phaser.Scene;
  centerX: number;
  centerY: number;
  rings?: number; // how many concentric rings until center
  spacesPerTrack?: number; // approx spaces per player's track
  players: number; // number of players (2-6)
  radius?: number; // outer radius
};

export default class Board {
  scene: Phaser.Scene;
  cfg: BoardConfig;
  graphics: Phaser.GameObjects.Graphics;

  constructor(cfg: BoardConfig) {
    this.cfg = { rings: 4, spacesPerTrack: 25, radius: 300, ...cfg };
    this.scene = cfg.scene;
    this.graphics = this.scene.add.graphics();
    // delegate generation/model/render responsibilities
    const generator = new BoardGenerator();
    this.tracks = generator.generate(this.cfg.players);
    this.model = new BoardModel();
    this.tracks.forEach((path, trackIndex) => {
      path.forEach((p, spaceIndex) => {
        const id = `${trackIndex}-${spaceIndex}`;
        this.model.setTile({ id, trackIndex, spaceIndex, state: TileState.UNKNOWN } as any);
      });
    });
    this.renderer = new BoardRenderer(this.scene);
  }

  // called by game logic when a player moves to a space
  // emits a global event `playerEnteredTile` on the scene with payload { playerId, trackIndex, spaceIndex, tileId }
  playerEnter(playerId: string, trackIndex: number, spaceIndex: number) {
    const tileId = `${trackIndex}-${spaceIndex}`;
    // On first pass, mark tile as DISCOVERED (visible to all)
    const tile = this.model.getTile(tileId);
    if (tile && tile.state === TileState.UNKNOWN) this.model.setTileState(tileId, TileState.DISCOVERED);
    if (this.scene && this.scene.events) {
      this.scene.events.emit('playerEnteredTile', { playerId, trackIndex, spaceIndex, tileId });
    }
    return tileId;
  }

  setTileState(tileId: string, state: TileState) {
    this.model.setTileState(tileId, state);
  }

  getTileState(tileId: string): TileState | null {
    const tile = this.model.getTile(tileId);
    return tile ? tile.state : null;
  }

  // returns list of positions for each player track: array[playerIndex] = [{x,y}, ...]
  generateTracks() {
    // expose previously generated tracks
    return this.tracks;
  }

  drawPlaceholder() {
    this.graphics.clear();
    this.graphics.lineStyle(2, 0xffffff, 0.6);
    this.renderer.drawTrack(this.tracks.flat());
    const { centerX, centerY } = this.cfg;
    this.graphics.fillStyle(0x22aa22, 1);
    this.graphics.fillCircle(centerX, centerY, 40);
    this.graphics.lineStyle(3, 0x000000, 0.6);
    this.graphics.strokeCircle(centerX, centerY, 40);
  }

  // expose tracks for other systems (player placement)
  getTracks() {
    return this.generateTracks();
  }
}
