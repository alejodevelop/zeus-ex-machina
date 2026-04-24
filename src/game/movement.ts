export interface Point2 {
  x: number;
  y: number;
}

export interface MovementBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface MovementInputState {
  down: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
}

export interface MovementStep {
  direction: Point2;
  isMoving: boolean;
  nextPosition: Point2;
  velocity: Point2;
}

const MAX_STEP_MS = 100;

export function resolveMovementDirection(input: MovementInputState): Point2 {
  const horizontal = Number(input.right) - Number(input.left);
  const vertical = Number(input.down) - Number(input.up);

  if (horizontal === 0 && vertical === 0) {
    return { x: 0, y: 0 };
  }

  const length = Math.hypot(horizontal, vertical);

  return {
    x: horizontal / length,
    y: vertical / length,
  };
}

export function clampPointToBounds(point: Point2, bounds: MovementBounds): Point2 {
  return {
    x: Math.min(Math.max(point.x, bounds.minX), bounds.maxX),
    y: Math.min(Math.max(point.y, bounds.minY), bounds.maxY),
  };
}

export function advancePosition(
  position: Point2,
  input: MovementInputState,
  speed: number,
  deltaMs: number,
  bounds?: MovementBounds,
): MovementStep {
  const direction = resolveMovementDirection(input);
  const safeDeltaSeconds = Math.min(Math.max(deltaMs, 0), MAX_STEP_MS) / 1000;
  const velocity = {
    x: direction.x * speed,
    y: direction.y * speed,
  };
  const unclampedPosition = {
    x: position.x + velocity.x * safeDeltaSeconds,
    y: position.y + velocity.y * safeDeltaSeconds,
  };

  return {
    direction,
    isMoving: direction.x !== 0 || direction.y !== 0,
    nextPosition: bounds ? clampPointToBounds(unclampedPosition, bounds) : unclampedPosition,
    velocity,
  };
}
