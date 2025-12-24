/**
 * OpenAI Provider
 */

import OpenAI from 'openai';
import { getConfig } from '../../config';

export async function reasonWithOpenAI(prompt: string): Promise<any> {
  const config = getConfig();
  
  if (!config.openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const client = new OpenAI({ apiKey: config.openaiApiKey });
  
  try {
    const response = await client.chat.completions.create({
      model: config.openaiModel,
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
      response_format: { type: 'json_object' }
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
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
    console.error('[OPERATOR] OpenAI API error:', error);
    throw error;
  }
}

