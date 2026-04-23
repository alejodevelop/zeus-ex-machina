import Phaser from 'phaser';

import { agentLaunchOptions } from '../../agent/session';
import { SceneKey } from './scene-keys';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Preload);
  }

  public preload(): void {
    this.cameras.main.setBackgroundColor('#efe6d8');
  }

  public create(): void {
    this.scene.start(agentLaunchOptions.startScene ?? SceneKey.Menu);
  }
}
