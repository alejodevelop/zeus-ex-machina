import { describe, expect, it } from 'vitest';

import {
  ObstacleOrientationId,
  ObstaclePrefabId,
  ObstacleRouteHintId,
  ObstacleSizeId,
  ROUTE_SANDBOX_OBSTACLES,
  advanceObstacleSandboxState,
  createObstacleSandboxState,
  getActiveObstacleBlockers,
  getObstacleSizeLabel,
  getObstacleTypeLabel,
  getRouteHintLabel,
  resolveObstacleFrame,
} from './obstacles';

describe('obstacles', () => {
  it('builds a route sandbox from straight wall prefabs', () => {
    const frame = resolveObstacleFrame(createObstacleSandboxState(), ROUTE_SANDBOX_OBSTACLES);

    expect(frame.summary.obstacleCount).toBe(4);
    expect(frame.instances.every((instance) => instance.prefabId === ObstaclePrefabId.StraightWall)).toBe(true);
  });

  it('creates horizontal wall blockers with wide bounds', () => {
    const frame = resolveObstacleFrame(
      createObstacleSandboxState(),
      [
        {
          id: 'wall-horizontal',
          prefabId: ObstaclePrefabId.StraightWall,
          size: ObstacleSizeId.Full,
          x: 300,
          y: 200,
        },
      ],
    );
    const blocker = getActiveObstacleBlockers(frame.instances)[0];

    expect(frame.instances[0].orientation).toBe(ObstacleOrientationId.Horizontal);
    expect(frame.instances[0].size).toBe(ObstacleSizeId.Full);
    expect(blocker.width).toBe(240);
    expect(blocker.height).toBe(28);
  });

  it('creates vertical wall blockers with tall bounds', () => {
    const frame = resolveObstacleFrame(
      createObstacleSandboxState(),
      [
        {
          id: 'wall-vertical',
          orientation: ObstacleOrientationId.Vertical,
          prefabId: ObstaclePrefabId.StraightWall,
          size: ObstacleSizeId.Half,
          x: 300,
          y: 260,
        },
      ],
    );
    const blocker = getActiveObstacleBlockers(frame.instances)[0];

    expect(frame.instances[0].angle).toBe(0);
    expect(blocker.width).toBe(28);
    expect(blocker.height).toBe(120);
  });

  it('supports quarter, half, and full wall sizes for composition', () => {
    const frame = resolveObstacleFrame(createObstacleSandboxState(), [
      { id: 'wall-quarter', prefabId: ObstaclePrefabId.StraightWall, size: ObstacleSizeId.Quarter, x: 180, y: 160 },
      { id: 'wall-half', prefabId: ObstaclePrefabId.StraightWall, size: ObstacleSizeId.Half, x: 320, y: 160 },
      { id: 'wall-full', prefabId: ObstaclePrefabId.StraightWall, size: ObstacleSizeId.Full, x: 520, y: 160 },
    ]);

    expect(frame.instances.map((instance) => instance.width)).toEqual([60, 120, 240]);
  });

  it('cycles route hints for the sandbox guidance banner', () => {
    const centerLane = resolveObstacleFrame({ elapsedMs: 0 }, ROUTE_SANDBOX_OBSTACLES).summary;
    const northLane = resolveObstacleFrame({ elapsedMs: 2500 }, ROUTE_SANDBOX_OBSTACLES).summary;
    const southLane = resolveObstacleFrame({ elapsedMs: 4500 }, ROUTE_SANDBOX_OBSTACLES).summary;

    expect(centerLane.routeHint).toBe(ObstacleRouteHintId.CenterLane);
    expect(northLane.routeHint).toBe(ObstacleRouteHintId.NorthLane);
    expect(southLane.routeHint).toBe(ObstacleRouteHintId.SouthLane);
  });

  it('advances sandbox elapsed time without going negative', () => {
    const advanced = advanceObstacleSandboxState(createObstacleSandboxState(), 120);
    const clamped = advanceObstacleSandboxState(advanced, -50);

    expect(advanced.elapsedMs).toBe(120);
    expect(clamped.elapsedMs).toBe(120);
  });

  it('provides readable labels for the wall sandbox', () => {
    expect(getObstacleTypeLabel(ObstaclePrefabId.StraightWall)).toBe('Straight wall');
    expect(getObstacleSizeLabel(ObstacleSizeId.Quarter)).toBe('25%');
    expect(getRouteHintLabel(ObstacleRouteHintId.NorthLane)).toBe('North lane route');
  });
});
