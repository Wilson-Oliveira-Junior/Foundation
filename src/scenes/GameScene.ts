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

    // enqueue players
    this.turnQueue = cfg.names.slice(0, cfg.players);

    // create teacher UI (Approve / Reject)
    this.createTeacherUI();
  }

  startMatch() {
    this.state = GameState.ROLL_DICE;
    this.turnQueue = ['Player 1', 'Player 2'];
    this.nextTurn();
  }

  nextTurn() {
    if (this.turnQueue.length === 0) {
      this.state = GameState.END_GAME;
      return;
    }
    const player = this.turnQueue.shift()!;
    console.log('Turn of', player);
    this.state = GameState.ROLL_DICE;
    this.time.delayedCall(500, () => this.revealChallenge(player));
  }

  revealChallenge(player: string) {
    this.state = GameState.REVEAL_CHALLENGE;
    this.add.text(20, 60, `Desafio para ${player}`, { color: '#ffff00' });
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
      this.add.text(20, 140, `${player} aprovado ✅`, { color: '#00ff00' });
    } else {
      this.add.text(20, 140, `${player} reprovado ❌`, { color: '#ff4444' });
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
