import { describe, expect, it } from 'vitest';

import { advancePosition, createDashState, resolveMovementDirection } from './movement';

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
    expect(step.dashTriggered).toBe(false);
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

  it('starts a dash when the player is moving and dash is pressed', () => {
    const step = advancePosition(
      { x: 10, y: 10 },
      {
        dashPressed: true,
        down: false,
        left: false,
        right: true,
        up: false,
      },
      240,
      50,
      undefined,
      createDashState(),
    );

    expect(step.dashTriggered).toBe(true);
    expect(step.dashState.isDashing).toBe(true);
    expect(step.dashState.cooldownRemainingMs).toBe(50);
    expect(step.nextPosition.x).toBe(46);
    expect(step.velocity).toEqual({ x: 720, y: 0 });
  });

  it('does not start a dash while idle', () => {
    const step = advancePosition(
      { x: 10, y: 10 },
      {
        dashPressed: true,
        down: false,
        left: false,
        right: false,
        up: false,
      },
      240,
      50,
      undefined,
      createDashState(),
    );

    expect(step.dashTriggered).toBe(false);
    expect(step.dashState.isDashing).toBe(false);
    expect(step.nextPosition).toEqual({ x: 10, y: 10 });
  });

  it('locks the dash direction even if the held input changes mid-dash', () => {
    const firstStep = advancePosition(
      { x: 10, y: 10 },
      {
        dashPressed: true,
        down: false,
        left: false,
        right: true,
        up: false,
      },
      240,
      50,
      undefined,
      createDashState(),
    );

    const secondStep = advancePosition(
      firstStep.nextPosition,
      {
        dashPressed: false,
        down: false,
        left: true,
        right: false,
        up: false,
      },
      240,
      25,
      undefined,
      firstStep.dashState,
    );

    expect(secondStep.dashState.isDashing).toBe(true);
    expect(secondStep.nextPosition.x).toBe(64);
    expect(secondStep.velocity).toEqual({ x: 720, y: 0 });
  });

  it('prevents retriggering the dash while the current dash is still active', () => {
    const firstStep = advancePosition(
      { x: 10, y: 10 },
      {
        dashPressed: true,
        down: false,
        left: false,
        right: true,
        up: false,
      },
      240,
      50,
      undefined,
      createDashState(),
    );

    const secondStep = advancePosition(
      firstStep.nextPosition,
      {
        dashPressed: true,
        down: false,
        left: false,
        right: true,
        up: false,
      },
      240,
      25,
      undefined,
      firstStep.dashState,
    );

    expect(secondStep.dashTriggered).toBe(false);
    expect(secondStep.dashState.isDashing).toBe(true);
    expect(secondStep.dashState.cooldownRemainingMs).toBe(25);
    expect(secondStep.nextPosition.x).toBe(64);
  });

  it('allows another dash after the cooldown finishes', () => {
    let step = advancePosition(
      { x: 10, y: 10 },
      {
        dashPressed: true,
        down: false,
        left: false,
        right: true,
        up: false,
      },
      240,
      100,
      undefined,
      createDashState(),
    );

    step = advancePosition(
      step.nextPosition,
      {
        dashPressed: false,
        down: false,
        left: false,
        right: true,
        up: false,
      },
      240,
      50,
      undefined,
      step.dashState,
    );

    const secondDash = advancePosition(
      step.nextPosition,
      {
        dashPressed: true,
        down: false,
        left: false,
        right: true,
        up: false,
      },
      240,
      50,
      undefined,
      step.dashState,
    );

    expect(step.dashState.cooldownRemainingMs).toBe(0);
    expect(secondDash.dashTriggered).toBe(true);
    expect(secondDash.dashState.isDashing).toBe(true);
  });

  it('clamps dash movement inside the movement bounds', () => {
    const step = advancePosition(
      { x: 96, y: 50 },
      {
        dashPressed: true,
        down: false,
        left: false,
        right: true,
        up: false,
      },
      240,
      100,
      {
        minX: 0,
        maxX: 100,
        minY: 0,
        maxY: 100,
      },
      createDashState(),
    );

    expect(step.dashTriggered).toBe(true);
    expect(step.nextPosition.x).toBe(100);
  });

  it('clamps unusually large frame deltas for dash movement and cooldown', () => {
    const step = advancePosition(
      { x: 10, y: 10 },
      {
        dashPressed: true,
        down: false,
        left: false,
        right: true,
        up: false,
      },
      240,
      1000,
      undefined,
      createDashState(),
    );

    expect(step.nextPosition.x).toBe(82);
    expect(step.dashState.cooldownRemainingMs).toBe(0);
  });
});
