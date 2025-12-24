/**
 * Anthropic Claude Provider
 */

import Anthropic from '@anthropic-ai/sdk';
import { getConfig } from '../../config';

export async function reasonWithClaude(prompt: string): Promise<any> {
  const config = getConfig();
  
  if (!config.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const client = new Anthropic({ apiKey: config.anthropicApiKey });
  
  try {
    const response = await client.messages.create({
      model: config.anthropicModel,
      max_tokens: 4096,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
    
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }
    
    const text = content.text.trim();
    
    // Try to extract JSON if wrapped in markdown
    let jsonText = text;
    if (text.startsWith('```json')) {
      jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (text.startsWith('```')) {
      jsonText = text.replace(/```\n?/g, '').trim();
    }
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('[OPERATOR] Claude API error:', error);
    throw error;
  }
}

