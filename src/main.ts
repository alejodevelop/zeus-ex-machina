import Phaser from 'phaser';

import { installGameDebug } from './agent/debug';
import { agentLaunchOptions } from './agent/session';
import './styles.css';
import { gameConfig } from './game/config';

const game = new Phaser.Game(gameConfig);
const cleanupGameDebug = installGameDebug(game, agentLaunchOptions);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanupGameDebug();
    game.destroy(true);
  });
}
