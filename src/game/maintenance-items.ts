export const HeldItemId = {
  DeadBattery: 'dead-battery',
  FreshBattery: 'fresh-battery',
  RepairPlate: 'repair-plate',
} as const;

export type HeldItem = (typeof HeldItemId)[keyof typeof HeldItemId] | null;

export function canDashWithHeldItem(heldItem: HeldItem): boolean {
  return heldItem === null;
}
