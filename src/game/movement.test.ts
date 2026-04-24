import { describe, expect, it } from 'vitest';

import { advancePosition, resolveMovementDirection } from './movement';

describe('resolveMovementDirection', () => {
  it('normalizes diagonal input so it does not move faster', () => {
    const direction = resolveMovementDirection({
      down: false,
      left: false,
      right: true,
      up: true,
    });

    expect(direction.x).toBeCloseTo(Math.SQRT1_2, 5);
    expect(direction.y).toBeCloseTo(-Math.SQRT1_2, 5);
  });

  it('cancels out opposite directions', () => {
    expect(
      resolveMovementDirection({
        down: true,
        left: true,
        right: true,
        up: true,
      }),
    ).toEqual({ x: 0, y: 0 });
  });
});

describe('advancePosition', () => {
  it('moves by speed and delta time on a single axis', () => {
    const step = advancePosition(
      { x: 40, y: 40 },
      {
        down: false,
        left: false,
        right: true,
        up: false,
      },
      240,
      100,
    );

    expect(step.nextPosition).toEqual({ x: 64, y: 40 });
    expect(step.velocity).toEqual({ x: 240, y: 0 });
    expect(step.isMoving).toBe(true);
  });

  it('clamps the player inside movement bounds', () => {
    const step = advancePosition(
      { x: 96, y: 96 },
      {
        down: true,
        left: false,
        right: true,
        up: false,
      },
      300,
      100,
      {
        minX: 0,
        maxX: 100,
        minY: 0,
        maxY: 100,
      },
    );

    expect(step.nextPosition.x).toBe(100);
    expect(step.nextPosition.y).toBe(100);
  });
});
