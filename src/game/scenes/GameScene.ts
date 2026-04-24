import Phaser from 'phaser';

import { ASSET_KEYS } from '../assets';
import { advancePosition, type MovementBounds, type MovementInputState } from '../movement';
import { SceneKey } from './scene-keys';

interface GameSceneDebugState {
  bounds: MovementBounds | null;
  player: {
    isMoving: boolean;
    x: number;
    y: number;
  } | null;
  ready: boolean;
}

type MovementKeyMap = Record<'down' | 'left' | 'right' | 'up', Phaser.Input.Keyboard.Key>;

const PLAYER_RADIUS = 24;
const PLAYER_SPEED = 240;

export class GameScene extends Phaser.Scene {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private debugState: GameSceneDebugState = {
    bounds: null,
    player: null,
    ready: false,
  };
  private leaving = false;
  private movementKeys?: MovementKeyMap;
  private playBounds: MovementBounds | null = null;
  private player?: Phaser.GameObjects.Image;
  private playerShadow?: Phaser.GameObjects.Ellipse;

  constructor() {
    super(SceneKey.Game);
  }

  public create(): void {
    const { width, height } = this.scale;
    const room = new Phaser.Geom.Rectangle(48, 44, width - 96, height - 88);
    const walkArea = new Phaser.Geom.Rectangle(room.x + 74, room.y + 90, room.width - 148, room.height - 172);
    const spawnPoint = {
      x: walkArea.x + walkArea.width / 2,
      y: walkArea.y + walkArea.height / 2,
    };

    this.leaving = false;
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.movementKeys = this.input.keyboard?.addKeys({
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W,
    }) as MovementKeyMap | undefined;
    this.playBounds = {
      minX: walkArea.x + PLAYER_RADIUS,
      maxX: walkArea.x + walkArea.width - PLAYER_RADIUS,
      minY: walkArea.y + PLAYER_RADIUS,
      maxY: walkArea.y + walkArea.height - PLAYER_RADIUS,
    };

    this.cameras.main.fadeIn(260, 0, 0, 0);
    this.cameras.main.setBackgroundColor('#ead8bf');

    renderPrototypeRoom(this, room, walkArea);

    this.playerShadow = this.add.ellipse(spawnPoint.x, spawnPoint.y + 18, 44, 18, 0x31190c, 0.16).setDepth(4);
    this.player = this.add.image(spawnPoint.x, spawnPoint.y, ASSET_KEYS.player).setDepth(5);

    const backButton = this.add
      .text(room.x + room.width - 28, room.y + 28, 'Menu [Esc]', {
        backgroundColor: '#17324a',
        color: '#fff9f0',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        padding: { bottom: 10, left: 16, right: 16, top: 10 },
      })
      .setDepth(10)
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });

    backButton.on('pointerover', () => {
      backButton.setStyle({
        backgroundColor: '#274864',
        color: '#fff3dc',
      });
    });

    backButton.on('pointerout', () => {
      backButton.setStyle({
        backgroundColor: '#17324a',
        color: '#fff9f0',
      });
    });

    backButton.on('pointerup', () => {
      this.leaveToMenu();
    });

    this.input.keyboard?.once('keydown-ESC', () => {
      this.leaveToMenu();
    });
    this.input.keyboard?.once('keydown-M', () => {
      this.leaveToMenu();
    });

    this.syncDebugState(false);
  }

  public update(_time: number, delta: number): void {
    if (!this.player || !this.playBounds) {
      return;
    }

    const step = advancePosition(
      { x: this.player.x, y: this.player.y },
      this.readMovementInput(),
      PLAYER_SPEED,
      delta,
      this.playBounds,
    );

    this.player.setPosition(step.nextPosition.x, step.nextPosition.y);
    this.player.setScale(step.isMoving ? 1.02 : 1);
    this.playerShadow?.setPosition(step.nextPosition.x, step.nextPosition.y + 18);
    this.playerShadow?.setAlpha(step.isMoving ? 0.22 : 0.16);
    this.syncDebugState(step.isMoving);
  }

  public getDebugState(): GameSceneDebugState {
    return {
      bounds: this.debugState.bounds ? { ...this.debugState.bounds } : null,
      player: this.debugState.player ? { ...this.debugState.player } : null,
      ready: this.debugState.ready,
    };
  }

  private leaveToMenu(): void {
    if (this.leaving) {
      return;
    }

    this.leaving = true;
    this.debugState = {
      ...this.debugState,
      ready: false,
    };
    this.cameras.main.fadeOut(180, 0, 0, 0);
    this.time.delayedCall(180, () => {
      this.scene.start(SceneKey.Menu);
    });
  }

  private readMovementInput(): MovementInputState {
    return {
      down: Boolean(this.cursors?.down.isDown || this.movementKeys?.down.isDown),
      left: Boolean(this.cursors?.left.isDown || this.movementKeys?.left.isDown),
      right: Boolean(this.cursors?.right.isDown || this.movementKeys?.right.isDown),
      up: Boolean(this.cursors?.up.isDown || this.movementKeys?.up.isDown),
    };
  }

  private syncDebugState(isMoving: boolean): void {
    this.debugState = {
      bounds: this.playBounds ? { ...this.playBounds } : null,
      player: this.player
        ? {
            isMoving,
            x: roundTo(this.player.x),
            y: roundTo(this.player.y),
          }
        : null,
      ready: Boolean(this.player && this.playBounds),
    };
  }
}

function renderPrototypeRoom(scene: Phaser.Scene, room: Phaser.Geom.Rectangle, walkArea: Phaser.Geom.Rectangle): void {
  const backdrop = scene.add.graphics();
  const centerX = room.x + room.width / 2;
  const centerY = room.y + room.height / 2;

  backdrop.fillStyle(0xcaab83, 0.24);
  backdrop.fillRoundedRect(room.x + 10, room.y + 14, room.width, room.height, 34);
  backdrop.fillStyle(0xfffbf6, 0.98);
  backdrop.fillRoundedRect(room.x, room.y, room.width, room.height, 34);
  backdrop.lineStyle(3, 0x27455d, 0.18);
  backdrop.strokeRoundedRect(room.x, room.y, room.width, room.height, 34);

  backdrop.fillStyle(0xf0dfc9, 1);
  backdrop.fillRoundedRect(room.x + 18, room.y + 18, room.width - 36, room.height - 36, 26);
  backdrop.fillStyle(0xf8f0e4, 1);
  backdrop.fillRoundedRect(walkArea.x - 24, walkArea.y - 22, walkArea.width + 48, walkArea.height + 44, 24);
  backdrop.lineStyle(2, 0xffffff, 0.32);
  backdrop.strokeRoundedRect(walkArea.x - 24, walkArea.y - 22, walkArea.width + 48, walkArea.height + 44, 24);

  backdrop.lineStyle(1, 0x31526a, 0.08);

  for (let x = walkArea.x - 8; x <= walkArea.x + walkArea.width + 8; x += 48) {
    backdrop.lineBetween(x, walkArea.y - 18, x, walkArea.y + walkArea.height + 18);
  }

  for (let y = walkArea.y - 18; y <= walkArea.y + walkArea.height + 18; y += 48) {
    backdrop.lineBetween(walkArea.x - 8, y, walkArea.x + walkArea.width + 8, y);
  }

  scene.add.image(centerX, centerY, ASSET_KEYS.emblem).setDepth(1).setAlpha(0.06).setScale(1.14);
  scene.add.rectangle(centerX, centerY, 156, 156, 0xffffff, 0.22).setDepth(1).setStrokeStyle(2, 0x27455d, 0.08);
  scene.add.rectangle(centerX, centerY, 88, 88, 0xffffff, 0.28).setDepth(1).setStrokeStyle(2, 0x27455d, 0.1);

  scene.add
    .text(room.x + 34, room.y + 30, 'MOVEMENT PROTOTYPE', {
      color: '#17324a',
      fontFamily: 'Palatino Linotype, Book Antiqua, Georgia, serif',
      fontSize: '34px',
      fontStyle: 'bold',
    })
    .setDepth(2)
    .setOrigin(0, 0.5);

  scene.add
    .text(room.x + 34, room.y + 62, 'Single screen, top-down camera, free movement in X and Y.', {
      color: '#5d6f7c',
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: '16px',
    })
    .setDepth(2)
    .setOrigin(0, 0.5);

  scene.add
    .text(room.x + room.width / 2, room.y + 30, 'WASD or arrow keys', {
      backgroundColor: '#fff5e7',
      color: '#8b5b34',
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      padding: { bottom: 8, left: 14, right: 14, top: 8 },
    })
    .setDepth(2)
    .setOrigin(0.5);

  scene.add
    .text(room.x + 34, room.y + room.height - 28, 'Current scope: move freely inside a single room.', {
      color: '#6a7b88',
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: '14px',
    })
    .setDepth(2)
    .setOrigin(0, 0.5);
}

function roundTo(value: number): number {
  return Math.round(value * 100) / 100;
}
