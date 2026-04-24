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
  dashPressed?: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
}

export interface DashState {
  cooldownRemainingMs: number;
  direction: Point2;
  durationRemainingMs: number;
  isDashing: boolean;
}

export interface DashConfig {
  cooldownMs: number;
  durationMs: number;
  speed: number;
}

export interface MovementStep {
  dashState: DashState;
  dashTriggered: boolean;
  direction: Point2;
  isMoving: boolean;
  nextPosition: Point2;
  velocity: Point2;
}

const MAX_STEP_MS = 100;

export const DEFAULT_DASH_CONFIG: DashConfig = {
  cooldownMs: 100,
  durationMs: 100,
  speed: 720,
};

export function createDashState(): DashState {
  return {
    cooldownRemainingMs: 0,
    direction: { x: 0, y: 0 },
    durationRemainingMs: 0,
    isDashing: false,
  };
}

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
  dashState: DashState = createDashState(),
  dashConfig: DashConfig = DEFAULT_DASH_CONFIG,
): MovementStep {
  const safeDeltaMs = clampStepDurationMs(deltaMs);
  const movementDirection = resolveMovementDirection(input);
  const nextDashState = copyDashState(dashState);
  let nextPosition = { ...position };
  let remainingMs = safeDeltaMs;
  let dashTriggered = false;
  let appliedDirection: Point2 = { x: 0, y: 0 };
  let appliedSpeed = 0;

  if (!nextDashState.isDashing && nextDashState.cooldownRemainingMs === 0 && input.dashPressed && hasDirection(movementDirection)) {
    nextDashState.cooldownRemainingMs = dashConfig.cooldownMs;
    nextDashState.direction = { ...movementDirection };
    nextDashState.durationRemainingMs = dashConfig.durationMs;
    nextDashState.isDashing = true;
    dashTriggered = true;
  }

  if (nextDashState.isDashing && nextDashState.durationRemainingMs > 0) {
    const dashMoveMs = Math.min(remainingMs, nextDashState.durationRemainingMs);

    nextPosition = movePoint(nextPosition, nextDashState.direction, dashConfig.speed, dashMoveMs, bounds);
    nextDashState.durationRemainingMs = Math.max(nextDashState.durationRemainingMs - dashMoveMs, 0);
    nextDashState.isDashing = nextDashState.durationRemainingMs > 0;
    remainingMs -= dashMoveMs;
    appliedDirection = { ...nextDashState.direction };
    appliedSpeed = dashConfig.speed;
  }

  if (remainingMs > 0 && hasDirection(movementDirection)) {
    nextPosition = movePoint(nextPosition, movementDirection, speed, remainingMs, bounds);
    appliedDirection = { ...movementDirection };
    appliedSpeed = speed;
  }

  nextDashState.cooldownRemainingMs = Math.max(nextDashState.cooldownRemainingMs - safeDeltaMs, 0);

  if (!nextDashState.isDashing && nextDashState.cooldownRemainingMs === 0) {
    nextDashState.direction = { x: 0, y: 0 };
  }

  return {
    dashState: nextDashState,
    dashTriggered,
    direction: appliedDirection,
    isMoving: nextPosition.x !== position.x || nextPosition.y !== position.y,
    nextPosition,
    velocity: {
      x: appliedDirection.x * appliedSpeed,
      y: appliedDirection.y * appliedSpeed,
    },
  };
}

function clampStepDurationMs(deltaMs: number): number {
  return Math.min(Math.max(deltaMs, 0), MAX_STEP_MS);
}

function copyDashState(dashState: DashState): DashState {
  const durationRemainingMs = Math.max(dashState.durationRemainingMs, 0);
  const isDashing = dashState.isDashing && durationRemainingMs > 0;

  return {
    cooldownRemainingMs: Math.max(dashState.cooldownRemainingMs, 0),
    direction: { ...dashState.direction },
    durationRemainingMs: isDashing ? durationRemainingMs : 0,
    isDashing,
  };
}

function hasDirection(direction: Point2): boolean {
  return direction.x !== 0 || direction.y !== 0;
}

function movePoint(
  position: Point2,
  direction: Point2,
  speed: number,
  deltaMs: number,
  bounds?: MovementBounds,
): Point2 {
  const safeDeltaSeconds = clampStepDurationMs(deltaMs) / 1000;
  const velocity = {
    x: direction.x * speed,
    y: direction.y * speed,
  };
  const unclampedPosition = {
    x: position.x + velocity.x * safeDeltaSeconds,
    y: position.y + velocity.y * safeDeltaSeconds,
  };

  return bounds ? clampPointToBounds(unclampedPosition, bounds) : unclampedPosition;
}
