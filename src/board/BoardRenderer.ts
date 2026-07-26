import { Tile } from './Tile';
import Phaser from 'phaser';

export default class BoardRenderer {
  constructor(private scene: Phaser.Scene) {}

  drawTrack(track: Tile[]) {
    // placeholder visual draw
    track.forEach(t => {
      this.scene.add.circle(t.x, t.y, 16, 0x666666);
    });
  }
}
