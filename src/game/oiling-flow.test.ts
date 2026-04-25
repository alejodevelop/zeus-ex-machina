import { describe, expect, it } from 'vitest';

import {
  DEFAULT_OIL_CHARGES,
  DEFAULT_OILING_FLOW_CONFIG,
  GearId,
  GearStatusId,
  OilingObjectiveId,
  OilingStationId,
  advanceOilingState,
  createOilingFlowState,
  getOilingInteractionPrompt,
  resolveOilingInteraction,
  resolveOilingObjective,
  resolveOilingObjectiveTarget,
} from './oiling-flow';
import { HeldItemId, canDashWithHeldItem } from './maintenance-items';

const TEST_CONFIG = {
  dryIntervalMs: 200,
  grindingDelayMs: 300,
};

describe('oiling flow', () => {
  it('starts idle and waits for the next dry gear', () => {
    const state = createOilingFlowState(TEST_CONFIG);

    expect(state.activeGearId).toBe(null);
    expect(state.oilCharges).toBe(DEFAULT_OIL_CHARGES);
    expect(state.timeUntilNextDryMs).toBe(200);
    expect(resolveOilingObjective(state)).toBe(OilingObjectiveId.Wait);
  });

  it('spawns the first dry gear after the timer', () => {
    const started = createOilingFlowState(TEST_CONFIG);
    const advanced = advanceOilingState(started, 220, TEST_CONFIG);

    expect(advanced.gearTriggered).toBe(true);
    expect(advanced.nextState.activeGearId).toBe(GearId.LeftGear);
    expect(advanced.nextState.gears[GearId.LeftGear].status).toBe(GearStatusId.NeedsOil);
  });

  it('moves a dry gear into grinding if ignored', () => {
    const active = advanceOilingState(createOilingFlowState(TEST_CONFIG), 220, TEST_CONFIG).nextState;
    const grinding = advanceOilingState(active, 320, TEST_CONFIG);

    expect(grinding.gearStartedGrinding).toBe(true);
    expect(grinding.nextState.gears[GearId.LeftGear].status).toBe(GearStatusId.Grinding);
  });

  it('refills oil charges at the pump when not full', () => {
    const started = createOilingFlowState(TEST_CONFIG);
    const emptyTank = {
      ...started,
      oilCharges: 0,
    };
    const filled = resolveOilingInteraction(emptyTank, OilingStationId.OilPump, TEST_CONFIG);

    expect(filled.action).toBe('refill');
    expect(filled.nextState.oilCharges).toBe(DEFAULT_OIL_CHARGES);
    expect(filled.objective).toBe(OilingObjectiveId.Wait);
  });

  it('oils the active gear and spends one charge', () => {
    const active = advanceOilingState(createOilingFlowState(TEST_CONFIG), 220, TEST_CONFIG).nextState;
    const oiled = resolveOilingInteraction(active, OilingStationId.GearLeft, TEST_CONFIG);

    expect(oiled.action).toBe('oil');
    expect(oiled.nextState.oilCharges).toBe(DEFAULT_OIL_CHARGES - 1);
    expect(oiled.nextState.activeGearId).toBe(null);
    expect(oiled.nextState.completedServices).toBe(1);
    expect(oiled.nextState.gears[GearId.LeftGear].status).toBe(GearStatusId.Healthy);
  });

  it('requires a refill before oiling when charges are empty', () => {
    const active = advanceOilingState(createOilingFlowState(TEST_CONFIG), 220, TEST_CONFIG).nextState;
    const depleted = {
      ...active,
      oilCharges: 0,
    };
    const blocked = resolveOilingInteraction(depleted, OilingStationId.GearLeft, TEST_CONFIG);

    expect(blocked.changed).toBe(false);
    expect(blocked.objective).toBe(OilingObjectiveId.RefillOil);
    expect(blocked.objectiveTarget).toBe(OilingStationId.OilPump);
  });

  it('alternates the next active gear after a successful service', () => {
    const first = advanceOilingState(createOilingFlowState(TEST_CONFIG), 220, TEST_CONFIG).nextState;
    const serviced = resolveOilingInteraction(first, OilingStationId.GearLeft, TEST_CONFIG).nextState;
    const second = advanceOilingState(serviced, 220, TEST_CONFIG).nextState;

    expect(second.activeGearId).toBe(GearId.RightGear);
  });

  it('derives prompts and objectives from state plus oil charges', () => {
    const active = advanceOilingState(createOilingFlowState(TEST_CONFIG), 220, TEST_CONFIG).nextState;
    const depleted = {
      ...active,
      oilCharges: 0,
    };

    expect(resolveOilingObjective(active)).toBe(OilingObjectiveId.OilGear);
    expect(resolveOilingObjectiveTarget(active)).toBe(OilingStationId.GearLeft);
    expect(getOilingInteractionPrompt(active, OilingStationId.GearLeft)).toBe('E Oil');
    expect(resolveOilingObjective(depleted)).toBe(OilingObjectiveId.RefillOil);
    expect(resolveOilingObjectiveTarget(depleted)).toBe(OilingStationId.OilPump);
    expect(getOilingInteractionPrompt(depleted, OilingStationId.OilPump)).toBe('E Refill oil');
  });

  it('still allows dash with empty hands during oiling', () => {
    expect(canDashWithHeldItem(null)).toBe(true);
    expect(canDashWithHeldItem(HeldItemId.RepairPlate)).toBe(false);
    expect(DEFAULT_OILING_FLOW_CONFIG.dryIntervalMs).toBeGreaterThan(0);
  });
});
