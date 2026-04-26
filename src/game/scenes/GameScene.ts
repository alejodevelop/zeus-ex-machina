import Phaser from 'phaser';

import type { GameDebugGameplayState } from '../../agent/debug';
import { ASSET_KEYS } from '../assets';
import {
  ROUTE_SANDBOX_OBSTACLES,
  ObstacleOrientationId,
  ObstaclePrefabId,
  advanceObstacleSandboxState,
  createObstacleSandboxState,
  getActiveObstacleBlockers,
  getObstacleSizeLabel,
  getObstacleTypeLabel,
  getRouteHintLabel,
  resolveObstacleFrame,
  type ObstacleFrame,
  type ObstacleInstance,
  type ObstacleSandboxState,
} from '../obstacles';
import {
  advancePosition,
  createDashState,
  type DashState,
  type MovementBounds,
  type MovementInputState,
  type MovementStep,
} from '../movement';
import { constrainPointToBlockers, isPointBlockedByBlockers } from '../traversal-blockers';
import { SceneKey } from './scene-keys';

type GameSceneDebugState = GameDebugGameplayState;
type MovementKeyMap = Record<'down' | 'left' | 'right' | 'up', Phaser.Input.Keyboard.Key>;
type ObstacleVisualMap = Record<string, Phaser.GameObjects.Image>;

interface RenderedRoom {
  obstacleLabelMap: Record<string, Phaser.GameObjects.Text>;
  obstacleVisuals: ObstacleVisualMap;
}

const PLAYER_BOUNDS_RADIUS = 24;
const PLAYER_COLLISION_RADIUS = 14;
const PLAYER_SPEED = 240;

export class GameScene extends Phaser.Scene {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private dashQueued = false;
  private dashState: DashState = createDashState();
  private debugState: GameSceneDebugState = {
    batteryTask: null,
    bounds: null,
    cracksTask: null,
    intelligenceTask: null,
    obstacleSandbox: null,
    oilingTask: null,
    player: null,
    ready: false,
  };
  private movementKeys?: MovementKeyMap;
  private obstacleFrame: ObstacleFrame = resolveObstacleFrame(createObstacleSandboxState(), ROUTE_SANDBOX_OBSTACLES);
  private obstacleHintBanner?: Phaser.GameObjects.Text;
  private obstacleLabelMap: Record<string, Phaser.GameObjects.Text> = {};
  private obstacleSandboxState: ObstacleSandboxState = createObstacleSandboxState();
  private obstacleStatusBanner?: Phaser.GameObjects.Text;
  private obstacleVisuals: ObstacleVisualMap = {};
  private objectiveBanner?: Phaser.GameObjects.Text;
  private playBounds: MovementBounds | null = null;
  private player?: Phaser.GameObjects.Image;
  private playerShadow?: Phaser.GameObjects.Ellipse;

  constructor() {
    super(SceneKey.Game);
  }

  public create(): void {
    const { width, height } = this.scale;
    const room = new Phaser.Geom.Rectangle(48, 44, width - 96, height - 88);
    const walkArea = new Phaser.Geom.Rectangle(room.x + 70, room.y + 96, room.width - 140, room.height - 182);

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.dashQueued = false;
    this.dashState = createDashState();
    this.movementKeys = this.input.keyboard?.addKeys({
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W,
    }) as MovementKeyMap | undefined;
    this.playBounds = {
      minX: walkArea.x + PLAYER_BOUNDS_RADIUS,
      maxX: walkArea.x + walkArea.width - PLAYER_BOUNDS_RADIUS,
      minY: walkArea.y + PLAYER_BOUNDS_RADIUS,
      maxY: walkArea.y + walkArea.height - PLAYER_BOUNDS_RADIUS,
    };
    this.obstacleSandboxState = createObstacleSandboxState();
    this.obstacleFrame = resolveObstacleFrame(this.obstacleSandboxState, ROUTE_SANDBOX_OBSTACLES);
    const spawnPoint = resolveSafeSpawnPoint(
      walkArea,
      getActiveObstacleBlockers(this.obstacleFrame.instances),
      PLAYER_COLLISION_RADIUS,
    );

    this.cameras.main.fadeIn(260, 0, 0, 0);
    this.cameras.main.setBackgroundColor('#dfd3be');

    const renderedRoom = renderWallSandbox(this, room, walkArea, this.obstacleFrame.instances);

    this.obstacleVisuals = renderedRoom.obstacleVisuals;
    this.obstacleLabelMap = renderedRoom.obstacleLabelMap;
    this.playerShadow = this.add.ellipse(spawnPoint.x, spawnPoint.y + 18, 44, 18, 0x31190c, 0.16).setDepth(11);
    this.player = this.add.image(spawnPoint.x, spawnPoint.y, ASSET_KEYS.player).setDepth(12);
    this.objectiveBanner = this.add
      .text(room.x + room.width / 2, room.y + 68, '', {
        color: '#17324a',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
      })
      .setDepth(14)
      .setOrigin(0.5);
    this.obstacleStatusBanner = this.add
      .text(room.x + room.width / 2, room.y + 92, '', {
        color: '#6c553f',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setDepth(14)
      .setOrigin(0.5);
    this.obstacleHintBanner = this.add
      .text(room.x + room.width / 2, room.y + room.height - 30, '', {
        backgroundColor: '#17324a',
        color: '#fff9f0',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        padding: { bottom: 7, left: 12, right: 12, top: 7 },
      })
      .setDepth(14)
      .setOrigin(0.5);

    this.input.keyboard?.on('keydown-SHIFT', this.queueDash, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-SHIFT', this.queueDash, this);
    });

    this.refreshScenePresentation();
    this.syncDebugState({
      dashState: this.dashState,
      dashTriggered: false,
      direction: { x: 0, y: 0 },
      isMoving: false,
      nextPosition: spawnPoint,
      velocity: { x: 0, y: 0 },
    });
  }

  public update(_time: number, delta: number): void {
    if (!this.player || !this.playBounds) {
      return;
    }

    this.obstacleSandboxState = advanceObstacleSandboxState(this.obstacleSandboxState, delta);
    this.obstacleFrame = resolveObstacleFrame(this.obstacleSandboxState, ROUTE_SANDBOX_OBSTACLES);

    const previousPosition = { x: this.player.x, y: this.player.y };
    const step = advancePosition(
      previousPosition,
      this.readMovementInput(),
      PLAYER_SPEED,
      delta,
      this.playBounds,
      this.dashState,
    );
    const constrained = constrainPointToBlockers(
      previousPosition,
      step.nextPosition,
      PLAYER_COLLISION_RADIUS,
      getActiveObstacleBlockers(this.obstacleFrame.instances),
    );
    const adjustedStep: MovementStep = {
      ...step,
      isMoving: constrained.x !== previousPosition.x || constrained.y !== previousPosition.y,
      nextPosition: constrained,
    };

    this.dashState = adjustedStep.dashState;
    this.player.setPosition(adjustedStep.nextPosition.x, adjustedStep.nextPosition.y);
    this.player.setScale(adjustedStep.dashState.isDashing ? 1.12 : adjustedStep.isMoving ? 1.02 : 1);
    this.playerShadow?.setPosition(adjustedStep.nextPosition.x, adjustedStep.nextPosition.y + 18);
    this.playerShadow?.setScale(adjustedStep.dashState.isDashing ? 1.18 : 1, adjustedStep.dashState.isDashing ? 0.84 : 1);
    this.playerShadow?.setAlpha(adjustedStep.dashState.isDashing ? 0.28 : adjustedStep.isMoving ? 0.22 : 0.16);

    this.refreshScenePresentation();
    this.syncDebugState(adjustedStep);
  }

  public getDebugState(): GameSceneDebugState {
    return {
      batteryTask: null,
      bounds: this.debugState.bounds ? { ...this.debugState.bounds } : null,
      cracksTask: null,
      intelligenceTask: null,
      obstacleSandbox: this.debugState.obstacleSandbox ? { ...this.debugState.obstacleSandbox } : null,
      oilingTask: null,
      player: this.debugState.player ? { ...this.debugState.player } : null,
      ready: this.debugState.ready,
    };
  }

  private queueDash(event: KeyboardEvent): void {
    if (event.repeat) {
      return;
    }

    this.dashQueued = true;
  }

  private readMovementInput(): MovementInputState {
    const dashPressed = this.dashQueued;

    this.dashQueued = false;

    return {
      dashPressed,
      down: Boolean(this.cursors?.down.isDown || this.movementKeys?.down.isDown),
      left: Boolean(this.cursors?.left.isDown || this.movementKeys?.left.isDown),
      right: Boolean(this.cursors?.right.isDown || this.movementKeys?.right.isDown),
      up: Boolean(this.cursors?.up.isDown || this.movementKeys?.up.isDown),
    };
  }

  private refreshObstacleVisuals(): void {
    for (const obstacle of this.obstacleFrame.instances) {
      const sprite = this.obstacleVisuals[obstacle.id];
      const label = this.obstacleLabelMap[obstacle.id];

      if (!sprite || !label) {
        continue;
      }

      sprite.setTexture(getObstacleTexture(obstacle));
      sprite.setPosition(obstacle.x, obstacle.y);
      sprite.setAngle(obstacle.angle);
      const displaySize = getWallDisplaySize(obstacle);
      sprite.setDisplaySize(displaySize.width, displaySize.height);
      sprite.setAlpha(1);
      label.setPosition(obstacle.x + obstacle.labelOffsetX, obstacle.y + getObstacleLabelOffset(obstacle));
      label.setAlpha(0.82);
      label.setText(getObstacleLabel(obstacle));
    }
  }

  private refreshScenePresentation(): void {
    this.objectiveBanner?.setText('Straight wall sandbox');
    this.obstacleStatusBanner?.setText(
      `${getRouteHintLabel(this.obstacleFrame.summary.routeHint)}  •  ${this.obstacleFrame.summary.obstacleCount} walls shaping simple routes`,
    );
    this.obstacleHintBanner?.setText('Test collision, sliding, and dash stops against straight walls');
    this.refreshObstacleVisuals();
  }

  private syncDebugState(step: MovementStep): void {
    this.debugState = {
      batteryTask: null,
      bounds: this.playBounds ? { ...this.playBounds } : null,
      cracksTask: null,
      intelligenceTask: null,
      obstacleSandbox: {
        activeBlockerCount: this.obstacleFrame.summary.activeBlockerCount,
        obstacleCount: this.obstacleFrame.summary.obstacleCount,
        routeHint: this.obstacleFrame.summary.routeHint,
      },
      oilingTask: null,
      player: this.player
        ? {
            canDash: true,
            dashCooldownRemainingMs: Math.round(step.dashState.cooldownRemainingMs),
            heldItem: null,
            isDashing: step.dashState.isDashing,
            isMoving: step.isMoving,
            nearbyTarget: null,
            x: roundTo(this.player.x),
            y: roundTo(this.player.y),
          }
        : null,
      ready: Boolean(this.player && this.playBounds),
    };
  }
}

function createWallSprite(scene: Phaser.Scene, obstacle: ObstacleInstance): Phaser.GameObjects.Image {
  const sprite = scene.add.image(obstacle.x, obstacle.y, getObstacleTexture(obstacle)).setDepth(6);
  const displaySize = getWallDisplaySize(obstacle);

  sprite.setDisplaySize(displaySize.width, displaySize.height);

  return sprite;
}

function getObstacleLabel(obstacle: ObstacleInstance): string {
  return `${getObstacleTypeLabel(obstacle.prefabId)}  •  ${getObstacleSizeLabel(obstacle.size)}  •  ${obstacle.orientation}`;
}

function getObstacleLabelOffset(obstacle: ObstacleInstance): number {
  return obstacle.labelOffsetY;
}

function getObstacleTexture(obstacle: ObstacleInstance): string {
  switch (obstacle.prefabId) {
    case ObstaclePrefabId.StraightWall:
      return obstacle.orientation === ObstacleOrientationId.Vertical
        ? ASSET_KEYS.obstacleStraightWallVertical
        : ASSET_KEYS.obstacleStraightWallHorizontal;
  }
}

function renderWallSandbox(
  scene: Phaser.Scene,
  room: Phaser.Geom.Rectangle,
  walkArea: Phaser.Geom.Rectangle,
  obstacles: ObstacleInstance[],
): RenderedRoom {
  const backdrop = scene.add.graphics();
  const centerX = room.x + room.width / 2;
  const centerY = room.y + room.height / 2;

  backdrop.fillStyle(0xb89f82, 0.24);
  backdrop.fillRoundedRect(room.x + 10, room.y + 14, room.width, room.height, 34);
  backdrop.fillStyle(0xfffbf5, 0.98);
  backdrop.fillRoundedRect(room.x, room.y, room.width, room.height, 34);
  backdrop.lineStyle(3, 0x27455d, 0.18);
  backdrop.strokeRoundedRect(room.x, room.y, room.width, room.height, 34);
  backdrop.fillStyle(0xecdec6, 1);
  backdrop.fillRoundedRect(room.x + 18, room.y + 18, room.width - 36, room.height - 36, 26);
  backdrop.fillStyle(0xf7efe3, 1);
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

  backdrop.lineStyle(6, 0x17324a, 0.06);
  backdrop.lineBetween(room.x + 132, room.y + 146, room.x + room.width - 132, room.y + 146);
  backdrop.lineBetween(centerX, room.y + 118, centerX, room.y + room.height - 126);
  backdrop.lineBetween(room.x + 154, centerY + 50, room.x + room.width - 154, centerY + 50);
  backdrop.fillStyle(0xffffff, 0.16);
  backdrop.fillCircle(centerX, centerY - 4, 36);
  backdrop.fillCircle(centerX, centerY - 4, 16);

  scene.add.image(centerX, centerY, ASSET_KEYS.emblem).setDepth(1).setAlpha(0.06).setScale(1.14);
  scene.add.rectangle(centerX, centerY, 168, 168, 0xffffff, 0.22).setDepth(1).setStrokeStyle(2, 0x27455d, 0.08);
  scene.add.rectangle(centerX, centerY, 96, 96, 0xffffff, 0.28).setDepth(1).setStrokeStyle(2, 0x27455d, 0.1);
  scene.add
    .text(room.x + room.width / 2, room.y + 36, 'WASD or arrow keys  •  Shift to dash  •  Collision route lab', {
      backgroundColor: '#fff5e7',
      color: '#8b5b34',
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      padding: { bottom: 8, left: 14, right: 14, top: 8 },
    })
    .setDepth(14)
    .setOrigin(0.5);

  const obstacleVisuals: ObstacleVisualMap = {};
  const obstacleLabelMap: Record<string, Phaser.GameObjects.Text> = {};

  for (const obstacle of obstacles) {
    const sprite = createWallSprite(scene, obstacle);
    const label = scene.add
      .text(obstacle.x + obstacle.labelOffsetX, obstacle.y + getObstacleLabelOffset(obstacle), getObstacleLabel(obstacle), {
        color: '#17324a',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setDepth(13)
      .setOrigin(0.5);

    obstacleVisuals[obstacle.id] = sprite;
    obstacleLabelMap[obstacle.id] = label;
  }

  return {
    obstacleLabelMap,
    obstacleVisuals,
  };
}

function resolveSafeSpawnPoint(
  walkArea: Phaser.Geom.Rectangle,
  blockers: { height: number; width: number; x: number; y: number }[],
  collisionRadius: number,
): { x: number; y: number } {
  const candidatePoints = [
    {
      x: walkArea.x + 72,
      y: walkArea.y + walkArea.height - 34,
    },
    {
      x: walkArea.x + 88,
      y: walkArea.y + 88,
    },
    {
      x: walkArea.x + walkArea.width / 2,
      y: walkArea.y + walkArea.height - 48,
    },
    {
      x: walkArea.x + walkArea.width - 88,
      y: walkArea.y + walkArea.height - 56,
    },
  ];

  for (const point of candidatePoints) {
    if (!isPointBlockedByBlockers(point, collisionRadius, blockers)) {
      return point;
    }
  }

  return candidatePoints[0];
}

function getWallDisplaySize(obstacle: ObstacleInstance): { height: number; width: number } {
  return obstacle.orientation === ObstacleOrientationId.Vertical
    ? { height: obstacle.width, width: 44 }
    : { height: 44, width: obstacle.width };
}

function roundTo(value: number): number {
  return Math.round(value * 100) / 100;
}
