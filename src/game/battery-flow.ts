import { HeldItemId, type HeldItem } from './maintenance-items';

export const BatteryStation = {
  BatterySupply: 'battery-supply',
  DiscardBin: 'discard-bin',
  Machine: 'machine',
} as const;

export type BatteryStationId = (typeof BatteryStation)[keyof typeof BatteryStation];

export const BatteryMachineStateId = {
  DeadInstalled: 'dead-installed',
  Empty: 'empty',
  FreshInstalled: 'fresh-installed',
} as const;

export type BatteryMachineState = (typeof BatteryMachineStateId)[keyof typeof BatteryMachineStateId];

export const BatteryObjectiveId = {
  Complete: 'complete',
  DiscardDeadBattery: 'discard-dead-battery',
  GrabFreshBattery: 'grab-fresh-battery',
  InstallFreshBattery: 'install-fresh-battery',
  RemoveDeadBattery: 'remove-dead-battery',
} as const;

export type BatteryObjective = (typeof BatteryObjectiveId)[keyof typeof BatteryObjectiveId];

export interface BatteryFlowState {
  completed: boolean;
  machine: BatteryMachineState;
}

export interface BatteryInteractionResult {
  action: 'discard' | 'install' | 'none' | 'remove' | 'take';
  changed: boolean;
  nextHeldItem: HeldItem;
  nextState: BatteryFlowState;
  objective: BatteryObjective;
  objectiveTarget: BatteryStationId | null;
}

export function createBatteryFlowState(): BatteryFlowState {
  return {
    completed: false,
    machine: BatteryMachineStateId.DeadInstalled,
  };
}

export function resolveBatteryObjective(state: BatteryFlowState, heldItem: HeldItem): BatteryObjective {
  if (state.completed || state.machine === BatteryMachineStateId.FreshInstalled) {
    return BatteryObjectiveId.Complete;
  }

  if (state.machine === BatteryMachineStateId.DeadInstalled && heldItem === null) {
    return BatteryObjectiveId.RemoveDeadBattery;
  }

  if (heldItem === HeldItemId.DeadBattery) {
    return BatteryObjectiveId.DiscardDeadBattery;
  }

  if (state.machine === BatteryMachineStateId.Empty && heldItem === null) {
    return BatteryObjectiveId.GrabFreshBattery;
  }

  if (state.machine === BatteryMachineStateId.Empty && heldItem === HeldItemId.FreshBattery) {
    return BatteryObjectiveId.InstallFreshBattery;
  }

  return BatteryObjectiveId.RemoveDeadBattery;
}

export function resolveBatteryObjectiveTarget(state: BatteryFlowState, heldItem: HeldItem): BatteryStationId | null {
  const objective = resolveBatteryObjective(state, heldItem);

  switch (objective) {
    case BatteryObjectiveId.RemoveDeadBattery:
    case BatteryObjectiveId.InstallFreshBattery:
      return BatteryStation.Machine;
    case BatteryObjectiveId.DiscardDeadBattery:
      return BatteryStation.DiscardBin;
    case BatteryObjectiveId.GrabFreshBattery:
      return BatteryStation.BatterySupply;
    case BatteryObjectiveId.Complete:
      return null;
  }
}

export function getBatteryInteractionPrompt(
  state: BatteryFlowState,
  heldItem: HeldItem,
  target: BatteryStationId | null,
): string | null {
  if (target === null) {
    return null;
  }

  if (target === BatteryStation.Machine && state.machine === BatteryMachineStateId.DeadInstalled && heldItem === null) {
    return 'E Remove';
  }

  if (target === BatteryStation.DiscardBin && heldItem === HeldItemId.DeadBattery) {
    return 'E Discard';
  }

  if (target === BatteryStation.BatterySupply && state.machine === BatteryMachineStateId.Empty && heldItem === null) {
    return 'E Take';
  }

  if (target === BatteryStation.Machine && state.machine === BatteryMachineStateId.Empty && heldItem === HeldItemId.FreshBattery) {
    return 'E Install';
  }

  return null;
}

export function resolveBatteryInteraction(
  state: BatteryFlowState,
  heldItem: HeldItem,
  target: BatteryStationId | null,
): BatteryInteractionResult {
  const nextState: BatteryFlowState = {
    completed: state.completed,
    machine: state.machine,
  };
  let action: BatteryInteractionResult['action'] = 'none';
  let nextHeldItem = heldItem;

  if (target === BatteryStation.Machine && nextState.machine === BatteryMachineStateId.DeadInstalled && nextHeldItem === null) {
    nextHeldItem = HeldItemId.DeadBattery;
    nextState.machine = BatteryMachineStateId.Empty;
    action = 'remove';
  } else if (target === BatteryStation.DiscardBin && nextHeldItem === HeldItemId.DeadBattery) {
    nextHeldItem = null;
    action = 'discard';
  } else if (target === BatteryStation.BatterySupply && nextState.machine === BatteryMachineStateId.Empty && nextHeldItem === null) {
    nextHeldItem = HeldItemId.FreshBattery;
    action = 'take';
  } else if (target === BatteryStation.Machine && nextState.machine === BatteryMachineStateId.Empty && nextHeldItem === HeldItemId.FreshBattery) {
    nextHeldItem = null;
    nextState.machine = BatteryMachineStateId.FreshInstalled;
    nextState.completed = true;
    action = 'install';
  }

  return {
    action,
    changed: action !== 'none',
    nextHeldItem,
    nextState,
    objective: resolveBatteryObjective(nextState, nextHeldItem),
    objectiveTarget: resolveBatteryObjectiveTarget(nextState, nextHeldItem),
  };
}
