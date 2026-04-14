import Phaser from 'phaser';

import { ASSET_KEYS } from '../assets';

export class MachineCore extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ASSET_KEYS.core);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(5);
    this.setCircle(24, 8, 8);
    this.playIdlePulse(scene);
  }

  public relocate(point: Phaser.Math.Vector2): void {
    this.setPosition(point.x, point.y);
  }

  private playIdlePulse(scene: Phaser.Scene): void {
    scene.tweens.add({
      targets: this,
      scale: 1.08,
      duration: 650,
      ease: 'Sine.InOut',
      repeat: -1,
      yoyo: true,
    });
  }
}
