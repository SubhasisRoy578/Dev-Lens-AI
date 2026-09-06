import type { VercelRequest, VercelResponse } from '@vercel/node';
import { startServer } from '../server';

let appPromise: ReturnType<typeof startServer> | undefined;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    appPromise ??= startServer();
    const app = await appPromise;
    return app(req, res);
  } catch (error) {
    console.error('[v0] API initialization failed:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'API initialization failed.' });
    }
  }
}
