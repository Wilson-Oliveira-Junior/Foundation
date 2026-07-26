import Phaser from 'phaser';
import Board from '../board/Board';
import seedrandom from 'seedrandom';

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
  tracks: { x: number; y: number }[][] = [];
  inputLocked: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.add.text(20, 20, 'Foundation - Game Scene (esqueleto)', { color: '#ffffff' });

    const cfg = this.registry.get('config') || { players: 2, names: ['Player 1', 'Player 2'], difficulty: 'beginner', seed: Date.now() };
    (this.game as any).seed = cfg.seed;
    console.log('Loaded config:', cfg);

    // Integrate deterministic RNG from seed
    const rng = seedrandom(String(cfg.seed));
    (this.game as any).rng = rng;

    // create adaptive board using configured players
    const board = new Board({ scene: this, centerX: 512, centerY: 384, players: cfg.players });
    board.drawPlaceholder();
    this.tracks = board.getTracks();

    // create placeholder player pieces
    const colors = [0x2196f3, 0xff9800, 0x4caf50, 0x9c27b0, 0xf44336, 0xffeb3b];
    for (let i = 0; i < cfg.players; i++) {
      const start = this.tracks[i][0];
      const piece = new (require('../entities/PlayerPiece').default)(this, start.x, start.y, colors[i % colors.length], i);
      this.pieces.push(piece);
    }

    // enqueue players
    this.turnQueue = cfg.names.slice(0, cfg.players);

    // create teacher UI (Approve / Reject)
    this.createTeacherUI();
  }

  startMatch() {
    this.state = GameState.ROLL_DICE;
    // turnQueue already set from config; ensure pieces reset
    this.turnQueue = this.turnQueue;
    this.pieces.forEach(p => p.setPositionIndex(0));
    // narrative: Cornerstone awakens at match start
    this.add.text(20, 40, 'A Cornerstone despertou.', { color: '#ffdd55' });
    this.nextTurn();
  }

  nextTurn() {
    if (this.turnQueue.length === 0) {
      this.state = GameState.END_GAME;
      return;
    }
    if (this.inputLocked) return;
    const player = this.turnQueue.shift()!;
    console.log('Turn of', player);
    this.state = GameState.ROLL_DICE;
    // perform deterministic dice roll using rng
    const rng = (this.game as any).rng || Math.random;
    const roll = Math.floor(rng() * 6) + 1;
    console.log('Rolled:', roll);
    // animate movement of the corresponding piece
    const playerIndex = 0; // map player name -> index
    const piece = this.pieces[playerIndex];
    this.inputLocked = true;
    piece.moveAlong(this.tracks[playerIndex], roll, () => {
      this.inputLocked = false;
      this.revealChallenge(player);
    });
  }

  revealChallenge(player: string) {
    this.state = GameState.REVEAL_CHALLENGE;
    // narrative: Cornerstone reveals a fragment when a space is reached
    this.add.text(20, 60, `A Cornerstone revelou um Fragmento. Desafio para ${player}`, { color: '#ffff00' });
    // wait for teacher decision via UI
    this.pendingTeacher = player;
    this.showAwaitingTeacher();
  }

  pendingTeacher: string | null = null;

  teacherDecisionFromUI(approved: boolean) {
    if (!this.pendingTeacher) return;
    const player = this.pendingTeacher;
    this.pendingTeacher = null;
    this.applyOutcome(player, approved);
  }

  showAwaitingTeacher() {
    // visual hint (could be improved)
    this.add.text(20, 100, `Aguardando professor... (use botões)`, { color: '#fff' });
  }

  createTeacherUI() {
    // create simple DOM buttons anchored top-right
    const container = document.createElement('div');
    container.id = 'teacher-ui';
    container.style.position = 'absolute';
    container.style.right = '20px';
    container.style.top = '20px';
    container.style.zIndex = '1000';
    container.style.display = 'flex';
    container.style.gap = '8px';

    const approve = document.createElement('button');
    approve.textContent = 'Aprovar ✅';
    approve.style.padding = '8px 12px';
    const reject = document.createElement('button');
    reject.textContent = 'Reprovar ❌';
    reject.style.padding = '8px 12px';

    approve.onclick = () => {
      this.teacherDecisionFromUI(true);
      approve.disabled = true; reject.disabled = true;
      setTimeout(() => { approve.disabled = false; reject.disabled = false; }, 500);
    };
    reject.onclick = () => {
      this.teacherDecisionFromUI(false);
      approve.disabled = true; reject.disabled = true;
      setTimeout(() => { approve.disabled = false; reject.disabled = false; }, 500);
    };

    container.appendChild(approve);
    container.appendChild(reject);
    document.body.appendChild(container);
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
