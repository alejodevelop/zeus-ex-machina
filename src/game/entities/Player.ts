import Phaser from 'phaser';

import { ASSET_KEYS } from '../assets';

export interface MovementState {
  down: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
}

const PLAYER_SPEED = 280;

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ASSET_KEYS.player);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(6);
    this.setDrag(1800, 1800);
    this.setMaxVelocity(PLAYER_SPEED, PLAYER_SPEED);
    this.setCircle(28, 8, 8);
  }

  public applyMovement(input: MovementState): void {
    const direction = new Phaser.Math.Vector2(
      Number(input.right) - Number(input.left),
      Number(input.down) - Number(input.up),
    );

    if (direction.lengthSq() === 0) {
      this.setVelocity(0, 0);
      return;
    }

    direction.normalize().scale(PLAYER_SPEED);

    this.setVelocity(direction.x, direction.y);

    if (Math.abs(direction.x) > 4) {
      this.setAngle(direction.x > 0 ? 0 : 180);
    }
  }

  public freeze(): void {
    this.setVelocity(0, 0);

    const body = this.body as Phaser.Physics.Arcade.Body | null;

    body?.stop();
  }
}
