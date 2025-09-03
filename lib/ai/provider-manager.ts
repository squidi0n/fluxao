import { logger } from '@/lib/logger';
import { getAIProvider, AIProvider as BaseAIProvider } from './provider';

export type AIProviderType = 'claude' | 'openai' | 'mock';

export interface AIResponse {
  content: string;
  provider: AIProviderType;
  model?: string;
  success: boolean;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens: number;
    cost?: number;
  };
  responseTime: number;
  metadata?: Record<string, any>;
}

export interface AIRequest {
  task: string;
  prompt: string;
  context?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  userId: string;
  metadata?: Record<string, any>;
}

export class AIProviderManager {
  private provider: BaseAIProvider;

  constructor() {
    // Use the centralized provider factory
    this.provider = getAIProvider();
  }

  getProvider(provider: AIProviderType): BaseAIProvider {
    // For now, return the same provider instance since we have one unified interface
    // In the future, we can expand this to support multiple providers
    return this.provider;
  }

  async execute(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      logger.info({ task: request.task, prompt: request.prompt?.substring(0, 100) }, 'Executing AI request');
      
      const response = await this.provider.generate({
        system: `Task: ${request.task}. ${request.context || ''}`,
        user: request.prompt,
        temperature: request.temperature || 0.7,
        maxTokens: request.maxTokens || 800,
        model: request.model
      });

      const responseTime = Date.now() - startTime;

      logger.info({ 
        task: request.task, 
        tokensUsed: response.tokensUsed, 
        responseTime 
      }, 'AI request completed successfully');

      return {
        content: response.content,
        provider: this.getProviderName(),
        success: true,
        usage: {
          totalTokens: response.tokensUsed,
          inputTokens: 0,
          outputTokens: response.tokensUsed
        },
        responseTime,
        metadata: request.metadata
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error({ 
        error: error.message, 
        task: request.task,
        provider: this.getProviderName() 
      }, 'AI provider execution failed');
      
      return {
        content: `AI service temporarily unavailable: ${error.message}. Please try again in a moment.`,
        provider: this.getProviderName(),
        success: false,
        usage: { totalTokens: 0 },
        responseTime,
        metadata: { error: error.message }
      };
    }
  }

  async executeMultiple(request: {
    providers: AIProviderType[];
    prompt: string;
    context?: string;
    userId: string;
    compareResults?: boolean;
  }): Promise<AIResponse[]> {
    // For now, just execute once since we have a single provider
    // In the future, this can be expanded to support multiple actual providers
    const singleRequest: AIRequest = {
      task: 'multi-provider',
      prompt: request.prompt,
      context: request.context,
      userId: request.userId
    };

    const result = await this.execute(singleRequest);
    return [result];
  }

  async compareResults(results: AIResponse[]): Promise<{
    bestResult: AIResponse;
    comparison: Record<string, any>;
    consensus?: string;
  }> {
    const bestResult = results.find(r => r.success) || results[0];
    
    const comparison = {
      totalProviders: results.length,
      successfulProviders: results.filter(r => r.success).length,
      averageResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length,
      totalTokensUsed: results.reduce((sum, r) => sum + (r.usage?.totalTokens || 0), 0)
    };

    return {
      bestResult,
      comparison,
      consensus: results.length > 1 ? bestResult.content : undefined
    };
  }

  async combineModerationResults(results: AIResponse[]): Promise<{
    approved: boolean;
    confidence: number;
    reasons: string[];
    suggestedAction: string;
  }> {
    const successfulResults = results.filter(r => r.success);
    
    if (successfulResults.length === 0) {
      return {
        approved: false,
        confidence: 0,
        reasons: ['No successful moderation results'],
        suggestedAction: 'manual_review'
      };
    }

    // Simple approval logic - can be enhanced
    const approved = successfulResults.every(r => 
      r.content.toLowerCase().includes('approved') || 
      !r.content.toLowerCase().includes('reject')
    );

    return {
      approved,
      confidence: successfulResults.length / results.length,
      reasons: [`Based on ${successfulResults.length} provider(s)`],
      suggestedAction: approved ? 'approve' : 'reject'
    };
  }

  async getProvidersStatus(): Promise<Record<string, any>> {
    return {
      [this.getProviderName()]: {
        available: true,
        latency: 0,
        usage: { today: 0, limit: 1000 }
      }
    };
  }

  async getProviderCapabilities(): Promise<Record<string, any>> {
    return {
      [this.getProviderName()]: {
        supportedTasks: ['content-generation', 'analysis', 'moderation', 'summarization'],
        maxTokens: 4096,
        supportsStreaming: this.provider.supportsStream || false,
        supportsBatch: this.provider.supportsBatch || false
      }
    };
  }

  private getProviderName(): AIProviderType {
    const envProvider = process.env.AI_PROVIDER || 'openai';
    if (envProvider === 'anthropic') return 'claude';
    if (envProvider === 'mock') return 'mock';
    return 'openai';
  }
}