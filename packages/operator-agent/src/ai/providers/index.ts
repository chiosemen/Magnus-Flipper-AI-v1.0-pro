/**
 * Multi-provider AI reasoning with fallback
 */

import { reasonWithClaude } from './anthropic';
import { reasonWithOpenAI } from './openai';
import { reasonWithDeepSeek } from './deepseek';
import { getConfig } from '../../config';

export async function reasonWithAI(prompt: string): Promise<any> {
  const config = getConfig();
  
  const providers = [
    { name: config.aiProvider, fn: getProviderFunction(config.aiProvider) },
    { name: config.fallbackProvider, fn: getProviderFunction(config.fallbackProvider) },
  ];

  for (const provider of providers) {
    try {
      console.log(`[OPERATOR] Attempting reasoning with ${provider.name}...`);
      const result = await provider.fn(prompt);
      console.log(`[OPERATOR] Success with ${provider.name}`);
      return result;
    } catch (error) {
      console.warn(`[OPERATOR] ${provider.name} failed:`, error);
      // Continue to next provider
    }
  }

  throw new Error('All AI providers failed');
}

function getProviderFunction(provider: string) {
  switch (provider) {
    case 'anthropic':
      return reasonWithClaude;
    case 'openai':
      return reasonWithOpenAI;
    case 'deepseek':
      return reasonWithDeepSeek;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

