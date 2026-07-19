import { describe, it, expect } from 'vitest';
import { createProvider } from './factory';
import { NullAIProvider } from './null-provider';
import type { AIProviderConfig } from './types';

describe('AI Provider Factory', () => {
  it('creates NullAIProvider for unknown provider type', () => {
    const config: AIProviderConfig = { provider: 'unknown' as any };
    const provider = createProvider(config);
    expect(provider).toBeInstanceOf(NullAIProvider);
    expect(provider.isAvailable).toBe(false);
  });

  it('creates NullAIProvider for null provider type', () => {
    const config: AIProviderConfig = { provider: 'null' };
    const provider = createProvider(config);
    expect(provider).toBeInstanceOf(NullAIProvider);
  });

  it('creates OpenAI provider with correct type', () => {
    const config: AIProviderConfig = { provider: 'openai', apiKey: 'test-key' };
    const provider = createProvider(config);
    expect(provider.type).toBe('openai');
    expect(provider.isAvailable).toBe(true);
    expect(provider.config.apiKey).toBe('test-key');
  });

  it('creates Anthropic provider with correct type', () => {
    const config: AIProviderConfig = { provider: 'anthropic', apiKey: 'test-key' };
    const provider = createProvider(config);
    expect(provider.type).toBe('anthropic');
    expect(provider.isAvailable).toBe(true);
  });

  it('creates Gemini provider with correct type', () => {
    const config: AIProviderConfig = { provider: 'gemini', apiKey: 'test-key' };
    const provider = createProvider(config);
    expect(provider.type).toBe('gemini');
    expect(provider.isAvailable).toBe(true);
  });

  it('creates OpenRouter provider with correct type', () => {
    const config: AIProviderConfig = { provider: 'openrouter', apiKey: 'test-key' };
    const provider = createProvider(config);
    expect(provider.type).toBe('openrouter');
    expect(provider.isAvailable).toBe(true);
  });

  it('creates Azure provider with correct type', () => {
    const config: AIProviderConfig = { provider: 'azure', apiKey: 'test-key' };
    const provider = createProvider(config);
    expect(provider.type).toBe('azure');
    expect(provider.isAvailable).toBe(true);
  });

  it('creates Ollama provider without API key', () => {
    const config: AIProviderConfig = { provider: 'ollama' };
    const provider = createProvider(config);
    expect(provider.type).toBe('ollama');
    expect(provider.isAvailable).toBe(true);
  });

  it('creates LMStudio provider without API key', () => {
    const config: AIProviderConfig = { provider: 'lmstudio' };
    const provider = createProvider(config);
    expect(provider.type).toBe('lmstudio');
    expect(provider.isAvailable).toBe(true);
  });

  it('creates Custom provider without API key', () => {
    const config: AIProviderConfig = { provider: 'custom' };
    const provider = createProvider(config);
    expect(provider.type).toBe('custom');
    expect(provider.isAvailable).toBe(true);
  });

  it('all real providers have full capabilities', () => {
    const types = ['openai', 'anthropic', 'gemini', 'openrouter', 'azure', 'ollama', 'lmstudio', 'custom'] as const;
    for (const type of types) {
      const config: AIProviderConfig = { provider: type };
      const provider = createProvider(config);
      expect(provider.capabilities.canExplain).toBe(true);
      expect(provider.capabilities.canFix).toBe(true);
      expect(provider.capabilities.canRewrite).toBe(true);
      expect(provider.capabilities.canGenerate).toBe(true);
      expect(provider.capabilities.canReview).toBe(true);
      expect(provider.capabilities.canSummarize).toBe(true);
      expect(provider.capabilities.canImprove).toBe(true);
      expect(provider.capabilities.canChat).toBe(true);
    }
  });

  it('NullAIProvider throws AIUnavailableError for all operations', async () => {
    const provider = createProvider({ provider: 'null' });
    await expect(provider.explain({ content: 'test' })).rejects.toThrow('No AI provider configured');
    await expect(provider.fix({ content: 'test' })).rejects.toThrow('No AI provider configured');
    await expect(provider.rewrite({ content: 'test' })).rejects.toThrow('No AI provider configured');
    await expect(provider.review({ content: 'test' })).rejects.toThrow('No AI provider configured');
    await expect(provider.chat({ messages: [{ role: 'user', content: 'test' }] })).rejects.toThrow('No AI provider configured');
  });
});
