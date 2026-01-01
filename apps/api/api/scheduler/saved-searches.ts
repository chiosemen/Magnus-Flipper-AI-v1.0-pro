import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runSavedSearchScheduler } from '../../lib/scheduler/savedSearchScheduler';

const CRON_SECRET = process.env.CRON_SECRET || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (CRON_SECRET) {
    const provided = (req.headers['x-cron-secret'] as string) || '';
    if (provided !== CRON_SECRET) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  }

  const host = req.headers.host;
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const baseUrl = host ? `${proto}://${host}` : '';

  const summary = await runSavedSearchScheduler({ baseUrl });
  res.status(200).json(summary);
}
