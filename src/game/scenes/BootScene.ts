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
    graphics.fillStyle(0x19334b, 1);
    graphics.fillRoundedRect(6, 6, 116, 116, 30);
    graphics.lineStyle(6, 0xf0b46d, 1);
    graphics.strokeRoundedRect(10, 10, 108, 108, 26);
    graphics.lineStyle(3, 0xfff8ef, 0.95);
    graphics.strokeCircle(64, 64, 24);
    graphics.lineBetween(64, 24, 64, 104);
    graphics.lineBetween(24, 64, 104, 64);
    graphics.fillStyle(0xf0b46d, 1);
    graphics.fillCircle(64, 64, 8);
    graphics.generateTexture(ASSET_KEYS.emblem, 128, 128);

    graphics.clear();
    graphics.fillStyle(0xf0b46d, 1);
    graphics.fillCircle(12, 12, 10);
    graphics.lineStyle(3, 0xfff8ef, 0.95);
    graphics.strokeCircle(12, 12, 7);
    graphics.generateTexture(ASSET_KEYS.beacon, 24, 24);

    graphics.clear();
    graphics.fillStyle(0x17324a, 1);
    graphics.fillRoundedRect(20, 26, 32, 26, 14);
    graphics.fillStyle(0x2f7a7b, 1);
    graphics.fillRoundedRect(24, 30, 24, 22, 10);
    graphics.fillStyle(0xefc08b, 1);
    graphics.fillCircle(36, 30, 11);
    graphics.lineStyle(4, 0xffffff, 1);
    graphics.strokeCircle(27, 18, 8);
    graphics.strokeCircle(36, 14, 10);
    graphics.strokeCircle(45, 18, 8);
    graphics.lineStyle(3, 0xfff8ef, 1);
    graphics.strokeRoundedRect(20, 26, 32, 26, 14);
    graphics.strokeCircle(36, 30, 11);
    graphics.generateTexture(ASSET_KEYS.player, 72, 72);

    graphics.destroy();
  }
}
