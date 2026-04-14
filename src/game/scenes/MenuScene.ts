import Phaser from 'phaser';

import { ASSET_KEYS } from '../assets';
import { SceneKey } from './scene-keys';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Menu);
  }

  public create(): void {
    const { width, height } = this.scale;
    const accent = this.add.image(width / 2, height * 0.26, ASSET_KEYS.gear).setAlpha(0.14);

    if (this.scene.isActive(SceneKey.Ui)) {
      this.scene.stop(SceneKey.Ui);
    }

    this.cameras.main.fadeIn(350, 0, 0, 0);

    this.tweens.add({
      targets: accent,
      angle: 360,
      duration: 16000,
      ease: 'Linear',
      repeat: -1,
    });

    this.add.image(width / 2, height * 0.25, ASSET_KEYS.badge).setScale(0.84);

    this.add
      .text(width / 2, height * 0.47, 'Calibrate the floor, collect machine cores, and keep the shift stable.', {
        align: 'center',
        color: '#d6e3f2',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '22px',
        wordWrap: { width: 620 },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.61, 'Move with WASD or the arrow keys.\nHit the score target before the timer closes.', {
        align: 'center',
        color: '#8aa4bf',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '18px',
        lineSpacing: 10,
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(width / 2, height * 0.79, 'Press SPACE, ENTER, or click to start', {
        color: '#f59e0b',
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
}
