import { ChallengeBank, Challenge } from './ChallengeBank';
import { PlayerSession } from './PlayerSession';

export type ChallengeInstance = {
  challenge: Challenge;
  deliveredAt: string;
};

export class ChallengeEngine {
  private bank: ChallengeBank;
  private sessions: Map<string, PlayerSession> = new Map();

  constructor(bank: ChallengeBank) { this.bank = bank; }

  requestChallenge(playerId: string, category?: string): ChallengeInstance | null {
    const session = this.getSession(playerId);
    const ch = this.bank.getRandom(category, session.answeredIds);
    if (!ch) return null;
    return { challenge: ch, deliveredAt: new Date().toISOString() };
  }

  recordResult(playerId: string, challengeId: string, correct: boolean) {
    const session = this.getSession(playerId);
    session.recordResult(challengeId, correct);
  }

  private getSession(playerId: string) {
    if (!this.sessions.has(playerId)) this.sessions.set(playerId, new PlayerSession(playerId));
    return this.sessions.get(playerId)!;
  }
}
