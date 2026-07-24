import 'phaser';
import BootScene from './scenes/BootScene';
import ConfigScene from './scenes/ConfigScene';
import GameScene from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1024,
  height: 768,
  backgroundColor: '#1d1d1d',
  scene: [BootScene, ConfigScene, GameScene]
};

new Phaser.Game(config);
