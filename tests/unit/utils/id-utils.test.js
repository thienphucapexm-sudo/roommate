import { describe, expect, it } from 'vitest';
import { generateUniqueId } from '../../../src/utils/id-utils.js';

describe('generateUniqueId', () => {
  it('creates a UUID v4-shaped string', () => {
    expect(generateUniqueId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('creates distinct IDs on consecutive calls', () => {
    expect(generateUniqueId()).not.toBe(generateUniqueId());
  });
});
