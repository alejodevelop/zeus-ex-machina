export const HeldItemId = {
  DeadBattery: 'dead-battery',
  FreshBattery: 'fresh-battery',
  MemoryModuleEmpty: 'memory-module-empty',
  MemoryModuleReady: 'memory-module-ready',
  RepairPlate: 'repair-plate',
} as const;

export type HeldItem = (typeof HeldItemId)[keyof typeof HeldItemId] | null;

export function canDashWithHeldItem(heldItem: HeldItem): boolean {
  return heldItem === null;
}
