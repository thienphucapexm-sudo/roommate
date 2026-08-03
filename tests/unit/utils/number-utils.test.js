import { describe, expect, it } from 'vitest';
import { safeParseNumber } from '../../../src/utils/number-utils.js';

describe('safeParseNumber', () => {
  it('parses numbers and formatted numeric strings', () => {
    expect(safeParseNumber(42)).toBe(42);
    expect(safeParseNumber('1,250.5')).toBe(1250.5);
  });

  it('keeps valid boundary values such as zero and negative values', () => {
    expect(safeParseNumber(0)).toBe(0);
    expect(safeParseNumber('-10')).toBe(-10);
  });

  it('uses the supplied default for empty and invalid values', () => {
    expect(safeParseNumber('', 99)).toBe(99);
    expect(safeParseNumber(null, 99)).toBe(99);
    expect(safeParseNumber('abc', 99)).toBe(99);
  });
});
