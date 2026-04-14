import Phaser from 'phaser';

import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { PreloadScene } from './scenes/PreloadScene';
import { UiScene } from './scenes/UiScene';

export const GAME_HEIGHT = 540;
export const GAME_WIDTH = 960;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  backgroundColor: '#050b13',
  input: {
    gamepad: true,
  },
  parent: 'game',
  physics: {
    arcade: {
      debug: false,
      gravity: {
        x: 0,
        y: 0,
      },
    },
    default: 'arcade',
  },
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
  scene: [BootScene, PreloadScene, MenuScene, GameScene, UiScene],
  type: Phaser.AUTO,
};
