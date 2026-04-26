import Phaser from 'phaser';

import type { GameDebugGameplayState } from '../../agent/debug';
import { ASSET_KEYS } from '../assets';
import {
  DEFAULT_INTELLIGENCE_FLOW_CONFIG,
  IntelligenceMachineStateId,
  IntelligenceStationId,
  IntelligenceStationStateId,
  advanceIntelligenceState,
  createIntelligenceFlowState,
  getIntelligenceInteractionPrompt,
  resolveIntelligenceInteraction,
  resolveIntelligenceObjective,
  resolveIntelligenceObjectiveTarget,
  type IntelligenceFlowState,
  type IntelligenceInteractionTarget,
  type IntelligenceMachineState,
  type IntelligenceObjective,
  type IntelligenceStationState,
} from '../intelligence-flow';
import { HeldItemId, canDashWithHeldItem, type HeldItem } from '../maintenance-items';
import {
  advancePosition,
  createDashState,
  type DashState,
  type MovementBounds,
  type MovementInputState,
  type MovementStep,
  type Point2,
} from '../movement';
import { SceneKey } from './scene-keys';

type GameSceneDebugState = GameDebugGameplayState;
type InteractionStationMap = Record<IntelligenceInteractionTarget, InteractionStation>;
type MovementKeyMap = Record<'down' | 'left' | 'right' | 'up', Phaser.Input.Keyboard.Key>;

interface InteractionStation {
  actionIcon: Phaser.GameObjects.Image;
  sprite: Phaser.GameObjects.Image;
  targetPoint: Point2;
}

interface RenderedRoom {
  intelligenceStation: InteractionStation;
  mainComputer: InteractionStation;
  stations: InteractionStationMap;
}

const INTERACT_DISTANCE = 88;
const PLAYER_RADIUS = 24;
const PLAYER_SPEED = 240;

export class GameScene extends Phaser.Scene {
  private carriedItem?: Phaser.GameObjects.Image;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private dashQueued = false;
  private dashState: DashState = createDashState();
  private debugState: GameSceneDebugState = {
    batteryTask: null,
    bounds: null,
    cracksTask: null,
    intelligenceTask: null,
    oilingTask: null,
    player: null,
    ready: false,
  };
  private heldItem: HeldItem = null;
  private intelligenceFlowState: IntelligenceFlowState = createIntelligenceFlowState();
  private intelligenceStationVisual?: InteractionStation;
  private interactionPrompt?: Phaser.GameObjects.Text;
  private interactionQueued = false;
  private interactionStations?: InteractionStationMap;
  private mainComputerVisual?: InteractionStation;
  private movementKeys?: MovementKeyMap;
  private objectiveBanner?: Phaser.GameObjects.Text;
  private playBounds: MovementBounds | null = null;
  private player?: Phaser.GameObjects.Image;
  private playerShadow?: Phaser.GameObjects.Ellipse;
  private statusBanner?: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKey.Game);
  }

  public create(): void {
    const { width, height } = this.scale;
    const room = new Phaser.Geom.Rectangle(48, 44, width - 96, height - 88);
    const walkArea = new Phaser.Geom.Rectangle(room.x + 70, room.y + 96, room.width - 140, room.height - 182);
    const spawnPoint = {
      x: walkArea.x + walkArea.width / 2,
      y: walkArea.y + walkArea.height - 12,
    };

    this.intelligenceFlowState = createIntelligenceFlowState();
    this.heldItem = null;
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.dashQueued = false;
    this.dashState = createDashState();
    this.interactionQueued = false;
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
    this.cameras.main.setBackgroundColor('#e5d7c0');

    const renderedRoom = renderIntelligenceSandbox(this, room, walkArea);

    this.interactionStations = renderedRoom.stations;
    this.mainComputerVisual = renderedRoom.mainComputer;
    this.intelligenceStationVisual = renderedRoom.intelligenceStation;
    this.playerShadow = this.add.ellipse(spawnPoint.x, spawnPoint.y + 18, 44, 18, 0x31190c, 0.16).setDepth(6);
    this.player = this.add.image(spawnPoint.x, spawnPoint.y, ASSET_KEYS.player).setDepth(7);
    this.carriedItem = this.add.image(spawnPoint.x, spawnPoint.y - 30, ASSET_KEYS.memoryModuleEmpty).setDepth(8).setVisible(false);
    this.interactionPrompt = this.add
      .text(room.x + room.width / 2, room.y + room.height - 28, '', {
        backgroundColor: '#17324a',
        color: '#fff9f0',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        padding: { bottom: 7, left: 12, right: 12, top: 7 },
      })
      .setDepth(12)
      .setOrigin(0.5)
      .setVisible(false);
    this.objectiveBanner = this.add
      .text(room.x + room.width / 2, room.y + 68, '', {
        color: '#17324a',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
      })
      .setDepth(4)
      .setOrigin(0.5);
    this.statusBanner = this.add
      .text(room.x + room.width / 2, room.y + 92, '', {
        color: '#6c553f',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setDepth(4)
      .setOrigin(0.5);

    this.input.keyboard?.on('keydown-SHIFT', this.queueDash, this);
    this.input.keyboard?.on('keydown-E', this.queueInteraction, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-SHIFT', this.queueDash, this);
      this.input.keyboard?.off('keydown-E', this.queueInteraction, this);
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
    if (!this.player || !this.playBounds || !this.interactionStations) {
      return;
    }

    const previousPosition = { x: this.player.x, y: this.player.y };
    const intelligenceAdvance = advanceIntelligenceState(
      this.intelligenceFlowState,
      delta,
      DEFAULT_INTELLIGENCE_FLOW_CONFIG,
    );

    this.intelligenceFlowState = intelligenceAdvance.nextState;

    if (intelligenceAdvance.processingCompleted) {
      this.cameras.main.shake(130, 0.0018);
      this.tweens.add({
        duration: 220,
        ease: 'Sine.Out',
        scaleX: 1.08,
        scaleY: 1.08,
        targets: this.intelligenceStationVisual?.sprite,
        yoyo: true,
      });
    }

    const step = advancePosition(
      previousPosition,
      this.readMovementInput(),
      PLAYER_SPEED,
      delta,
      this.playBounds,
      this.dashState,
    );
    const nearbyTarget = findNearbyStation(step.nextPosition, this.interactionStations);

    this.dashState = step.dashState;
    this.player.setPosition(step.nextPosition.x, step.nextPosition.y);
    this.player.setScale(step.dashState.isDashing ? 1.12 : step.isMoving ? 1.02 : 1);
    this.playerShadow?.setPosition(step.nextPosition.x, step.nextPosition.y + 18);
    this.playerShadow?.setScale(step.dashState.isDashing ? 1.18 : 1, step.dashState.isDashing ? 0.84 : 1);
    this.playerShadow?.setAlpha(step.dashState.isDashing ? 0.28 : step.isMoving ? 0.22 : 0.16);

    if (this.consumeInteractionQueue()) {
      this.applyInteraction(nearbyTarget);
    }

    this.refreshScenePresentation(nearbyTarget);
    this.syncDebugState(step, nearbyTarget);
  }

  public getDebugState(): GameSceneDebugState {
    return {
      batteryTask: null,
      bounds: this.debugState.bounds ? { ...this.debugState.bounds } : null,
      cracksTask: null,
      intelligenceTask: this.debugState.intelligenceTask ? { ...this.debugState.intelligenceTask } : null,
      oilingTask: null,
      player: this.debugState.player ? { ...this.debugState.player } : null,
      ready: this.debugState.ready,
    };
  }

  private applyInteraction(target: IntelligenceInteractionTarget | null): void {
    const interaction = resolveIntelligenceInteraction(
      this.intelligenceFlowState,
      this.heldItem,
      target,
      DEFAULT_INTELLIGENCE_FLOW_CONFIG,
    );

    if (!interaction.changed) {
      return;
    }

    this.intelligenceFlowState = interaction.nextState;
    this.heldItem = interaction.nextHeldItem;

    if (interaction.action === 'remove' || interaction.action === 'install') {
      this.tweens.add({
        duration: 180,
        ease: 'Sine.Out',
        scaleX: 1.06,
        scaleY: 1.06,
        targets: this.mainComputerVisual?.sprite,
        yoyo: true,
      });
    }

    if (interaction.action === 'load' || interaction.action === 'take-ready') {
      this.tweens.add({
        duration: 180,
        ease: 'Sine.Out',
        scaleX: 1.06,
        scaleY: 1.06,
        targets: this.intelligenceStationVisual?.sprite,
        yoyo: true,
      });
    }
  }

  private consumeDashQueue(): boolean {
    const dashPressed = this.dashQueued;

    this.dashQueued = false;

    return dashPressed;
  }

  private consumeInteractionQueue(): boolean {
    const interactionQueued = this.interactionQueued;

    this.interactionQueued = false;

    return interactionQueued;
  }

  private queueDash(event: KeyboardEvent): void {
    if (event.repeat) {
      return;
    }

    this.dashQueued = true;
  }

  private queueInteraction(event: KeyboardEvent): void {
    if (event.repeat) {
      return;
    }

    this.interactionQueued = true;
  }

  private readMovementInput(): MovementInputState {
    const canDash = canDashWithHeldItem(this.heldItem);

    if (!canDash) {
      this.consumeDashQueue();
    }

    return {
      dashPressed: canDash && this.consumeDashQueue(),
      down: Boolean(this.cursors?.down.isDown || this.movementKeys?.down.isDown),
      left: Boolean(this.cursors?.left.isDown || this.movementKeys?.left.isDown),
      right: Boolean(this.cursors?.right.isDown || this.movementKeys?.right.isDown),
      up: Boolean(this.cursors?.up.isDown || this.movementKeys?.up.isDown),
    };
  }

  private refreshPresentation(objectiveTarget: IntelligenceInteractionTarget | null): void {
    if (this.mainComputerVisual) {
      this.mainComputerVisual.sprite.setTexture(getMainComputerTexture(this.intelligenceFlowState.machine));
      this.mainComputerVisual.sprite.setScale(objectiveTarget === IntelligenceStationId.MainComputer ? 1.05 : 1);
      this.mainComputerVisual.sprite.setAlpha(this.intelligenceFlowState.machine === IntelligenceMachineStateId.Empty ? 0.9 : 1);
    }

    if (this.intelligenceStationVisual) {
      this.intelligenceStationVisual.sprite.setTexture(getIntelligenceStationTexture(this.intelligenceFlowState.station));
      this.intelligenceStationVisual.sprite.setScale(objectiveTarget === IntelligenceStationId.IntelligenceStation ? 1.05 : 1);

      if (this.intelligenceFlowState.station === IntelligenceStationStateId.Processing) {
        const pulse = 1 + Math.sin(this.time.now / 180) * 0.025;

        this.intelligenceStationVisual.sprite.setScale(
          (objectiveTarget === IntelligenceStationId.IntelligenceStation ? 1.05 : 1) * pulse,
        );
        this.intelligenceStationVisual.sprite.setAngle(Math.sin(this.time.now / 220) * 1.8);
      } else if (this.intelligenceFlowState.station === IntelligenceStationStateId.Ready) {
        this.intelligenceStationVisual.sprite.setAngle(Math.sin(this.time.now / 120) * 3.2);
      } else {
        this.intelligenceStationVisual.sprite.setAngle(0);
      }
    }
  }

  private refreshScenePresentation(nearbyTarget: IntelligenceInteractionTarget | null = null): void {
    const objective = {
      label: getIntelligenceObjectiveLabel(resolveIntelligenceObjective(this.intelligenceFlowState, this.heldItem)),
      target: resolveIntelligenceObjectiveTarget(this.intelligenceFlowState, this.heldItem),
    };
    const prompt = getIntelligenceInteractionPrompt(this.intelligenceFlowState, this.heldItem, nearbyTarget);

    this.interactionPrompt?.setVisible(Boolean(prompt));
    this.interactionPrompt?.setText(prompt ?? '');
    this.objectiveBanner?.setText(objective.label);
    this.statusBanner?.setText(getIntelligenceStatusLabel(this.intelligenceFlowState));

    if (this.carriedItem && this.player) {
      this.carriedItem.setVisible(this.heldItem !== null);

      if (this.heldItem !== null) {
        this.carriedItem.setTexture(getHeldItemTexture(this.heldItem));
        this.carriedItem.setPosition(this.player.x, this.player.y - 32);
      }
    }

    this.refreshPresentation(objective.target);

    if (this.interactionStations) {
      for (const [targetId, station] of Object.entries(this.interactionStations) as [
        IntelligenceInteractionTarget,
        InteractionStation,
      ][]) {
        const isObjective = targetId === objective.target;

        station.actionIcon.setAlpha(isObjective ? 1 : 0.84);
      }
    }
  }

  private syncDebugState(step: MovementStep, nearbyTarget: IntelligenceInteractionTarget | null = null): void {
    this.debugState = {
      batteryTask: null,
      bounds: this.playBounds ? { ...this.playBounds } : null,
      cracksTask: null,
      intelligenceTask: {
        completed: this.intelligenceFlowState.completed,
        machineState: this.intelligenceFlowState.machine,
        objective: resolveIntelligenceObjective(this.intelligenceFlowState, this.heldItem),
        processingRemainingMs:
          this.intelligenceFlowState.processingRemainingMs === null
            ? null
            : Math.ceil(this.intelligenceFlowState.processingRemainingMs),
        stationState: this.intelligenceFlowState.station,
      },
      oilingTask: null,
      player: this.player
        ? {
            canDash: canDashWithHeldItem(this.heldItem),
            dashCooldownRemainingMs: Math.round(step.dashState.cooldownRemainingMs),
            heldItem: this.heldItem,
            isDashing: step.dashState.isDashing,
            isMoving: step.isMoving,
            nearbyTarget,
            x: roundTo(this.player.x),
            y: roundTo(this.player.y),
          }
        : null,
      ready: Boolean(this.player && this.playBounds && this.interactionStations),
    };
  }
}

function createStation(
  scene: Phaser.Scene,
  x: number,
  y: number,
  texture: string,
  label: string,
): InteractionStation {
  const icon = scene.add.image(x, y, texture).setDepth(3);

  scene.add
    .text(x, y + 84, label, {
      color: '#17324a',
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
    })
    .setDepth(3)
    .setOrigin(0.5);

  return {
    actionIcon: icon,
    sprite: icon,
    targetPoint: { x, y },
  };
}

function findNearbyStation(
  position: Point2,
  stations: InteractionStationMap,
): IntelligenceInteractionTarget | null {
  let nearestStation: IntelligenceInteractionTarget | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const [targetId, station] of Object.entries(stations) as [IntelligenceInteractionTarget, InteractionStation][]) {
    const distance = Phaser.Math.Distance.Between(position.x, position.y, station.targetPoint.x, station.targetPoint.y);

    if (distance > INTERACT_DISTANCE || distance >= nearestDistance) {
      continue;
    }

    nearestStation = targetId;
    nearestDistance = distance;
  }

  return nearestStation;
}

function getHeldItemTexture(heldItem: HeldItem): string {
  switch (heldItem) {
    case HeldItemId.MemoryModuleEmpty:
      return ASSET_KEYS.memoryModuleEmpty;
    case HeldItemId.MemoryModuleReady:
      return ASSET_KEYS.memoryModuleReady;
    default:
      return ASSET_KEYS.memoryModuleEmpty;
  }
}

function getIntelligenceObjectiveLabel(objective: IntelligenceObjective): string {
  switch (objective) {
    case 'remove-module':
      return 'Remove the depleted memory module';
    case 'load-station':
      return 'Load the intelligence station';
    case 'wait-for-processing':
      return 'Wait for the station to finish processing';
    case 'take-ready-module':
      return 'Take the restored module';
    case 'install-module':
      return 'Return the module to the main computer';
    case 'complete':
      return 'Main computer restored';
  }
}

function getIntelligenceStatusLabel(state: IntelligenceFlowState): string {
  if (state.completed) {
    return 'System intelligence restored';
  }

  if (state.station === IntelligenceStationStateId.Processing) {
    return `Processing module  •  ${formatSeconds(state.processingRemainingMs)}s`;
  }

  if (state.station === IntelligenceStationStateId.Ready) {
    return 'Processing complete  •  pick up the ready module';
  }

  if (state.machine === IntelligenceMachineStateId.Empty) {
    return 'Main computer bay is open';
  }

  return 'Carry the memory module between both stations';
}

function getIntelligenceStationTexture(state: IntelligenceStationState): string {
  switch (state) {
    case IntelligenceStationStateId.Idle:
      return ASSET_KEYS.intelligenceStationIdle;
    case IntelligenceStationStateId.Processing:
      return ASSET_KEYS.intelligenceStationProcessing;
    case IntelligenceStationStateId.Ready:
      return ASSET_KEYS.intelligenceStationReady;
  }
}

function getMainComputerTexture(state: IntelligenceMachineState): string {
  switch (state) {
    case IntelligenceMachineStateId.DepletedInstalled:
      return ASSET_KEYS.mainComputerDepleted;
    case IntelligenceMachineStateId.Empty:
      return ASSET_KEYS.mainComputerOpen;
    case IntelligenceMachineStateId.Restored:
      return ASSET_KEYS.mainComputerRestored;
  }
}

function renderIntelligenceSandbox(
  scene: Phaser.Scene,
  room: Phaser.Geom.Rectangle,
  walkArea: Phaser.Geom.Rectangle,
): RenderedRoom {
  const backdrop = scene.add.graphics();
  const centerX = room.x + room.width / 2;
  const centerY = room.y + room.height / 2;
  const mainComputerX = room.x + 204;
  const mainComputerY = room.y + room.height - 150;
  const intelligenceStationX = room.x + room.width - 204;
  const intelligenceStationY = room.y + room.height - 150;

  backdrop.fillStyle(0xc7b091, 0.24);
  backdrop.fillRoundedRect(room.x + 10, room.y + 14, room.width, room.height, 34);
  backdrop.fillStyle(0xfffbf6, 0.98);
  backdrop.fillRoundedRect(room.x, room.y, room.width, room.height, 34);
  backdrop.lineStyle(3, 0x27455d, 0.18);
  backdrop.strokeRoundedRect(room.x, room.y, room.width, room.height, 34);
  backdrop.fillStyle(0xefe1cb, 1);
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

  backdrop.lineStyle(6, 0x17324a, 0.06);
  backdrop.lineBetween(mainComputerX + 52, mainComputerY - 28, centerX, centerY - 10);
  backdrop.lineBetween(centerX, centerY - 10, intelligenceStationX - 52, intelligenceStationY - 28);
  backdrop.lineBetween(centerX, room.y + 128, centerX, room.y + room.height - 170);
  backdrop.fillStyle(0xffffff, 0.18);
  backdrop.fillCircle(centerX, centerY - 10, 34);
  backdrop.fillCircle(centerX, centerY - 10, 14);

  scene.add.image(centerX, centerY, ASSET_KEYS.emblem).setDepth(1).setAlpha(0.06).setScale(1.14);
  scene.add.rectangle(centerX, centerY, 160, 160, 0xffffff, 0.22).setDepth(1).setStrokeStyle(2, 0x27455d, 0.08);
  scene.add.rectangle(centerX, centerY, 92, 92, 0xffffff, 0.28).setDepth(1).setStrokeStyle(2, 0x27455d, 0.1);
  scene.add
    .text(room.x + room.width / 2, room.y + 36, 'WASD or arrow keys  •  Shift to dash  •  E interact', {
      backgroundColor: '#fff5e7',
      color: '#8b5b34',
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      padding: { bottom: 8, left: 14, right: 14, top: 8 },
    })
    .setDepth(4)
    .setOrigin(0.5);

  const mainComputer = createStation(scene, mainComputerX, mainComputerY, ASSET_KEYS.mainComputerDepleted, 'Main computer');
  const intelligenceStation = createStation(
    scene,
    intelligenceStationX,
    intelligenceStationY,
    ASSET_KEYS.intelligenceStationIdle,
    'Intelligence station',
  );

  return {
    intelligenceStation,
    mainComputer,
    stations: {
      [IntelligenceStationId.IntelligenceStation]: intelligenceStation,
      [IntelligenceStationId.MainComputer]: mainComputer,
    },
  };
}

function formatSeconds(durationMs: number | null): string {
  if (durationMs === null) {
    return '0.0';
  }

  return (Math.ceil(durationMs / 100) / 10).toFixed(1);
}

function roundTo(value: number): number {
  return Math.round(value * 100) / 100;
}
