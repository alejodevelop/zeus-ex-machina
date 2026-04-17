import Phaser from 'phaser';

import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { PreloadScene } from './scenes/PreloadScene';

export const GAME_HEIGHT = 540;
export const GAME_WIDTH = 960;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  backgroundColor: '#efe6d8',
  parent: 'game',
  render: {
    antialias: true,
    pixelArt: false,
  },
  scale: {
    autoCenter: Phaser.Scale.CENTER_BOTH,
    height: GAME_HEIGHT,
    mode: Phaser.Scale.FIT,
    width: GAME_WIDTH,
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene],
  type: Phaser.AUTO,
};
