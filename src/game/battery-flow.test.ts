import { describe, expect, it } from 'vitest';

import {
  BatteryMachineStateId,
  BatteryObjectiveId,
  BatteryStation,
  createBatteryFlowState,
  getBatteryInteractionPrompt,
  resolveBatteryInteraction,
  resolveBatteryObjective,
  resolveBatteryObjectiveTarget,
} from './battery-flow';
import { HeldItemId, canDashWithHeldItem } from './maintenance-items';

describe('battery flow', () => {
  it('starts with a dead battery installed and the remove objective', () => {
    const state = createBatteryFlowState();

    expect(state).toEqual({
      completed: false,
      machine: BatteryMachineStateId.DeadInstalled,
    });
    expect(resolveBatteryObjective(state, null)).toBe(BatteryObjectiveId.RemoveDeadBattery);
    expect(resolveBatteryObjectiveTarget(state, null)).toBe(BatteryStation.Machine);
  });

  it('removes the dead battery from the machine', () => {
    const result = resolveBatteryInteraction(createBatteryFlowState(), null, BatteryStation.Machine);

    expect(result.action).toBe('remove');
    expect(result.changed).toBe(true);
    expect(result.nextHeldItem).toBe(HeldItemId.DeadBattery);
    expect(result.nextState.machine).toBe(BatteryMachineStateId.Empty);
    expect(result.objective).toBe(BatteryObjectiveId.DiscardDeadBattery);
  });

  it('discards the dead battery and asks for a fresh one next', () => {
    const removed = resolveBatteryInteraction(createBatteryFlowState(), null, BatteryStation.Machine);
    const discarded = resolveBatteryInteraction(removed.nextState, removed.nextHeldItem, BatteryStation.DiscardBin);

    expect(discarded.action).toBe('discard');
    expect(discarded.nextHeldItem).toBe(null);
    expect(discarded.objective).toBe(BatteryObjectiveId.GrabFreshBattery);
    expect(discarded.objectiveTarget).toBe(BatteryStation.BatterySupply);
  });

  it('takes a fresh battery only when the machine is empty and hands are free', () => {
    const emptyState = {
      completed: false,
      machine: BatteryMachineStateId.Empty,
    };
    const taken = resolveBatteryInteraction(emptyState, null, BatteryStation.BatterySupply);

    expect(taken.action).toBe('take');
    expect(taken.nextHeldItem).toBe(HeldItemId.FreshBattery);
    expect(taken.objective).toBe(BatteryObjectiveId.InstallFreshBattery);
  });

  it('installs a fresh battery and completes the slice', () => {
    const readyToInstall = {
      completed: false,
      machine: BatteryMachineStateId.Empty,
    };
    const installed = resolveBatteryInteraction(readyToInstall, HeldItemId.FreshBattery, BatteryStation.Machine);

    expect(installed.action).toBe('install');
    expect(installed.nextState).toEqual({
      completed: true,
      machine: BatteryMachineStateId.FreshInstalled,
    });
    expect(installed.nextHeldItem).toBe(null);
    expect(installed.objective).toBe(BatteryObjectiveId.Complete);
    expect(installed.objectiveTarget).toBe(null);
  });

  it('leaves invalid interactions as no-ops', () => {
    const state = createBatteryFlowState();
    const invalidTake = resolveBatteryInteraction(state, null, BatteryStation.BatterySupply);
    const invalidDiscard = resolveBatteryInteraction(state, null, BatteryStation.DiscardBin);

    expect(invalidTake.changed).toBe(false);
    expect(invalidTake.nextState).toEqual(state);
    expect(invalidTake.nextHeldItem).toBe(null);
    expect(invalidDiscard.changed).toBe(false);
    expect(invalidDiscard.nextState).toEqual(state);
  });

  it('derives prompts only for valid nearby interactions', () => {
    const initialState = createBatteryFlowState();
    const removed = resolveBatteryInteraction(initialState, null, BatteryStation.Machine);

    expect(getBatteryInteractionPrompt(initialState, null, BatteryStation.Machine)).toBe('E Remove');
    expect(getBatteryInteractionPrompt(initialState, null, BatteryStation.BatterySupply)).toBe(null);
    expect(getBatteryInteractionPrompt(removed.nextState, removed.nextHeldItem, BatteryStation.DiscardBin)).toBe('E Discard');
  });

  it('disables dash while carrying any maintenance item', () => {
    expect(canDashWithHeldItem(null)).toBe(true);
    expect(canDashWithHeldItem(HeldItemId.DeadBattery)).toBe(false);
    expect(canDashWithHeldItem(HeldItemId.FreshBattery)).toBe(false);
    expect(canDashWithHeldItem(HeldItemId.RepairPlate)).toBe(false);
  });
});
