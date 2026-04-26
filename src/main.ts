import Phaser from 'phaser';

import { installGameDebug } from './agent/debug';
import { agentLaunchOptions } from './agent/session';
import './styles.css';
import { gameConfig } from './game/config';

const game = new Phaser.Game(gameConfig);
const cleanupGameDebug = installGameDebug(game, agentLaunchOptions);
const cleanupFullscreenUi = installFullscreenUi(game);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanupFullscreenUi();
    cleanupGameDebug();
    game.destroy(true);
  });
}

function installFullscreenUi(game: Phaser.Game): () => void {
  const fullscreenButton = document.getElementById('fullscreen-toggle');

  if (!(fullscreenButton instanceof HTMLButtonElement)) {
    return () => undefined;
  }

  const handleToggle = (): void => {
    if (!game.scale.fullscreen.available) {
      return;
    }

    game.scale.toggleFullscreen({ navigationUI: 'hide' });
  };

  const syncFullscreenButton = (): void => {
    const isFullscreen = game.scale.isFullscreen;
    const supported = game.scale.fullscreen.available;

    fullscreenButton.disabled = !supported;
    fullscreenButton.hidden = !supported;
    fullscreenButton.setAttribute(
      'aria-label',
      isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen',
    );
    fullscreenButton.setAttribute('aria-pressed', String(isFullscreen));
    fullscreenButton.dataset.fullscreenState = isFullscreen ? 'on' : 'off';
    document.body.classList.toggle('is-fullscreen', isFullscreen);
  };

  fullscreenButton.addEventListener('click', handleToggle);
  game.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, syncFullscreenButton);
  game.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, syncFullscreenButton);
  game.scale.on(Phaser.Scale.Events.FULLSCREEN_UNSUPPORTED, syncFullscreenButton);
  game.scale.on(Phaser.Scale.Events.FULLSCREEN_FAILED, syncFullscreenButton);
  syncFullscreenButton();

  return () => {
    fullscreenButton.removeEventListener('click', handleToggle);
    game.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, syncFullscreenButton);
    game.scale.off(Phaser.Scale.Events.LEAVE_FULLSCREEN, syncFullscreenButton);
    game.scale.off(Phaser.Scale.Events.FULLSCREEN_UNSUPPORTED, syncFullscreenButton);
    game.scale.off(Phaser.Scale.Events.FULLSCREEN_FAILED, syncFullscreenButton);
    document.body.classList.remove('is-fullscreen');
  };
}
