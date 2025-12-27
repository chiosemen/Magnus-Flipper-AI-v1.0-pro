import { Prisma } from '@prisma/client';
import { AlertsResponse } from '@magnus/deploy-guardian-contracts';
import { getPrismaClient } from '../client.js';

export async function fetchAlerts(since?: string, limit = 100): Promise<AlertsResponse | null> {
  const client = await getPrismaClient();
  if (!client) return null;

  try {
    const rows = await client.$queryRaw<
      Array<{
        id: string;
        severity: string;
        category: string;
        message: string;
        created_at: Date;
        context: unknown | null;
      }>
    >(Prisma.sql`
      select id, severity, category, message, created_at, context
      from guardian_alerts
      where ${since ? Prisma.sql`created_at >= ${new Date(since)}` : Prisma.sql`true`}
      order by created_at desc
      limit ${limit}
    `);

    return AlertsResponse.parse({
      alerts: rows.map((row) => ({
        id: row.id,
        severity: row.severity,
        category: row.category,
        message: row.message,
        created_at: row.created_at.toISOString(),
        context: row.context ?? null,
      })),
    });
  } catch (error) {
    console.error('[guardian-api] fetchAlerts failed', error);
    return null;
  }
}
