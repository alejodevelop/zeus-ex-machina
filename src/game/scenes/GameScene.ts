import Phaser from 'phaser';

import { MachineCore } from '../entities/MachineCore';
import { type MovementState, Player } from '../entities/Player';
import { GAME_EVENTS } from '../events';
import { SessionState } from '../systems/SessionState';
import { pickSpawnPoint } from '../systems/spawn-point';
import { SceneKey } from './scene-keys';

const FLOOR_MARGIN = 70;
const TARGET_SCORE = 10;
const TIME_LIMIT_SECONDS = 35;

interface WasdKeys {
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
}

export class GameScene extends Phaser.Scene {
  private core!: MachineCore;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyboard!: Phaser.Input.Keyboard.KeyboardPlugin;
  private player!: Player;
  private resultOverlay?: Phaser.GameObjects.Container;
  private runLocked = false;
  private session!: SessionState;
  private tickEvent?: Phaser.Time.TimerEvent;
  private wasd!: WasdKeys;

  constructor() {
    super(SceneKey.Game);
  }

  public create(): void {
    const bounds = this.getPlayBounds();

    this.cameras.main.fadeIn(220, 0, 0, 0);
    this.physics.world.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
    this.drawFactoryFloor(bounds);

    this.session = new SessionState({
      targetScore: TARGET_SCORE,
      timeLimitSeconds: TIME_LIMIT_SECONDS,
    });
    this.session.start();

    this.player = new Player(this, bounds.centerX, bounds.centerY);
    this.player.setCollideWorldBounds(true);

    this.core = new MachineCore(this, bounds.centerX + 96, bounds.centerY);
    this.relocateCore();

    this.physics.add.overlap(this.player, this.core, () => {
      this.collectCore();
    });

    if (!this.input.keyboard) {
      throw new Error('Keyboard input is unavailable in GameScene.');
    }

    this.keyboard = this.input.keyboard;
    this.cursors = this.keyboard.createCursorKeys();
    this.wasd = this.keyboard.addKeys({
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W,
    }) as WasdKeys;

    this.tickEvent = this.time.addEvent({
      callback: this.handleTick,
      callbackScope: this,
      delay: 1000,
      loop: true,
    });

    this.scene.launch(SceneKey.Ui, { snapshot: this.session.snapshot });
    this.scene.bringToTop(SceneKey.Ui);
    this.publishSession();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
  }

  public update(): void {
    if (this.runLocked) {
      return;
    }

    this.player.applyMovement(this.readMovement());
  }

  private collectCore(): void {
    if (this.runLocked) {
      return;
    }

    this.session.addScore();
    this.publishSession();
    this.spawnCollectionBurst(this.core.getCenter());

    this.game.events.emit(GAME_EVENTS.coreCollected, this.session.snapshot);

    if (this.session.isTargetReached) {
      this.finishRun('success');
      return;
    }

    this.relocateCore();
  }

  private drawFactoryFloor(bounds: Phaser.Geom.Rectangle): void {
    const graphics = this.add.graphics();

    graphics.fillGradientStyle(0x081421, 0x081421, 0x03070d, 0x03070d, 1);
    graphics.fillRect(0, 0, this.scale.width, this.scale.height);

    graphics.lineStyle(1, 0x1d3550, 0.65);

    for (let x = bounds.left; x <= bounds.right; x += 48) {
      graphics.lineBetween(x, bounds.top, x, bounds.bottom);
    }

    for (let y = bounds.top; y <= bounds.bottom; y += 48) {
      graphics.lineBetween(bounds.left, y, bounds.right, y);
    }

    graphics.lineStyle(3, 0x2f4b67, 1);
    graphics.strokeRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, 18);

    const stations = [
      new Phaser.Math.Vector2(bounds.left + 54, bounds.top + 52),
      new Phaser.Math.Vector2(bounds.right - 54, bounds.top + 52),
      new Phaser.Math.Vector2(bounds.left + 54, bounds.bottom - 52),
      new Phaser.Math.Vector2(bounds.right - 54, bounds.bottom - 52),
    ];

    stations.forEach((point, index) => {
      this.add.rectangle(point.x, point.y, 94, 64, 0x0b1522, 0.96).setStrokeStyle(2, 0x365677, 1);
      this.add.image(point.x - 24, point.y, 'signal-node').setAlpha(0.8 + index * 0.05);
      this.add.rectangle(point.x + 12, point.y, 28, 10, 0x1b3047, 0.9);
      this.add.rectangle(point.x + 32, point.y, 10, 10, 0xf59e0b, 0.92);
    });
  }

  private finishRun(outcome: 'success' | 'timeout'): void {
    if (this.runLocked) {
      return;
    }

    this.runLocked = true;
    this.tickEvent?.remove(false);
    this.player.freeze();

    if (outcome === 'success') {
      this.session.markSuccess();
    } else {
      this.session.markTimeout();
    }

    this.publishSession();
    this.showResultCard(outcome);
  }

  private getPlayBounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      FLOOR_MARGIN,
      FLOOR_MARGIN,
      this.scale.width - FLOOR_MARGIN * 2,
      this.scale.height - FLOOR_MARGIN * 2,
    );
  }

  private handleShutdown(): void {
    this.resultOverlay?.destroy();

    if (this.scene.isActive(SceneKey.Ui)) {
      this.scene.stop(SceneKey.Ui);
    }
  }

  private handleTick(): void {
    this.session.tick();
    this.publishSession();

    if (!this.session.hasTimeRemaining) {
      this.finishRun('timeout');
    }
  }

  private publishSession(): void {
    this.game.events.emit(GAME_EVENTS.sessionChanged, this.session.snapshot);
  }

  private readMovement(): MovementState {
    return {
      down: this.cursors.down.isDown || this.wasd.down.isDown,
      left: this.cursors.left.isDown || this.wasd.left.isDown,
      right: this.cursors.right.isDown || this.wasd.right.isDown,
      up: this.cursors.up.isDown || this.wasd.up.isDown,
    };
  }

  private relocateCore(): void {
    const point = pickSpawnPoint(this.getPlayBounds(), 32, this.player.getCenter());
    this.core.relocate(point);
  }

  private showResultCard(outcome: 'success' | 'timeout'): void {
    const { height, width } = this.scale;
    const title = outcome === 'success' ? 'Calibration complete' : 'Shift window closed';
    const body =
      outcome === 'success'
        ? `You secured ${this.session.snapshot.score} cores with ${this.session.snapshot.remainingSeconds}s left.`
        : `You gathered ${this.session.snapshot.score} of ${this.session.snapshot.targetScore} cores before time ran out.`;

    const panel = this.add.container(width / 2, height / 2);
    const backdrop = this.add.rectangle(0, 0, 430, 220, 0x040b13, 0.92).setStrokeStyle(2, 0x365677, 1);
    const heading = this.add
      .text(0, -60, title, {
        color: outcome === 'success' ? '#f8fafc' : '#f59e0b',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const summary = this.add
      .text(0, -12, body, {
        align: 'center',
        color: '#cbd5e1',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '18px',
        wordWrap: { width: 340 },
      })
      .setOrigin(0.5);
    const restart = createActionLabel(this, -92, 66, 'Restart run');
    const menu = createActionLabel(this, 92, 66, 'Back to menu');

    restart.on('pointerup', () => {
      this.scene.restart();
    });

    menu.on('pointerup', () => {
      this.scene.stop(SceneKey.Ui);
      this.scene.start(SceneKey.Menu);
    });

    panel.add([backdrop, heading, summary, restart, menu]);
    panel.setDepth(20);
    panel.setScale(0.92);
    panel.setAlpha(0);

    this.tweens.add({
      targets: panel,
      alpha: 1,
      duration: 180,
      ease: 'Sine.Out',
      scale: 1,
    });

    this.resultOverlay = panel;

    this.keyboard.once('keydown-R', () => {
      this.scene.restart();
    });
    this.keyboard.once('keydown-M', () => {
      this.scene.stop(SceneKey.Ui);
      this.scene.start(SceneKey.Menu);
    });
  }

  private spawnCollectionBurst(origin: Phaser.Math.Vector2): void {
    const burst = this.add.container(origin.x, origin.y);

    for (let index = 0; index < 8; index += 1) {
      const spark = this.add.image(0, 0, 'spark-particle').setTint(index % 2 === 0 ? 0xf59e0b : 0x22d3ee);
      const angle = Phaser.Math.DegToRad(index * 45);
      const distance = 26 + index * 4;

      burst.add(spark);

      this.tweens.add({
        targets: spark,
        alpha: 0,
        duration: 260,
        ease: 'Sine.Out',
        scale: 0,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
      });
    }

    this.time.delayedCall(280, () => {
      burst.destroy();
    });
  }
}

function createActionLabel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
): Phaser.GameObjects.Text {
  const button = scene.add
    .text(x, y, label, {
      backgroundColor: '#102033',
      color: '#f8fafc',
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      padding: { left: 18, right: 18, top: 12, bottom: 12 },
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

  button.on('pointerover', () => {
    button.setStyle({
      backgroundColor: '#16314b',
      color: '#fef3c7',
    });
  });

  button.on('pointerout', () => {
    button.setStyle({
      backgroundColor: '#102033',
      color: '#f8fafc',
    });
  });

  return button;
}
