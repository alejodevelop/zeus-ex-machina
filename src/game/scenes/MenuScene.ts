import Phaser from 'phaser';

import { SceneKey } from './scene-keys';

export class MenuScene extends Phaser.Scene {
  private starting = false;

  constructor() {
    super(SceneKey.Menu);
  }

  public create(): void {
    const { width, height } = this.scale;

    this.starting = false;

    this.cameras.main.fadeIn(350, 0, 0, 0);

    this.add
      .text(width / 2, height * 0.44, 'GAME JAM', {
        color: '#17324a',
        fontFamily: 'Palatino Linotype, Book Antiqua, Georgia, serif',
        fontSize: '58px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(width / 2, height * 0.62, 'Oprime cualquier boton para continuar', {
        color: '#8b5b34',
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
      if (this.starting) {
        return;
      }

      this.starting = true;
      this.input.off('pointerdown', startRun);
      this.input.keyboard?.off('keydown', startRun);
      this.cameras.main.fadeOut(220, 0, 0, 0);
      this.time.delayedCall(220, () => {
        this.scene.start(SceneKey.Game);
      });
    };

    this.input.on('pointerdown', startRun);
    this.input.keyboard?.on('keydown', startRun);
  }
}
