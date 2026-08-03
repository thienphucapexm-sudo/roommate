import { describe, expect, it } from 'vitest';
import {
  isEmptyString,
  isNonNegativeNumber,
  isValidDate,
  isValidVietnamesePhone,
} from '../../../src/utils/validation-utils.js';

describe('validation utilities', () => {
  it('detects empty values and preserves meaningful values', () => {
    expect(isEmptyString('   ')).toBe(true);
    expect(isEmptyString(null)).toBe(true);
    expect(isEmptyString('Room A')).toBe(false);
    expect(isEmptyString(0)).toBe(false);
  });

  it('validates Vietnamese phone numbers and rejects invalid input', () => {
    expect(isValidVietnamesePhone('0912345678')).toBe(true);
    expect(isValidVietnamesePhone('0312345678')).toBe(true);
    expect(isValidVietnamesePhone('0212345678')).toBe(false);
    expect(isValidVietnamesePhone('')).toBe(false);
    expect(isValidVietnamesePhone(null)).toBe(false);
  });

  it('validates non-negative numeric values including zero', () => {
    expect(isNonNegativeNumber(0)).toBe(true);
    expect(isNonNegativeNumber('12.5')).toBe(true);
    expect(isNonNegativeNumber(-1)).toBe(false);
    expect(isNonNegativeNumber('')).toBe(false);
    expect(isNonNegativeNumber('abc')).toBe(false);
  });

  it('validates valid dates and rejects empty or malformed values', () => {
    expect(isValidDate('2026-08-03')).toBe(true);
    expect(isValidDate(new Date('2026-08-03'))).toBe(true);
    expect(isValidDate('')).toBe(false);
    expect(isValidDate('not-a-date')).toBe(false);
  });
});
