export class PlayerSession {
  playerId: string;
  answeredIds: Set<string> = new Set();
  failedIds: Set<string> = new Set();
  shields: number = 0;

  constructor(playerId: string) { this.playerId = playerId; }

  recordResult(challengeId: string, correct: boolean) {
    this.answeredIds.add(challengeId);
    if (!correct) this.failedIds.add(challengeId);
  }

  hasSeen(challengeId: string) { return this.answeredIds.has(challengeId); }
}
