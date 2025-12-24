/**
 * Operator Agent Configuration
 * Multi-provider AI support with fallback
 * 
 * IMPORTANT: All environment access is lazy to avoid build-time evaluation
 */

export function getConfig() {
  return {
    // AI Provider Configuration
    aiProvider: process.env.OPERATOR_AI_PROVIDER || 'anthropic', // 'openai' | 'anthropic' | 'deepseek'
    fallbackProvider: process.env.OPERATOR_AI_FALLBACK || 'deepseek',
    
    // API Keys
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
    
    // Model Selection
    openaiModel: process.env.OPERATOR_OPENAI_MODEL || 'gpt-4-turbo-preview',
    anthropicModel: process.env.OPERATOR_ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
    deepseekModel: process.env.OPERATOR_DEEPSEEK_MODEL || 'deepseek-chat',
    
    // RAG Configuration
    ragEnabled: process.env.OPERATOR_RAG_ENABLED !== 'false',
    ragChunkLimit: parseInt(process.env.OPERATOR_RAG_CHUNK_LIMIT || '5'),
    ragThreshold: parseFloat(process.env.OPERATOR_RAG_THRESHOLD || '0.7'),
    
    // Safety Configuration
    minConfidenceThreshold: parseFloat(process.env.OPERATOR_MIN_CONFIDENCE || '0.6'),
    requireEvidence: process.env.OPERATOR_REQUIRE_EVIDENCE !== 'false',
    
    // Supabase Configuration
    supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

