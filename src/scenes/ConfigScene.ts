import Phaser from 'phaser';

export default class ConfigScene extends Phaser.Scene {
  formEl?: HTMLDivElement;

  constructor() {
    super({ key: 'ConfigScene' });
  }

  create() {
    // create simple DOM form overlay
    this.formEl = document.createElement('div');
    this.formEl.style.position = 'absolute';
    this.formEl.style.left = '20px';
    this.formEl.style.top = '20px';
    this.formEl.style.padding = '12px';
    this.formEl.style.background = 'rgba(0,0,0,0.7)';
    this.formEl.style.color = '#fff';
    this.formEl.style.zIndex = '1000';
    this.formEl.style.maxWidth = '400px';

    this.formEl.innerHTML = `
      <h3>Configurar Partida</h3>
      <label>Jogadores: <select id="players"><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option></select></label>
      <div id="names"></div>
      <label>Dificuldade: <select id="difficulty"><option value="beginner">Iniciante</option><option value="intermediate">Intermediário</option><option value="advanced">Avançado</option></select></label>
      <div style="margin-top:8px;"><button id="genSeed">Gerar Seed</button> <span id="seedVal">-</span></div>
      <div style="margin-top:8px;"><button id="startBtn">Iniciar Partida</button></div>
    `;

    document.body.appendChild(this.formEl);

    const playersSelect = this.formEl.querySelector('#players') as HTMLSelectElement;
    const namesDiv = this.formEl.querySelector('#names') as HTMLDivElement;
    const seedVal = this.formEl.querySelector('#seedVal') as HTMLSpanElement;

    const renderNameInputs = () => {
      const n = Number(playersSelect.value);
      namesDiv.innerHTML = '';
      for (let i = 0; i < n; i++) {
        const el = document.createElement('div');
        el.innerHTML = `<label>Nome ${i + 1}: <input id="name${i}" value="Jogador ${i + 1}"></label>`;
        namesDiv.appendChild(el);
      }
    };

    playersSelect.addEventListener('change', renderNameInputs);
    renderNameInputs();

    const genSeedBtn = this.formEl.querySelector('#genSeed') as HTMLButtonElement;
    genSeedBtn.addEventListener('click', () => {
      const seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
      seedVal.textContent = String(seed);
      this.registry.set('seed', seed);
    });

    const startBtn = this.formEl.querySelector('#startBtn') as HTMLButtonElement;
    startBtn.addEventListener('click', () => {
      const n = Number(playersSelect.value);
      const names: string[] = [];
      for (let i = 0; i < n; i++) {
        const input = this.formEl!.querySelector(`#name${i}`) as HTMLInputElement;
        names.push(input.value || `Jogador ${i + 1}`);
      }
      const difficulty = (this.formEl!.querySelector('#difficulty') as HTMLSelectElement).value;
      let seed = this.registry.get('seed');
      if (!seed) {
        seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        this.registry.set('seed', seed);
      }

      // store config in registry for GameScene
      this.registry.set('config', { players: n, names, difficulty, seed });

      // cleanup DOM
      this.formEl!.remove();
      this.scene.start('GameScene');
    });
  }

  shutdown() {
    if (this.formEl && this.formEl.parentElement) this.formEl.remove();
  }
}
