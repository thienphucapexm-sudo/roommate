import { describe, expect, it, vi } from 'vitest';
import {
  calculateDaysBetween,
  compareDates,
  formatDateInputToDisplay,
  formatIsoToVietnameseDate,
  getCurrentIsoDate,
} from '../../../src/utils/date-utils.js';

describe('date utilities', () => {
  it('returns the current time in ISO 8601 format', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-03T12:00:00.000Z'));
    expect(getCurrentIsoDate()).toBe('2026-08-03T12:00:00.000Z');
    vi.useRealTimers();
  });

  it('formats ISO dates and HTML date inputs for Vietnamese display', () => {
    expect(formatIsoToVietnameseDate('2026-08-03T12:00:00.000Z')).toBe('03/08/2026');
    expect(formatDateInputToDisplay('2026-01-09')).toBe('09/01/2026');
  });

  it('compares dates without considering their time component', () => {
    expect(compareDates('2026-08-03T23:59:59', '2026-08-03T00:00:00')).toBe(0);
    expect(compareDates('2026-08-02', '2026-08-03')).toBe(-1);
    expect(compareDates('2026-08-04', '2026-08-03')).toBe(1);
  });

  it('calculates the absolute day difference, including zero at the boundary', () => {
    expect(calculateDaysBetween('2026-08-03', '2026-08-03')).toBe(0);
    expect(calculateDaysBetween('2026-08-05', '2026-08-03')).toBe(2);
  });

  it('rejects empty, malformed, and invalid date values', () => {
    expect(() => formatIsoToVietnameseDate('')).toThrow();
    expect(() => formatDateInputToDisplay('2026-08')).toThrow();
    expect(() => compareDates('not-a-date', '2026-08-03')).toThrow();
    expect(() => calculateDaysBetween('2026-08-03', 'not-a-date')).toThrow();
  });
});
