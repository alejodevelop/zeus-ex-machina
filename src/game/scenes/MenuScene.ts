import Phaser from 'phaser';

import { ASSET_KEYS } from '../assets';
import { SceneKey } from './scene-keys';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Menu);
  }

  public create(): void {
    const { width, height } = this.scale;
    const accent = this.add.image(width - 150, 116, ASSET_KEYS.emblem).setAlpha(0.14).setScale(0.92);
    const echo = this.add.image(156, height - 120, ASSET_KEYS.emblem).setAlpha(0.08).setScale(0.62).setAngle(45);
    const band = this.add.graphics();

    band.fillStyle(0xfff9f2, 0.72);
    band.fillRoundedRect(76, 78, width - 152, height - 156, 30);
    band.lineStyle(2, 0x42586f, 0.25);
    band.strokeRoundedRect(76, 78, width - 152, height - 156, 30);

    this.cameras.main.fadeIn(350, 0, 0, 0);

    this.tweens.add({
      targets: [accent, echo],
      angle: 360,
      duration: 22000,
      ease: 'Linear',
      repeat: -1,
    });

    this.add
      .text(width / 2, height * 0.2, 'Blank Game Scaffold', {
        color: '#17324a',
        fontFamily: 'Palatino Linotype, Book Antiqua, Georgia, serif',
        fontSize: '50px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.3, 'Phaser + Vite + TypeScript', {
        color: '#c17b45',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.43,
        'The repo now holds only the neutral scene flow and toolchain. Define the next loop, systems, and art direction from zero.',
        {
          align: 'center',
          color: '#405466',
          fontFamily: 'Trebuchet MS, Verdana, sans-serif',
          fontSize: '21px',
          lineSpacing: 8,
          wordWrap: { width: 700 },
        },
      )
      .setOrigin(0.5);

    this.createChip(width * 0.3, height * 0.61, 'Boot -> Preload -> Menu -> Placeholder');
    this.createChip(width * 0.5, height * 0.69, 'Runtime textures only');
    this.createChip(width * 0.7, height * 0.61, 'Lint / test / build ready');

    const prompt = this.add
      .text(width / 2, height * 0.87, 'Press SPACE, ENTER, or click to open the placeholder scene', {
        color: '#a85d2d',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.35,
      duration: 780,
      ease: 'Sine.InOut',
      repeat: -1,
      yoyo: true,
    });

    const startRun = (): void => {
      this.cameras.main.fadeOut(220, 0, 0, 0);
      this.time.delayedCall(220, () => {
        this.scene.start(SceneKey.Game);
      });
    };

    this.input.once('pointerdown', startRun);
    this.input.keyboard?.once('keydown-SPACE', startRun);
    this.input.keyboard?.once('keydown-ENTER', startRun);
  }

  private createChip(x: number, y: number, label: string): void {
    this.add
      .text(x, y, label, {
        backgroundColor: '#f8efe3',
        color: '#17324a',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '15px',
        padding: { bottom: 9, left: 14, right: 14, top: 9 },
      })
      .setOrigin(0.5);

    this.add.image(x - 116, y, ASSET_KEYS.beacon).setScale(0.7).setAlpha(0.9);
  }
}
