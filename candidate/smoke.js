const http = require('http');

function request(method, path, body) {
  const opts = { hostname: 'localhost', port: 3000, path, method, headers: { 'Content-Type': 'application/json' } };
  return new Promise((resolve, reject) => {
    const req = http.request(opts, res => {
      let data='';
      res.on('data', d=>data+=d);
      res.on('end', ()=>{
        try { resolve(JSON.parse(data)); } catch(e){ resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async()=>{
  const res1 = await request('POST', '/v1/lead-lists', { org_id: 'org1', name: 'List A' });
  console.log('create list ->', res1);
  const id = res1.id;
  const res2 = await request('POST', '/v1/leads/upload', { org_id: 'org1', list_id: id, leads: [{ email: 'a@example.com', name: 'A' }, { email: 'b@example.com', name: 'B', status: 'NEW' }] });
  console.log('upload ->', res2);
  const res3 = await request('GET', '/v1/leads?org_id=org1&status=NEW&page=1&size=50');
  console.log('fetch ->', res3);
})();
