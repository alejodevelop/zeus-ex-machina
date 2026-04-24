import Phaser from 'phaser';

import type { AgentLaunchOptions } from './launch-options';

export interface GameDebugGameplayPlayerState {
  canDash: boolean;
  dashCooldownRemainingMs: number;
  heldItem: 'dead-battery' | 'fresh-battery' | null;
  isDashing: boolean;
  isMoving: boolean;
  nearbyTarget: 'battery-supply' | 'discard-bin' | 'machine' | null;
  x: number;
  y: number;
}

export interface GameDebugBatteryTaskState {
  completed: boolean;
  machineState: 'dead-installed' | 'empty' | 'fresh-installed';
  objective: 'complete' | 'discard-dead-battery' | 'grab-fresh-battery' | 'install-fresh-battery' | 'remove-dead-battery';
}

export interface GameDebugGameplayState {
  batteryTask: GameDebugBatteryTaskState | null;
  bounds: {
    maxX: number;
    maxY: number;
    minX: number;
    minY: number;
  } | null;
  player: GameDebugGameplayPlayerState | null;
  ready: boolean;
}

export interface GameDebugSnapshot {
  activeScene: string | null;
  activeScenes: string[];
  canvas: {
    backingHeight: number;
    backingWidth: number;
    clientHeight: number;
    clientWidth: number;
    dpr: number;
  };
  fps: number;
  pointer: {
      isDown: boolean;
      x: number;
      y: number;
    } | null;
  gameplay: GameDebugGameplayState | null;
}

interface GameDebugController {
  focusCanvas(): boolean;
  getSnapshot(): GameDebugSnapshot;
  listScenes(): string[];
  restartActiveScene(): boolean;
  startScene(sceneKey: string): boolean;
}

interface AgentHud {
  destroy(): void;
  update(snapshot: GameDebugSnapshot): void;
}

declare global {
  interface Window {
    __gameDebug?: GameDebugController;
  }
}

export function installGameDebug(game: Phaser.Game, options: AgentLaunchOptions): () => void {
  if (!options.enabled) {
    return () => undefined;
  }

  decorateCanvas(game);

  const controller: GameDebugController = {
    focusCanvas: () => focusCanvas(game),
    getSnapshot: () => readSnapshot(game),
    listScenes: () => listSceneKeys(game),
    restartActiveScene: () => restartActiveScene(game),
    startScene: (sceneKey: string) => startScene(game, sceneKey),
  };
  const hud = options.showHud ? createAgentHud(controller) : null;
  const updateHud = (): void => {
    hud?.update(controller.getSnapshot());
  };

  window.__gameDebug = controller;
  updateHud();
  focusCanvas(game);

  game.events.on(Phaser.Core.Events.POST_STEP, updateHud);

  return () => {
    game.events.off(Phaser.Core.Events.POST_STEP, updateHud);
    hud?.destroy();

    if (window.__gameDebug === controller) {
      delete window.__gameDebug;
    }
  };
}

function createAgentHud(controller: GameDebugController): AgentHud {
  const root = document.createElement('aside');
  root.id = 'agent-tools-root';
  root.className = 'agent-hud';
  root.setAttribute('data-testid', 'agent-hud');
  root.innerHTML = [
    '<div class="agent-hud__title-row">',
    '  <div>',
    '    <p class="agent-hud__eyebrow">Local Agent Tools</p>',
    '    <h2 class="agent-hud__title">Visual Checkpoint</h2>',
    '  </div>',
    '  <span class="agent-hud__badge">dev only</span>',
    '</div>',
    '<dl class="agent-hud__grid">',
    '  <div class="agent-hud__stat">',
    '    <dt>Scene</dt>',
    '    <dd data-testid="agent-scene-value">-</dd>',
    '  </div>',
    '  <div class="agent-hud__stat">',
    '    <dt>FPS</dt>',
    '    <dd data-testid="agent-fps-value">-</dd>',
    '  </div>',
    '  <div class="agent-hud__stat">',
    '    <dt>Pointer</dt>',
    '    <dd data-testid="agent-pointer-value">-</dd>',
    '  </div>',
    '  <div class="agent-hud__stat">',
    '    <dt>Canvas</dt>',
    '    <dd data-testid="agent-canvas-value">-</dd>',
    '  </div>',
    '</dl>',
    '<div class="agent-hud__actions">',
    '  <div class="agent-hud__actions-group" data-testid="agent-scene-actions"></div>',
    '  <div class="agent-hud__actions-group" data-testid="agent-utility-actions"></div>',
    '</div>',
  ].join('');

  const sceneActions = root.querySelector<HTMLElement>('[data-testid="agent-scene-actions"]');
  const utilityActions = root.querySelector<HTMLElement>('[data-testid="agent-utility-actions"]');
  const sceneValue = root.querySelector<HTMLElement>('[data-testid="agent-scene-value"]');
  const fpsValue = root.querySelector<HTMLElement>('[data-testid="agent-fps-value"]');
  const pointerValue = root.querySelector<HTMLElement>('[data-testid="agent-pointer-value"]');
  const canvasValue = root.querySelector<HTMLElement>('[data-testid="agent-canvas-value"]');

  if (!sceneActions || !utilityActions || !sceneValue || !fpsValue || !pointerValue || !canvasValue) {
    throw new Error('Agent HUD failed to render.');
  }

  const sceneButtons = new Map<string, HTMLButtonElement>();

  const restartButton = document.createElement('button');
  restartButton.type = 'button';
  restartButton.className = 'agent-hud__button agent-hud__button--secondary';
  restartButton.setAttribute('data-testid', 'agent-action-restart');
  restartButton.textContent = 'restart';
  restartButton.addEventListener('click', () => {
    controller.restartActiveScene();
  });
  utilityActions.append(restartButton);

  const focusButton = document.createElement('button');
  focusButton.type = 'button';
  focusButton.className = 'agent-hud__button agent-hud__button--secondary';
  focusButton.setAttribute('data-testid', 'agent-action-focus');
  focusButton.textContent = 'focus';
  focusButton.addEventListener('click', () => {
    controller.focusCanvas();
  });
  utilityActions.append(focusButton);

  document.body.append(root);

  const syncSceneButtons = (): void => {
    const sceneKeys = buildHudSceneList(controller.listScenes());

    for (const [sceneKey, button] of sceneButtons) {
      if (sceneKeys.includes(sceneKey)) {
        continue;
      }

      button.remove();
      sceneButtons.delete(sceneKey);
    }

    for (const sceneKey of sceneKeys) {
      if (sceneButtons.has(sceneKey)) {
        continue;
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'agent-hud__button';
      button.setAttribute('data-testid', `agent-scene-${sceneKey}`);
      button.textContent = sceneKey;
      button.addEventListener('click', () => {
        controller.startScene(sceneKey);
      });
      sceneButtons.set(sceneKey, button);
      sceneActions.append(button);
    }
  };

  syncSceneButtons();

  return {
    destroy() {
      root.remove();
    },
    update(snapshot) {
      syncSceneButtons();
      sceneValue.textContent = snapshot.activeScene ?? 'none';
      fpsValue.textContent = `${Math.round(snapshot.fps)} fps`;
      pointerValue.textContent = snapshot.gameplay?.batteryTask
        ? `${snapshot.gameplay.batteryTask.objective}${snapshot.gameplay.player?.heldItem ? ` | ${snapshot.gameplay.player.heldItem}` : ''}`
        : snapshot.pointer
            ? `${snapshot.pointer.x}, ${snapshot.pointer.y}${snapshot.pointer.isDown ? ' down' : ''}`
            : 'n/a';
      canvasValue.textContent =
        snapshot.gameplay?.player
          ? `${snapshot.gameplay.player.nearbyTarget ?? 'free'} | dash ${snapshot.gameplay.player.canDash ? 'on' : 'off'}`
          : `${snapshot.canvas.clientWidth}x${snapshot.canvas.clientHeight} css | ${snapshot.canvas.backingWidth}x${snapshot.canvas.backingHeight} px`;
    },
  };
}

function buildHudSceneList(sceneKeys: string[]): string[] {
  const preferredSceneKeys = sceneKeys.filter((sceneKey) => sceneKey !== 'boot' && sceneKey !== 'preload');

  return preferredSceneKeys.length > 0 ? preferredSceneKeys : sceneKeys;
}

function decorateCanvas(game: Phaser.Game): void {
  const canvas = game.canvas;

  if (!canvas) {
    return;
  }

  canvas.setAttribute('aria-label', 'Game canvas');
  canvas.setAttribute('data-testid', 'game-canvas');

  if (canvas.tabIndex < 0) {
    canvas.tabIndex = 0;
  }
}

function focusCanvas(game: Phaser.Game): boolean {
  const canvas = game.canvas;

  if (!canvas) {
    return false;
  }

  decorateCanvas(game);
  canvas.focus();

  return true;
}

function getActiveScene(game: Phaser.Game): Phaser.Scene | null {
  const activeScenes = game.scene.scenes.filter((scene) => scene.sys.isActive());

  return activeScenes.at(-1) ?? null;
}

function listSceneKeys(game: Phaser.Game): string[] {
  return game.scene.scenes.map((scene) => scene.sys.settings.key);
}

function readSnapshot(game: Phaser.Game): GameDebugSnapshot {
  const canvas = game.canvas;
  const activeScenes = game.scene.scenes.filter((scene) => scene.sys.isActive());
  const activeScene = activeScenes.at(-1) ?? null;
  const bounds = canvas?.getBoundingClientRect();
  const pointer = activeScene?.input.activePointer;

  return {
    activeScene: activeScene?.sys.settings.key ?? null,
    activeScenes: activeScenes.map((scene) => scene.sys.settings.key),
    canvas: {
      backingHeight: canvas?.height ?? 0,
      backingWidth: canvas?.width ?? 0,
      clientHeight: Math.round(bounds?.height ?? 0),
      clientWidth: Math.round(bounds?.width ?? 0),
      dpr: window.devicePixelRatio,
    },
    fps: game.loop.actualFps,
    pointer: pointer
      ? {
          isDown: pointer.isDown,
          x: Math.round(pointer.x),
          y: Math.round(pointer.y),
        }
      : null,
    gameplay: readGameplayDebugState(activeScene),
  };
}

function readGameplayDebugState(scene: Phaser.Scene | null): GameDebugSnapshot['gameplay'] {
  const provider = scene as (Phaser.Scene & {
    getDebugState?: () => GameDebugSnapshot['gameplay'];
  }) | null;

  if (!provider || typeof provider.getDebugState !== 'function') {
    return null;
  }

  return provider.getDebugState();
}

function restartActiveScene(game: Phaser.Game): boolean {
  const activeScene = getActiveScene(game);

  if (!activeScene) {
    return false;
  }

  activeScene.scene.restart();

  return true;
}

function startScene(game: Phaser.Game, sceneKey: string): boolean {
  if (!listSceneKeys(game).includes(sceneKey)) {
    return false;
  }

  const activeScene = getActiveScene(game);

  if (activeScene) {
    activeScene.scene.start(sceneKey);
  } else {
    game.scene.start(sceneKey);
  }

  focusCanvas(game);

  return true;
}
