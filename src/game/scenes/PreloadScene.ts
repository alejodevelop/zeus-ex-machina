import Phaser from 'phaser';

import { ASSET_KEYS } from '../assets';
import { SceneKey } from './scene-keys';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Preload);
  }

  public preload(): void {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#040b13');

    this.add
      .text(width / 2, height * 0.3, 'Booting factory rig', {
        color: '#f8fafc',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '32px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.38, 'Loading the starter slice and runtime assets', {
        color: '#8aa4bf',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '16px',
      })
      .setOrigin(0.5);

    const barFrame = this.add
      .rectangle(width / 2, height * 0.56, width * 0.48, 22, 0x102033, 0.95)
      .setStrokeStyle(2, 0x243b53, 1);

    const barFill = this.add
      .rectangle(barFrame.getTopLeft().x + 4, barFrame.y, 0, 12, 0xf59e0b, 1)
      .setOrigin(0, 0.5);

    const progressLabel = this.add
      .text(width / 2, height * 0.64, '0%', {
        color: '#22d3ee',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      barFill.width = (barFrame.width - 8) * value;
      progressLabel.setText(`${Math.round(value * 100)}%`);
    });

    this.load.svg(ASSET_KEYS.badge, 'assets/images/factory-badge.svg', {
      height: 124,
      width: 406,
    });
    this.load.svg(ASSET_KEYS.gear, 'assets/images/gear-mark.svg', {
      height: 196,
      width: 196,
    });
  }

  public create(): void {
    this.scene.start(SceneKey.Menu);
  }
}
