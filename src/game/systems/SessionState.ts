import type { RunOutcome, SessionSnapshot } from '../types/session';

interface SessionStateConfig {
  targetScore: number;
  timeLimitSeconds: number;
}

export class SessionState {
  private outcome: RunOutcome = 'in-progress';
  private remainingSeconds: number;
  private score = 0;
  private status: SessionSnapshot['status'] = 'ready';
  private readonly targetScore: number;
  private readonly timeLimitSeconds: number;

  constructor(config: SessionStateConfig) {
    this.targetScore = config.targetScore;
    this.timeLimitSeconds = config.timeLimitSeconds;
    this.remainingSeconds = config.timeLimitSeconds;
  }

  public addScore(points = 1): void {
    if (this.status === 'ended') {
      return;
    }

    this.score += points;
  }

  public markSuccess(): void {
    this.outcome = 'success';
    this.status = 'ended';
  }

  public markTimeout(): void {
    this.outcome = 'timeout';
    this.status = 'ended';
  }

  public start(): void {
    this.status = 'running';
  }

  public tick(): void {
    if (this.status !== 'running') {
      return;
    }

    this.remainingSeconds = Math.max(0, this.remainingSeconds - 1);
  }

  public get hasTimeRemaining(): boolean {
    return this.remainingSeconds > 0;
  }

  public get isTargetReached(): boolean {
    return this.score >= this.targetScore;
  }

  public get snapshot(): SessionSnapshot {
    return {
      outcome: this.outcome,
      remainingSeconds: this.remainingSeconds,
      score: this.score,
      status: this.status,
      targetScore: this.targetScore,
    };
  }

  public reset(): void {
    this.outcome = 'in-progress';
    this.remainingSeconds = this.timeLimitSeconds;
    this.score = 0;
    this.status = 'ready';
  }
}
