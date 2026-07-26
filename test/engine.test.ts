import { describe, it, expect } from 'vitest';
import { ChallengeBank } from '../src/engine/ChallengeBank';
import { ChallengeEngine } from '../src/engine/ChallengeEngine';

describe('ChallengeEngine', () => {
  it('delivers a challenge and records result', () => {
    const bank = new ChallengeBank([
      { id: 'c1', category: 'loops', difficulty: 1, question: 'Q1', answer: 'A1' },
      { id: 'c2', category: 'loops', difficulty: 2, question: 'Q2', answer: 'A2' },
    ]);
    const engine = new ChallengeEngine(bank);
    const inst = engine.requestChallenge('player1', 'loops');
    expect(inst).not.toBeNull();
    if (inst) engine.recordResult('player1', inst.challenge.id, true);
    const inst2 = engine.requestChallenge('player1', 'loops');
    // should not deliver the same challenge again for same player
    if (inst && inst2) expect(inst2.challenge.id).not.toBe(inst.challenge.id);
  });
});
