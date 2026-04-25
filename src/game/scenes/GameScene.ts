import Phaser from 'phaser';

import type { GameDebugGameplayState } from '../../agent/debug';
import { ASSET_KEYS } from '../assets';
import {
  DEFAULT_OILING_FLOW_CONFIG,
  GearId,
  GearStatusId,
  OilingStationId,
  advanceOilingState,
  createOilingFlowState,
  getOilingInteractionPrompt,
  resolveOilingInteraction,
  resolveOilingObjective,
  resolveOilingObjectiveTarget,
  type Gear,
  type GearStatus,
  type OilingFlowState,
  type OilingInteractionTarget,
  type OilingObjective,
} from '../oiling-flow';
import { canDashWithHeldItem, type HeldItem } from '../maintenance-items';
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
type GearVisualMap = Record<Gear, GearVisual>;
type InteractionStationMap = Record<OilingInteractionTarget, InteractionStation>;
type MovementKeyMap = Record<'down' | 'left' | 'right' | 'up', Phaser.Input.Keyboard.Key>;

interface GearVisual {
  sprite: Phaser.GameObjects.Image;
}

interface InteractionStation {
  actionIcon: Phaser.GameObjects.Image;
  targetPoint: Point2;
}

interface RenderedRoom {
  gearVisuals: GearVisualMap;
  stations: InteractionStationMap;
}

const INTERACT_DISTANCE = 88;
const PLAYER_RADIUS = 24;
const PLAYER_SPEED = 240;

export class GameScene extends Phaser.Scene {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private dashQueued = false;
  private dashState: DashState = createDashState();
  private debugState: GameSceneDebugState = {
    batteryTask: null,
    bounds: null,
    cracksTask: null,
    oilingTask: null,
    player: null,
    ready: false,
  };
  private gearVisuals?: GearVisualMap;
  private heldItem: HeldItem = null;
  private interactionPrompt?: Phaser.GameObjects.Text;
  private interactionQueued = false;
  private interactionStations?: InteractionStationMap;
  private movementKeys?: MovementKeyMap;
  private objectiveBanner?: Phaser.GameObjects.Text;
  private oilingFlowState: OilingFlowState = createOilingFlowState(DEFAULT_OILING_FLOW_CONFIG);
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
    const spawnPoint = {
      x: walkArea.x + walkArea.width / 2,
      y: walkArea.y + walkArea.height - 12,
    };

    this.oilingFlowState = createOilingFlowState(DEFAULT_OILING_FLOW_CONFIG);
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
    this.cameras.main.setBackgroundColor('#ead8bf');

    const renderedRoom = renderOilingSandbox(this, room, walkArea);

    this.interactionStations = renderedRoom.stations;
    this.gearVisuals = renderedRoom.gearVisuals;
    this.playerShadow = this.add.ellipse(spawnPoint.x, spawnPoint.y + 18, 44, 18, 0x31190c, 0.16).setDepth(6);
    this.player = this.add.image(spawnPoint.x, spawnPoint.y, ASSET_KEYS.player).setDepth(7);
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
      .text(room.x + room.width / 2, room.y + 72, '', {
        color: '#17324a',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '16px',
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
    const oilingAdvance = advanceOilingState(this.oilingFlowState, delta, DEFAULT_OILING_FLOW_CONFIG);

    this.oilingFlowState = oilingAdvance.nextState;

    if (oilingAdvance.gearTriggered || oilingAdvance.gearStartedGrinding) {
      this.cameras.main.shake(140, 0.002);
    }

    const step = advancePosition(
      previousPosition,
      this.readMovementInput(),
      PLAYER_SPEED,
      delta,
      this.playBounds,
      this.dashState,
    );
    const nearbyTarget = findNearbyStation(step.nextPosition, this.interactionStations, this.oilingFlowState);

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
      oilingTask: this.debugState.oilingTask ? { ...this.debugState.oilingTask } : null,
      player: this.debugState.player ? { ...this.debugState.player } : null,
      ready: this.debugState.ready,
    };
  }

  private applyInteraction(target: OilingInteractionTarget | null): void {
    const servicedGearId = this.oilingFlowState.activeGearId;
    const interaction = resolveOilingInteraction(this.oilingFlowState, target, DEFAULT_OILING_FLOW_CONFIG);

    if (!interaction.changed) {
      return;
    }

    this.oilingFlowState = interaction.nextState;

    if (interaction.action === 'oil' && servicedGearId && this.gearVisuals) {
      this.tweens.add({
        angle: 180,
        duration: 260,
        ease: 'Sine.Out',
        targets: this.gearVisuals[servicedGearId].sprite,
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

  private refreshGearVisuals(objectiveTarget: OilingInteractionTarget | null): void {
    if (!this.gearVisuals) {
      return;
    }

    for (const [gearId, gearVisual] of Object.entries(this.gearVisuals) as [Gear, GearVisual][]) {
      const status = this.oilingFlowState.gears[gearId].status;

      gearVisual.sprite.setTexture(getGearTexture(status));
      gearVisual.sprite.setScale(objectiveTarget === getGearTarget(gearId) ? 1.06 : 1);
      gearVisual.sprite.setAlpha(status === GearStatusId.Healthy ? 0.86 : 1);

      if (status === GearStatusId.NeedsOil) {
        gearVisual.sprite.setAngle(Math.sin(this.time.now / 170) * 3);
      } else if (status === GearStatusId.Grinding) {
        gearVisual.sprite.setAngle(Math.sin(this.time.now / 90) * 7);
      } else {
        gearVisual.sprite.setAngle(0);
      }
    }
  }

  private refreshScenePresentation(nearbyTarget: OilingInteractionTarget | null = null): void {
    const objective = {
      label: getOilingObjectiveLabel(resolveOilingObjective(this.oilingFlowState)),
      target: resolveOilingObjectiveTarget(this.oilingFlowState),
    };
    const prompt = getOilingInteractionPrompt(this.oilingFlowState, nearbyTarget);

    this.interactionPrompt?.setVisible(Boolean(prompt));
    this.interactionPrompt?.setText(prompt ?? '');
    this.objectiveBanner?.setText(`${objective.label}  •  Oil ${this.oilingFlowState.oilCharges}/${this.oilingFlowState.maxOilCharges}`);

    this.refreshGearVisuals(objective.target);

    if (this.interactionStations) {
      for (const [targetId, station] of Object.entries(this.interactionStations) as [OilingInteractionTarget, InteractionStation][]) {
        const isObjective = targetId === objective.target;
        station.actionIcon.setAlpha(isObjective ? 1 : 0.84);
        station.actionIcon.setScale(isObjective ? 1.05 : 1);
      }
    }
  }

  private syncDebugState(step: MovementStep, nearbyTarget: OilingInteractionTarget | null = null): void {
    const activeGearStatus = getActiveGearStatus(this.oilingFlowState);

    this.debugState = {
      batteryTask: null,
      bounds: this.playBounds ? { ...this.playBounds } : null,
      cracksTask: null,
      oilingTask: {
        activeGearId: this.oilingFlowState.activeGearId,
        completedServices: this.oilingFlowState.completedServices,
        maxOilCharges: this.oilingFlowState.maxOilCharges,
        objective: resolveOilingObjective(this.oilingFlowState),
        oilCharges: this.oilingFlowState.oilCharges,
        status: activeGearStatus,
        timeUntilGrindingMs:
          this.oilingFlowState.timeUntilGrindingMs === null ? null : Math.ceil(this.oilingFlowState.timeUntilGrindingMs),
        triggered: this.oilingFlowState.activeGearId !== null,
      },
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

function createGearVisual(scene: Phaser.Scene, x: number, y: number): GearVisual {
  return {
    sprite: scene.add.image(x, y, ASSET_KEYS.gearHealthy).setDepth(3),
  };
}

function createStation(
  scene: Phaser.Scene,
  x: number,
  y: number,
  texture: string,
  label?: string,
): InteractionStation {
  const icon = scene.add.image(x, y, texture).setDepth(3);

  if (label) {
    scene.add
      .text(x, y + 78, label, {
        color: '#17324a',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setDepth(3)
      .setOrigin(0.5);
  }

  return {
    actionIcon: icon,
    targetPoint: { x, y },
  };
}

function findNearbyStation(
  position: Point2,
  stations: InteractionStationMap,
  oilingFlowState: OilingFlowState,
): OilingInteractionTarget | null {
  let nearestStation: OilingInteractionTarget | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const [targetId, station] of Object.entries(stations) as [OilingInteractionTarget, InteractionStation][]) {
    if (!isTargetEnabled(targetId, oilingFlowState)) {
      continue;
    }

    const distance = Phaser.Math.Distance.Between(position.x, position.y, station.targetPoint.x, station.targetPoint.y);

    if (distance > INTERACT_DISTANCE || distance >= nearestDistance) {
      continue;
    }

    nearestStation = targetId;
    nearestDistance = distance;
  }

  return nearestStation;
}

function getActiveGearStatus(state: OilingFlowState): GearStatus | null {
  return state.activeGearId ? state.gears[state.activeGearId].status : null;
}

function getGearTarget(gearId: Gear | null): OilingInteractionTarget | null {
  switch (gearId) {
    case GearId.LeftGear:
      return OilingStationId.GearLeft;
    case GearId.RightGear:
      return OilingStationId.GearRight;
    case null:
      return null;
  }
}

function getGearTexture(status: GearStatus): string {
  switch (status) {
    case GearStatusId.Healthy:
      return ASSET_KEYS.gearHealthy;
    case GearStatusId.NeedsOil:
      return ASSET_KEYS.gearNeedsOil;
    case GearStatusId.Grinding:
      return ASSET_KEYS.gearGrinding;
  }
}

function getOilingObjectiveLabel(objective: OilingObjective): string {
  switch (objective) {
    case 'wait':
      return 'Wait for the next dry gear';
    case 'refill-oil':
      return 'Refill at the oil pump';
    case 'oil-gear':
      return 'Oil the active gear';
  }
}

function isTargetEnabled(target: OilingInteractionTarget, oilingFlowState: OilingFlowState): boolean {
  if (target === OilingStationId.OilPump) {
    return true;
  }

  return oilingFlowState.activeGearId !== null && shouldTrackGearTarget(target, oilingFlowState);
}

function renderOilingSandbox(
  scene: Phaser.Scene,
  room: Phaser.Geom.Rectangle,
  walkArea: Phaser.Geom.Rectangle,
): RenderedRoom {
  const backdrop = scene.add.graphics();
  const centerX = room.x + room.width / 2;
  const centerY = room.y + room.height / 2;
  const pumpX = room.x + room.width - 190;
  const pumpY = room.y + room.height - 136;
  const leftGearX = centerX - 116;
  const leftGearY = centerY + 42;
  const rightGearX = centerX + 116;
  const rightGearY = centerY + 42;

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

  backdrop.lineStyle(6, 0x17324a, 0.06);
  backdrop.lineBetween(room.x + 124, room.y + room.height - 154, leftGearX, leftGearY + 52);
  backdrop.lineBetween(pumpX - 36, pumpY - 72, rightGearX, rightGearY + 52);
  backdrop.lineBetween(centerX, room.y + 124, centerX, room.y + room.height - 170);

  scene.add.image(centerX, centerY, ASSET_KEYS.emblem).setDepth(1).setAlpha(0.06).setScale(1.14);
  scene.add.rectangle(centerX, centerY, 156, 156, 0xffffff, 0.22).setDepth(1).setStrokeStyle(2, 0x27455d, 0.08);
  scene.add.rectangle(centerX, centerY, 88, 88, 0xffffff, 0.28).setDepth(1).setStrokeStyle(2, 0x27455d, 0.1);
  scene.add.circle(room.x + 132, room.y + room.height - 154, 34, 0xffffff, 0.16).setDepth(1).setStrokeStyle(3, 0x27455d, 0.08);
  scene.add.circle(room.x + 132, room.y + room.height - 154, 16, 0xffffff, 0.2).setDepth(1).setStrokeStyle(2, 0x27455d, 0.08);
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

  const leftGear = createGearVisual(scene, leftGearX, leftGearY);
  const rightGear = createGearVisual(scene, rightGearX, rightGearY);
  const oilPump = createStation(scene, pumpX, pumpY, ASSET_KEYS.oilPump, 'Oil pump');

  return {
    gearVisuals: {
      [GearId.LeftGear]: leftGear,
      [GearId.RightGear]: rightGear,
    },
    stations: {
      [OilingStationId.GearLeft]: {
        actionIcon: leftGear.sprite,
        targetPoint: { x: leftGearX, y: leftGearY },
      },
      [OilingStationId.GearRight]: {
        actionIcon: rightGear.sprite,
        targetPoint: { x: rightGearX, y: rightGearY },
      },
      [OilingStationId.OilPump]: oilPump,
    },
  };
}

function roundTo(value: number): number {
  return Math.round(value * 100) / 100;
}

function shouldTrackGearTarget(target: OilingInteractionTarget, oilingFlowState: OilingFlowState): boolean {
  const gearId = target === OilingStationId.GearLeft ? GearId.LeftGear : target === OilingStationId.GearRight ? GearId.RightGear : null;

  if (gearId === null) {
    return false;
  }

  return oilingFlowState.activeGearId === gearId;
}
