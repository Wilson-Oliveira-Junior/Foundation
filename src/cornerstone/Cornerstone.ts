import { ChallengeEngine } from '../engine/ChallengeEngine';

export class Cornerstone {
  id: string;
  engine: ChallengeEngine;

  constructor(id: string, engine: ChallengeEngine) {
    this.id = id;
    this.engine = engine;
  }

  async onPlayerEnter(playerId: string, category?: string) {
    const inst = this.engine.requestChallenge(playerId, category);
    return inst;
  }
}
