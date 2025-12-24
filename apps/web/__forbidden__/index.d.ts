/**
 * 🚫 FORBIDDEN IMPORT BOUNDARY
 * 
 * This package is intentionally forbidden in apps/web.
 * 
 * WHY: apps/web must depend only on stable contracts, not implementation.
 * 
 * WHAT TO DO INSTEAD:
 * Import from "@/lib/types/*" instead.
 * 
 * Example:
 *   ❌ import type { FeedItem } from "@magnus-flipper-ai/core/types/feed"
 *   ✅ import type { FeedItem } from "@/lib/types/feed"
 * 
 * If you need a type that doesn't exist in @/lib/types:
 * 1. Add it to the appropriate file in apps/web/lib/types/
 * 2. This is intentional — contracts are manually synced
 * 3. Breaking changes are explicit, not silent
 */

// This will cause a clear error if anyone tries to import from @magnus-flipper-ai packages
export type FORBIDDEN_IMPORT_ERROR = 
  "🚫 Import from @/lib/types/* instead. See apps/web/__forbidden__/index.d.ts for details.";

