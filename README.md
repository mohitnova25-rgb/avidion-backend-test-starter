# Avidion Backend Practical Test — Starter Repo

This folder gives the candidate a ready environment:
- Docker for **Postgres** and **Redis**
- Node/Express **mock providers** (Email, CRM, AI)

## HR: Start infra before the test
```bash
docker compose up -d
cd mocks && npm install && npm run start-all
```
Health checks (open in browser):
- Email mock: http://localhost:4010/_health  → `{ok:true}`
- CRM mock:   http://localhost:4020/_health  → `{ok:true}`
- AI mock:    http://localhost:4030/_health  → `{ok:true}`

## Candidate Instructions
- Build your backend in the `candidate/` folder (NestJS recommended).
- Use `.env.sample` values for DB/Redis and providers.
- Deliverables: code zip (candidate/), README, Postman export.
