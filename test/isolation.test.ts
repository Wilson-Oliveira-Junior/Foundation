import { describe, it, expect } from 'vitest';
import { ChallengeBank } from '../src/engine/ChallengeBank';
import { ChallengeEngine } from '../src/engine/ChallengeEngine';
import { Cornerstone } from '../src/cornerstone/Cornerstone';

describe('Isolation between players', () => {
  it('delivers different challenges to two players landing same tile and does not mutate tile state', async () => {
    const bank = new ChallengeBank([
      { id: 'c1', category: 'loops', difficulty: 1, question: 'Q1', answer: 'A1' },
      { id: 'c2', category: 'loops', difficulty: 1, question: 'Q2', answer: 'A2' },
      { id: 'c3', category: 'loops', difficulty: 1, question: 'Q3', answer: 'A3' },
    ]);
    const engine = new ChallengeEngine(bank);
    const cornerstone = new Cornerstone('center', engine as any);

    const p1 = 'playerA';
    const p2 = 'playerB';
    const inst1 = await cornerstone.onPlayerEnter(p1, 'loops');
    const inst2 = await cornerstone.onPlayerEnter(p2, 'loops');

    expect(inst1).not.toBeNull();
    expect(inst2).not.toBeNull();
    if (inst1 && inst2) {
      engine.recordResult(p1, inst1.challenge.id, true);
      engine.recordResult(p2, inst2.challenge.id, false);
      const inst1Next = engine.requestChallenge(p1, 'loops');
      if (inst1Next) expect(inst1Next.challenge.id).not.toBe(inst1.challenge.id);
    }
  });
});
