export type RunStatus = 'ready' | 'running' | 'ended';
export type RunOutcome = 'in-progress' | 'success' | 'timeout';

export interface SessionSnapshot {
  outcome: RunOutcome;
  remainingSeconds: number;
  score: number;
  status: RunStatus;
  targetScore: number;
}
