import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const FILE = path.join(DATA_DIR, 'store.json');

type Store = {
  org: Record<string, any>[];
  user_tbl: Record<string, any>[];
  lead_list: Record<string, any>[];
  lead: Record<string, any>[];
  oauth_conn: Record<string, any>[];
  email_send: Record<string, any>[];
};

const EXPECTED_TABLES: (keyof Store)[] = ['org', 'user_tbl', 'lead_list', 'lead', 'oauth_conn', 'email_send'];

function load(): Store {
  if (!fs.existsSync(FILE)) {
    const init: Store = { org: [], user_tbl: [], lead_list: [], lead: [], oauth_conn: [], email_send: [] };
    fs.writeFileSync(FILE, JSON.stringify(init, null, 2));
    return init;
  }
  const raw = fs.readFileSync(FILE, 'utf8');
  const parsed = JSON.parse(raw) as Partial<Store>;
  // Ensure all expected tables exist (handle older/partial store files)
  for (const t of EXPECTED_TABLES) {
    if (!Array.isArray(parsed[t])) parsed[t] = [];
  }
  // Persist normalized shape back to file in case we added missing tables
  fs.writeFileSync(FILE, JSON.stringify(parsed, null, 2));
  return parsed as Store;
}

function save(s: Store) {
  fs.writeFileSync(FILE, JSON.stringify(s, null, 2));
}

const store = load();

export function insert(table: keyof Store, rec: any) {
  if (!Array.isArray(store[table])) store[table] = [] as any;
  store[table].push(rec);
  save(store);
}

export function insertMany(table: keyof Store, recs: any[]) {
  if (!Array.isArray(store[table])) store[table] = [] as any;
  store[table].push(...recs);
  save(store);
}

export function query(table: keyof Store, where: (r: any) => boolean, orderBy?: (a: any, b: any) => number) {
  let items = store[table].filter(where);
  if (orderBy) items = items.sort(orderBy);
  return items;
}

export function count(table: keyof Store, where: (r: any) => boolean) {
  return store[table].filter(where).length;
}

export default { insert, insertMany, query, count };
