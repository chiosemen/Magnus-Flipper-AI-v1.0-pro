/**
 * Semantic search over Operator Knowledge Base
 * Uses pgvector for similarity search
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

function getOpenAIClient() {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }

  return new OpenAI({ apiKey: openaiApiKey });
}

export interface KnowledgeChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  similarity: number;
  metadata: Record<string, any>;
}

/**
 * Search knowledge base using semantic similarity
 * @param query - Search query text
 * @param limit - Maximum number of results (default: 5)
 * @param threshold - Minimum similarity threshold (default: 0.7)
 * @returns Array of matching knowledge chunks with similarity scores
 */
export async function searchKnowledge(
  query: string,
  limit: number = 5,
  threshold: number = 0.7
): Promise<KnowledgeChunk[]> {
  const openai = getOpenAIClient();
  const supabase = getSupabaseClient();
  
  // 1. Generate query embedding
  let queryEmbedding: number[];
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    if (!response || !response.data || response.data.length === 0) {
      throw new Error('Failed to generate embedding: No data returned');
    }

    queryEmbedding = response.data[0].embedding;
  } catch (error) {
    console.error('[KB] Error generating query embedding:', error);
    throw error;
  }

  // 2. Vector similarity search using RPC function
  const { data: chunks, error } = await supabase.rpc('search_kb_chunks', {
    query_embedding: queryEmbedding,
    match_count: limit,
    match_threshold: threshold,
  });

  if (error) {
    console.error('[KB] Error searching knowledge base:', error);
    throw new Error(`Knowledge base search failed: ${error.message}`);
  }

  if (!chunks || chunks.length === 0) {
    console.log(`[KB] No matching chunks found for query: "${query}"`);
    return [];
  }

  return chunks.map((chunk: any) => ({
    id: chunk.id,
    document_id: chunk.document_id,
    chunk_index: chunk.chunk_index,
    content: chunk.content,
    similarity: chunk.similarity,
    metadata: chunk.metadata || {},
  }));
}

