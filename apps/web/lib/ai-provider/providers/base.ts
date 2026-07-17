import type {
  AIProvider,
  AIProviderType,
  AIProviderConfig,
  AIProviderCapabilities,
  AIRequest,
  AIStreamRequest,
  AIExplainResponse,
  AIFixResponse,
  AIRewriteResponse,
  AIGenerateResponse,
  AIReviewResponse,
  AISummarizeResponse,
  AIImproveResponse,
  AIChatRequest,
  AIChatResponse,
} from '../types';

export abstract class BaseAIProvider implements AIProvider {
  abstract type: AIProviderType;
  abstract capabilities: AIProviderCapabilities;
  abstract config: AIProviderConfig;

  get isAvailable(): boolean {
    return !!this.config.apiKey || this.type === 'ollama' || this.type === 'lmstudio' || this.type === 'custom';
  }

  protected buildSystemPrompt(operation: string, context?: string): string {
    const base = `You are an expert technical writer and documentation assistant for TomeBase, an AI-powered documentation platform. You help developers write, improve, and maintain high-quality technical documentation.

Rules:
- Always output clean, well-formatted markdown
- Be concise and direct
- Preserve the user's intent and voice
- When fixing content, maintain the original structure
- For code examples, use proper fenced code blocks with language tags
- Never add unnecessary preamble or explanations unless asked`;

    const operationPrompts: Record<string, string> = {
      explain: `${base}\n\nYour task: Explain the provided content clearly and concisely. Identify what the content is about, its purpose, and any key concepts.`,
      fix: `${base}\n\nYour task: Fix the provided content. Return the corrected version with improvements. Focus on accuracy, clarity, and proper formatting.`,
      rewrite: `${base}\n\nYour task: Rewrite the provided content to improve clarity, readability, and professionalism. Maintain the original meaning.`,
      generate: `${base}\n\nYour task: Generate new documentation content based on the provided context and instructions.`,
      review: `${base}\n\nYour task: Review the provided documentation. Score it from 1-100 and identify specific issues with suggestions for improvement.`,
      summarize: `${base}\n\nYour task: Summarize the provided content into a concise overview with key points.`,
      improve: `${base}\n\nYour task: Improve the provided content. Make it clearer, more complete, and better structured. List the improvements you made.`,
      chat: `${base}\n\n${context ? `Context: The user is working on documentation.\n\n${context}` : 'The user is asking questions about documentation.'}`,
    };

    return operationPrompts[operation] || base;
  }

  protected parseJSONResponse<T>(content: string): T {
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) return JSON.parse(jsonMatch[1]!) as T;
      return JSON.parse(content) as T;
    } catch {
      return content as unknown as T;
    }
  }

  abstract explain(request: AIRequest): Promise<AIExplainResponse>;
  abstract fix(request: AIRequest): Promise<AIFixResponse>;
  abstract rewrite(request: AIRequest): Promise<AIRewriteResponse>;
  abstract generate(request: AIRequest): Promise<AIGenerateResponse>;
  abstract review(request: AIRequest): Promise<AIReviewResponse>;
  abstract summarize(request: AIRequest): Promise<AISummarizeResponse>;
  abstract improve(request: AIRequest): Promise<AIImproveResponse>;
  abstract chat(request: AIChatRequest): Promise<AIChatResponse>;
  abstract streamChat(request: AIStreamRequest): AsyncGenerator<string>;
  abstract testConnection(): Promise<{ success: boolean; message: string; model?: string }>;

  protected makeBaseResponse(content: string, model: string) {
    return {
      content,
      confidence: 'high' as const,
      model,
      provider: this.type,
    };
  }
}
