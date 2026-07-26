export type Challenge = {
  id: string;
  category: string;
  difficulty: number;
  question: string;
  answer: string;
};

export class ChallengeBank {
  private challenges: Challenge[] = [];

  constructor(initial: Challenge[] = []) {
    this.challenges = initial.slice();
  }

  static fromContentPack(pack: import('./ContentPack').default) {
    return new ChallengeBank(pack.items.slice());
  }

  getRandom(category?: string, excludeIds: Set<string> = new Set()): Challenge | null {
    const pool = this.challenges.filter(c => (!category || c.category === category) && !excludeIds.has(c.id));
    if (!pool.length) return null;
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  }

  add(ch: Challenge) { this.challenges.push(ch); }
  count() { return this.challenges.length; }
}
