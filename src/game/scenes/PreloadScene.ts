import Phaser from 'phaser';

import { agentLaunchOptions } from '../../agent/session';
import { SceneKey } from './scene-keys';

export class PreloadScene extends Phaser.Scene {
  private barTargetWidth = 0;
  private progressFill!: Phaser.GameObjects.Rectangle;
  private progressLabel!: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKey.Preload);
  }

  public preload(): void {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#efe6d8');

    this.add
      .text(width / 2, height * 0.3, 'Preparing scaffold', {
        color: '#16324a',
        fontFamily: 'Palatino Linotype, Book Antiqua, Georgia, serif',
        fontSize: '34px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.39, 'No game-specific assets are bundled right now. Add future loads here.', {
        color: '#4f6476',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '16px',
        wordWrap: { width: 560 },
      })
      .setOrigin(0.5);

    const barFrame = this.add
      .rectangle(width / 2, height * 0.56, width * 0.46, 22, 0xf8f1e8, 0.98)
      .setStrokeStyle(2, 0x42586f, 0.7);

    this.barTargetWidth = barFrame.width - 8;

    this.progressFill = this.add
      .rectangle(barFrame.getTopLeft().x + 4, barFrame.y, 0, 12, 0xf59e0b, 1)
      .setOrigin(0, 0.5);

    this.progressLabel = this.add
      .text(width / 2, height * 0.64, 'stand by', {
        color: '#c17b45',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      this.progressFill.width = this.barTargetWidth * value;
      this.progressLabel.setText(`${Math.round(value * 100)}%`);
    });
  }

  public create(): void {
    this.progressLabel.setText('ready');

    this.tweens.add({
      duration: 220,
      ease: 'Sine.Out',
      targets: this.progressFill,
      width: this.barTargetWidth,
    });

    this.time.delayedCall(260, () => {
      this.scene.start(agentLaunchOptions.startScene ?? SceneKey.Menu);
    });
  }
}
