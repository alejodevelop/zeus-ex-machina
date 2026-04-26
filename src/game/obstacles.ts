import type { TraversalBlocker } from './traversal-blockers';

export const ObstaclePrefabId = {
  StraightWall: 'straight-wall',
} as const;

export type ObstaclePrefab = (typeof ObstaclePrefabId)[keyof typeof ObstaclePrefabId];

export const ObstacleOrientationId = {
  Horizontal: 'horizontal',
  Vertical: 'vertical',
} as const;

export type ObstacleOrientation = (typeof ObstacleOrientationId)[keyof typeof ObstacleOrientationId];

export const ObstacleRouteHintId = {
  CenterLane: 'center-lane',
  NorthLane: 'north-lane',
  SouthLane: 'south-lane',
} as const;

export type ObstacleRouteHint = (typeof ObstacleRouteHintId)[keyof typeof ObstacleRouteHintId];

export const ObstacleSizeId = {
  Full: 'full',
  Half: 'half',
  Quarter: 'quarter',
} as const;

export type ObstacleSize = (typeof ObstacleSizeId)[keyof typeof ObstacleSizeId];

export interface ObstaclePlacement {
  id: string;
  labelOffsetX?: number;
  labelOffsetY?: number;
  orientation?: ObstacleOrientation;
  prefabId: ObstaclePrefab;
  size?: ObstacleSize;
  x: number;
  y: number;
}

export interface ObstacleSandboxState {
  elapsedMs: number;
}

export interface ObstacleInstance {
  active: boolean;
  angle: number;
  blocker: TraversalBlocker;
  id: string;
  labelOffsetX: number;
  labelOffsetY: number;
  orientation: ObstacleOrientation;
  prefabId: ObstaclePrefab;
  size: ObstacleSize;
  width: number;
  x: number;
  y: number;
}

export interface ObstacleRouteSummary {
  activeBlockerCount: number;
  obstacleCount: number;
  routeHint: ObstacleRouteHint;
}

export interface ObstacleFrame {
  instances: ObstacleInstance[];
  summary: ObstacleRouteSummary;
}

export const ROUTE_SANDBOX_OBSTACLES: ObstaclePlacement[] = [
  {
    id: 'wall-full-north',
    labelOffsetY: 42,
    prefabId: ObstaclePrefabId.StraightWall,
    size: ObstacleSizeId.Full,
    x: 324,
    y: 188,
  },
  {
    id: 'wall-half-center',
    labelOffsetX: 84,
    orientation: ObstacleOrientationId.Vertical,
    prefabId: ObstaclePrefabId.StraightWall,
    size: ObstacleSizeId.Half,
    x: 480,
    y: 272,
  },
  {
    id: 'wall-quarter-east',
    labelOffsetY: 38,
    prefabId: ObstaclePrefabId.StraightWall,
    size: ObstacleSizeId.Quarter,
    x: 694,
    y: 236,
  },
  {
    id: 'wall-full-south',
    labelOffsetY: -40,
    prefabId: ObstaclePrefabId.StraightWall,
    size: ObstacleSizeId.Full,
    x: 356,
    y: 382,
  },
];

const STRAIGHT_WALL_THICKNESS = 28;

export function createObstacleSandboxState(): ObstacleSandboxState {
  return {
    elapsedMs: 0,
  };
}

export function advanceObstacleSandboxState(state: ObstacleSandboxState, deltaMs: number): ObstacleSandboxState {
  return {
    elapsedMs: state.elapsedMs + Math.max(deltaMs, 0),
  };
}

export function getActiveObstacleBlockers(instances: ObstacleInstance[]): TraversalBlocker[] {
  return instances.map((instance) => instance.blocker);
}

export function getObstacleSizeLabel(size: ObstacleSize): string {
  switch (size) {
    case ObstacleSizeId.Full:
      return '100%';
    case ObstacleSizeId.Half:
      return '50%';
    case ObstacleSizeId.Quarter:
      return '25%';
  }
}

export function getObstacleTypeLabel(prefabId: ObstaclePrefab): string {
  switch (prefabId) {
    case ObstaclePrefabId.StraightWall:
      return 'Straight wall';
  }
}

export function getRouteHintLabel(routeHint: ObstacleRouteHint): string {
  switch (routeHint) {
    case ObstacleRouteHintId.CenterLane:
      return 'Center lane open';
    case ObstacleRouteHintId.NorthLane:
      return 'North lane route';
    case ObstacleRouteHintId.SouthLane:
      return 'South lane route';
  }
}

export function resolveObstacleFrame(
  state: ObstacleSandboxState,
  placements: ObstaclePlacement[] = ROUTE_SANDBOX_OBSTACLES,
): ObstacleFrame {
  const instances = placements.map((placement) => resolveObstacleInstance(placement));

  return {
    instances,
    summary: summarizeObstacleFrame(instances, state.elapsedMs),
  };
}

function createCenteredBlocker(x: number, y: number, width: number, height: number): TraversalBlocker {
  return {
    height,
    width,
    x: x - width / 2,
    y: y - height / 2,
  };
}

function resolveObstacleInstance(placement: ObstaclePlacement): ObstacleInstance {
  const orientation = placement.orientation ?? ObstacleOrientationId.Horizontal;
  const size = placement.size ?? ObstacleSizeId.Full;
  const width = resolveStraightWallWidth(size);
  const blockerWidth = orientation === ObstacleOrientationId.Horizontal ? width : STRAIGHT_WALL_THICKNESS;
  const blockerHeight = orientation === ObstacleOrientationId.Horizontal ? STRAIGHT_WALL_THICKNESS : width;

  return {
    active: true,
    angle: 0,
    blocker: createCenteredBlocker(placement.x, placement.y, blockerWidth, blockerHeight),
    id: placement.id,
    labelOffsetX: placement.labelOffsetX ?? 0,
    labelOffsetY: placement.labelOffsetY ?? getDefaultLabelOffsetY(orientation, width),
    orientation,
    prefabId: placement.prefabId,
    size,
    width,
    x: placement.x,
    y: placement.y,
  };
}

function resolveStraightWallWidth(size: ObstacleSize): number {
  switch (size) {
    case ObstacleSizeId.Full:
      return 240;
    case ObstacleSizeId.Half:
      return 120;
    case ObstacleSizeId.Quarter:
      return 60;
  }
}

function getDefaultLabelOffsetY(orientation: ObstacleOrientation, width: number): number {
  return orientation === ObstacleOrientationId.Vertical ? width / 2 + 22 : 38;
}

function summarizeObstacleFrame(instances: ObstacleInstance[], elapsedMs: number): ObstacleRouteSummary {
  const cyclePhase = ((elapsedMs % 6000) + 6000) % 6000;
  let routeHint: ObstacleRouteHint = ObstacleRouteHintId.CenterLane;

  if (cyclePhase >= 2000 && cyclePhase < 4000) {
    routeHint = ObstacleRouteHintId.NorthLane;
  } else if (cyclePhase >= 4000) {
    routeHint = ObstacleRouteHintId.SouthLane;
  }

  return {
    activeBlockerCount: instances.length,
    obstacleCount: instances.length,
    routeHint,
  };
}
