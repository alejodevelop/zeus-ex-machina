export const GearId = {
  LeftGear: 'left-gear',
  RightGear: 'right-gear',
} as const;

export type Gear = (typeof GearId)[keyof typeof GearId];

export const GearStatusId = {
  Grinding: 'grinding',
  Healthy: 'healthy',
  NeedsOil: 'needs-oil',
} as const;

export type GearStatus = (typeof GearStatusId)[keyof typeof GearStatusId];

export const OilingObjectiveId = {
  RefillOil: 'refill-oil',
  OilGear: 'oil-gear',
  Wait: 'wait',
} as const;

export type OilingObjective = (typeof OilingObjectiveId)[keyof typeof OilingObjectiveId];

export const OilingStationId = {
  GearLeft: 'gear-left',
  GearRight: 'gear-right',
  OilPump: 'oil-pump',
} as const;

export type OilingInteractionTarget = (typeof OilingStationId)[keyof typeof OilingStationId];

export interface GearState {
  id: Gear;
  status: GearStatus;
}

export interface OilingFlowState {
  activeGearId: Gear | null;
  completedServices: number;
  gearOrderIndex: number;
  gears: Record<Gear, GearState>;
  maxOilCharges: number;
  oilCharges: number;
  timeUntilGrindingMs: number | null;
  timeUntilNextDryMs: number;
}

export interface OilingFlowConfig {
  dryIntervalMs: number;
  grindingDelayMs: number;
}

export interface OilingAdvanceResult {
  gearStartedGrinding: boolean;
  gearTriggered: boolean;
  nextState: OilingFlowState;
}

export interface OilingInteractionResult {
  action: 'none' | 'oil' | 'refill';
  changed: boolean;
  nextState: OilingFlowState;
  objective: OilingObjective;
  objectiveTarget: OilingInteractionTarget | null;
}

export const DEFAULT_OILING_FLOW_CONFIG: OilingFlowConfig = {
  dryIntervalMs: 2200,
  grindingDelayMs: 4800,
};

export const DEFAULT_OIL_CHARGES = 3;

const GEAR_SEQUENCE: Gear[] = [GearId.LeftGear, GearId.RightGear];

export function createOilingFlowState(config: OilingFlowConfig = DEFAULT_OILING_FLOW_CONFIG): OilingFlowState {
  return {
    activeGearId: null,
    completedServices: 0,
    gearOrderIndex: 0,
    gears: {
      [GearId.LeftGear]: { id: GearId.LeftGear, status: GearStatusId.Healthy },
      [GearId.RightGear]: { id: GearId.RightGear, status: GearStatusId.Healthy },
    },
    maxOilCharges: DEFAULT_OIL_CHARGES,
    oilCharges: DEFAULT_OIL_CHARGES,
    timeUntilGrindingMs: null,
    timeUntilNextDryMs: config.dryIntervalMs,
  };
}

export function advanceOilingState(
  state: OilingFlowState,
  deltaMs: number,
  config: OilingFlowConfig = DEFAULT_OILING_FLOW_CONFIG,
): OilingAdvanceResult {
  const safeDeltaMs = Math.max(deltaMs, 0);

  if (state.activeGearId === null) {
    const timeUntilNextDryMs = Math.max(state.timeUntilNextDryMs - safeDeltaMs, 0);

    if (timeUntilNextDryMs > 0) {
      return {
        gearStartedGrinding: false,
        gearTriggered: false,
        nextState: {
          ...state,
          timeUntilNextDryMs,
        },
      };
    }

    return {
      gearStartedGrinding: false,
      gearTriggered: true,
      nextState: triggerNextDryGear(state, config),
    };
  }

  if (state.timeUntilGrindingMs === null || state.gears[state.activeGearId].status !== GearStatusId.NeedsOil) {
    return {
      gearStartedGrinding: false,
      gearTriggered: false,
      nextState: state,
    };
  }

  const timeUntilGrindingMs = Math.max(state.timeUntilGrindingMs - safeDeltaMs, 0);

  if (timeUntilGrindingMs > 0) {
    return {
      gearStartedGrinding: false,
      gearTriggered: false,
      nextState: {
        ...state,
        timeUntilGrindingMs,
      },
    };
  }

  return {
    gearStartedGrinding: true,
    gearTriggered: false,
    nextState: {
      ...state,
      gears: {
        ...state.gears,
        [state.activeGearId]: {
          ...state.gears[state.activeGearId],
          status: GearStatusId.Grinding,
        },
      },
      timeUntilGrindingMs: 0,
    },
  };
}

export function getOilingInteractionPrompt(state: OilingFlowState, target: OilingInteractionTarget | null): string | null {
  if (target === null) {
    return null;
  }

  if (target === OilingStationId.OilPump && state.oilCharges < state.maxOilCharges) {
    return 'E Refill oil';
  }

  const gearTarget = getGearTarget(state.activeGearId);

  if (target === gearTarget && state.oilCharges > 0) {
    return 'E Oil';
  }

  return null;
}

export function resolveOilingInteraction(
  state: OilingFlowState,
  target: OilingInteractionTarget | null,
  config: OilingFlowConfig = DEFAULT_OILING_FLOW_CONFIG,
): OilingInteractionResult {
  const nextState = cloneState(state);
  let action: OilingInteractionResult['action'] = 'none';

  if (target === OilingStationId.OilPump && nextState.oilCharges < nextState.maxOilCharges) {
    nextState.oilCharges = nextState.maxOilCharges;
    action = 'refill';
  } else {
    const gearTarget = getGearTarget(nextState.activeGearId);

    if (target === gearTarget && nextState.activeGearId !== null && nextState.oilCharges > 0) {
      const servicedGearId = nextState.activeGearId;

      nextState.oilCharges -= 1;
      nextState.activeGearId = null;
      nextState.completedServices += 1;
      nextState.timeUntilGrindingMs = null;
      nextState.timeUntilNextDryMs = config.dryIntervalMs;
      nextState.gears[servicedGearId] = {
        ...nextState.gears[servicedGearId],
        status: GearStatusId.Healthy,
      };
      action = 'oil';
    }
  }

  return {
    action,
    changed: action !== 'none',
    nextState,
    objective: resolveOilingObjective(nextState),
    objectiveTarget: resolveOilingObjectiveTarget(nextState),
  };
}

export function resolveOilingObjective(state: OilingFlowState): OilingObjective {
  if (state.activeGearId === null) {
    return OilingObjectiveId.Wait;
  }

  if (state.oilCharges === 0) {
    return OilingObjectiveId.RefillOil;
  }

  return OilingObjectiveId.OilGear;
}

export function resolveOilingObjectiveTarget(state: OilingFlowState): OilingInteractionTarget | null {
  const objective = resolveOilingObjective(state);

  switch (objective) {
    case OilingObjectiveId.RefillOil:
      return OilingStationId.OilPump;
    case OilingObjectiveId.OilGear:
      return getGearTarget(state.activeGearId);
    case OilingObjectiveId.Wait:
      return null;
  }
}

export function triggerNextDryGear(
  state: OilingFlowState,
  config: OilingFlowConfig = DEFAULT_OILING_FLOW_CONFIG,
): OilingFlowState {
  if (state.activeGearId !== null) {
    return state;
  }

  const activeGearId = GEAR_SEQUENCE[state.gearOrderIndex % GEAR_SEQUENCE.length];

  return {
    ...state,
    activeGearId,
    gearOrderIndex: state.gearOrderIndex + 1,
    gears: {
      ...state.gears,
      [activeGearId]: {
        ...state.gears[activeGearId],
        status: GearStatusId.NeedsOil,
      },
    },
    timeUntilGrindingMs: config.grindingDelayMs,
    timeUntilNextDryMs: 0,
  };
}

function cloneState(state: OilingFlowState): OilingFlowState {
  return {
    activeGearId: state.activeGearId,
    completedServices: state.completedServices,
    gearOrderIndex: state.gearOrderIndex,
    gears: {
      [GearId.LeftGear]: { ...state.gears[GearId.LeftGear] },
      [GearId.RightGear]: { ...state.gears[GearId.RightGear] },
    },
    maxOilCharges: state.maxOilCharges,
    oilCharges: state.oilCharges,
    timeUntilGrindingMs: state.timeUntilGrindingMs,
    timeUntilNextDryMs: state.timeUntilNextDryMs,
  };
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
