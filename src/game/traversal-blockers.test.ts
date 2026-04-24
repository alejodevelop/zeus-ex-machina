import { describe, expect, it } from 'vitest';

import { constrainPointToBlockers } from './traversal-blockers';

describe('traversal blockers', () => {
  const blocker = {
    height: 120,
    width: 40,
    x: 80,
    y: 20,
  };

  it('allows movement when there is no blocker collision', () => {
    expect(constrainPointToBlockers({ x: 20, y: 20 }, { x: 40, y: 20 }, 10, [blocker])).toEqual({ x: 40, y: 20 });
  });

  it('stops direct movement through a blocker', () => {
    expect(constrainPointToBlockers({ x: 20, y: 60 }, { x: 120, y: 60 }, 10, [blocker])).toEqual({ x: 20, y: 60 });
  });

  it('allows sliding on the free axis when one axis is blocked', () => {
    expect(constrainPointToBlockers({ x: 60, y: 10 }, { x: 120, y: 60 }, 10, [blocker])).toEqual({ x: 60, y: 60 });
  });

  it('lets the player move out if they are already inside a blocker', () => {
    expect(constrainPointToBlockers({ x: 90, y: 60 }, { x: 30, y: 60 }, 10, [blocker])).toEqual({ x: 30, y: 60 });
  });
});
