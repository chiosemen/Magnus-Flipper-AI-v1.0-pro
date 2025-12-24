/**
 * Document ingestion for Operator Knowledge Base
 * Handles document storage, chunking, and embedding generation
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { chunkText } from './chunker';

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

export interface IngestDocumentParams {
  title: string;
  source: string;
  content: string;
  tags?: string[];
  confidenceLevel?: 'low' | 'medium' | 'high';
  version?: string;
}

/**
 * Ingest a document into the knowledge base
 * - Stores document metadata
 * - Chunks content
 * - Generates embeddings
 * - Stores chunks with embeddings
 */
export async function ingestDocument(params: IngestDocumentParams): Promise<string> {
  const { title, source, content, tags = [], confidenceLevel = 'medium', version = null } = params;
  const supabase = getSupabaseClient();
  const openai = getOpenAIClient();

  // 1. Insert document
  const { data: doc, error: docError } = await supabase
    .from('operator_kb_documents')
    .insert({
      title,
      source,
      content,
      tags,
      confidence_level: confidenceLevel,
      version,
    })
    .select()
    .single();

  if (docError) {
    throw new Error(`Failed to insert document: ${docError.message}`);
  }

  if (!doc) {
    throw new Error('Document insert returned no data');
  }

  console.log(`[KB] Document inserted: ${doc.id} - ${title}`);

  // 2. Chunk content (500 tokens per chunk with 50 token overlap)
  const chunks = chunkText(content, 500, 50);
  console.log(`[KB] Chunked into ${chunks.length} pieces`);

  if (chunks.length === 0) {
    console.warn(`[KB] No chunks generated for document ${doc.id}`);
    return doc.id;
  }

  // 3. Generate embeddings in batches (OpenAI rate limits)
  const batchSize = 10;
  const chunkInserts: Array<{
    document_id: string;
    chunk_index: number;
    content: string;
    embedding: number[];
  }> = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    
    try {
      const embeddingsResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch,
      });

      for (let j = 0; j < batch.length; j++) {
        chunkInserts.push({
          document_id: doc.id,
          chunk_index: i + j,
          content: batch[j],
          embedding: embeddingsResponse.data[j].embedding,
        });
      }

      console.log(`[KB] Generated embeddings for batch ${Math.floor(i / batchSize) + 1}`);
    } catch (error) {
      console.error(`[KB] Error generating embeddings for batch ${i / batchSize + 1}:`, error);
      throw error;
    }
  }

  // 4. Insert chunks with embeddings
  const { error: chunkError } = await supabase
    .from('operator_kb_chunks')
    .insert(chunkInserts);

  if (chunkError) {
    console.error(`[KB] Failed to insert chunks: ${chunkError.message}`);
    // Clean up document if chunk insertion fails
    await supabase.from('operator_kb_documents').delete().eq('id', doc.id);
    throw new Error(`Failed to insert chunks: ${chunkError.message}`);
  }

  console.log(`[KB] Successfully ingested document ${doc.id} with ${chunkInserts.length} chunks`);

  return doc.id;
}

