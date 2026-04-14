import { describe, expect, it } from 'vitest';

import { formatClock } from './time';

describe('formatClock', () => {
  it('pads minutes and seconds', () => {
    expect(formatClock(65)).toBe('01:05');
  });

  it('clamps negative values to zero', () => {
    expect(formatClock(-4)).toBe('00:00');
  });
});
