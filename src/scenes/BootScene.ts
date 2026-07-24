import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // pre-load any non-critical assets; critical assets are validated after load
    // (we don't list critical files here so devs can drop them into assets/)
  }

  create() {
    // Define critical assets that must exist for the game to start
    const critical = [
      '/assets/player-1.png',
      '/assets/player-2.png',
      '/assets/player-3.png',
      '/assets/player-4.png',
      '/assets/player-5.png',
      '/assets/player-6.png',
      '/assets/jewel.png'
    ];

    const missing: string[] = [];
    for (const url of critical) {
      // check by trying to create an image element and test load
      const img = new Image();
      img.src = url;
      // If image is not in cache, textures won't know; do a quick check via naturalWidth if available
      if (!img.complete || (img.naturalWidth === 0 && img.naturalHeight === 0)) {
        // We'll collect and show message; do not proceed
        missing.push(url.replace('/assets/', ''));
      }
    }

    if (missing.length > 0) {
      const msg = 'Assets críticos ausentes: ' + missing.join(', ');
      this.add.text(40, 40, 'Erro crítico no boot', { color: '#ff4444', fontSize: '22px' });
      this.add.text(40, 80, msg, { color: '#ffffff', fontSize: '16px' });
      this.add.text(40, 120, 'Adicione os arquivos na pasta /assets e reinicie.', { color: '#cccccc', fontSize: '14px' });
      // block further scenes
      this.scene.pause();
      return;
    }

    // all critical assets exist - continue
    this.scene.start('ConfigScene');
  }
}
