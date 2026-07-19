import type { AIProviderConfig, AIProviderType, AIProvider } from './types';
import { NullAIProvider } from './null-provider';
import { GenericProvider, type ClientFactory } from './providers/generic';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const openAIClientFactory: ClientFactory = (config) =>
  createOpenAI({
    apiKey: config.apiKey,
    ...(config.baseUrl ? { baseURL: config.baseUrl } : {}),
  });

const anthropicClientFactory: ClientFactory = (config) =>
  createAnthropic({ apiKey: config.apiKey });

const geminiClientFactory: ClientFactory = (config) =>
  createGoogleGenerativeAI({ apiKey: config.apiKey });

const openRouterClientFactory: ClientFactory = (config) =>
  createOpenAICompatible({
    name: 'openrouter',
    apiKey: config.apiKey,
    baseURL: config.baseUrl || 'https://openrouter.ai/api/v1',
  });

const azureClientFactory: ClientFactory = (config) =>
  createOpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  });

const ollamaClientFactory: ClientFactory = (config) =>
  createOpenAICompatible({
    name: 'ollama',
    apiKey: 'ollama',
    baseURL: config.baseUrl || 'http://localhost:11434/v1',
  });

const lmstudioClientFactory: ClientFactory = (config) =>
  createOpenAICompatible({
    name: 'lmstudio',
    apiKey: 'lm-studio',
    baseURL: config.baseUrl || 'http://localhost:1234/v1',
  });

const customClientFactory: ClientFactory = (config) =>
  createOpenAICompatible({
    name: 'custom',
    apiKey: config.apiKey || 'no-key',
    baseURL: config.baseUrl || 'http://localhost:8080/v1',
  });

const PROVIDER_REGISTRY: Record<string, { factory: ClientFactory; defaultModel: string } | null> = {
  openai: { factory: openAIClientFactory, defaultModel: 'gpt-4.1-mini' },
  anthropic: { factory: anthropicClientFactory, defaultModel: 'claude-sonnet-4-20250514' },
  gemini: { factory: geminiClientFactory, defaultModel: 'gemini-2.5-flash' },
  openrouter: { factory: openRouterClientFactory, defaultModel: 'openai/gpt-4.1-mini' },
  azure: { factory: azureClientFactory, defaultModel: 'gpt-4o' },
  ollama: { factory: ollamaClientFactory, defaultModel: 'llama3.1' },
  lmstudio: { factory: lmstudioClientFactory, defaultModel: 'local-model' },
  custom: { factory: customClientFactory, defaultModel: 'custom-model' },
  null: null,
};

export function createProvider(config: AIProviderConfig): AIProvider {
  const registration = PROVIDER_REGISTRY[config.provider];
  if (!registration) {
    return new NullAIProvider();
  }
  return new GenericProvider(config, config.provider, registration.factory, registration.defaultModel);
}
