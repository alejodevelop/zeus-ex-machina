import Phaser from 'phaser';

import type { GameDebugGameplayState } from '../../agent/debug';
import { ASSET_KEYS } from '../assets';
import {
  BatteryMachineStateId,
  BatteryObjectiveId,
  BatteryStation,
  HeldItemId,
  canDashWithHeldItem,
  createBatteryFlowState,
  getBatteryInteractionPrompt,
  resolveBatteryInteraction,
  resolveBatteryObjective,
  resolveBatteryObjectiveTarget,
  type BatteryFlowState,
  type BatteryObjective,
  type BatteryStationId,
} from '../battery-flow';
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

type InteractionStationMap = Record<BatteryStationId, InteractionStation>;
type MovementKeyMap = Record<'down' | 'left' | 'right' | 'up', Phaser.Input.Keyboard.Key>;

interface InteractionStation {
  actionIcon: Phaser.GameObjects.Image;
  targetPoint: Point2;
}

const INTERACT_DISTANCE = 88;
const PLAYER_RADIUS = 24;
const PLAYER_SPEED = 240;

export class GameScene extends Phaser.Scene {
  private batteryCompletionText?: Phaser.GameObjects.Text;
  private batteryFlowState: BatteryFlowState = createBatteryFlowState();
  private carriedBattery?: Phaser.GameObjects.Image;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private dashQueued = false;
  private dashState: DashState = createDashState();
  private debugState: GameSceneDebugState = {
    batteryTask: null,
    bounds: null,
    player: null,
    ready: false,
  };
  private interactionPrompt?: Phaser.GameObjects.Text;
  private interactionQueued = false;
  private interactionStations?: InteractionStationMap;
  private leaving = false;
  private machineImage?: Phaser.GameObjects.Image;
  private movementKeys?: MovementKeyMap;
  private objectiveBanner?: Phaser.GameObjects.Text;
  private playBounds: MovementBounds | null = null;
  private player?: Phaser.GameObjects.Image;
  private playerShadow?: Phaser.GameObjects.Ellipse;
  private successPulse?: Phaser.GameObjects.Ellipse;

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

    this.leaving = false;
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.batteryFlowState = createBatteryFlowState();
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

    this.interactionStations = renderBatteryRoom(this, room, walkArea);
    this.machineImage = this.interactionStations.machine.actionIcon;
    this.playerShadow = this.add.ellipse(spawnPoint.x, spawnPoint.y + 18, 44, 18, 0x31190c, 0.16).setDepth(6);
    this.player = this.add.image(spawnPoint.x, spawnPoint.y, ASSET_KEYS.player).setDepth(7);
    this.carriedBattery = this.add.image(spawnPoint.x, spawnPoint.y - 30, ASSET_KEYS.batteryDead).setDepth(8).setVisible(false);
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
    this.batteryCompletionText = this.add
      .text(room.x + room.width / 2, room.y + 102, 'Power restored', {
        color: '#2d6a4f',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setDepth(4)
      .setOrigin(0.5)
      .setAlpha(0);
    this.successPulse = this.add.ellipse(
      this.interactionStations.machine.targetPoint.x,
      this.interactionStations.machine.targetPoint.y,
      132,
      132,
      0xa4d573,
      0,
    );
    this.successPulse.setDepth(2.5);

    this.input.keyboard?.once('keydown-ESC', () => {
      this.leaveToMenu();
    });
    this.input.keyboard?.once('keydown-M', () => {
      this.leaveToMenu();
    });
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

    const step = advancePosition(
      { x: this.player.x, y: this.player.y },
      this.readMovementInput(),
      PLAYER_SPEED,
      delta,
      this.playBounds,
      this.dashState,
    );
    const nearbyTarget = findNearbyStation({ x: step.nextPosition.x, y: step.nextPosition.y }, this.interactionStations);

    this.dashState = step.dashState;
    this.player.setPosition(step.nextPosition.x, step.nextPosition.y);
    this.player.setScale(step.dashState.isDashing ? 1.12 : step.isMoving ? 1.02 : 1);
    this.playerShadow?.setPosition(step.nextPosition.x, step.nextPosition.y + 18);
    this.playerShadow?.setScale(step.dashState.isDashing ? 1.18 : 1, step.dashState.isDashing ? 0.84 : 1);
    this.playerShadow?.setAlpha(step.dashState.isDashing ? 0.28 : step.isMoving ? 0.22 : 0.16);

    if (this.consumeInteractionQueue()) {
      this.applyBatteryInteraction(nearbyTarget);
    }

    this.refreshScenePresentation(nearbyTarget);
    this.syncDebugState(step, nearbyTarget);
  }

  public getDebugState(): GameSceneDebugState {
    return {
      batteryTask: this.debugState.batteryTask ? { ...this.debugState.batteryTask } : null,
      bounds: this.debugState.bounds ? { ...this.debugState.bounds } : null,
      player: this.debugState.player ? { ...this.debugState.player } : null,
      ready: this.debugState.ready,
    };
  }

  private applyBatteryInteraction(target: BatteryStationId | null): void {
    const interaction = resolveBatteryInteraction(this.batteryFlowState, target);

    if (!interaction.changed) {
      return;
    }

    this.batteryFlowState = interaction.nextState;

    if (interaction.action === 'install') {
      this.tweens.add({
        alpha: 0.34,
        duration: 160,
        targets: this.successPulse,
        width: 176,
        yoyo: true,
      });
      this.tweens.add({
        alpha: 1,
        duration: 220,
        ease: 'Sine.Out',
        targets: this.batteryCompletionText,
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
    const canDash = canDashWithHeldItem(this.batteryFlowState.heldItem);

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

  private refreshScenePresentation(nearbyTarget: BatteryStationId | null = null): void {
    const objectiveTarget = resolveBatteryObjectiveTarget(this.batteryFlowState);
    const prompt = getBatteryInteractionPrompt(this.batteryFlowState, nearbyTarget);

    this.interactionPrompt?.setVisible(Boolean(prompt));
    this.interactionPrompt?.setText(prompt ?? '');
    this.objectiveBanner?.setText(getObjectiveLabel(resolveBatteryObjective(this.batteryFlowState)));
    this.batteryCompletionText?.setVisible(Boolean(this.batteryCompletionText && (this.batteryFlowState.completed || this.batteryCompletionText.alpha > 0)));

    if (this.carriedBattery && this.player) {
      const heldItem = this.batteryFlowState.heldItem;

      this.carriedBattery.setVisible(heldItem !== null);

      if (heldItem !== null) {
        this.carriedBattery.setTexture(heldItem === HeldItemId.DeadBattery ? ASSET_KEYS.batteryDead : ASSET_KEYS.batteryFresh);
        this.carriedBattery.setPosition(this.player.x, this.player.y - 32);
      }
    }

    this.machineImage?.setTexture(getMachineTexture(this.batteryFlowState.machine));

    if (this.interactionStations) {
      for (const [stationId, station] of Object.entries(this.interactionStations) as [BatteryStationId, InteractionStation][]) {
        const isObjective = stationId === objectiveTarget;

        station.actionIcon.setScale(isObjective ? 1.05 : 1);
        station.actionIcon.setAlpha(isObjective ? 1 : 0.82);
      }
    }
  }

  private syncDebugState(step: MovementStep, nearbyTarget: BatteryStationId | null = null): void {
    this.debugState = {
      batteryTask: {
        completed: this.batteryFlowState.completed,
        machineState: this.batteryFlowState.machine,
        objective: resolveBatteryObjective(this.batteryFlowState),
      },
      bounds: this.playBounds ? { ...this.playBounds } : null,
      player: this.player
        ? {
            canDash: canDashWithHeldItem(this.batteryFlowState.heldItem),
            dashCooldownRemainingMs: Math.round(step.dashState.cooldownRemainingMs),
            heldItem: this.batteryFlowState.heldItem,
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
    .text(x, y + 72, label, {
      color: '#17324a',
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
    })
    .setDepth(3)
    .setOrigin(0.5);

  return {
    actionIcon: icon,
    targetPoint: { x, y },
  };
}

function findNearbyStation(position: Point2, stations: InteractionStationMap): BatteryStationId | null {
  let nearestStation: BatteryStationId | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const [stationId, station] of Object.entries(stations) as [BatteryStationId, InteractionStation][]) {
    const distance = Phaser.Math.Distance.Between(position.x, position.y, station.targetPoint.x, station.targetPoint.y);

    if (distance > INTERACT_DISTANCE || distance >= nearestDistance) {
      continue;
    }

    nearestStation = stationId;
    nearestDistance = distance;
  }

  return nearestStation;
}

function getMachineTexture(machineState: BatteryFlowState['machine']): string {
  switch (machineState) {
    case BatteryMachineStateId.DeadInstalled:
      return ASSET_KEYS.batteryMachineDead;
    case BatteryMachineStateId.Empty:
      return ASSET_KEYS.batteryMachineOpen;
    case BatteryMachineStateId.FreshInstalled:
      return ASSET_KEYS.batteryMachineFull;
  }
}

function getObjectiveLabel(objective: BatteryObjective): string {
  switch (objective) {
    case BatteryObjectiveId.RemoveDeadBattery:
      return 'Remove the dead battery';
    case BatteryObjectiveId.DiscardDeadBattery:
      return 'Discard the dead battery';
    case BatteryObjectiveId.GrabFreshBattery:
      return 'Take a fresh battery';
    case BatteryObjectiveId.InstallFreshBattery:
      return 'Install the fresh battery';
    case BatteryObjectiveId.Complete:
      return 'Battery restored';
  }
}

function renderBatteryRoom(
  scene: Phaser.Scene,
  room: Phaser.Geom.Rectangle,
  walkArea: Phaser.Geom.Rectangle,
): InteractionStationMap {
  const backdrop = scene.add.graphics();
  const centerX = room.x + room.width / 2;
  const centerY = room.y + room.height / 2;
  const machineX = centerX;
  const machineY = room.y + 192;
  const discardX = room.x + 164;
  const discardY = room.y + room.height - 134;
  const supplyX = room.x + room.width - 164;
  const supplyY = room.y + room.height - 134;

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

  const machine = createStation(scene, machineX, machineY, ASSET_KEYS.batteryMachineDead, 'Main socket');
  const discardBin = createStation(scene, discardX, discardY, ASSET_KEYS.discardBin, 'Discard bin');
  const batterySupply = createStation(scene, supplyX, supplyY, ASSET_KEYS.batterySupply, 'Fresh batteries');

  return {
    [BatteryStation.BatterySupply]: batterySupply,
    [BatteryStation.DiscardBin]: discardBin,
    [BatteryStation.Machine]: machine,
  };
}

function roundTo(value: number): number {
  return Math.round(value * 100) / 100;
}
