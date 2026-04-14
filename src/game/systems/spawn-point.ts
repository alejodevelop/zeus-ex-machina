import Phaser from 'phaser';

export function pickSpawnPoint(
  bounds: Phaser.Geom.Rectangle,
  padding: number,
  avoid?: Phaser.Math.Vector2,
): Phaser.Math.Vector2 {
  const safeBounds = new Phaser.Geom.Rectangle(
    bounds.x + padding,
    bounds.y + padding,
    bounds.width - padding * 2,
    bounds.height - padding * 2,
  );

  let candidate = randomPointInRect(safeBounds);

  if (!avoid) {
    return candidate;
  }

  for (let attempts = 0; attempts < 12; attempts += 1) {
    if (Phaser.Math.Distance.BetweenPoints(candidate, avoid) >= 132) {
      return candidate;
    }

    candidate = randomPointInRect(safeBounds);
  }

  return candidate;
}

function randomPointInRect(bounds: Phaser.Geom.Rectangle): Phaser.Math.Vector2 {
  return new Phaser.Math.Vector2(
    Phaser.Math.Between(Math.floor(bounds.left), Math.floor(bounds.right)),
    Phaser.Math.Between(Math.floor(bounds.top), Math.floor(bounds.bottom)),
  );
}
