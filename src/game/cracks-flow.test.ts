import { describe, expect, it } from 'vitest';

import {
  CrackSiteId,
  CrackStationId,
  CrackStatusId,
  CracksObjectiveId,
  advanceCracksState,
  createCracksFlowState,
  getCracksInteractionPrompt,
  isCrackBlocking,
  resolveCracksInteraction,
  resolveCracksObjective,
  resolveCracksObjectiveTarget,
} from './cracks-flow';
import { HeldItemId } from './maintenance-items';

const TEST_CONFIG = {
  spawnIntervalMs: 200,
  warningDurationMs: 300,
};

describe('cracks flow', () => {
  it('starts idle and waits for the first crack timer', () => {
    const state = createCracksFlowState(TEST_CONFIG);

    expect(state.activeSiteId).toBe(null);
    expect(state.timeUntilNextCrackMs).toBe(200);
    expect(resolveCracksObjective(state, null)).toBe(CracksObjectiveId.Wait);
  });

  it('spawns a crack after the spawn timer expires', () => {
    const started = createCracksFlowState(TEST_CONFIG);
    const advanced = advanceCracksState(started, 220, TEST_CONFIG);

    expect(advanced.crackTriggered).toBe(true);
    expect(advanced.nextState.activeSiteId).toBe(CrackSiteId.LeftLane);
    expect(advanced.nextState.sites[CrackSiteId.LeftLane].status).toBe(CrackStatusId.Warning);
    expect(advanced.nextState.timeUntilBlockedMs).toBe(300);
  });

  it('turns a warning crack into blocked after the warning timer expires', () => {
    const triggered = advanceCracksState(createCracksFlowState(TEST_CONFIG), 220, TEST_CONFIG).nextState;
    const blocked = advanceCracksState(triggered, 320, TEST_CONFIG);

    expect(blocked.becameBlocked).toBe(true);
    expect(blocked.nextState.sites[CrackSiteId.LeftLane].status).toBe(CrackStatusId.Blocked);
    expect(isCrackBlocking(blocked.nextState, CrackSiteId.LeftLane)).toBe(true);
  });

  it('lets the player take a plate only with empty hands while a crack is active', () => {
    const triggered = advanceCracksState(createCracksFlowState(TEST_CONFIG), 220, TEST_CONFIG).nextState;
    const taken = resolveCracksInteraction(triggered, null, CrackStationId.RepairPlateSupply, TEST_CONFIG);
    const blocked = resolveCracksInteraction(triggered, HeldItemId.DeadBattery, CrackStationId.RepairPlateSupply, TEST_CONFIG);

    expect(taken.action).toBe('take-plate');
    expect(taken.nextHeldItem).toBe(HeldItemId.RepairPlate);
    expect(blocked.changed).toBe(false);
  });

  it('repairs the active crack and schedules the next spawn', () => {
    const triggered = advanceCracksState(createCracksFlowState(TEST_CONFIG), 220, TEST_CONFIG).nextState;
    const repaired = resolveCracksInteraction(triggered, HeldItemId.RepairPlate, CrackStationId.CrackLeft, TEST_CONFIG);

    expect(repaired.action).toBe('repair');
    expect(repaired.nextHeldItem).toBe(null);
    expect(repaired.nextState.activeSiteId).toBe(null);
    expect(repaired.nextState.sites[CrackSiteId.LeftLane].status).toBe(CrackStatusId.Patched);
    expect(repaired.nextState.timeUntilNextCrackMs).toBe(200);
  });

  it('cycles to the other crack site on the next spawn', () => {
    const first = advanceCracksState(createCracksFlowState(TEST_CONFIG), 220, TEST_CONFIG).nextState;
    const repaired = resolveCracksInteraction(first, HeldItemId.RepairPlate, CrackStationId.CrackLeft, TEST_CONFIG).nextState;
    const second = advanceCracksState(repaired, 220, TEST_CONFIG).nextState;

    expect(second.activeSiteId).toBe(CrackSiteId.RightLane);
  });

  it('derives prompts and objective targets from crack state plus held item', () => {
    const triggered = advanceCracksState(createCracksFlowState(TEST_CONFIG), 220, TEST_CONFIG).nextState;

    expect(resolveCracksObjective(triggered, null)).toBe(CracksObjectiveId.GrabRepairPlate);
    expect(resolveCracksObjectiveTarget(triggered, null)).toBe(CrackStationId.RepairPlateSupply);
    expect(getCracksInteractionPrompt(triggered, null, CrackStationId.RepairPlateSupply)).toBe('E Take plate');
    expect(resolveCracksObjective(triggered, HeldItemId.RepairPlate)).toBe(CracksObjectiveId.RepairCrack);
    expect(resolveCracksObjectiveTarget(triggered, HeldItemId.RepairPlate)).toBe(CrackStationId.CrackLeft);
    expect(getCracksInteractionPrompt(triggered, HeldItemId.RepairPlate, CrackStationId.CrackLeft)).toBe('E Patch');
  });

  it('keeps warning cracks passable until they become blocked', () => {
    const triggered = advanceCracksState(createCracksFlowState(TEST_CONFIG), 220, TEST_CONFIG).nextState;

    expect(isCrackBlocking(triggered, CrackSiteId.LeftLane)).toBe(false);
  });
});
