export default class UIManager {
  showChallenge(scene: any, playerId: string, question: string) {
    scene.add.text(20, 80, `Desafio para ${playerId}: ${question}`, { color: '#ffd' });
  }

  showAwaitingTeacher(scene: any) {
    scene.add.text(20, 100, `Aguardando professor... (use botões)`, { color: '#fff' });
  }
}
