import { describe, it, expect } from 'vitest';
import { hashApiKey, extractPrefix, generateApiKey } from './api-auth';

describe('hashApiKey', () => {
  it('returns a sha256 hex hash', () => {
    const hash = hashApiKey('test-key');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces consistent hashes', () => {
    expect(hashApiKey('same-input')).toBe(hashApiKey('same-input'));
  });

  it('produces different hashes for different inputs', () => {
    expect(hashApiKey('key-a')).not.toBe(hashApiKey('key-b'));
  });
});

describe('extractPrefix', () => {
  it('returns first 12 characters', () => {
    const input = 'tb_abcdefghijklmn';
    expect(extractPrefix(input)).toBe(input.slice(0, 12));
  });

  it('works with short strings', () => {
    expect(extractPrefix('short')).toBe('short');
  });
});

describe('generateApiKey', () => {
  it('starts with tb_ prefix', () => {
    const key = generateApiKey();
    expect(key).toMatch(/^tb_/);
  });

  it('generates unique keys', () => {
    const keys = new Set(Array.from({ length: 10 }, () => generateApiKey()));
    expect(keys.size).toBe(10);
  });

  it('generates keys of consistent length', () => {
    const key = generateApiKey();
    // tb_ (3) + 32 bytes hex (64) = 67
    expect(key).toHaveLength(67);
  });
});
