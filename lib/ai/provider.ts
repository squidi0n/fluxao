import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { logger } from '@/lib/logger';
import { checkBudget, recordUsage } from './budget';

export interface GenerateOptions {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  jsonSchema?: z.ZodType<any>;
  stream?: boolean;
  model?: string;
}

export interface StreamChunk {
  content: string;
  finished: boolean;
  tokensUsed?: number;
}

export interface BatchOptions {
  requests: GenerateOptions[];
  maxConcurrency?: number;
}

export interface GenerateResponse {
  content: string;
  tokensUsed: number;
}

export interface AIProvider {
  generate(options: GenerateOptions): Promise<GenerateResponse>;
  generateStream?(options: GenerateOptions): AsyncGenerator<StreamChunk>;
  generateBatch?(options: BatchOptions): Promise<GenerateResponse[]>;
  supportsBatch?: boolean;
  supportsStream?: boolean;
}

/**
 * OpenAI Provider Implementation
 */
class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;
  public supportsBatch = true;
  public supportsStream = true;

  constructor(apiKey: string, model?: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model || process.env.AI_MODEL || 'gpt-4o-mini';
  }

  async generate(options: GenerateOptions): Promise<GenerateResponse> {
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: options.system },
        { role: 'user', content: options.user },
      ];

      const response = await this.client.chat.completions.create({
        model: options.model || this.model,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 800,
        response_format: options.jsonSchema ? { type: 'json_object' } : undefined,
      });

      const content = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;

      // If JSON schema provided, validate the response
      if (options.jsonSchema) {
        try {
          const parsed = JSON.parse(content);
          const validated = options.jsonSchema.parse(parsed);
          return {
            content: JSON.stringify(validated),
            tokensUsed,
          };
        } catch (error) {
          logger.error({ error, content }, 'Failed to parse AI JSON response');
          throw new Error('Invalid JSON response from AI');
        }
      }

      return { content, tokensUsed };
    } catch (error) {
      logger.error({ error }, 'OpenAI generation failed');
      throw error;
    }
  }

  async *generateStream(options: GenerateOptions): AsyncGenerator<StreamChunk> {
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: options.system },
        { role: 'user', content: options.user },
      ];

      const stream = await this.client.chat.completions.create({
        model: options.model || this.model,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 800,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        const finished = chunk.choices[0]?.finish_reason !== null;
        
        yield {
          content,
          finished,
          tokensUsed: finished ? chunk.usage?.total_tokens : undefined,
        };
      }
    } catch (error) {
      logger.error({ error }, 'OpenAI streaming failed');
      throw error;
    }
  }

  async generateBatch(options: BatchOptions): Promise<GenerateResponse[]> {
    const { requests, maxConcurrency = 5 } = options;
    const results: GenerateResponse[] = [];
    
    // Process in batches to avoid rate limits
    for (let i = 0; i < requests.length; i += maxConcurrency) {
      const batch = requests.slice(i, i + maxConcurrency);
      const batchResults = await Promise.all(
        batch.map(request => this.generate(request))
      );
      results.push(...batchResults);
    }
    
    return results;
  }
}

/**
 * Anthropic Provider Implementation
 */
class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;
  public supportsBatch = false;
  public supportsStream = true;

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model || process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20241022';
  }

  async generate(options: GenerateOptions): Promise<GenerateResponse> {
    try {
      const response = await this.client.messages.create({
        model: options.model || this.model,
        max_tokens: options.maxTokens ?? 800,
        temperature: options.temperature ?? 0.3,
        system: options.system,
        messages: [{ role: 'user', content: options.user }],
      });

      const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

      // If JSON schema provided, validate the response
      if (options.jsonSchema) {
        try {
          const parsed = JSON.parse(content);
          const validated = options.jsonSchema.parse(parsed);
          return {
            content: JSON.stringify(validated),
            tokensUsed,
          };
        } catch (error) {
          logger.error({ error, content }, 'Failed to parse AI JSON response');
          throw new Error('Invalid JSON response from AI');
        }
      }

      return { content, tokensUsed };
    } catch (error) {
      logger.error({ error }, 'Anthropic generation failed');
      throw error;
    }
  }

  async *generateStream(options: GenerateOptions): AsyncGenerator<StreamChunk> {
    try {
      const stream = await this.client.messages.create({
        model: options.model || this.model,
        max_tokens: options.maxTokens ?? 800,
        temperature: options.temperature ?? 0.3,
        system: options.system,
        messages: [{ role: 'user', content: options.user }],
        stream: true,
      });

      let totalTokens = 0;
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield {
            content: chunk.delta.text,
            finished: false,
          };
        } else if (chunk.type === 'message_delta' && chunk.usage) {
          totalTokens = chunk.usage.input_tokens + chunk.usage.output_tokens;
        } else if (chunk.type === 'message_stop') {
          yield {
            content: '',
            finished: true,
            tokensUsed: totalTokens,
          };
        }
      }
    } catch (error) {
      logger.error({ error }, 'Anthropic streaming failed');
      throw error;
    }
  }
}

/**
 * Mock Provider for Testing
 */
class MockProvider implements AIProvider {
  public supportsBatch = true;
  public supportsStream = true;

  async generate(options: GenerateOptions): Promise<GenerateResponse> {
    logger.debug({ options }, 'Mock AI generation');

    // Return mock responses based on the system prompt
    if (options.system.includes('summary')) {
      return {
        content:
          'This is a mock summary of the blog post content. It provides a concise overview of the main topics discussed.',
        tokensUsed: 50,
      };
    }

    if (options.system.includes('keywords')) {
      const keywords = ['nextjs', 'react', 'typescript', 'web-development', 'tutorial'];
      return {
        content: JSON.stringify({ keywords }),
        tokensUsed: 30,
      };
    }

    if (options.system.includes('tags')) {
      const tags = ['react', 'tutorial', 'web'];
      return {
        content: JSON.stringify({ tags }),
        tokensUsed: 20,
      };
    }

    if (options.system.includes('content generation')) {
      return {
        content: 'This is a mock-generated blog post about the latest developments in AI and machine learning. It covers key topics and provides valuable insights for readers.',
        tokensUsed: 100,
      };
    }

    if (options.system.includes('personalization')) {
      return {
        content: JSON.stringify({
          recommendations: ['post-1', 'post-2', 'post-3'],
          reasons: ['Similar topic interest', 'Reading history match', 'Trending content']
        }),
        tokensUsed: 40,
      };
    }

    return {
      content: 'Mock response',
      tokensUsed: 10,
    };
  }

  async *generateStream(options: GenerateOptions): AsyncGenerator<StreamChunk> {
    const mockContent = 'This is a mock streaming response from the AI provider.';
    const words = mockContent.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      yield {
        content: words[i] + ' ',
        finished: i === words.length - 1,
        tokensUsed: i === words.length - 1 ? 20 : undefined,
      };
      // Small delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async generateBatch(options: BatchOptions): Promise<GenerateResponse[]> {
    return Promise.all(
      options.requests.map(request => this.generate(request))
    );
  }
}

/**
 * Factory to create AI provider based on configuration
 */
export function createAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'openai';

  // Use mock provider in test environment or if no API key
  if (process.env.NODE_ENV === 'test' || provider === 'mock') {
    logger.info('Using mock AI provider');
    return new MockProvider();
  }

  switch (provider) {
    case 'openai': {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        logger.warn('OpenAI API key not configured, using mock provider');
        return new MockProvider();
      }
      logger.info({ model: process.env.AI_MODEL || 'gpt-4o-mini' }, 'Using OpenAI provider');
      return new OpenAIProvider(apiKey);
    }

    case 'anthropic': {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        logger.warn('Anthropic API key not configured, using mock provider');
        return new MockProvider();
      }
      logger.info({ model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20241022' }, 'Using Anthropic provider');
      return new AnthropicProvider(apiKey);
    }

    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

// Singleton instance
let providerInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!providerInstance) {
    providerInstance = createAIProvider();
  }
  return providerInstance;
}
