import { HeldItemId, type HeldItem } from './maintenance-items';

export const CrackSiteId = {
  LeftLane: 'left-lane',
  RightLane: 'right-lane',
} as const;

export type CrackSite = (typeof CrackSiteId)[keyof typeof CrackSiteId];

export const CrackStatusId = {
  Blocked: 'blocked',
  Idle: 'idle',
  Patched: 'patched',
  Warning: 'warning',
} as const;

export type CrackStatus = (typeof CrackStatusId)[keyof typeof CrackStatusId];

export const CracksObjectiveId = {
  GrabRepairPlate: 'grab-repair-plate',
  RepairCrack: 'repair-crack',
  Wait: 'wait',
} as const;

export type CracksObjective = (typeof CracksObjectiveId)[keyof typeof CracksObjectiveId];

export const CrackStationId = {
  CrackLeft: 'crack-left',
  CrackRight: 'crack-right',
  RepairPlateSupply: 'repair-plate-supply',
} as const;

export type CrackInteractionTarget = (typeof CrackStationId)[keyof typeof CrackStationId];

export interface CrackSiteState {
  id: CrackSite;
  status: CrackStatus;
}

export interface CracksFlowState {
  activeSiteId: CrackSite | null;
  completedRepairs: number;
  siteOrderIndex: number;
  sites: Record<CrackSite, CrackSiteState>;
  timeUntilBlockedMs: number | null;
  timeUntilNextCrackMs: number;
}

export interface CracksFlowConfig {
  spawnIntervalMs: number;
  warningDurationMs: number;
}

export interface CracksAdvanceResult {
  becameBlocked: boolean;
  crackTriggered: boolean;
  nextState: CracksFlowState;
}

export interface CracksInteractionResult {
  action: 'none' | 'repair' | 'take-plate';
  changed: boolean;
  nextHeldItem: HeldItem;
  nextState: CracksFlowState;
  objective: CracksObjective;
  objectiveTarget: CrackInteractionTarget | null;
}

export const DEFAULT_CRACKS_FLOW_CONFIG: CracksFlowConfig = {
  spawnIntervalMs: 2400,
  warningDurationMs: 3200,
};

const CRACK_SITE_SEQUENCE: CrackSite[] = [CrackSiteId.LeftLane, CrackSiteId.RightLane];

export function createCracksFlowState(config: CracksFlowConfig = DEFAULT_CRACKS_FLOW_CONFIG): CracksFlowState {
  return {
    activeSiteId: null,
    completedRepairs: 0,
    siteOrderIndex: 0,
    sites: {
      [CrackSiteId.LeftLane]: { id: CrackSiteId.LeftLane, status: CrackStatusId.Idle },
      [CrackSiteId.RightLane]: { id: CrackSiteId.RightLane, status: CrackStatusId.Idle },
    },
    timeUntilBlockedMs: null,
    timeUntilNextCrackMs: config.spawnIntervalMs,
  };
}

export function advanceCracksState(
  state: CracksFlowState,
  deltaMs: number,
  config: CracksFlowConfig = DEFAULT_CRACKS_FLOW_CONFIG,
): CracksAdvanceResult {
  const safeDeltaMs = Math.max(deltaMs, 0);

  if (state.activeSiteId === null) {
    const timeUntilNextCrackMs = Math.max(state.timeUntilNextCrackMs - safeDeltaMs, 0);

    if (timeUntilNextCrackMs > 0) {
      return {
        becameBlocked: false,
        crackTriggered: false,
        nextState: {
          ...state,
          timeUntilNextCrackMs,
        },
      };
    }

    return {
      becameBlocked: false,
      crackTriggered: true,
      nextState: triggerNextCrack(state, config),
    };
  }

  if (state.timeUntilBlockedMs === null || state.sites[state.activeSiteId].status !== CrackStatusId.Warning) {
    return {
      becameBlocked: false,
      crackTriggered: false,
      nextState: state,
    };
  }

  const timeUntilBlockedMs = Math.max(state.timeUntilBlockedMs - safeDeltaMs, 0);

  if (timeUntilBlockedMs > 0) {
    return {
      becameBlocked: false,
      crackTriggered: false,
      nextState: {
        ...state,
        timeUntilBlockedMs,
      },
    };
  }

  return {
    becameBlocked: true,
    crackTriggered: false,
    nextState: {
      ...state,
      sites: {
        ...state.sites,
        [state.activeSiteId]: {
          ...state.sites[state.activeSiteId],
          status: CrackStatusId.Blocked,
        },
      },
      timeUntilBlockedMs: 0,
    },
  };
}

export function getCracksInteractionPrompt(
  state: CracksFlowState,
  heldItem: HeldItem,
  target: CrackInteractionTarget | null,
): string | null {
  if (target === null) {
    return null;
  }

  if (target === CrackStationId.RepairPlateSupply && state.activeSiteId !== null && heldItem === null) {
    return 'E Take plate';
  }

  const crackTarget = getCrackTarget(state.activeSiteId);

  if (target === crackTarget && heldItem === HeldItemId.RepairPlate) {
    return 'E Patch';
  }

  return null;
}

export function isCrackBlocking(state: CracksFlowState, siteId: CrackSite): boolean {
  return state.sites[siteId].status === CrackStatusId.Blocked;
}

export function resolveCracksInteraction(
  state: CracksFlowState,
  heldItem: HeldItem,
  target: CrackInteractionTarget | null,
  config: CracksFlowConfig = DEFAULT_CRACKS_FLOW_CONFIG,
): CracksInteractionResult {
  const nextState = cloneState(state);
  let nextHeldItem = heldItem;
  let action: CracksInteractionResult['action'] = 'none';

  if (target === CrackStationId.RepairPlateSupply && nextState.activeSiteId !== null && nextHeldItem === null) {
    nextHeldItem = HeldItemId.RepairPlate;
    action = 'take-plate';
  } else {
    const crackTarget = getCrackTarget(nextState.activeSiteId);

    if (target === crackTarget && nextState.activeSiteId !== null && nextHeldItem === HeldItemId.RepairPlate) {
      const repairedSiteId = nextState.activeSiteId;

      nextHeldItem = null;
      nextState.activeSiteId = null;
      nextState.completedRepairs += 1;
      nextState.timeUntilBlockedMs = null;
      nextState.timeUntilNextCrackMs = config.spawnIntervalMs;
      nextState.sites[repairedSiteId] = {
        ...nextState.sites[repairedSiteId],
        status: CrackStatusId.Patched,
      };
      action = 'repair';
    }
  }

  return {
    action,
    changed: action !== 'none',
    nextHeldItem,
    nextState,
    objective: resolveCracksObjective(nextState, nextHeldItem),
    objectiveTarget: resolveCracksObjectiveTarget(nextState, nextHeldItem),
  };
}

export function resolveCracksObjective(state: CracksFlowState, heldItem: HeldItem): CracksObjective {
  if (state.activeSiteId === null) {
    return CracksObjectiveId.Wait;
  }

  if (heldItem === HeldItemId.RepairPlate) {
    return CracksObjectiveId.RepairCrack;
  }

  return CracksObjectiveId.GrabRepairPlate;
}

export function resolveCracksObjectiveTarget(state: CracksFlowState, heldItem: HeldItem): CrackInteractionTarget | null {
  const objective = resolveCracksObjective(state, heldItem);

  switch (objective) {
    case CracksObjectiveId.GrabRepairPlate:
      return CrackStationId.RepairPlateSupply;
    case CracksObjectiveId.RepairCrack:
      return getCrackTarget(state.activeSiteId);
    case CracksObjectiveId.Wait:
      return null;
  }
}

export function triggerNextCrack(
  state: CracksFlowState,
  config: CracksFlowConfig = DEFAULT_CRACKS_FLOW_CONFIG,
): CracksFlowState {
  if (state.activeSiteId !== null) {
    return state;
  }

  const activeSiteId = CRACK_SITE_SEQUENCE[state.siteOrderIndex % CRACK_SITE_SEQUENCE.length];

  return {
    ...state,
    activeSiteId,
    siteOrderIndex: state.siteOrderIndex + 1,
    sites: {
      ...state.sites,
      [activeSiteId]: {
        ...state.sites[activeSiteId],
        status: CrackStatusId.Warning,
      },
    },
    timeUntilBlockedMs: config.warningDurationMs,
    timeUntilNextCrackMs: 0,
  };
}

function cloneState(state: CracksFlowState): CracksFlowState {
  return {
    activeSiteId: state.activeSiteId,
    completedRepairs: state.completedRepairs,
    siteOrderIndex: state.siteOrderIndex,
    sites: {
      [CrackSiteId.LeftLane]: { ...state.sites[CrackSiteId.LeftLane] },
      [CrackSiteId.RightLane]: { ...state.sites[CrackSiteId.RightLane] },
    },
    timeUntilBlockedMs: state.timeUntilBlockedMs,
    timeUntilNextCrackMs: state.timeUntilNextCrackMs,
  };
}

function getCrackTarget(siteId: CrackSite | null): CrackInteractionTarget | null {
  switch (siteId) {
    case CrackSiteId.LeftLane:
      return CrackStationId.CrackLeft;
    case CrackSiteId.RightLane:
      return CrackStationId.CrackRight;
    case null:
      return null;
  }
}
