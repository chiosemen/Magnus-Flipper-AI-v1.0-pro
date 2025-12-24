/**
 * DeepSeek Provider
 */

import OpenAI from 'openai';
import { getConfig } from '../../config';

export async function reasonWithDeepSeek(prompt: string): Promise<any> {
  const config = getConfig();
  
  if (!config.deepseekApiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  // DeepSeek uses OpenAI-compatible API
  const client = new OpenAI({
    apiKey: config.deepseekApiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
  });
  
  try {
    const response = await client.chat.completions.create({
      model: config.deepseekModel,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that returns only valid JSON. Do not include markdown formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in DeepSeek response');
    }
    
    const text = content.trim();
    
    // Try to extract JSON if wrapped in markdown
    let jsonText = text;
    if (text.startsWith('```json')) {
      jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (text.startsWith('```')) {
      jsonText = text.replace(/```\n?/g, '').trim();
    }
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('[OPERATOR] DeepSeek API error:', error);
    throw error;
  }
}

