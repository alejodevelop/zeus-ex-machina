import Phaser from 'phaser';

import type { GameDebugGameplayState } from '../../agent/debug';
import { ASSET_KEYS } from '../assets';
import {
  CrackSiteId,
  CrackStationId,
  CrackStatusId,
  DEFAULT_CRACKS_FLOW_CONFIG,
  advanceCracksState,
  createCracksFlowState,
  getCracksInteractionPrompt,
  resolveCracksInteraction,
  resolveCracksObjective,
  resolveCracksObjectiveTarget,
  type CrackInteractionTarget,
  type CrackSite,
  type CrackStatus,
  type CracksFlowState,
  type CracksObjective,
} from '../cracks-flow';
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
import { constrainPointToBlockers, type TraversalBlocker } from '../traversal-blockers';
import { SceneKey } from './scene-keys';

type GameSceneDebugState = GameDebugGameplayState;
type InteractionStationMap = Record<CrackInteractionTarget, InteractionStation>;
type MovementKeyMap = Record<'down' | 'left' | 'right' | 'up', Phaser.Input.Keyboard.Key>;
type CrackVisualMap = Record<CrackSite, CrackVisual>;

interface InteractionStation {
  actionIcon: Phaser.GameObjects.Image;
  targetPoint: Point2;
}

interface CrackVisual {
  blocker: TraversalBlocker;
  sprite: Phaser.GameObjects.Image;
}

interface RenderedRoom {
  crackVisuals: CrackVisualMap;
  stations: InteractionStationMap;
}

const INTERACT_DISTANCE = 88;
const PLAYER_RADIUS = 24;
const PLAYER_SPEED = 240;

export class GameScene extends Phaser.Scene {
  private carriedItem?: Phaser.GameObjects.Image;
  private crackVisuals?: CrackVisualMap;
  private cracksFlowState: CracksFlowState = createCracksFlowState(DEFAULT_CRACKS_FLOW_CONFIG);
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private dashQueued = false;
  private dashState: DashState = createDashState();
  private debugState: GameSceneDebugState = {
    batteryTask: null,
    bounds: null,
    cracksTask: null,
    player: null,
    ready: false,
  };
  private heldItem: HeldItem = null;
  private interactionPrompt?: Phaser.GameObjects.Text;
  private interactionQueued = false;
  private interactionStations?: InteractionStationMap;
  private movementKeys?: MovementKeyMap;
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
    const spawnPoint = {
      x: walkArea.x + walkArea.width / 2,
      y: walkArea.y + walkArea.height - 10,
    };

    this.cracksFlowState = createCracksFlowState(DEFAULT_CRACKS_FLOW_CONFIG);
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

    const renderedRoom = renderCracksSandbox(this, room, walkArea);

    this.interactionStations = renderedRoom.stations;
    this.crackVisuals = renderedRoom.crackVisuals;
    this.playerShadow = this.add.ellipse(spawnPoint.x, spawnPoint.y + 18, 44, 18, 0x31190c, 0.16).setDepth(6);
    this.player = this.add.image(spawnPoint.x, spawnPoint.y, ASSET_KEYS.player).setDepth(7);
    this.carriedItem = this.add.image(spawnPoint.x, spawnPoint.y - 30, ASSET_KEYS.repairPlate).setDepth(8).setVisible(false);
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
    const cracksAdvance = advanceCracksState(this.cracksFlowState, delta, DEFAULT_CRACKS_FLOW_CONFIG);

    this.cracksFlowState = cracksAdvance.nextState;

    if (cracksAdvance.crackTriggered || cracksAdvance.becameBlocked) {
      this.cameras.main.shake(140, 0.0022);
    }

    const step = advancePosition(
      previousPosition,
      this.readMovementInput(),
      PLAYER_SPEED,
      delta,
      this.playBounds,
      this.dashState,
    );
    const constrainedPosition = constrainPointToBlockers(
      previousPosition,
      step.nextPosition,
      PLAYER_RADIUS,
      this.getActiveBlockers(),
    );
    const adjustedStep: MovementStep = {
      ...step,
      isMoving: constrainedPosition.x !== previousPosition.x || constrainedPosition.y !== previousPosition.y,
      nextPosition: constrainedPosition,
    };
    const nearbyTarget = findNearbyStation(constrainedPosition, this.interactionStations, this.cracksFlowState);

    this.dashState = adjustedStep.dashState;
    this.player.setPosition(adjustedStep.nextPosition.x, adjustedStep.nextPosition.y);
    this.player.setScale(adjustedStep.dashState.isDashing ? 1.12 : adjustedStep.isMoving ? 1.02 : 1);
    this.playerShadow?.setPosition(adjustedStep.nextPosition.x, adjustedStep.nextPosition.y + 18);
    this.playerShadow?.setScale(adjustedStep.dashState.isDashing ? 1.18 : 1, adjustedStep.dashState.isDashing ? 0.84 : 1);
    this.playerShadow?.setAlpha(adjustedStep.dashState.isDashing ? 0.28 : adjustedStep.isMoving ? 0.22 : 0.16);

    if (this.consumeInteractionQueue()) {
      this.applyInteraction(nearbyTarget);
    }

    this.refreshScenePresentation(nearbyTarget);
    this.syncDebugState(adjustedStep, nearbyTarget);
  }

  public getDebugState(): GameSceneDebugState {
    return {
      batteryTask: null,
      bounds: this.debugState.bounds ? { ...this.debugState.bounds } : null,
      cracksTask: this.debugState.cracksTask ? { ...this.debugState.cracksTask } : null,
      player: this.debugState.player ? { ...this.debugState.player } : null,
      ready: this.debugState.ready,
    };
  }

  private applyInteraction(target: CrackInteractionTarget | null): void {
    const interaction = resolveCracksInteraction(this.cracksFlowState, this.heldItem, target, DEFAULT_CRACKS_FLOW_CONFIG);

    if (!interaction.changed) {
      return;
    }

    this.cracksFlowState = interaction.nextState;
    this.heldItem = interaction.nextHeldItem;

    if (interaction.action === 'repair') {
      const repairedSite = this.findPatchedSite();

      if (repairedSite && this.crackVisuals) {
        this.tweens.add({
          duration: 180,
          ease: 'Sine.Out',
          scaleX: 1.08,
          scaleY: 1.08,
          targets: this.crackVisuals[repairedSite].sprite,
          yoyo: true,
        });
      }
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

  private findPatchedSite(): CrackSite | null {
    for (const siteId of [CrackSiteId.LeftLane, CrackSiteId.RightLane]) {
      if (this.cracksFlowState.sites[siteId].status === CrackStatusId.Patched) {
        return siteId;
      }
    }

    return null;
  }

  private getActiveBlockers(): TraversalBlocker[] {
    if (!this.crackVisuals) {
      return [];
    }

    return (Object.entries(this.crackVisuals) as [CrackSite, CrackVisual][])
      .filter(([siteId]) => this.cracksFlowState.sites[siteId].status === CrackStatusId.Blocked)
      .map(([, crackVisual]) => crackVisual.blocker);
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

  private refreshCrackVisuals(objectiveTarget: CrackInteractionTarget | null): void {
    if (!this.crackVisuals) {
      return;
    }

    for (const [siteId, crackVisual] of Object.entries(this.crackVisuals) as [CrackSite, CrackVisual][]) {
      const status = this.cracksFlowState.sites[siteId].status;

      if (status === CrackStatusId.Idle) {
        crackVisual.sprite.setVisible(false);

        continue;
      }

      crackVisual.sprite.setVisible(true);
      crackVisual.sprite.setTexture(getCrackTexture(status));
      crackVisual.sprite.setScale(objectiveTarget === getCrackStationId(siteId) ? 1.06 : 1);

      if (status === CrackStatusId.Warning) {
        crackVisual.sprite.setAlpha(0.72 + Math.sin(this.time.now / 120) * 0.16);
      } else {
        crackVisual.sprite.setAlpha(1);
      }
    }
  }

  private refreshScenePresentation(nearbyTarget: CrackInteractionTarget | null = null): void {
    const objective = {
      label: getCracksObjectiveLabel(resolveCracksObjective(this.cracksFlowState, this.heldItem)),
      target: resolveCracksObjectiveTarget(this.cracksFlowState, this.heldItem),
    };
    const prompt = getCracksInteractionPrompt(this.cracksFlowState, this.heldItem, nearbyTarget);

    this.interactionPrompt?.setVisible(Boolean(prompt));
    this.interactionPrompt?.setText(prompt ?? '');
    this.objectiveBanner?.setText(objective.label);

    if (this.carriedItem && this.player) {
      this.carriedItem.setVisible(this.heldItem !== null);

      if (this.heldItem !== null) {
        this.carriedItem.setTexture(ASSET_KEYS.repairPlate);
        this.carriedItem.setPosition(this.player.x, this.player.y - 32);
      }
    }

    this.refreshCrackVisuals(objective.target);

    if (this.interactionStations) {
      for (const [targetId, station] of Object.entries(this.interactionStations) as [CrackInteractionTarget, InteractionStation][]) {
        const isObjective = targetId === objective.target;
        const isHiddenCrackTarget = targetId !== CrackStationId.RepairPlateSupply && !shouldTrackCrackTarget(targetId, this.cracksFlowState);

        station.actionIcon.setAlpha(isHiddenCrackTarget ? 0 : isObjective ? 1 : 0.82);

        if (targetId === CrackStationId.RepairPlateSupply) {
          station.actionIcon.setVisible(this.cracksFlowState.activeSiteId !== null);
        }
      }
    }
  }

  private syncDebugState(step: MovementStep, nearbyTarget: CrackInteractionTarget | null = null): void {
    const activeCrackStatus = getActiveCrackStatus(this.cracksFlowState);

    this.debugState = {
      batteryTask: null,
      bounds: this.playBounds ? { ...this.playBounds } : null,
      cracksTask: {
        activeSiteId: this.cracksFlowState.activeSiteId,
        completedRepairs: this.cracksFlowState.completedRepairs,
        objective: resolveCracksObjective(this.cracksFlowState, this.heldItem),
        status: activeCrackStatus,
        timeUntilBlockedMs:
          this.cracksFlowState.timeUntilBlockedMs === null ? null : Math.ceil(this.cracksFlowState.timeUntilBlockedMs),
        triggered: this.cracksFlowState.activeSiteId !== null,
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

function createCrackVisual(scene: Phaser.Scene, x: number, y: number): CrackVisual {
  const sprite = scene.add.image(x, y, ASSET_KEYS.crackWarning).setDepth(3).setVisible(false);

  return {
    blocker: {
      height: 70,
      width: 148,
      x: x - 74,
      y: y - 35,
    },
    sprite,
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
      .text(x, y + 72, label, {
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
  cracksFlowState: CracksFlowState,
): CrackInteractionTarget | null {
  let nearestStation: CrackInteractionTarget | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const [targetId, station] of Object.entries(stations) as [CrackInteractionTarget, InteractionStation][]) {
    if (!isTargetEnabled(targetId, cracksFlowState)) {
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

function getActiveCrackStatus(state: CracksFlowState): CrackStatus | null {
  return state.activeSiteId ? state.sites[state.activeSiteId].status : null;
}

function getCrackStationId(siteId: CrackSite): CrackInteractionTarget {
  return siteId === CrackSiteId.LeftLane ? CrackStationId.CrackLeft : CrackStationId.CrackRight;
}

function getCrackTexture(status: CrackStatus): string {
  switch (status) {
    case CrackStatusId.Warning:
      return ASSET_KEYS.crackWarning;
    case CrackStatusId.Blocked:
      return ASSET_KEYS.crackBlocked;
    case CrackStatusId.Patched:
      return ASSET_KEYS.crackPatched;
    case CrackStatusId.Idle:
      return ASSET_KEYS.crackWarning;
  }
}

function getCracksObjectiveLabel(objective: CracksObjective): string {
  switch (objective) {
    case 'wait':
      return 'Wait for the next structural crack';
    case 'grab-repair-plate':
      return 'Take a repair plate';
    case 'repair-crack':
      return 'Patch the structural crack';
  }
}

function isTargetEnabled(target: CrackInteractionTarget, cracksFlowState: CracksFlowState): boolean {
  if (target === CrackStationId.RepairPlateSupply) {
    return cracksFlowState.activeSiteId !== null;
  }

  return shouldTrackCrackTarget(target, cracksFlowState);
}

function renderCracksSandbox(
  scene: Phaser.Scene,
  room: Phaser.Geom.Rectangle,
  walkArea: Phaser.Geom.Rectangle,
): RenderedRoom {
  const backdrop = scene.add.graphics();
  const centerX = room.x + room.width / 2;
  const centerY = room.y + room.height / 2;
  const plateSupplyX = centerX;
  const plateSupplyY = room.y + room.height - 140;
  const crackLeftX = centerX - 146;
  const crackLeftY = centerY + 24;
  const crackRightX = centerX + 146;
  const crackRightY = centerY + 24;

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
  backdrop.lineBetween(plateSupplyX, plateSupplyY - 54, crackLeftX, crackLeftY + 32);
  backdrop.lineBetween(plateSupplyX, plateSupplyY - 54, crackRightX, crackRightY + 32);

  scene.add.image(centerX, centerY, ASSET_KEYS.emblem).setDepth(1).setAlpha(0.06).setScale(1.14);
  scene.add.rectangle(centerX, centerY, 156, 156, 0xffffff, 0.22).setDepth(1).setStrokeStyle(2, 0x27455d, 0.08);
  scene.add.rectangle(centerX, centerY, 88, 88, 0xffffff, 0.28).setDepth(1).setStrokeStyle(2, 0x27455d, 0.1);
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

  const crackLeft = createCrackVisual(scene, crackLeftX, crackLeftY);
  const crackRight = createCrackVisual(scene, crackRightX, crackRightY);
  const repairPlateSupply = createStation(scene, plateSupplyX, plateSupplyY, ASSET_KEYS.repairPlateSupply, 'Repair plates');

  return {
    crackVisuals: {
      [CrackSiteId.LeftLane]: crackLeft,
      [CrackSiteId.RightLane]: crackRight,
    },
    stations: {
      [CrackStationId.CrackLeft]: {
        actionIcon: crackLeft.sprite,
        targetPoint: { x: crackLeftX, y: crackLeftY },
      },
      [CrackStationId.CrackRight]: {
        actionIcon: crackRight.sprite,
        targetPoint: { x: crackRightX, y: crackRightY },
      },
      [CrackStationId.RepairPlateSupply]: repairPlateSupply,
    },
  };
}

function roundTo(value: number): number {
  return Math.round(value * 100) / 100;
}

function shouldTrackCrackTarget(target: CrackInteractionTarget, cracksFlowState: CracksFlowState): boolean {
  const siteId = target === CrackStationId.CrackLeft ? CrackSiteId.LeftLane : target === CrackStationId.CrackRight ? CrackSiteId.RightLane : null;

  if (siteId === null) {
    return false;
  }

  const status = cracksFlowState.sites[siteId].status;

  return status === CrackStatusId.Warning || status === CrackStatusId.Blocked;
}
