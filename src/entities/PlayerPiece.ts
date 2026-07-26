import Phaser from 'phaser';

export default class PlayerPiece {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Arc | Phaser.GameObjects.Image;
  color: number;
  index: number;
  positionIndex: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, color: number, index: number, textureKey?: string) {
    this.scene = scene;
    this.color = color;
    this.index = index;

    if (textureKey) {
      this.sprite = this.scene.add.image(x, y, textureKey).setDisplaySize(36, 36);
    } else {
      this.sprite = this.scene.add.circle(x, y, 18, color);
    }
  }

  moveAlong(path: { x: number; y: number }[], steps: number, onComplete?: () => void) {
    if (steps <= 0) { onComplete && onComplete(); return; }
    const nextIndex = Math.min(this.positionIndex + steps, path.length - 1);
    const targets = [] as { x: number; y: number }[];
    for (let i = this.positionIndex + 1; i <= nextIndex; i++) targets.push(path[i]);

    const tweenChain = (i: number) => {
      if (i >= targets.length) {
        this.positionIndex = nextIndex;
        onComplete && onComplete();
        return;
      }
      const t = this.scene.tweens.add({
        targets: this.sprite,
        x: targets[i].x,
        y: targets[i].y,
        duration: 250,
        ease: 'Power2',
        onComplete: () => tweenChain(i + 1)
      });
    };

    tweenChain(0);
  }

  setPositionIndex(i: number) {
    this.positionIndex = i;
  }

  getPositionIndex() {
    return this.positionIndex;
  }
}
