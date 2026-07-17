import { generateText, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { BaseAIProvider } from './base';
import type {
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

export class AzureProvider extends BaseAIProvider {
  type: AIProviderType = 'azure';
  capabilities: AIProviderCapabilities = {
    canExplain: true,
    canFix: true,
    canRewrite: true,
    canGenerate: true,
    canReview: true,
    canSummarize: true,
    canImprove: true,
    canChat: true,
  };
  config: AIProviderConfig;

  private getClient() {
    return createOpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl,
    });
  }

  private get model() {
    return this.config.model || 'gpt-4o';
  }

  constructor(config: AIProviderConfig) {
    super();
    this.config = config;
  }

  private async generateTextOp(systemPrompt: string, userContent: string): Promise<string> {
    const result = await generateText({
      model: this.getClient().languageModel(this.model),
      system: systemPrompt,
      prompt: userContent,
      maxOutputTokens: 4096,
    });
    return result.text;
  }

  async explain(request: AIRequest): Promise<AIExplainResponse> {
    const systemPrompt = this.buildSystemPrompt('explain');
    const userContent = `Title: ${request.pageTitle || 'Untitled'}\n\nContent:\n${request.selectedText || request.content}`;
    const text = await this.generateTextOp(systemPrompt, userContent);
    return { ...this.makeBaseResponse(text, this.model), explanation: text, suggestions: [] };
  }

  async fix(request: AIRequest): Promise<AIFixResponse> {
    const systemPrompt = this.buildSystemPrompt('fix') + '\n\nRespond with JSON: {"fixedContent": "...", "description": "..."}';
    const userContent = `Fix this content:\n\nTitle: ${request.pageTitle || 'Untitled'}\n\n${request.content}${request.diagnostic ? `\n\nIssue: ${request.diagnostic.title} - ${request.diagnostic.description}` : ''}`;
    const text = await this.generateTextOp(systemPrompt, userContent);
    const parsed = this.parseJSONResponse<{ fixedContent: string; description: string }>(text);
    return {
      ...this.makeBaseResponse(text, this.model),
      fixedContent: typeof parsed === 'string' ? request.content : (parsed.fixedContent || request.content),
      description: typeof parsed === 'string' ? 'Fixed content' : (parsed.description || 'Applied fix'),
    };
  }

  async rewrite(request: AIRequest): Promise<AIRewriteResponse> {
    const systemPrompt = this.buildSystemPrompt('rewrite');
    const userContent = `Rewrite this content for clarity and professionalism:\n\n${request.selectedText || request.content}`;
    const text = await this.generateTextOp(systemPrompt, userContent);
    return { ...this.makeBaseResponse(text, this.model), rewrittenContent: text, changes: ['Rewritten for clarity'] };
  }

  async generate(request: AIRequest): Promise<AIGenerateResponse> {
    const systemPrompt = this.buildSystemPrompt('generate');
    const userContent = `Generate documentation for:\n${request.context || request.content}\n\nTitle: ${request.pageTitle || ''}`;
    const text = await this.generateTextOp(systemPrompt, userContent);
    return { ...this.makeBaseResponse(text, this.model), generatedContent: text };
  }

  async review(request: AIRequest): Promise<AIReviewResponse> {
    const systemPrompt = this.buildSystemPrompt('review') + '\n\nRespond with JSON: {"overallScore": 85, "issues": [{"severity": "warning", "description": "...", "suggestion": "..."}]}';
    const userContent = `Review this documentation:\n\nTitle: ${request.pageTitle || 'Untitled'}\n\n${request.content}`;
    const text = await this.generateTextOp(systemPrompt, userContent);
    const parsed = this.parseJSONResponse<{ overallScore: number; issues: Array<{ severity: string; description: string; suggestion: string }> }>(text);
    return {
      ...this.makeBaseResponse(text, this.model),
      overallScore: typeof parsed === 'string' ? 75 : (parsed.overallScore || 75),
      issues: typeof parsed === 'string' ? [] : (parsed.issues || []),
    };
  }

  async summarize(request: AIRequest): Promise<AISummarizeResponse> {
    const systemPrompt = this.buildSystemPrompt('summarize');
    const userContent = `Summarize this:\n\n${request.content}`;
    const text = await this.generateTextOp(systemPrompt, userContent);
    return { ...this.makeBaseResponse(text, this.model), summary: text, keyPoints: [] };
  }

  async improve(request: AIRequest): Promise<AIImproveResponse> {
    const systemPrompt = this.buildSystemPrompt('improve');
    const userContent = `Improve this content:\n\n${request.selectedText || request.content}`;
    const text = await this.generateTextOp(systemPrompt, userContent);
    return { ...this.makeBaseResponse(text, this.model), improvedContent: text, improvements: ['Improved clarity and structure'] };
  }

  async chat(request: AIChatRequest): Promise<AIChatResponse> {
    const systemPrompt = this.buildSystemPrompt('chat');
    const result = await generateText({
      model: this.getClient().languageModel(this.model),
      system: systemPrompt,
      messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
      maxOutputTokens: request.maxTokens || 4096,
    });
    return { ...this.makeBaseResponse(result.text, this.model), message: result.text };
  }

  async *streamChat(request: AIStreamRequest): AsyncGenerator<string> {
    const result = streamText({
      model: this.getClient().languageModel(this.model),
      system: request.systemPrompt || this.buildSystemPrompt('chat'),
      messages: [{ role: 'user', content: request.content }],
      maxOutputTokens: request.maxTokens || 4096,
    });
    for await (const chunk of result.textStream) {
      yield chunk;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; model?: string }> {
    try {
      const result = await generateText({
        model: this.getClient().languageModel(this.model),
        prompt: 'Say "Connection successful" in exactly those words.',
        maxOutputTokens: 20,
      });
      return { success: true, message: result.text.trim(), model: this.model };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
