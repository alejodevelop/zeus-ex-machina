import { describe, expect, it } from 'vitest';

import { SessionState } from './SessionState';

describe('SessionState', () => {
  it('tracks score and target progress', () => {
    const session = new SessionState({ targetScore: 3, timeLimitSeconds: 30 });

    session.start();
    session.addScore();
    session.addScore(2);

    expect(session.isTargetReached).toBe(true);
    expect(session.snapshot.score).toBe(3);
    expect(session.snapshot.status).toBe('running');
  });

  it('counts down until the timer expires', () => {
    const session = new SessionState({ targetScore: 2, timeLimitSeconds: 2 });

    session.start();
    session.tick();
    session.tick();

    expect(session.hasTimeRemaining).toBe(false);
    expect(session.snapshot.remainingSeconds).toBe(0);
  });
});
