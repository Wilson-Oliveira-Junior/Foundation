import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // pre-load any non-critical assets; critical assets are validated after load
    // (we don't list critical files here so devs can drop them into assets/)
  }

  async create() {
    // Define critical assets that must exist for the game to start
    // acceptable player filenames (case-insensitive) - prefer normalized player-1.png ...
    const expectedPlayers = ['player-1.png','player-2.png','player-3.png','player-4.png','player-5.png','player-6.png'];
    const critical = expectedPlayers.map(p => `/assets/players/${p}`);
    // also accept legacy variants (e.g., Player_one.png)
    const legacyPatterns = [/player[_-]?one/i,/player[_-]?two/i,/player[_-]?three/i,/player[_-]?four/i,/player[_-]?five/i,/player[_-]?six/i];
    // check players folder and try to accept legacy file names
    const playersDir = window.location.origin + '/assets/players/';

    const missing: string[] = [];
    // load directory listing via fetch to check available player files (best-effort)
    const playerFiles: string[] = [];
    try {
      const res = await fetch('/assets/players/?_ts=' + Date.now());
      if (res.ok) {
        const text = await res.text();
        // crude extraction of filenames from directory index (works on simple static servers)
        const re = /href=\"([^\"\?]+)\"/g;
        let m;
        while ((m = re.exec(text)) !== null) {
          const name = m[1];
          if (name && !name.endsWith('/')) playerFiles.push(name);
        }
      }
    } catch (e) {
      // ignore - fallback to direct checks
    }

    for (const expected of expectedPlayers) {
      // prefer normalized name
      let found = false;
      if (playerFiles.length) {
        found = playerFiles.some(f => f.toLowerCase() === expected.toLowerCase());
        if (!found) {
          // try legacy patterns
          const idx = expectedPlayers.indexOf(expected);
          const patt = legacyPatterns[idx];
          found = playerFiles.some(f => patt.test(f));
        }
      } else {
        // no directory listing available - check direct URL via fetch
        try {
          const candidates = [expected, expected.replace(/^player/, 'Player')];
          for (const c of candidates) {
            try {
              const r = await fetch(`/assets/players/${c}?_ts=${Date.now()}`, { method: 'GET' });
              if (r.ok) {
                found = true;
                break;
              }
            } catch (_) {
              // try next
            }
          }
        } catch (e) {
          found = false;
        }
      }
      if (!found) missing.push(`players/${expected}`);
    }
    // debug logging
    // eslint-disable-next-line no-console
    console.log('[BootScene] playerFiles:', playerFiles);
    // eslint-disable-next-line no-console
    console.log('[BootScene] missing after checks:', missing);
    // check cornerstone jewel fallback
    try {
      const testUrl = `${location.origin}/assets/cornerstone/crystal.png?_ts=${Date.now()}`;
      const r = await fetch(testUrl, { method: 'GET' });
      // eslint-disable-next-line no-console
      console.log('[BootScene] crystal fetch status', testUrl, r.status, r.ok);
      if (!r.ok) missing.push('cornerstone/crystal.png');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[BootScene] crystal fetch error', e);
      missing.push('cornerstone/crystal.png');
    }

    if (missing.length > 0) {
      const msg = 'Assets críticos ausentes: ' + missing.join(', ');
      // also log to console for dev visibility
      // eslint-disable-next-line no-console
      console.error('[BootScene] missing critical assets:', missing);
      this.add.text(40, 40, 'Erro crítico no boot', { color: '#ff4444', fontSize: '22px' });
      this.add.text(40, 80, msg, { color: '#ffffff', fontSize: '16px' });
      this.add.text(40, 120, 'Adicione os arquivos na pasta /assets e reinicie.', { color: '#cccccc', fontSize: '14px' });
      // block further scenes
      this.scene.pause();
      return;
    }

    // all critical assets exist - continue
    // preload board background and all tiles into texture manager for Board to use
    try {
      const now = Date.now();
      if (!this.textures.exists('board-background')) this.load.image('board-background', `/assets/background.png?_ts=${now}`);

      // fetch list of files from tiles directory (best-effort)
      const tileList: string[] = [];
      try {
        const res = await fetch(`/assets/tiles/?_ts=${now}`);
        if (res.ok) {
          const text = await res.text();
          const re = /href=\"([^\"\?]+)\"/g;
          let m;
          while ((m = re.exec(text)) !== null) {
            const name = m[1];
            if (name && !name.endsWith('/')) tileList.push(name);
          }
        }
      } catch (_) {
        // ignore
      }

      // ensure neutral tile is always queued
      if (!tileList.includes('tile-neutral.png')) tileList.push('tile-neutral.png');

      tileList.forEach(name => {
        const key = name.replace(/\.[a-z]+$/i, '');
        if (!this.textures.exists(key)) {
          this.load.image(key, `/assets/tiles/${name}?_ts=${now}`);
        }
      });
      // expose loaded tile keys to registry for renderer to pick
      this.registry.set('availableTileKeys', tileList.map(n => n.replace(/\.[a-z]+$/i, '')));

      if (this.load.list && this.load.list.length > 0) {
        this.load.once('complete', () => this.scene.start('ConfigScene'));
        this.load.start();
      } else {
        this.scene.start('ConfigScene');
      }
    } catch (e) {
      this.scene.start('ConfigScene');
    }
  }
}
