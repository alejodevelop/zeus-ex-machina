import type { Point2 } from './movement';

export interface TraversalBlocker {
  height: number;
  width: number;
  x: number;
  y: number;
}

interface RectBounds {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
}

export function constrainPointToBlockers(
  previous: Point2,
  next: Point2,
  radius: number,
  blockers: TraversalBlocker[],
): Point2 {
  if (!isMoveBlocked(previous, next, radius, blockers)) {
    return next;
  }

  const xOnly = { x: next.x, y: previous.y };

  if (!isMoveBlocked(previous, xOnly, radius, blockers)) {
    return xOnly;
  }

  const yOnly = { x: previous.x, y: next.y };

  if (!isMoveBlocked(previous, yOnly, radius, blockers)) {
    return yOnly;
  }

  return previous;
}

function createExpandedBounds(blocker: TraversalBlocker, radius: number): RectBounds {
  return {
    maxX: blocker.x + blocker.width + radius,
    maxY: blocker.y + blocker.height + radius,
    minX: blocker.x - radius,
    minY: blocker.y - radius,
  };
}

function isMoveBlocked(previous: Point2, next: Point2, radius: number, blockers: TraversalBlocker[]): boolean {
  return blockers.some((blocker) => segmentIntersectsBounds(previous, next, createExpandedBounds(blocker, radius)));
}

function isPointInsideBounds(point: Point2, bounds: RectBounds): boolean {
  return point.x >= bounds.minX && point.x <= bounds.maxX && point.y >= bounds.minY && point.y <= bounds.maxY;
}

function lineIntersectsLine(startA: Point2, endA: Point2, startB: Point2, endB: Point2): boolean {
  const denominator = (endA.x - startA.x) * (endB.y - startB.y) - (endA.y - startA.y) * (endB.x - startB.x);

  if (denominator === 0) {
    return false;
  }

  const numeratorA = (startA.y - startB.y) * (endB.x - startB.x) - (startA.x - startB.x) * (endB.y - startB.y);
  const numeratorB = (startA.y - startB.y) * (endA.x - startA.x) - (startA.x - startB.x) * (endA.y - startA.y);
  const ua = numeratorA / denominator;
  const ub = numeratorB / denominator;

  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

function segmentIntersectsBounds(start: Point2, end: Point2, bounds: RectBounds): boolean {
  if (isPointInsideBounds(start, bounds)) {
    return false;
  }

  if (isPointInsideBounds(end, bounds)) {
    return true;
  }

  const topLeft = { x: bounds.minX, y: bounds.minY };
  const topRight = { x: bounds.maxX, y: bounds.minY };
  const bottomLeft = { x: bounds.minX, y: bounds.maxY };
  const bottomRight = { x: bounds.maxX, y: bounds.maxY };

  return (
    lineIntersectsLine(start, end, topLeft, topRight) ||
    lineIntersectsLine(start, end, topRight, bottomRight) ||
    lineIntersectsLine(start, end, bottomRight, bottomLeft) ||
    lineIntersectsLine(start, end, bottomLeft, topLeft)
  );
}
