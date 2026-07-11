import { describe, it, expect, vi } from 'vitest';

vi.mock('@fluid/database', () => ({
  prisma: {},
}));

import { TIERS } from './limits';

describe('TIERS', () => {
  it('has exactly two tiers', () => {
    expect(Object.keys(TIERS)).toEqual(['free', 'pro']);
  });

  it('free tier has 1 project limit', () => {
    expect(TIERS.free.maxProjects).toBe(1);
  });

  it('free tier has unlimited pages', () => {
    expect(TIERS.free.maxPages).toBe(Infinity);
  });

  it('free tier allows 5 members', () => {
    expect(TIERS.free.maxMembers).toBe(5);
  });

  it('free tier does not allow custom domains', () => {
    expect(TIERS.free.customDomain).toBe(false);
  });

  it('pro tier has unlimited projects', () => {
    expect(TIERS.pro.maxProjects).toBe(Infinity);
  });

  it('pro tier has unlimited pages', () => {
    expect(TIERS.pro.maxPages).toBe(Infinity);
  });

  it('pro tier has unlimited members', () => {
    expect(TIERS.pro.maxMembers).toBe(Infinity);
  });

  it('pro tier allows custom domains', () => {
    expect(TIERS.pro.customDomain).toBe(true);
  });

  it('free tier does not hide branding', () => {
    expect(TIERS.free.hideBranding).toBe(false);
  });

  it('pro tier hides branding', () => {
    expect(TIERS.pro.hideBranding).toBe(true);
  });
});
