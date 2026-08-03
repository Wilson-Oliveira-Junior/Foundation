import Phaser from 'phaser';
import BoardGenerator from './BoardGenerator';
import { Tile } from './Tile';
import BoardModel from './BoardModel';
import BoardRenderer from './BoardRenderer';
import { TileState } from './Tile';

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
  tracks: Tile[][];
  model: BoardModel;
  renderer: BoardRenderer;

  constructor(cfg: BoardConfig) {
    this.cfg = { rings: 4, spacesPerTrack: 25, radius: 300, ...cfg };
    this.scene = cfg.scene;
    this.graphics = this.scene.add.graphics();
    // delegate generation/model/render responsibilities
    const generator = new BoardGenerator();
    this.tracks = generator.generate(this.cfg.players, this.cfg.centerX, this.cfg.centerY, this.cfg.radius || 300);
    this.model = new BoardModel();
    this.tracks.forEach((path: Tile[], trackIndex: number) => {
      path.forEach((p: Tile, spaceIndex: number) => {
        const id = `${trackIndex}-${spaceIndex}`;
        this.model.setTile({ id, trackIndex, spaceIndex, state: TileState.UNKNOWN });
      });
    });
    this.renderer = new BoardRenderer(this.scene);
  }

  // attempt to load an explicit positions map (produced by tools) to override generated tracks
  async loadPositions(): Promise<boolean> {
    try {
      const res = await fetch('/assets/tiles/board-positions.json?_ts=' + Date.now());
      if (!res.ok) return false;
      const data = await res.json();
      const positions = data.positions || [];
      // build tracks from positions array
      const tracksMap: Record<number, Tile[]> = {};
      positions.forEach((p: any) => {
        const t = p.track;
        const s = p.space;
        const x = p.x;
        const y = p.y;
        if (!tracksMap[t]) tracksMap[t] = [];
        tracksMap[t][s] = { id: `${t}-${s}`, x, y, state: TileState.UNKNOWN } as any;
      });
      const tracks: Tile[][] = [];
      Object.keys(tracksMap).map(k => parseInt(k, 10)).sort((a,b)=>a-b).forEach(k => tracks.push(tracksMap[k]));
      // The JSON currently only defines a fixed number of tracks (one per
      // authored ring). If it has FEWER tracks than the configured player
      // count, do NOT use it — that would leave tracks[i] undefined for the
      // extra players and crash GameScene when placing their pieces.
      // Keep the tracks already generated adaptively in the constructor instead.
      if (tracks.length > 0 && tracks.length >= (this.cfg.players || 0)) {
        // if the JSON contains more tracks than the current game players,
        // trim to the configured number of players so only requested tracks are shown
        const desiredTracks = Math.max(1, Math.min(this.cfg.players || tracks.length, tracks.length));
        this.tracks = tracks.slice(0, desiredTracks);
        // rebuild model from positions
        this.model = new BoardModel();
        this.tracks.forEach((path: Tile[], trackIndex: number) => {
          path.forEach((p: Tile, spaceIndex: number) => {
            const id = `${trackIndex}-${spaceIndex}`;
            this.model.setTile({ id, trackIndex, spaceIndex, state: TileState.UNKNOWN });
          });
        });
        return true;
      }
    } catch (e) {
      // ignore and fall back to generated tracks
    }
    return false;
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
    // draw background image if available
    try {
      // add background centered; use a low depth so tiles render above it
      const bg = this.scene.add.image(this.cfg.centerX, this.cfg.centerY, 'board-background').setDepth(0);
      bg.setOrigin(0.5, 0.5);
      // scale to fit radius (best-effort)
      const desired = (this.cfg.radius || 300) * 2;
      const scaleX = desired / bg.width;
      const scaleY = desired / bg.height;
      bg.setScale(Math.max(scaleX, scaleY) * 1.12);
    } catch (e) {
      // ignore if texture not loaded; fallback to primitives
    }
    // debug: report if textures are present
    // eslint-disable-next-line no-console
    console.log('[Board] board-background exists?', this.scene.textures.exists('board-background'));
    // eslint-disable-next-line no-console
    console.log('[Board] straight tile exists?', this.scene.textures.exists('straight'));
    this.graphics.lineStyle(2, 0xffffff, 0.6);
    // DEMO: mark a few tiles with different states to preview visuals
    try {
      // clear any previous demo markings
      // pick some example tiles if present
      if (this.tracks && this.tracks.length > 0) {
        const t0 = this.tracks[0] && this.tracks[0][0];
        const t1 = this.tracks[1] && this.tracks[1][2];
        const t2 = this.tracks[2] && this.tracks[2][3];
        const t3 = this.tracks[0] && this.tracks[0][4];
        if (t0) this.model.setTileState(`${0}-${0}`, (t0.state ? t0.state : 'SUCCESS') as any);
        if (t1) this.model.setTileState(`${1}-${2}`, 'BLOCKED' as any);
        if (t2) this.model.setTileState(`${2}-${3}`, 'REWARD' as any);
        if (t3) this.model.setTileState(`${0}-${4}`, 'DISCOVERED' as any);
      }
    } catch (e) {
      // ignore demo errors
    }
    this.renderer.drawTracks(this.tracks, this.model);
    const { centerX, centerY } = this.cfg;
    // enforce depths for key layers: background (0) < tiles (10) < cornerstone (20)
    try {
      this.scene.children.list.forEach((child: any) => {
        const key = child?.texture?.key;
        if (!key) return;
        if (key === 'board-background') {
          child.setDepth(0);
        }
        if (key === 'cornerstone' || key === 'Cornerstone') {
          child.setDepth(20);
        }
      });
    } catch (e) {
      // non-fatal
    }
    // try to render the cornerstone/core crystal image at center if available
    const tex = this.scene.textures;
    const coreKeys = ['core_crystal', 'Cornerstone', 'cornerstone', 'crystal', 'core'];
    let coreKey: string | null = null;
    for (const k of coreKeys) {
      if (tex.exists(k)) { coreKey = k; break; }
    }
    if (coreKey) {
      try {
        const img = this.scene.add.image(centerX, centerY, coreKey);
        img.setOrigin(0.5, 0.5);
        const src = this.scene.textures.get(coreKey).getSourceImage() as HTMLImageElement;
        // make cornerstone visually larger to match tile footprint
        const desired = 180; // diameter target to match tile footprint
        // set exact display size to match tile footprint
        img.setDisplaySize(desired, desired);
        // ensure cornerstone renders above tiles
        img.setDepth(100000);
      } catch (e) {
        // fallback to primitive if texture cannot be read
        this.graphics.fillStyle(0x22aa22, 1);
        this.graphics.fillCircle(centerX, centerY, 40);
        this.graphics.lineStyle(3, 0x000000, 0.6);
        this.graphics.strokeCircle(centerX, centerY, 40);
      }
    } else {
      this.graphics.fillStyle(0x22aa22, 1);
      this.graphics.fillCircle(centerX, centerY, 40);
      this.graphics.lineStyle(3, 0x000000, 0.6);
      this.graphics.strokeCircle(centerX, centerY, 40);
    }
  }

  // expose tracks for other systems (player placement)
  getTracks() {
    return this.generateTracks();
  }
}
