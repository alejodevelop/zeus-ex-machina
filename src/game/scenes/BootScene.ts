import Phaser from 'phaser';

import { ASSET_KEYS } from '../assets';
import { SceneKey } from './scene-keys';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Boot);
  }

  public create(): void {
    this.createRuntimeTextures();
    this.scene.start(SceneKey.Preload);
  }

  private createRuntimeTextures(): void {
    const graphics = this.make.graphics({}, false);

    graphics.clear();
    graphics.fillStyle(0x08121f, 1);
    graphics.fillRoundedRect(0, 0, 72, 72, 18);
    graphics.lineStyle(5, 0x22d3ee, 1);
    graphics.strokeRoundedRect(3, 3, 66, 66, 16);
    graphics.fillStyle(0xf8fafc, 1);
    graphics.fillRoundedRect(18, 17, 32, 38, 12);
    graphics.fillStyle(0xf59e0b, 1);
    graphics.fillTriangle(50, 36, 30, 22, 30, 50);
    graphics.generateTexture(ASSET_KEYS.player, 72, 72);

    graphics.clear();
    graphics.fillStyle(0x07111d, 1);
    graphics.fillCircle(32, 32, 32);
    graphics.lineStyle(6, 0x22d3ee, 1);
    graphics.strokeCircle(32, 32, 25);
    graphics.fillStyle(0xf59e0b, 1);
    graphics.fillCircle(32, 32, 10);
    graphics.fillStyle(0xf8fafc, 1);
    graphics.fillRect(30, 10, 4, 12);
    graphics.fillRect(30, 42, 4, 12);
    graphics.fillRect(10, 30, 12, 4);
    graphics.fillRect(42, 30, 12, 4);
    graphics.generateTexture(ASSET_KEYS.core, 64, 64);

    graphics.clear();
    graphics.fillStyle(0x22d3ee, 1);
    graphics.fillCircle(10, 10, 10);
    graphics.lineStyle(3, 0xf8fafc, 0.9);
    graphics.strokeCircle(10, 10, 7);
    graphics.generateTexture(ASSET_KEYS.signal, 20, 20);

    graphics.clear();
    graphics.fillStyle(0xf8fafc, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture(ASSET_KEYS.spark, 8, 8);

    graphics.destroy();
  }
}
