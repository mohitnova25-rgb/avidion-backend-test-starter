import fetch from 'node-fetch';

async function run() {
  const base = 'http://localhost:3000';
  console.log('creating lead list...');
  const res1 = await fetch(base + '/v1/lead-lists', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ org_id: 'org1', name: 'List A' }) });
  console.log(await res1.json());
}

run().catch(e=>console.error(e));
