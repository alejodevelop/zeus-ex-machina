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

    graphics.clear();
    drawRepairPlate(graphics, 0xe1b36f, 0x7e5734, 0xffefcb);
    graphics.generateTexture(ASSET_KEYS.repairPlate, 96, 48);

    graphics.clear();
    drawRepairPlateSupply(graphics);
    graphics.generateTexture(ASSET_KEYS.repairPlateSupply, 136, 112);

    graphics.clear();
    drawCrack(graphics, 0x6f604f, 0x43382d, 0.65);
    graphics.generateTexture(ASSET_KEYS.crackWarning, 180, 120);

    graphics.clear();
    drawCrack(graphics, 0x45382c, 0x1d1510, 1);
    graphics.generateTexture(ASSET_KEYS.crackBlocked, 180, 120);

    graphics.clear();
    drawPatchedCrack(graphics);
    graphics.generateTexture(ASSET_KEYS.crackPatched, 180, 120);

    graphics.clear();
    drawOilPump(graphics);
    graphics.generateTexture(ASSET_KEYS.oilPump, 136, 112);

    graphics.clear();
    drawGear(graphics, 0x8294a0, 0x495864, 0xc6d1d7, 0x6e7f8a);
    graphics.generateTexture(ASSET_KEYS.gearHealthy, 132, 132);

    graphics.clear();
    drawGear(graphics, 0xc4a44b, 0x7a5e1b, 0xffefb4, 0xa5812e);
    graphics.generateTexture(ASSET_KEYS.gearNeedsOil, 132, 132);

    graphics.clear();
    drawGear(graphics, 0xbc7d4b, 0x6b3117, 0xf6d2b3, 0x8d4822);
    graphics.generateTexture(ASSET_KEYS.gearGrinding, 132, 132);

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

function drawRepairPlate(
  graphics: Phaser.GameObjects.Graphics,
  fillColor: number,
  lineColor: number,
  boltColor: number,
  offsetX = 0,
  offsetY = 0,
): void {
  graphics.fillStyle(fillColor, 1);
  graphics.fillRoundedRect(offsetX + 8, offsetY + 8, 80, 32, 8);
  graphics.lineStyle(3, lineColor, 1);
  graphics.strokeRoundedRect(offsetX + 8, offsetY + 8, 80, 32, 8);
  graphics.fillStyle(boltColor, 1);
  graphics.fillCircle(offsetX + 22, offsetY + 18, 4);
  graphics.fillCircle(offsetX + 74, offsetY + 18, 4);
  graphics.fillCircle(offsetX + 22, offsetY + 30, 4);
  graphics.fillCircle(offsetX + 74, offsetY + 30, 4);
}

function drawRepairPlateSupply(graphics: Phaser.GameObjects.Graphics): void {
  graphics.fillStyle(0x694936, 1);
  graphics.fillRoundedRect(12, 12, 112, 88, 18);
  graphics.lineStyle(3, 0x3d291d, 1);
  graphics.strokeRoundedRect(12, 12, 112, 88, 18);
  drawRepairPlate(graphics, 0xe1b36f, 0x7e5734, 0xffefcb, 8, 14);
  drawRepairPlate(graphics, 0xf0c67d, 0x87603e, 0xfff5d9, 22, 32);
}

function drawCrack(
  graphics: Phaser.GameObjects.Graphics,
  fillColor: number,
  lineColor: number,
  alpha: number,
): void {
  graphics.fillStyle(fillColor, alpha);
  graphics.fillRoundedRect(16, 30, 148, 50, 22);
  graphics.lineStyle(5, lineColor, 1);
  graphics.beginPath();
  graphics.moveTo(24, 54);
  graphics.lineTo(46, 38);
  graphics.lineTo(72, 62);
  graphics.lineTo(94, 34);
  graphics.lineTo(118, 68);
  graphics.lineTo(146, 42);
  graphics.lineTo(160, 62);
  graphics.strokePath();
  graphics.beginPath();
  graphics.moveTo(44, 72);
  graphics.lineTo(66, 50);
  graphics.lineTo(88, 80);
  graphics.lineTo(112, 48);
  graphics.lineTo(138, 78);
  graphics.strokePath();
}

function drawPatchedCrack(graphics: Phaser.GameObjects.Graphics): void {
  drawCrack(graphics, 0x65574a, 0x2e241d, 0.5);
  graphics.fillStyle(0xd8b27c, 1);
  graphics.fillRoundedRect(42, 34, 96, 44, 10);
  graphics.lineStyle(3, 0x7e5734, 1);
  graphics.strokeRoundedRect(42, 34, 96, 44, 10);
  graphics.fillStyle(0xffefcb, 1);
  graphics.fillCircle(54, 46, 4);
  graphics.fillCircle(126, 46, 4);
  graphics.fillCircle(54, 66, 4);
  graphics.fillCircle(126, 66, 4);
}

function drawGear(
  graphics: Phaser.GameObjects.Graphics,
  fillColor: number,
  lineColor: number,
  centerColor: number,
  toothColor: number,
): void {
  graphics.fillStyle(toothColor, 1);

  for (let index = 0; index < 8; index += 1) {
    const angle = (Math.PI * 2 * index) / 8;
    const toothX = 66 + Math.cos(angle) * 44;
    const toothY = 66 + Math.sin(angle) * 44;

    graphics.fillCircle(toothX, toothY, 10);
  }

  graphics.fillStyle(fillColor, 1);
  graphics.fillCircle(66, 66, 38);
  graphics.lineStyle(4, lineColor, 1);
  graphics.strokeCircle(66, 66, 38);
  graphics.fillStyle(centerColor, 1);
  graphics.fillCircle(66, 66, 14);
  graphics.lineStyle(3, 0xffffff, 0.4);

  for (let index = 0; index < 4; index += 1) {
    const angle = (Math.PI * 2 * index) / 4;

    graphics.lineBetween(66, 66, 66 + Math.cos(angle) * 28, 66 + Math.sin(angle) * 28);
  }
}

function drawOilPump(graphics: Phaser.GameObjects.Graphics): void {
  graphics.fillStyle(0x214865, 1);
  graphics.fillRoundedRect(14, 10, 108, 92, 20);
  graphics.lineStyle(3, 0xffffff, 0.18);
  graphics.strokeRoundedRect(14, 10, 108, 92, 20);
  graphics.fillStyle(0x3b708f, 1);
  graphics.fillRoundedRect(28, 24, 44, 56, 10);
  graphics.fillStyle(0xd9e6ed, 1);
  graphics.fillRoundedRect(38, 32, 24, 18, 6);
  graphics.fillStyle(0xe0c05a, 1);
  graphics.fillRoundedRect(78, 34, 16, 48, 8);
  graphics.fillStyle(0x7d8ea0, 1);
  graphics.fillRoundedRect(94, 44, 12, 8, 4);
  graphics.fillTriangle(104, 44, 122, 52, 104, 60);
}
