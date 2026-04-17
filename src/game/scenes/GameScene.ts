import Phaser from 'phaser';

import { ASSET_KEYS } from '../assets';
import { SceneKey } from './scene-keys';

export class GameScene extends Phaser.Scene {
  private leaving = false;

  constructor() {
    super(SceneKey.Game);
  }

  public create(): void {
    const { width, height } = this.scale;
    const accent = this.add.image(width - 136, 108, ASSET_KEYS.emblem).setAlpha(0.12).setScale(0.84);
    const backdrop = this.add.graphics();

    this.cameras.main.fadeIn(260, 0, 0, 0);

    backdrop.fillStyle(0xfffaf4, 0.78);
    backdrop.fillRoundedRect(48, 42, width - 96, height - 84, 28);
    backdrop.lineStyle(2, 0x42586f, 0.28);
    backdrop.strokeRoundedRect(48, 42, width - 96, height - 84, 28);
    backdrop.lineStyle(1, 0x42586f, 0.12);

    for (let x = 96; x <= width - 96; x += 56) {
      backdrop.lineBetween(x, 84, x, height - 84);
    }

    this.tweens.add({
      angle: -360,
      duration: 24000,
      ease: 'Linear',
      repeat: -1,
      targets: accent,
    });

    this.add
      .text(width / 2, 98, 'Placeholder Scene', {
        color: '#17324a',
        fontFamily: 'Palatino Linotype, Book Antiqua, Georgia, serif',
        fontSize: '42px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        146,
        'Gameplay has been intentionally removed. This scene is only a clean handoff point for the next prototype.',
        {
          align: 'center',
          color: '#405466',
          fontFamily: 'Trebuchet MS, Verdana, sans-serif',
          fontSize: '18px',
          wordWrap: { width: 690 },
        },
      )
      .setOrigin(0.5);

    createInfoCard(this, 180, 318, 'Current State', [
      'No rules, win states, or actors remain.',
      'No theme-specific assets are loaded.',
      'Only scaffold visuals are active.',
    ]);
    createInfoCard(this, 480, 318, 'Still Wired', [
      'Scene flow and scaling config.',
      'Vite entry, HMR, and build output.',
      'A small tested utility layer.',
    ]);
    createInfoCard(this, 780, 318, 'Good Next Moves', [
      'Define the core loop first.',
      'Add only the systems you need.',
      'Replace placeholder copy and art.',
    ]);

    const backButton = this.add
      .text(width / 2, height - 72, 'Back to Menu', {
        backgroundColor: '#17324a',
        color: '#fff9f0',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        padding: { bottom: 12, left: 20, right: 20, top: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    backButton.on('pointerover', () => {
      backButton.setStyle({
        backgroundColor: '#274864',
        color: '#fff3dc',
      });
    });

    backButton.on('pointerout', () => {
      backButton.setStyle({
        backgroundColor: '#17324a',
        color: '#fff9f0',
      });
    });

    backButton.on('pointerup', () => {
      this.leaveToMenu();
    });

    this.add
      .text(width / 2, height - 34, 'ESC or M also returns to the menu', {
        color: '#6a7b88',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '14px',
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-ESC', () => {
      this.leaveToMenu();
    });
    this.input.keyboard?.once('keydown-M', () => {
      this.leaveToMenu();
    });
  }

  private leaveToMenu(): void {
    if (this.leaving) {
      return;
    }

    this.leaving = true;
    this.cameras.main.fadeOut(180, 0, 0, 0);
    this.time.delayedCall(180, () => {
      this.scene.start(SceneKey.Menu);
    });
  }
}

function createInfoCard(scene: Phaser.Scene, x: number, y: number, title: string, lines: string[]): void {
  scene.add.rectangle(x, y, 250, 186, 0xf8efe3, 0.98).setStrokeStyle(1, 0x42586f, 0.3);
  scene.add.image(x - 90, y - 62, ASSET_KEYS.beacon).setScale(0.78).setAlpha(0.92);
  scene.add
    .text(x - 70, y - 64, title, {
      color: '#17324a',
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
    })
    .setOrigin(0, 0.5);
  scene.add
    .text(x - 94, y - 30, lines.map((line) => `- ${line}`).join('\n'), {
      color: '#405466',
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: '15px',
      lineSpacing: 10,
      wordWrap: { width: 188 },
    })
    .setOrigin(0, 0);
}
