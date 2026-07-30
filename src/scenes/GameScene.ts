import Phaser from 'phaser';
import PlayerPiece from '../entities/PlayerPiece';
import Board from '../board/Board';
import { TileState } from '../board/Tile';
import { ChallengeBank } from '../engine/ChallengeBank';
import { ChallengeEngine } from '../engine/ChallengeEngine';
import { Cornerstone } from '../cornerstone/Cornerstone';
import seedrandom from 'seedrandom';
import TurnManager from '../engine/TurnManager';
import MovementManager from '../engine/MovementManager';
import UIManager from '../engine/UIManager';
import Narrator from '../engine/Narrator';
import TileEventEngine from '../engine/TileEventEngine';

enum GameState {
  SETUP,
  ROLL_DICE,
  MOVE_PLAYER,
  REVEAL_CHALLENGE,
  TEACHER_DECISION,
  APPLY_OUTCOME,
  CHECK_WIN,
  NEXT_TURN,
  END_GAME,
  ERROR_BLOCKING
}

export default class GameScene extends Phaser.Scene {
  state: GameState = GameState.SETUP;
  turnQueue: string[] = [];
  pieces: any[] = [];
  tracks: import('../board/Tile').Tile[][] = [];
  inputLocked: boolean = false;
  board?: Board;

  constructor() {
    super({ key: 'GameScene' });
  }

  async create() {
    this.add.text(20, 20, 'Foundation - Game Scene (esqueleto)', { color: '#ffffff' });

    const cfg = this.registry.get('config') || { players: 2, names: ['Player 1', 'Player 2'], difficulty: 'beginner', seed: Date.now() };
    (this.game as any).seed = cfg.seed;
    console.log('Loaded config:', cfg);

    // Integrate deterministic RNG from seed
    const rng = seedrandom(String(cfg.seed));
    (this.game as any).rng = rng;

    // create adaptive board using configured players and camera center
    const cam = this.cameras && this.cameras.main ? this.cameras.main : null;
    const centerX = cam ? Math.round(cam.centerX) : 512;
    const centerY = cam ? Math.round(cam.centerY) : 384;
    const board = new Board({ scene: this, centerX, centerY, players: cfg.players });
    // if a positions map exists, load it to override generated tracks
    try {
      await board.loadPositions();
    } catch (_) {}
    // ensure required textures are loaded before drawing
    const tex = this.textures;
    const toLoad: { key: string; url: string }[] = [];
    // allow tile-neutral in multiple formats (png/svg) or use availableTileKeys provided by BootScene
    if (!tex.exists('tile-neutral')) {
      const avail = this.registry.get('availableTileKeys') as string[] | undefined;
      if (avail && avail.includes('tile-neutral')) {
        // try to load whatever BootScene exposed (it includes extension-stripped keys)
        // BootScene loaded list into registry as keys without extensions
        // but the actual URL must include extension; prefer png then svg
        toLoad.push({ key: 'tile-neutral', url: '/assets/tiles/tile-neutral.png' });
        toLoad.push({ key: 'tile-neutral', url: '/assets/tiles/tile-neutral.svg' });
      } else {
        toLoad.push({ key: 'tile-neutral', url: '/assets/tiles/tile-neutral.png' });
        toLoad.push({ key: 'tile-neutral', url: '/assets/tiles/tile-neutral.svg' });
      }
    }
    if (!tex.exists('board-background')) toLoad.push({ key: 'board-background', url: '/assets/background.png' });
    if (toLoad.length > 0) {
      // queue each candidate URL; Phaser will pick the first that loads successfully
      toLoad.forEach(t => this.load.image(t.key, t.url + '?_ts=' + Date.now()));
      await new Promise<void>((resolve) => {
        this.load.once('complete', () => resolve());
        this.load.start();
      });
    }
    board.drawPlaceholder();
    this.tracks = board.getTracks();
    this.board = board;

    // turn manager
    this.turnManager = new TurnManager(cfg.names.slice(0, cfg.players));

    // create placeholder player pieces
    const colors = [0x2196f3, 0xff9800, 0x4caf50, 0x9c27b0, 0xf44336, 0xffeb3b];
    this.playerIndexByName = new Map<string, number>();
    for (let i = 0; i < cfg.players; i++) {
      const start = this.tracks[i][0];
      const piece = new PlayerPiece(this, start.x!, start.y!, colors[i % colors.length], i);
      this.pieces.push(piece);
      // map player name to index (use provided names order)
      const name = this.turnQueue[i] || `Player ${i + 1}`;
      this.playerIndexByName.set(name, i);
    }

    this.movementManager = new MovementManager();
    this.uiManager = new UIManager();
    this.narrator = new Narrator();
    this.tileEventEngine = new TileEventEngine();

    // --- Challenge engine setup (example seed data)
    const initial = [
      { id: 'c1', category: 'logic', difficulty: 1, question: 'O que é uma variável?', answer: 'Um nome que aponta para um valor' },
      { id: 'c2', category: 'loops', difficulty: 1, question: 'Qual comando cria um laço?', answer: 'for / while' },
      { id: 'c3', category: 'arrays', difficulty: 1, question: 'Como acessar o primeiro elemento?', answer: 'indice 0' },
    ];
    const bank = new ChallengeBank(initial as any);
    this.challengeEngine = new ChallengeEngine(bank);
    this.cornerstone = new Cornerstone('center', this.challengeEngine);

    // listen to board events (player entering tile)
    this.events.on('playerEnteredTile', async (payload: any) => {
      const { playerId } = payload;
      // request a challenge for this player
      const inst = await this.cornerstone?.onPlayerEnter(playerId);
      if (inst) {
        this.uiManager?.showChallenge(this, playerId, inst.challenge.question);
        // store pending challenge for teacher decision
        this.pendingChallenge = { playerId, challengeId: inst.challenge.id };
      }
    });

    this.events.on('awakenTile', (payload: any) => {
      const { tileId } = payload;
      // mark awakened on board model
      if (this.board && typeof this.board.setTileState === 'function') {
        this.board.setTileState(tileId, TileState.AWAKENED);
      } else {
        console.warn('Board not available to set tile state', tileId);
      }
    });

    // create teacher UI (Approve / Reject)
    this.createTeacherUI();
    // load content pack (tries generated then questions.json) and prepare deck
    this.loadContentPack('pack-programming-logic-v1', cfg.seed, 1000).then(() => {
      console.log('Loaded content pack, deck size=', this.deck.length);
    }).catch(err => {
      console.warn('Content pack load failed:', err);
    });
  }

  async loadContentPack(packName: string, seed: string | number, maxCount: number) {
    const base = `/content-packs/${packName}`;
    const urls = [
      `${base}/questions.generated.json`,
      `${base}/questions.json`
    ];
    let data: any = null;
    for (const u of urls) {
      try {
        const res = await fetch(u);
        if (!res.ok) continue;
        data = await res.json();
        break;
      } catch (e) {
        // ignore and try next
      }
    }
    if (!data) throw new Error('No pack data found');
    const questions = data.questions || [];
    // shuffle deterministically using game's rng
    const rngFn = (this.game as any).rng ? () => (this.game as any).rng() : Math.random;
    const arr = questions.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rngFn() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    this.deck = arr.slice(0, Math.min(maxCount, arr.length));
  }

  // runtime fields
  challengeEngine?: ChallengeEngine;
  cornerstone?: Cornerstone;
  pendingChallenge: { playerId: string; challengeId: string } | null = null;
  playerIndexByName?: Map<string, number>;
  turnManager?: TurnManager;
  movementManager?: MovementManager;
  uiManager?: UIManager;
  narrator?: Narrator;
  tileEventEngine?: TileEventEngine;
  // content pack deck
  deck: any[] = [];

  startMatch() {
    this.state = GameState.ROLL_DICE;
    // turnQueue already set from config; ensure pieces reset
    // reset pieces
    this.pieces.forEach(p => p.setPositionIndex(0));
    // narrative: Cornerstone awakens at match start
    this.narrator?.say(this, 'A Cornerstone despertou.', { color: '#ffdd55', y: 40 });
    this.nextTurn();
  }

  nextTurn() {
    const player = this.turnManager?.next();
    if (!player) {
      this.state = GameState.END_GAME;
      return;
    }
    if (this.inputLocked) return;
    console.log('Turn of', player);
    this.state = GameState.ROLL_DICE;
    // perform deterministic dice roll using rng
    const rng = (this.game as any).rng || Math.random;
    const roll = Math.floor(rng() * 6) + 1;
    console.log('Rolled:', roll);
    // special reaction on rolling a 6
    if (roll === 6) this.narrator?.say(this, 'Rolou 6! O Core reage...', { color: '#ffd700' });
    // animate movement of the corresponding piece
    const playerIndex = this.playerIndexByName?.get(player) ?? 0; // map player name -> index
    const piece = this.pieces[playerIndex];
    this.inputLocked = true;
    this.movementManager?.movePiece(piece, this.tracks[playerIndex], roll, () => {
      this.inputLocked = false;
      const tileId = this.currentTileIdForPlayer(player);
      const def = this.board?.model?.getDefinition(tileId || '');
      const eventResult = this.tileEventEngine?.handleTileEvent(player, def, this);
      if (eventResult && eventResult.action && eventResult.action !== 'none') {
        // simple handling: if advance, move piece further then reveal
        if (eventResult.action === 'advance') {
          const steps = eventResult.steps || 1;
          this.movementManager?.movePiece(piece, this.tracks[playerIndex], steps, () => {
            this.revealChallenge(player);
          });
          return;
        }
      }
      this.revealChallenge(player);
    });
  }

  async revealChallenge(player: string) {
    // Legacy path kept: request via cornerstone if not already requested
    this.state = GameState.REVEAL_CHALLENGE;
    // Prefer using deck if available
    let q: any | null = null;
    if (this.deck && this.deck.length > 0) {
      q = this.deck.shift();
      this.uiManager?.showChallenge(this, player, q.question);
      this.pendingChallenge = { playerId: player, challengeId: q.id };
    } else {
      const inst = await this.cornerstone?.onPlayerEnter(player);
      if (inst) {
        this.uiManager?.showChallenge(this, player, inst.challenge.question);
        this.pendingChallenge = { playerId: player, challengeId: inst.challenge.id };
      }
    }
    this.pendingTeacher = player;
    this.uiManager?.showAwaitingTeacher(this);
    this.showProfessorHint();
  }

  pendingTeacher: string | null = null;

  teacherDecisionFromUI(approved: boolean) {
    if (!this.pendingTeacher) return;
    const player = this.pendingTeacher;
    this.pendingTeacher = null;
    // record result in engine if pending challenge exists
    if (this.pendingChallenge && this.pendingChallenge.playerId === player) {
      this.challengeEngine?.recordResult(player, this.pendingChallenge.challengeId, approved);
      // if approved, awaken the tile; if rejected, keep discovered
      const tileId = this.currentTileIdForPlayer(player);
      if (approved && tileId) {
        // set tile awakened in board
        // board instance not stored; emit event to allow board to update if listener present
        this.events.emit('awakenTile', { tileId });
      }
      this.pendingChallenge = null;
    }
    this.applyOutcome(player, approved);
  }

  currentTileIdForPlayer(player: string): string | null {
    // derive player index from mapping
    const idx = this.playerIndexByName?.get(player);
    if (idx === undefined) return null;
    const piece = this.pieces[idx];
    if (piece && typeof piece.getPositionIndex === 'function') {
      const posIdx = piece.getPositionIndex();
      return `${idx}-${posIdx}`;
    }
    return null;
  }

  showChallengeForPlayer(playerId: string, challenge: any) {
    // kept for backward compatibility; prefer UIManager
    this.uiManager?.showChallenge(this, playerId, challenge.question);
  }

  showAwaitingTeacher() {
    this.uiManager?.showAwaitingTeacher(this);
  }

  createTeacherUI() {
    // In-game minimal teacher UI using keyboard shortcuts (Y/N)
    // Small hint text shown when awaiting teacher decision
    this.uiProfessorText = this.add.text(520, 20, '', { color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.4)', padding: { x: 8, y: 6 } }).setDepth(1000);
    this.uiProfessorText.setScrollFactor(0);
    this.uiProfessorText.setVisible(false);

    // keyboard listeners
      this.input?.keyboard?.on('keydown-Y', () => {
      if (!this.pendingTeacher) return;
      this.teacherDecisionFromUI(true);
      this.hideProfessorHint();
    });
      this.input?.keyboard?.on('keydown-N', () => {
      if (!this.pendingTeacher) return;
      this.teacherDecisionFromUI(false);
      this.hideProfessorHint();
    });
  }

  uiProfessorText?: Phaser.GameObjects.Text;

  showProfessorHint() {
    if (!this.uiProfessorText) return;
    this.uiProfessorText.setText('Professor\n[Y] Aprovar    [N] Reprovar');
    this.uiProfessorText.setVisible(true);
    // auto-hide after 8s if not used
    this.time.delayedCall(8000, () => { if (this.uiProfessorText) this.uiProfessorText.setVisible(false); });
  }

  hideProfessorHint() {
    if (!this.uiProfessorText) return;
    this.uiProfessorText.setVisible(false);
  }

  applyOutcome(player: string, approved: boolean) {
    this.state = GameState.APPLY_OUTCOME;
    if (approved) {
      // narrative: Core responds to the curious when approved
      this.add.text(20, 140, `${player} aprovado ✅ — O Core responde aos curiosos.`, { color: '#00ff00' });
    } else {
      // narrative: corruption reaches the Cornerstone on failure
      this.add.text(20, 140, `${player} reprovado ❌ — A corrupção alcançou a Cornerstone.`, { color: '#ff4444' });
    }
    this.time.delayedCall(800, () => {
      this.state = GameState.CHECK_WIN;
      this.time.delayedCall(200, () => {
        this.state = GameState.NEXT_TURN;
        this.nextTurn();
      });
    });
  }
}
