import { HeldItemId, type HeldItem } from './maintenance-items';

export const IntelligenceMachineStateId = {
  DepletedInstalled: 'depleted-installed',
  Empty: 'empty',
  Restored: 'restored',
} as const;

export type IntelligenceMachineState =
  (typeof IntelligenceMachineStateId)[keyof typeof IntelligenceMachineStateId];

export const IntelligenceStationStateId = {
  Idle: 'idle',
  Processing: 'processing',
  Ready: 'ready',
} as const;

export type IntelligenceStationState =
  (typeof IntelligenceStationStateId)[keyof typeof IntelligenceStationStateId];

export const IntelligenceObjectiveId = {
  Complete: 'complete',
  InstallModule: 'install-module',
  LoadStation: 'load-station',
  RemoveModule: 'remove-module',
  TakeReadyModule: 'take-ready-module',
  WaitForProcessing: 'wait-for-processing',
} as const;

export type IntelligenceObjective = (typeof IntelligenceObjectiveId)[keyof typeof IntelligenceObjectiveId];

export const IntelligenceStationId = {
  IntelligenceStation: 'intelligence-station',
  MainComputer: 'main-computer',
} as const;

export type IntelligenceInteractionTarget =
  (typeof IntelligenceStationId)[keyof typeof IntelligenceStationId];

export interface IntelligenceFlowState {
  completed: boolean;
  machine: IntelligenceMachineState;
  processingRemainingMs: number | null;
  station: IntelligenceStationState;
}

export interface IntelligenceFlowConfig {
  processingDurationMs: number;
}

export interface IntelligenceAdvanceResult {
  nextState: IntelligenceFlowState;
  processingCompleted: boolean;
}

export interface IntelligenceInteractionResult {
  action: 'install' | 'load' | 'none' | 'remove' | 'take-ready';
  changed: boolean;
  nextHeldItem: HeldItem;
  nextState: IntelligenceFlowState;
  objective: IntelligenceObjective;
  objectiveTarget: IntelligenceInteractionTarget | null;
}

export const DEFAULT_INTELLIGENCE_FLOW_CONFIG: IntelligenceFlowConfig = {
  processingDurationMs: 4200,
};

export function createIntelligenceFlowState(): IntelligenceFlowState {
  return {
    completed: false,
    machine: IntelligenceMachineStateId.DepletedInstalled,
    processingRemainingMs: null,
    station: IntelligenceStationStateId.Idle,
  };
}

export function advanceIntelligenceState(
  state: IntelligenceFlowState,
  deltaMs: number,
  _config: IntelligenceFlowConfig = DEFAULT_INTELLIGENCE_FLOW_CONFIG,
): IntelligenceAdvanceResult {
  if (state.station !== IntelligenceStationStateId.Processing || state.processingRemainingMs === null) {
    return {
      nextState: state,
      processingCompleted: false,
    };
  }

  const safeDeltaMs = Math.max(deltaMs, 0);
  const processingRemainingMs = Math.max(state.processingRemainingMs - safeDeltaMs, 0);

  if (processingRemainingMs > 0) {
    return {
      nextState: {
        ...state,
        processingRemainingMs,
      },
      processingCompleted: false,
    };
  }

  return {
    nextState: {
      ...state,
      processingRemainingMs: 0,
      station: IntelligenceStationStateId.Ready,
    },
    processingCompleted: true,
  };
}

export function resolveIntelligenceObjective(
  state: IntelligenceFlowState,
  heldItem: HeldItem,
): IntelligenceObjective {
  if (state.completed || state.machine === IntelligenceMachineStateId.Restored) {
    return IntelligenceObjectiveId.Complete;
  }

  if (state.machine === IntelligenceMachineStateId.DepletedInstalled && heldItem === null) {
    return IntelligenceObjectiveId.RemoveModule;
  }

  if (heldItem === HeldItemId.MemoryModuleEmpty) {
    return IntelligenceObjectiveId.LoadStation;
  }

  if (state.station === IntelligenceStationStateId.Processing) {
    return IntelligenceObjectiveId.WaitForProcessing;
  }

  if (state.station === IntelligenceStationStateId.Ready && heldItem === null) {
    return IntelligenceObjectiveId.TakeReadyModule;
  }

  if (heldItem === HeldItemId.MemoryModuleReady && state.machine === IntelligenceMachineStateId.Empty) {
    return IntelligenceObjectiveId.InstallModule;
  }

  return IntelligenceObjectiveId.RemoveModule;
}

export function resolveIntelligenceObjectiveTarget(
  state: IntelligenceFlowState,
  heldItem: HeldItem,
): IntelligenceInteractionTarget | null {
  const objective = resolveIntelligenceObjective(state, heldItem);

  switch (objective) {
    case IntelligenceObjectiveId.RemoveModule:
    case IntelligenceObjectiveId.InstallModule:
      return IntelligenceStationId.MainComputer;
    case IntelligenceObjectiveId.LoadStation:
    case IntelligenceObjectiveId.TakeReadyModule:
      return IntelligenceStationId.IntelligenceStation;
    case IntelligenceObjectiveId.WaitForProcessing:
    case IntelligenceObjectiveId.Complete:
      return null;
  }
}

export function getIntelligenceInteractionPrompt(
  state: IntelligenceFlowState,
  heldItem: HeldItem,
  target: IntelligenceInteractionTarget | null,
): string | null {
  if (target === null) {
    return null;
  }

  if (
    target === IntelligenceStationId.MainComputer &&
    state.machine === IntelligenceMachineStateId.DepletedInstalled &&
    heldItem === null
  ) {
    return 'E Remove';
  }

  if (
    target === IntelligenceStationId.IntelligenceStation &&
    state.station === IntelligenceStationStateId.Idle &&
    heldItem === HeldItemId.MemoryModuleEmpty
  ) {
    return 'E Load';
  }

  if (
    target === IntelligenceStationId.IntelligenceStation &&
    state.station === IntelligenceStationStateId.Ready &&
    heldItem === null
  ) {
    return 'E Take module';
  }

  if (
    target === IntelligenceStationId.MainComputer &&
    state.machine === IntelligenceMachineStateId.Empty &&
    heldItem === HeldItemId.MemoryModuleReady
  ) {
    return 'E Install';
  }

  return null;
}

export function resolveIntelligenceInteraction(
  state: IntelligenceFlowState,
  heldItem: HeldItem,
  target: IntelligenceInteractionTarget | null,
  config: IntelligenceFlowConfig = DEFAULT_INTELLIGENCE_FLOW_CONFIG,
): IntelligenceInteractionResult {
  const nextState = cloneState(state);
  let action: IntelligenceInteractionResult['action'] = 'none';
  let nextHeldItem = heldItem;

  if (
    target === IntelligenceStationId.MainComputer &&
    nextState.machine === IntelligenceMachineStateId.DepletedInstalled &&
    nextHeldItem === null
  ) {
    nextHeldItem = HeldItemId.MemoryModuleEmpty;
    nextState.machine = IntelligenceMachineStateId.Empty;
    action = 'remove';
  } else if (
    target === IntelligenceStationId.IntelligenceStation &&
    nextState.station === IntelligenceStationStateId.Idle &&
    nextHeldItem === HeldItemId.MemoryModuleEmpty
  ) {
    nextHeldItem = null;
    nextState.processingRemainingMs = config.processingDurationMs;
    nextState.station = IntelligenceStationStateId.Processing;
    action = 'load';
  } else if (
    target === IntelligenceStationId.IntelligenceStation &&
    nextState.station === IntelligenceStationStateId.Ready &&
    nextHeldItem === null
  ) {
    nextHeldItem = HeldItemId.MemoryModuleReady;
    nextState.processingRemainingMs = null;
    nextState.station = IntelligenceStationStateId.Idle;
    action = 'take-ready';
  } else if (
    target === IntelligenceStationId.MainComputer &&
    nextState.machine === IntelligenceMachineStateId.Empty &&
    nextHeldItem === HeldItemId.MemoryModuleReady
  ) {
    nextHeldItem = null;
    nextState.completed = true;
    nextState.machine = IntelligenceMachineStateId.Restored;
    action = 'install';
  }

  return {
    action,
    changed: action !== 'none',
    nextHeldItem,
    nextState,
    objective: resolveIntelligenceObjective(nextState, nextHeldItem),
    objectiveTarget: resolveIntelligenceObjectiveTarget(nextState, nextHeldItem),
  };
}

function cloneState(state: IntelligenceFlowState): IntelligenceFlowState {
  return {
    completed: state.completed,
    machine: state.machine,
    processingRemainingMs: state.processingRemainingMs,
    station: state.station,
  };
}
