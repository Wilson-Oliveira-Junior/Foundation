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
    // NOTE: do NOT use Cornerstone.svg here — it's a 39MB, 267k-path Inkscape
    // auto-trace of a bitmap (one <path> per pixel), not a real vector file.
    // Fetching or rendering it will hang/crash the browser. Use crystal.png.
    try {
      const cristalUrl = `${location.origin}/assets/cornerstone/crystal.png?_ts=${Date.now()}`;
      const r = await fetch(cristalUrl, { method: 'GET' });
      // eslint-disable-next-line no-console
      console.log('[BootScene] crystal fetch status', cristalUrl, r.status, r.ok);
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

      // ensure a neutral path tile exists; prefer existing neutral_tile
      if (!tileList.some(n => n.toLowerCase() === 'neutral_tile.png') && !tileList.some(n => n.toLowerCase() === 'straight.png')) {
        // don't force-add straight.png if it doesn't exist on disk; leave tileList as-is
      }

      const sanitizeKey = (name: string) => name.replace(/\.[a-z]+$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      tileList.forEach(name => {
        const key = sanitizeKey(name);
        if (!this.textures.exists(key)) {
          this.load.image(key, `/assets/tiles/${name}?_ts=${now}`);
        }
      });
      // create canonical mapping for common gameplay tile states to available files
        // create canonical mapping for common gameplay tile states to available files
        const keysLower = tileList.map(n => n.replace(/\.[a-z]+$/i, '').toLowerCase());
        const canonical: Record<string,string> = {};
        if (keysLower.includes('neutral_tile')) canonical['neutral_tile'] = 'neutral_tile';
        if (keysLower.includes('revelado')) canonical['revelado'] = 'revelado';
        if (keysLower.includes('evento')) canonical['evento'] = 'evento';
        if (keysLower.includes('recompensa')) canonical['recompensa'] = 'recompensa';
        if (keysLower.includes('bloqueado')) canonical['bloqueado'] = 'bloqueado';
        // If directory listing failed (tileList empty), probe known filenames so we still load assets
        const probes = [
          'neutral_tile.png','Revelado.png','revelado.png','Evento.png','Recompensa.png','Bloqueado.png','straight.png','Tile-Neutral.png',
          // curve and intersection variants (english/portuguese and common typos)
          'Curve180.png','Cruve180.png','Curve-90degrerigth.png','Curve-90degreleft.png','Curve-90degree-right.png','Curve-90degree-left.png',
          'T intersection.png','T-intersection.png','t-intersection.png','Cruzamento.png','cross.png','intersection.png'
        ];
        for (const p of probes) {
          const lower = p.replace(/\.[a-z]+$/i, '').toLowerCase();
          if (keysLower.includes(lower)) continue;
          try {
            // attempt to fetch the file; if exists, queue load
            // use headless GET
            // eslint-disable-next-line no-await-in-loop
            const r = await fetch(`/assets/tiles/${p}?_ts=${now}`, { method: 'GET' });
            // eslint-disable-next-line no-console
            console.log('[BootScene] probe', p, '->', r.status, r.ok);
            if (r.ok) {
              // choose mapped key (sanitize)
              let mappedKey = sanitizeKey(p);
              if (/curve180|cruve180/i.test(lower)) mappedKey = 'curve-180';
              if (/curve-?90.*right|90degrerigth|90degree-right/i.test(lower)) mappedKey = 'curve-90-right';
              if (/curve-?90.*left|90degreleft|90degree-left/i.test(lower)) mappedKey = 'curve-90-left';
              if (/t.?intersection|cruzamento|cross|intersection/i.test(lower)) mappedKey = 't-intersection';
              keysLower.push(mappedKey);
              if (!this.textures.exists(mappedKey)) this.load.image(mappedKey, `/assets/tiles/${p}?_ts=${now}`);
              // map canonical gameplay keys
              if (mappedKey === 'neutral_tile') canonical['neutral_tile'] = mappedKey;
              if (mappedKey === 'revelado') canonical['revelado'] = mappedKey;
              if (mappedKey === 'evento') canonical['evento'] = mappedKey;
              if (mappedKey === 'recompensa') canonical['recompensa'] = mappedKey;
              if (mappedKey === 'bloqueado') canonical['bloqueado'] = mappedKey;
            }
          } catch (e) {
            // ignore
          }
        }
        // merge canonical keys into tileList registry so renderer can find them by canonical names
        const registryKeys = Array.from(new Set([...keysLower, ...Object.values(canonical)]));
        this.registry.set('availableTileKeys', registryKeys);
        // Ensure common curve/intersection assets are queued for load even if probes failed
        const forceLoad = [
          'Curve180.png','Cruve180.png','Curve-90degrerigth.png','Curve-90degreleft.png',
            'Curve-90degree-right.png','Curve-90degree-left.png','T intersection.png','T-intersection.png','t-intersection.png','Cruzamento.png'
        ];
        for (const f of forceLoad) {
            // map known problematic filenames to canonical keys
            const raw = f.replace(/\.[a-z]+$/i, '').toLowerCase();
            let mapped = raw;
            if (/cruve180|curve180/i.test(raw)) mapped = 'curve-180';
            if (/curve-?90.*right|90degrerigth|90degree-right/i.test(raw)) mapped = 'curve-90-right';
            if (/curve-?90.*left|90degreleft|90degree-left/i.test(raw)) mapped = 'curve-90-left';
            if (/t.?intersection|cruzamento|cross|intersection/i.test(raw)) mapped = 't-intersection';
            if (!this.textures.exists(mapped)) {
              // queue load using original filename but register under canonical mapped key
              this.load.image(mapped, `/assets/tiles/${f}?_ts=${now}`);
              if (!registryKeys.includes(mapped)) registryKeys.push(mapped);
            }
        }
        this.registry.set('availableTileKeys', registryKeys);
      // load cornerstone crystal as a normal PNG texture.
      // (Cornerstone.svg is a 39MB/267k-path auto-trace and must never be
      // loaded as a live texture — see note above.)
      if (!this.textures.exists('cornerstone')) {
        this.load.image('cornerstone', `/assets/cornerstone/crystal.png?_ts=${now}`);
      }

      // log/load events to surface file-level errors for debugging
      this.load.on('filecomplete', (key: string, type: string, data: any) => {
        // eslint-disable-next-line no-console
        console.log('[BootScene] filecomplete', key, type);
      });
      this.load.on('loaderror', (file: any) => {
        // eslint-disable-next-line no-console
        console.warn('[BootScene] loaderror', file && file.key, file && file.src);
      });

      // available keys already set (registryKeys) above; leave as-is

      const loadList: any = this.load.list;
      const hasQueued = loadList ? (loadList.size !== undefined ? loadList.size > 0 : (loadList.length > 0)) : false;
      if (hasQueued) {
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
