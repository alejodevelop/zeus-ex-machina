import { describe, expect, it } from 'vitest';

import {
  BatteryMachineStateId,
  BatteryObjectiveId,
  BatteryStation,
  HeldItemId,
  canDashWithHeldItem,
  createBatteryFlowState,
  getBatteryInteractionPrompt,
  resolveBatteryInteraction,
  resolveBatteryObjective,
  resolveBatteryObjectiveTarget,
} from './battery-flow';

describe('battery flow', () => {
  it('starts with a dead battery installed and the remove objective', () => {
    const state = createBatteryFlowState();

    expect(state).toEqual({
      completed: false,
      heldItem: null,
      machine: BatteryMachineStateId.DeadInstalled,
    });
    expect(resolveBatteryObjective(state)).toBe(BatteryObjectiveId.RemoveDeadBattery);
    expect(resolveBatteryObjectiveTarget(state)).toBe(BatteryStation.Machine);
  });

  it('removes the dead battery from the machine', () => {
    const result = resolveBatteryInteraction(createBatteryFlowState(), BatteryStation.Machine);

    expect(result.action).toBe('remove');
    expect(result.changed).toBe(true);
    expect(result.nextState.heldItem).toBe(HeldItemId.DeadBattery);
    expect(result.nextState.machine).toBe(BatteryMachineStateId.Empty);
    expect(result.objective).toBe(BatteryObjectiveId.DiscardDeadBattery);
  });

  it('discards the dead battery and asks for a fresh one next', () => {
    const removed = resolveBatteryInteraction(createBatteryFlowState(), BatteryStation.Machine);
    const discarded = resolveBatteryInteraction(removed.nextState, BatteryStation.DiscardBin);

    expect(discarded.action).toBe('discard');
    expect(discarded.nextState.heldItem).toBe(null);
    expect(discarded.objective).toBe(BatteryObjectiveId.GrabFreshBattery);
    expect(discarded.objectiveTarget).toBe(BatteryStation.BatterySupply);
  });

  it('takes a fresh battery only when the machine is empty and hands are free', () => {
    const emptyState = {
      completed: false,
      heldItem: null,
      machine: BatteryMachineStateId.Empty,
    };
    const taken = resolveBatteryInteraction(emptyState, BatteryStation.BatterySupply);

    expect(taken.action).toBe('take');
    expect(taken.nextState.heldItem).toBe(HeldItemId.FreshBattery);
    expect(taken.objective).toBe(BatteryObjectiveId.InstallFreshBattery);
  });

  it('installs a fresh battery and completes the slice', () => {
    const readyToInstall = {
      completed: false,
      heldItem: HeldItemId.FreshBattery,
      machine: BatteryMachineStateId.Empty,
    };
    const installed = resolveBatteryInteraction(readyToInstall, BatteryStation.Machine);

    expect(installed.action).toBe('install');
    expect(installed.nextState).toEqual({
      completed: true,
      heldItem: null,
      machine: BatteryMachineStateId.FreshInstalled,
    });
    expect(installed.objective).toBe(BatteryObjectiveId.Complete);
    expect(installed.objectiveTarget).toBe(null);
  });

  it('leaves invalid interactions as no-ops', () => {
    const state = createBatteryFlowState();
    const invalidTake = resolveBatteryInteraction(state, BatteryStation.BatterySupply);
    const invalidDiscard = resolveBatteryInteraction(state, BatteryStation.DiscardBin);

    expect(invalidTake.changed).toBe(false);
    expect(invalidTake.nextState).toEqual(state);
    expect(invalidDiscard.changed).toBe(false);
    expect(invalidDiscard.nextState).toEqual(state);
  });

  it('derives prompts only for valid nearby interactions', () => {
    const initialState = createBatteryFlowState();
    const removed = resolveBatteryInteraction(initialState, BatteryStation.Machine);

    expect(getBatteryInteractionPrompt(initialState, BatteryStation.Machine)).toBe('E Remove');
    expect(getBatteryInteractionPrompt(initialState, BatteryStation.BatterySupply)).toBe(null);
    expect(getBatteryInteractionPrompt(removed.nextState, BatteryStation.DiscardBin)).toBe('E Discard');
  });

  it('disables dash while carrying any battery', () => {
    expect(canDashWithHeldItem(null)).toBe(true);
    expect(canDashWithHeldItem(HeldItemId.DeadBattery)).toBe(false);
    expect(canDashWithHeldItem(HeldItemId.FreshBattery)).toBe(false);
  });
});
