import Phaser from 'phaser';

import { GAME_EVENTS } from '../events';
import type { SessionSnapshot } from '../types/session';
import { formatClock } from '../utils/time';
import { SceneKey } from './scene-keys';

interface UiSceneData {
  snapshot?: SessionSnapshot;
}

export class UiScene extends Phaser.Scene {
  private objectiveText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKey.Ui);
  }

  public create(data: UiSceneData): void {
    const initialSnapshot = data.snapshot ?? {
      outcome: 'in-progress',
      remainingSeconds: 0,
      score: 0,
      status: 'ready',
      targetScore: 0,
    };

    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

    this.add.rectangle(146, 48, 232, 66, 0x05101b, 0.84).setStrokeStyle(1, 0x2f4b67, 1);
    this.add.rectangle(this.scale.width - 118, 48, 190, 66, 0x05101b, 0.84).setStrokeStyle(1, 0x2f4b67, 1);

    this.scoreText = this.add
      .text(56, 26, '', {
        color: '#f8fafc',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    this.objectiveText = this.add
      .text(56, 54, '', {
        color: '#8aa4bf',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '15px',
      })
      .setOrigin(0, 0.5);

    this.timerText = this.add
      .text(this.scale.width - 118, 40, '', {
        color: '#f59e0b',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const syncSnapshot = (snapshot: SessionSnapshot): void => {
      this.renderSnapshot(snapshot);
    };

    const flashScore = (): void => {
      this.tweens.add({
        targets: this.scoreText,
        duration: 140,
        ease: 'Sine.Out',
        scaleX: 1.08,
        scaleY: 1.08,
        yoyo: true,
      });
    };

    this.game.events.on(GAME_EVENTS.sessionChanged, syncSnapshot);
    this.game.events.on(GAME_EVENTS.coreCollected, flashScore);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(GAME_EVENTS.sessionChanged, syncSnapshot);
      this.game.events.off(GAME_EVENTS.coreCollected, flashScore);
    });

    this.renderSnapshot(initialSnapshot);
  }

  private renderSnapshot(snapshot: SessionSnapshot): void {
    this.scoreText.setText(`Cores ${snapshot.score}/${snapshot.targetScore}`);
    this.timerText.setText(formatClock(snapshot.remainingSeconds));

    if (snapshot.status === 'ended' && snapshot.outcome === 'success') {
      this.objectiveText.setText('Shift stable. Restart or head back to the menu.');
      this.timerText.setColor('#22d3ee');
      return;
    }

    if (snapshot.status === 'ended' && snapshot.outcome === 'timeout') {
      this.objectiveText.setText('Time expired. Restart or return to the menu.');
      this.timerText.setColor('#f59e0b');
      return;
    }

    this.objectiveText.setText('Collect the roaming machine core before the timer closes.');
    this.timerText.setColor(snapshot.remainingSeconds <= 10 ? '#f97316' : '#f59e0b');
  }
}
