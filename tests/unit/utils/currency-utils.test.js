import { describe, expect, it } from 'vitest';
import { formatVND } from '../../../src/utils/currency-utils.js';

describe('formatVND', () => {
  it('formats numeric and numeric-string values as Vietnamese currency', () => {
    const formatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
    expect(formatVND(1500000)).toBe(formatter.format(1500000));
    expect(formatVND('25000')).toBe(formatter.format(25000));
  });

  it('formats zero and negative boundary values', () => {
    const formatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
    expect(formatVND(0)).toBe(formatter.format(0));
    expect(formatVND(-500)).toBe(formatter.format(-500));
  });

  it('rejects empty non-numeric input', () => {
    expect(() => formatVND('not-a-number')).toThrow();
  });
});
