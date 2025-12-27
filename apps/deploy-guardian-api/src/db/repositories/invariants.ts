import { Prisma } from '@prisma/client';
import { InvariantsEvaluateResponse } from '@magnus/deploy-guardian-contracts';
import { getPrismaClient } from '../client.js';

export async function fetchLatestInvariants(): Promise<InvariantsEvaluateResponse | null> {
  const client = await getPrismaClient();
  if (!client) return null;

  try {
    const rows = await client.$queryRaw<
      Array<{ ok: boolean; violations: unknown; created_at: Date }>
    >(Prisma.sql`
      select ok, violations, created_at
      from guardian_invariant_results
      order by created_at desc
      limit 1
    `);

    const row = rows[0];
    if (!row) return null;

    return InvariantsEvaluateResponse.parse({
      ok: row.ok,
      violations: row.violations,
    });
  } catch (error) {
    console.error('[guardian-api] fetchLatestInvariants failed', error);
    return null;
  }
}
