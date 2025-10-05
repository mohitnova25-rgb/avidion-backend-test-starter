This is a minimal TypeScript Express app to satisfy the hiring test endpoints.

Run locally:

1. cd candidate
2. npm install
3. npm run dev

The server starts on port 3000 by default.


POST /v1/lead-lists → INSERT into lead_list
POST /v1/leads/upload → INSERT many into lead
GET /v1/leads → SELECT with pagination
POST /v1/oauth/connect → INSERT into oauth_conn, call mock email provider, INSERT into email_send