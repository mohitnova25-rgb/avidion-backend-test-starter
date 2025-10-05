import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 4030;

app.post('/classify', (req, res) => {
  const { title, website } = req.body || {};
  const industry = (website || '').toLowerCase().includes('logistic') ? 'logistics' : 'saas';
  const role = (title || '').toLowerCase().includes('marketing') ? 'marketing' : 'operations';
  res.json({ industry, role, personalization_need: 'medium' });
});

app.post('/draft', (req, res) => {
  const { bullets = [], industry = 'saas' } = req.body || {};
  const hook = bullets[0] || `noticed your work in ${industry}`;
  const subject = `Quick idea for ${industry}`;
  const body = `Hi {{name}},\n\n${hook}. We help teams like yours improve response times.\nOpen to a short chat?\n\nThanks,\nAvidion`;
  res.json({ subject, body });
});

app.post('/verify', (req, res) => {
  const { body = '' } = req.body || {};
  const wordCount = body.split(/\s+/).filter(Boolean).length;
  const pass = wordCount > 10 && wordCount < 150;
  const spamScore = 0.1;
  const hasCTA = body.toLowerCase().includes('chat');
  res.json({ hasName: body.includes('Hi'), hasCTA, wordCount, spamScore, pass, issues: pass ? [] : ['length'] });
});

app.get('/_health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`[mock-llm] listening on :${PORT}`));
