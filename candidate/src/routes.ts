import express from 'express';
import { Request, Response, NextFunction } from 'express';
import db from './pg';
import { v4 as uuidv4 } from 'uuid';

class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const router = express.Router();

// POST /v1/lead-lists → create new list → { id }
router.post('/v1/lead-lists', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { org_id, name } = req.body as any;
    if (!org_id) return next(new ApiError(400, 'bad_request', 'org_id required'));
    const id = uuidv4();
    await db.insert('lead_list', { id, org_id, name: name || null, created_at: Date.now() });
    return res.json({ id });
  } catch (err) {
    return next(err);
  }
});

// POST /v1/leads/upload → bulk insert leads → { inserted:n }
router.post('/v1/leads/upload', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { org_id, list_id, leads } = req.body as any;
    if (!org_id || !Array.isArray(leads)) return next(new ApiError(400, 'bad_request', 'org_id and leads[] required'));
    const items = leads.map((item: any) => ({
      id: uuidv4(),
      org_id,
      list_id: list_id || null,
      email: item.email || null,
      name: item.name || null,
      status: item.status || 'NEW',
      metadata: item.metadata || null,
      created_at: Date.now()
    }));
    await db.insertMany('lead', items);
    return res.json({ inserted: items.length });
  } catch (err) {
    return next(err);
  }
});

// GET /v1/leads?status=NEW&page=1&size=50 → paginated results
router.get('/v1/leads', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org_id = String((req.query.org_id || '') as string);
    const status = String((req.query.status || '') as string);
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const size = Math.max(1, Math.min(100, parseInt(String(req.query.size || '50'), 10)));
    if (!org_id) return next(new ApiError(400, 'bad_request', 'org_id required'));
    // Query Postgres for paginated leads
    const whereClauses: string[] = ['org_id = $1'];
    const params: any[] = [org_id];
    if (status) { params.push(status); whereClauses.push(`status = $${params.length}`); }
    const where = whereClauses.join(' AND ');
    const total = await db.count('lead', where, params);
    const offset = (page - 1) * size;
    const rows = await db.query(`SELECT id, org_id, list_id, email, name, status, metadata, created_at FROM lead WHERE ${where} ORDER BY created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`, [...params, size, offset]);
    return res.json({ total, page, size, items: rows });
  } catch (err) {
    return next(err);
  }
});

// POST /v1/oauth/connect -> save provider token and send a test email using the saved token
router.post('/v1/oauth/connect', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { org_id, provider, token, test_email } = req.body as any;
    if (!org_id || !provider || !token) return next(new ApiError(400, 'bad_request', 'org_id, provider and token required'));

  const id = uuidv4();
  await db.insert('oauth_conn', { id, org_id, provider, token, created_at: Date.now() });

    // Prepare test email payload
    const to = (test_email && test_email.to) || 'test@example.com';
    const subject = (test_email && test_email.subject) || 'Test email';
    const body = (test_email && test_email.body) || 'This is a test email';

    // Call mock email provider
    const emailUrl = process.env.PROVIDER_EMAIL_BASE || 'http://localhost:4010/send';
    // Use global fetch (Node 18+) or dynamic import fallback
    const fetchFn: typeof fetch = (globalThis as any).fetch || (await import('node-fetch')).default;
    const resp = await fetchFn(emailUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ to, subject, body, access_token: token })
    });
    const json = await resp.json().catch(()=>({}));
    if (!resp.ok) {
      return next(new ApiError(resp.status, 'email_send_failed', json && json.error ? json.error : 'send failed'));
    }

    const provider_message_id = json && json.message_id ? json.message_id : null;
  const sendId = uuidv4();
  await db.insert('email_send', { id: sendId, lead_id: null, org_id, provider_message_id, provider, to_addr: to, subject, body, created_at: Date.now() });

    return res.json({ ok: true, oauth_id: id, email_send_id: sendId, provider_message_id });
  } catch (err) {
    return next(err);
  }
});

export default router;

