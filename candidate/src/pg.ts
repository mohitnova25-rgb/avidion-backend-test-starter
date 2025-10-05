import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'avidion_test'
});

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS org (id text PRIMARY KEY, name text);
    CREATE TABLE IF NOT EXISTS user_tbl (id text PRIMARY KEY, org_id text NOT NULL, email text, name text);
    CREATE TABLE IF NOT EXISTS lead_list (id text PRIMARY KEY, org_id text NOT NULL, name text, created_at bigint);
    CREATE TABLE IF NOT EXISTS lead (id text PRIMARY KEY, org_id text NOT NULL, list_id text, email text, name text, status text DEFAULT 'NEW', metadata jsonb, created_at bigint);
    CREATE TABLE IF NOT EXISTS oauth_conn (id text PRIMARY KEY, org_id text NOT NULL, provider text, token text, created_at bigint);
    CREATE TABLE IF NOT EXISTS email_send (id text PRIMARY KEY, lead_id text, org_id text, provider_message_id text, provider text, to_addr text, subject text, body text, created_at bigint);
  `);
}

// run migration on import
migrate().catch(err => {
  console.error('pg migration failed', err);
  process.exit(1);
});

export async function query(text: string, params?: any[]) {
  const res = await pool.query(text, params);
  return res.rows;
}

export async function insert(table: string, rec: any) {
  // naive mapping: keys -> columns
  const cols = Object.keys(rec);
  const vals = cols.map((c) => rec[c]);
  const placeholders = cols.map((_, i) => `$${i+1}`).join(', ');
  const text = `INSERT INTO ${table}(${cols.join(',')}) VALUES (${placeholders})`;
  await pool.query(text, vals);
}

export async function insertMany(table: string, recs: any[]) {
  if (!recs || recs.length === 0) return;
  const cols = Object.keys(recs[0]);
  const values: any[] = [];
  const rows: string[] = recs.map((r, i) => {
    const placeholders = cols.map((_, j) => `$${i*cols.length + j + 1}`);
    values.push(...cols.map(c => r[c]));
    return `(${placeholders.join(',')})`;
  });
  const text = `INSERT INTO ${table}(${cols.join(',')}) VALUES ${rows.join(',')}`;
  await pool.query(text, values);
}

export async function count(table: string, whereClause = 'TRUE', params: any[] = []) {
  const res = await pool.query(`SELECT count(*)::int as cnt FROM ${table} WHERE ${whereClause}`, params);
  return res.rows[0].cnt as number;
}

export default { query, insert, insertMany, count };
