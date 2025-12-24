# Operator Agent Environment Variables

This document lists all environment variables required for the Magnus Operator Agent system.

## Required Variables

### Supabase Configuration

```bash
# Supabase URL (required)
SUPABASE_URL=https://your-project.supabase.co
# OR use Next.js public variable
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Service Role Key (required for backend operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Supabase Anon Key (required for API routes)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### AI Provider Configuration

```bash
# Primary AI Provider (default: anthropic)
OPERATOR_AI_PROVIDER=anthropic  # Options: 'anthropic', 'openai', 'deepseek'

# Fallback AI Provider (default: deepseek)
OPERATOR_AI_FALLBACK=deepseek

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-...
OPERATOR_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPERATOR_OPENAI_MODEL=gpt-4-turbo-preview

# DeepSeek Configuration
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1  # Optional, defaults to this
OPERATOR_DEEPSEEK_MODEL=deepseek-chat
```

### RAG Configuration

```bash
# Enable/disable RAG (default: true)
OPERATOR_RAG_ENABLED=true

# Number of KB chunks to retrieve (default: 5)
OPERATOR_RAG_CHUNK_LIMIT=5

# Similarity threshold for KB search (default: 0.7)
OPERATOR_RAG_THRESHOLD=0.7
```

### Safety Configuration

```bash
# Minimum confidence threshold (default: 0.6)
OPERATOR_MIN_CONFIDENCE=0.6

# Require evidence for all claims (default: true)
OPERATOR_REQUIRE_EVIDENCE=true
```

### Worker Configuration

```bash
# Poll interval in milliseconds (default: 60000 = 1 minute)
OPERATOR_POLL_INTERVAL_MS=60000

# Worker ID (default: worker-operator-001)
WORKER_ID=worker-operator-001

# Health score threshold for alerts (default: 50)
OPERATOR_HEALTH_THRESHOLD=50

# Enable auto-escalation (default: true)
OPERATOR_AUTO_ESCALATE=true
```

## Deployment Configuration

### Vercel (Next.js API Routes)

Add to Vercel project environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPERATOR_AI_PROVIDER`
- `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`)
- `OPENAI_API_KEY` (for RAG embeddings)

### Worker Deployment (Azure/Docker)

Add to worker environment:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPERATOR_POLL_INTERVAL_MS`
- `WORKER_ID`
- `OPERATOR_HEALTH_THRESHOLD`
- `OPERATOR_AUTO_ESCALATE`

## Optional Variables

```bash
# Log level for worker (default: info)
LOG_LEVEL=info

# Node environment
NODE_ENV=production
```

## Validation

The system will throw errors at startup if required variables are missing:
- Supabase URL and service role key
- At least one AI provider API key
- OpenAI API key (required for RAG embeddings)

## Security Notes

- **Never commit** API keys to version control
- Use environment variable management (Vercel, Azure Key Vault, etc.)
- Service role key should only be used server-side
- Anon key is safe for client-side use (but not needed for Operator Agent)

