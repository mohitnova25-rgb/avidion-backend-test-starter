import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 4010;

let sends = [];
let tokens = { access_token: 'token-abc', expires_in: 3600 };

app.post('/send', (req, res) => {
  const { to, subject, body, access_token } = req.body || {};
  if (!to || !subject || !body) return res.status(400).json({ error: 'missing_fields' });
  if (!access_token) return res.status(401).json({ error: 'no_token' });

  if (sends.length > 0 && sends.length % 10 === 0) {
    return res.status(429).json({ error: 'rate_limited' });
  }

  const message_id = uuidv4();
  sends.push({ id: message_id, to, subject, body, ts: Date.now() });
  return res.json({ message_id, thread_id: 'thread-' + to });
});

app.post('/refresh', (_req, res) => {
  tokens = { access_token: 'token-' + uuidv4().slice(0,8), expires_in: 3600 };
  return res.json(tokens);
});

function verifySig(req) {
  return req.header('X-Mock-Signature') === 'test';
}

app.post('/webhooks/reply', (req, res) => {
  if (!verifySig(req)) return res.status(401).send('bad sig');
  const event = { id: uuidv4(), type: 'reply', ...req.body };
  return res.json({ ok: true, event });
});

app.post('/webhooks/bounce', (req, res) => {
  if (!verifySig(req)) return res.status(401).send('bad sig');
  const event = { id: uuidv4(), type: 'bounce', ...req.body };
  return res.json({ ok: true, event });
});

app.get('/_health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`[mock-email] listening on :${PORT}`));
