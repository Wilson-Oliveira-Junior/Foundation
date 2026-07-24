# Foundation (provisório)

Versão inicial do jogo digital de tabuleiro educativo para ensino de lógica de programação.

Visão resumida
- Objetivo: jogo por turnos onde os jogadores avançam em direção ao centro (a "Joia") resolvendo desafios de lógica.
- Público: crianças (10+), adolescentes, iniciantes em programação e uso em sala de aula.
- Plataforma: Web local (TypeScript + Phaser 3), execução offline.

Status do repositório
- Pasta: `Foundation/` — scaffold TypeScript + Phaser + Vite.

O que já está implementado (estado atual)
- Infraestrutura:
  - Projeto TypeScript com `vite` e `phaser`.
  - `index.html` e bootstrap (`src/main.ts`).
- Fluxo e UX básico:
  - `BootScene`: validação estrita de *assets críticos* (player-1..6, jewel) — bloqueia se faltarem.
  - `ConfigScene`: interface para configurar partida (2–6 jogadores, nomes, dificuldade, geração de seed).
  - `GameScene`: máquina de estados (FSM) esquelética, fila de turnos e integração com `Board`.
  - `Board`: geração programática de trilhas adaptáveis (2–6 jogadores) e desenho placeholder do tabuleiro.
  - UI do professor: botões `Aprovar` / `Reprovar` integrados ao fluxo de decisão.
  - RNG determinístico integrado via `seedrandom` (seed gerada em `ConfigScene` e propagada para o jogo).

Funcionalidades ainda pendentes (MVP / próximos entregáveis)
- Movimento animado das peças entre casas com tween e representação de peças (placeholders ou sprites reais).
- Sistema de desafios (categorias, seleção por dificuldade e conteúdo de perguntas).
- Recompensas e punições aplicáveis (efeitos de jogo concretos).
- Idempotência completa e proteção contra spam de input (debounce/locks durante animações/ações críticas).
- Telemetria local estruturada (logs por partida com seed, eventos e erros).
- Integração total da seed ao motor de jogo (usar RNG para rolagem de dados determinística reproduzível).
- Testes de robustez: spam de input, loops de partidas e falha de assets.

Diretórios e arquivos importantes
- `Foundation/src/board/Board.ts` — gera trilhas e desenha o tabuleiro placeholder.
- `Foundation/src/scenes/BootScene.ts` — valida assets críticos no boot.
- `Foundation/src/scenes/ConfigScene.ts` — tela de configuração da partida.
- `Foundation/src/scenes/GameScene.ts` — FSM, UI do professor e integração com `seedrandom`.
- `Foundation/assets/` — pasta para sprites (coloque aqui `player-1.png`…`player-6.png` e `jewel.png`).

Como rodar localmente (desenvolvimento)

```bash
cd Foundation
npm install
npm run dev

# abrir http://localhost:5173/ no navegador
```

Publicar no GitHub (passos recomendados)
1. Criar repositório remoto no GitHub (público). Você tem três opções:
   - Usar o GitHub CLI (`gh`) local: `gh repo create <org-or-user>/<repo-name> --public --source=Foundation --remote=origin --push`
   - Criar manualmente no GitHub web e seguir as instruções para adicionar `origin` e fazer push.
   - Fornecer um personal access token (PAT) OU me autorizar a usar `gh` (recomendado se quiser que eu execute o push). Não compartilhe o token publicamente aqui — prefira rodar o comando no seu terminal com as linhas abaixo.

2. Comandos típicos (executar no terminal na raiz do workspace):

```bash
cd Foundation
# inicializar git (se ainda não)
git init
git remote add origin https://github.com/<seu-usuario>/<repo>.git
git branch -M main
git add .
git commit -m "chore: initial Foundation scaffold"
git push -u origin main
```

Se usar `gh` (recomendado):

```bash
cd .. # na raiz do workspace
gh repo create <seu-usuario>/<repo> --public --source=Foundation --remote=origin --push
```

Checklist pré-push (recomendado)
- Verifique se `Foundation/assets/` contém os sprites críticos ou remova a validação estrita temporariamente.
- Atualize o README com imagens, licença (se aplicável) e descrição do projeto.

Próximos passos que posso executar para você
- A: Implementar movimento animado das peças entre casas e placeholders para sprites.  
- B: Ajudar a publicar o repositório remoto (posso gerar os comandos e orientá-lo; se quiser que eu execute, preciso de autorização via `gh` CLI no seu ambiente).  
- C: Configurar CI básico (por exemplo, GitHub Actions) para executar lint/build automaticamente.

Contato e colaboração
Por favor diga qual ação você deseja agora (A/B/C) ou se prefere que eu apenas gere os comandos exatos para você executar localmente para criar o repositório remoto e empurrar o código.
