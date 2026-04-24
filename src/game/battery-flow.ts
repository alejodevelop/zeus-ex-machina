export const BatteryStation = {
  BatterySupply: 'battery-supply',
  DiscardBin: 'discard-bin',
  Machine: 'machine',
} as const;

export type BatteryStationId = (typeof BatteryStation)[keyof typeof BatteryStation];

export const HeldItemId = {
  DeadBattery: 'dead-battery',
  FreshBattery: 'fresh-battery',
} as const;

export type HeldItem = (typeof HeldItemId)[keyof typeof HeldItemId] | null;

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
  heldItem: HeldItem;
  machine: BatteryMachineState;
}

export interface BatteryInteractionResult {
  action: 'discard' | 'install' | 'none' | 'remove' | 'take';
  changed: boolean;
  nextState: BatteryFlowState;
  objective: BatteryObjective;
  objectiveTarget: BatteryStationId | null;
}

export function createBatteryFlowState(): BatteryFlowState {
  return {
    completed: false,
    heldItem: null,
    machine: BatteryMachineStateId.DeadInstalled,
  };
}

export function canDashWithHeldItem(heldItem: HeldItem): boolean {
  return heldItem === null;
}

export function resolveBatteryObjective(state: BatteryFlowState): BatteryObjective {
  if (state.completed || state.machine === BatteryMachineStateId.FreshInstalled) {
    return BatteryObjectiveId.Complete;
  }

  if (state.machine === BatteryMachineStateId.DeadInstalled && state.heldItem === null) {
    return BatteryObjectiveId.RemoveDeadBattery;
  }

  if (state.heldItem === HeldItemId.DeadBattery) {
    return BatteryObjectiveId.DiscardDeadBattery;
  }

  if (state.machine === BatteryMachineStateId.Empty && state.heldItem === null) {
    return BatteryObjectiveId.GrabFreshBattery;
  }

  if (state.machine === BatteryMachineStateId.Empty && state.heldItem === HeldItemId.FreshBattery) {
    return BatteryObjectiveId.InstallFreshBattery;
  }

  return BatteryObjectiveId.RemoveDeadBattery;
}

export function resolveBatteryObjectiveTarget(state: BatteryFlowState): BatteryStationId | null {
  const objective = resolveBatteryObjective(state);

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
  target: BatteryStationId | null,
): string | null {
  if (target === null) {
    return null;
  }

  if (target === BatteryStation.Machine && state.machine === BatteryMachineStateId.DeadInstalled && state.heldItem === null) {
    return 'E Remove';
  }

  if (target === BatteryStation.DiscardBin && state.heldItem === HeldItemId.DeadBattery) {
    return 'E Discard';
  }

  if (target === BatteryStation.BatterySupply && state.machine === BatteryMachineStateId.Empty && state.heldItem === null) {
    return 'E Take';
  }

  if (target === BatteryStation.Machine && state.machine === BatteryMachineStateId.Empty && state.heldItem === HeldItemId.FreshBattery) {
    return 'E Install';
  }

  return null;
}

export function resolveBatteryInteraction(
  state: BatteryFlowState,
  target: BatteryStationId | null,
): BatteryInteractionResult {
  const nextState: BatteryFlowState = {
    completed: state.completed,
    heldItem: state.heldItem,
    machine: state.machine,
  };
  let action: BatteryInteractionResult['action'] = 'none';

  if (target === BatteryStation.Machine && nextState.machine === BatteryMachineStateId.DeadInstalled && nextState.heldItem === null) {
    nextState.heldItem = HeldItemId.DeadBattery;
    nextState.machine = BatteryMachineStateId.Empty;
    action = 'remove';
  } else if (target === BatteryStation.DiscardBin && nextState.heldItem === HeldItemId.DeadBattery) {
    nextState.heldItem = null;
    action = 'discard';
  } else if (
    target === BatteryStation.BatterySupply &&
    nextState.machine === BatteryMachineStateId.Empty &&
    nextState.heldItem === null
  ) {
    nextState.heldItem = HeldItemId.FreshBattery;
    action = 'take';
  } else if (
    target === BatteryStation.Machine &&
    nextState.machine === BatteryMachineStateId.Empty &&
    nextState.heldItem === HeldItemId.FreshBattery
  ) {
    nextState.heldItem = null;
    nextState.machine = BatteryMachineStateId.FreshInstalled;
    nextState.completed = true;
    action = 'install';
  }

  return {
    action,
    changed: action !== 'none',
    nextState,
    objective: resolveBatteryObjective(nextState),
    objectiveTarget: resolveBatteryObjectiveTarget(nextState),
  };
}
