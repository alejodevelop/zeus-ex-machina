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

    graphics.clear();
    drawBattery(graphics, 0x6d7783, 0x404851, 0x30363d);
    graphics.generateTexture(ASSET_KEYS.batteryDead, 48, 64);

    graphics.clear();
    drawBattery(graphics, 0x9ed36a, 0x3d6741, 0xeff8c6);
    graphics.generateTexture(ASSET_KEYS.batteryFresh, 48, 64);

    graphics.clear();
    drawBatteryMachine(graphics, 0x7b8692, 0x535c66, 0x65717c);
    graphics.generateTexture(ASSET_KEYS.batteryMachineDead, 132, 112);

    graphics.clear();
    drawBatteryMachine(graphics, 0xa4c978, 0x49624a, 0xa4c978);
    graphics.generateTexture(ASSET_KEYS.batteryMachineFull, 132, 112);

    graphics.clear();
    drawBatteryMachine(graphics, 0xf4efe4, 0x535c66, null);
    graphics.generateTexture(ASSET_KEYS.batteryMachineOpen, 132, 112);

    graphics.clear();
    drawBatterySupply(graphics);
    graphics.generateTexture(ASSET_KEYS.batterySupply, 136, 112);

    graphics.clear();
    drawDiscardBin(graphics);
    graphics.generateTexture(ASSET_KEYS.discardBin, 112, 112);

    graphics.destroy();
  }
}

function drawBattery(
  graphics: Phaser.GameObjects.Graphics,
  fillColor: number,
  lineColor: number,
  capColor: number,
): void {
  graphics.fillStyle(fillColor, 1);
  graphics.fillRoundedRect(8, 10, 32, 46, 10);
  graphics.fillStyle(capColor, 1);
  graphics.fillRoundedRect(16, 4, 16, 12, 4);
  graphics.lineStyle(3, lineColor, 1);
  graphics.strokeRoundedRect(8, 10, 32, 46, 10);
  graphics.strokeRoundedRect(16, 4, 16, 12, 4);
  graphics.lineStyle(2, 0xffffff, 0.5);
  graphics.lineBetween(14, 20, 34, 20);
  graphics.lineBetween(14, 28, 34, 28);
  graphics.lineBetween(14, 36, 34, 36);
}

function drawBatteryMachine(
  graphics: Phaser.GameObjects.Graphics,
  accentColor: number,
  bodyLineColor: number,
  batteryFillColor: number | null,
): void {
  graphics.fillStyle(0x17324a, 1);
  graphics.fillRoundedRect(10, 8, 112, 96, 20);
  graphics.lineStyle(4, 0xffffff, 0.14);
  graphics.strokeRoundedRect(10, 8, 112, 96, 20);
  graphics.fillStyle(0x2a4158, 1);
  graphics.fillRoundedRect(28, 18, 76, 72, 16);
  graphics.lineStyle(3, bodyLineColor, 1);
  graphics.strokeRoundedRect(28, 18, 76, 72, 16);
  graphics.fillStyle(accentColor, 1);
  graphics.fillRoundedRect(18, 20, 8, 66, 4);

  if (batteryFillColor !== null) {
    graphics.fillStyle(batteryFillColor, 1);
    graphics.fillRoundedRect(48, 26, 36, 52, 10);
    graphics.fillStyle(0xfff9d8, 1);
    graphics.fillRoundedRect(56, 20, 20, 10, 4);
    graphics.lineStyle(3, bodyLineColor, 1);
    graphics.strokeRoundedRect(48, 26, 36, 52, 10);
    graphics.strokeRoundedRect(56, 20, 20, 10, 4);
  }
}

function drawBatterySupply(graphics: Phaser.GameObjects.Graphics): void {
  graphics.fillStyle(0x29506a, 1);
  graphics.fillRoundedRect(8, 10, 120, 92, 18);
  graphics.lineStyle(3, 0xffffff, 0.18);
  graphics.strokeRoundedRect(8, 10, 120, 92, 18);
  graphics.fillStyle(0x3b6e8f, 1);
  graphics.fillRoundedRect(18, 22, 100, 68, 12);
  graphics.fillStyle(0xa4d573, 1);
  graphics.fillRoundedRect(30, 36, 24, 38, 10);
  graphics.fillRoundedRect(56, 30, 24, 44, 10);
  graphics.fillRoundedRect(82, 36, 24, 38, 10);
  graphics.fillStyle(0xf0f7cf, 1);
  graphics.fillRoundedRect(36, 30, 12, 10, 4);
  graphics.fillRoundedRect(62, 24, 12, 10, 4);
  graphics.fillRoundedRect(88, 30, 12, 10, 4);
}

function drawDiscardBin(graphics: Phaser.GameObjects.Graphics): void {
  graphics.fillStyle(0x6f5040, 1);
  graphics.fillRoundedRect(18, 20, 76, 74, 16);
  graphics.lineStyle(3, 0x433127, 1);
  graphics.strokeRoundedRect(18, 20, 76, 74, 16);
  graphics.fillStyle(0x8d6751, 1);
  graphics.fillRoundedRect(10, 12, 92, 16, 8);
  graphics.lineStyle(3, 0x433127, 1);
  graphics.strokeRoundedRect(10, 12, 92, 16, 8);
  graphics.fillStyle(0x4a3429, 0.45);
  graphics.fillRoundedRect(26, 30, 60, 54, 12);
  graphics.lineStyle(2, 0xffffff, 0.18);
  graphics.lineBetween(38, 32, 38, 84);
  graphics.lineBetween(56, 32, 56, 84);
  graphics.lineBetween(74, 32, 74, 84);
}
