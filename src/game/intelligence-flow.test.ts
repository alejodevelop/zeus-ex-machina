import { describe, expect, it } from 'vitest';

import {
  DEFAULT_INTELLIGENCE_FLOW_CONFIG,
  IntelligenceMachineStateId,
  IntelligenceObjectiveId,
  IntelligenceStationId,
  IntelligenceStationStateId,
  advanceIntelligenceState,
  createIntelligenceFlowState,
  getIntelligenceInteractionPrompt,
  resolveIntelligenceInteraction,
  resolveIntelligenceObjective,
  resolveIntelligenceObjectiveTarget,
} from './intelligence-flow';
import { HeldItemId, canDashWithHeldItem } from './maintenance-items';

describe('intelligence flow', () => {
  it('starts with a depleted module installed in the main computer', () => {
    const state = createIntelligenceFlowState();

    expect(state.machine).toBe(IntelligenceMachineStateId.DepletedInstalled);
    expect(state.station).toBe(IntelligenceStationStateId.Idle);
    expect(resolveIntelligenceObjective(state, null)).toBe(IntelligenceObjectiveId.RemoveModule);
    expect(resolveIntelligenceObjectiveTarget(state, null)).toBe(IntelligenceStationId.MainComputer);
  });

  it('removes the depleted module from the main computer', () => {
    const result = resolveIntelligenceInteraction(createIntelligenceFlowState(), null, IntelligenceStationId.MainComputer);

    expect(result.action).toBe('remove');
    expect(result.nextHeldItem).toBe(HeldItemId.MemoryModuleEmpty);
    expect(result.nextState.machine).toBe(IntelligenceMachineStateId.Empty);
    expect(result.objective).toBe(IntelligenceObjectiveId.LoadStation);
  });

  it('loads the empty module into the intelligence station', () => {
    const removed = resolveIntelligenceInteraction(createIntelligenceFlowState(), null, IntelligenceStationId.MainComputer);
    const loaded = resolveIntelligenceInteraction(
      removed.nextState,
      removed.nextHeldItem,
      IntelligenceStationId.IntelligenceStation,
      DEFAULT_INTELLIGENCE_FLOW_CONFIG,
    );

    expect(loaded.action).toBe('load');
    expect(loaded.nextHeldItem).toBe(null);
    expect(loaded.nextState.station).toBe(IntelligenceStationStateId.Processing);
    expect(loaded.nextState.processingRemainingMs).toBe(DEFAULT_INTELLIGENCE_FLOW_CONFIG.processingDurationMs);
    expect(loaded.objective).toBe(IntelligenceObjectiveId.WaitForProcessing);
  });

  it('completes processing after the timer elapses', () => {
    const removed = resolveIntelligenceInteraction(createIntelligenceFlowState(), null, IntelligenceStationId.MainComputer);
    const loaded = resolveIntelligenceInteraction(
      removed.nextState,
      removed.nextHeldItem,
      IntelligenceStationId.IntelligenceStation,
      DEFAULT_INTELLIGENCE_FLOW_CONFIG,
    );
    const advanced = advanceIntelligenceState(
      loaded.nextState,
      DEFAULT_INTELLIGENCE_FLOW_CONFIG.processingDurationMs + 100,
      DEFAULT_INTELLIGENCE_FLOW_CONFIG,
    );

    expect(advanced.processingCompleted).toBe(true);
    expect(advanced.nextState.station).toBe(IntelligenceStationStateId.Ready);
    expect(advanced.nextState.processingRemainingMs).toBe(0);
  });

  it('takes the ready module and returns to the install objective', () => {
    const readyState = {
      ...createIntelligenceFlowState(),
      machine: IntelligenceMachineStateId.Empty,
      processingRemainingMs: 0,
      station: IntelligenceStationStateId.Ready,
    };
    const taken = resolveIntelligenceInteraction(readyState, null, IntelligenceStationId.IntelligenceStation);

    expect(taken.action).toBe('take-ready');
    expect(taken.nextHeldItem).toBe(HeldItemId.MemoryModuleReady);
    expect(taken.nextState.station).toBe(IntelligenceStationStateId.Idle);
    expect(taken.objective).toBe(IntelligenceObjectiveId.InstallModule);
    expect(taken.objectiveTarget).toBe(IntelligenceStationId.MainComputer);
  });

  it('installs the ready module and completes the sandbox', () => {
    const state = {
      ...createIntelligenceFlowState(),
      machine: IntelligenceMachineStateId.Empty,
      station: IntelligenceStationStateId.Idle,
    };
    const installed = resolveIntelligenceInteraction(state, HeldItemId.MemoryModuleReady, IntelligenceStationId.MainComputer);

    expect(installed.action).toBe('install');
    expect(installed.nextHeldItem).toBe(null);
    expect(installed.nextState.completed).toBe(true);
    expect(installed.nextState.machine).toBe(IntelligenceMachineStateId.Restored);
    expect(installed.objective).toBe(IntelligenceObjectiveId.Complete);
  });

  it('derives prompts only for valid interactions', () => {
    const initial = createIntelligenceFlowState();
    const waiting = {
      ...initial,
      machine: IntelligenceMachineStateId.Empty,
      processingRemainingMs: 1000,
      station: IntelligenceStationStateId.Processing,
    };

    expect(getIntelligenceInteractionPrompt(initial, null, IntelligenceStationId.MainComputer)).toBe('E Remove');
    expect(getIntelligenceInteractionPrompt(waiting, null, IntelligenceStationId.IntelligenceStation)).toBe(null);
    expect(resolveIntelligenceObjective(waiting, null)).toBe(IntelligenceObjectiveId.WaitForProcessing);
  });

  it('disables dash while carrying either module state', () => {
    expect(canDashWithHeldItem(null)).toBe(true);
    expect(canDashWithHeldItem(HeldItemId.MemoryModuleEmpty)).toBe(false);
    expect(canDashWithHeldItem(HeldItemId.MemoryModuleReady)).toBe(false);
  });
});
