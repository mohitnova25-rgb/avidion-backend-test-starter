import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 4020;

let contacts = new Map();
let activities = new Map();

app.post('/contacts', (req, res) => {
  const { email, name } = req.body || {};
  if (!email) return res.status(400).json({ error: 'missing_email' });
  if (contacts.has(email)) return res.json(contacts.get(email));
  const contact = { id: uuidv4(), email, name: name || null };
  contacts.set(email, contact);
  res.json(contact);
});

app.post('/activities', (req, res) => {
  const { send_id, contact_id, note } = req.body || {};
  if (!send_id || !contact_id) return res.status(400).json({ error: 'missing_fields' });
  if (activities.has(send_id)) {
    return res.status(409).json({ error: 'duplicate', existing: activities.get(send_id) });
  }
  const activity = { id: uuidv4(), send_id, contact_id, note: note || '', ts: Date.now() };
  activities.set(send_id, activity);
  res.json(activity);
});

app.get('/_health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`[mock-crm] listening on :${PORT}`));
