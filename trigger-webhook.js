const http = require('http');

const req = http.request('http://localhost:3000/api/webhooks/incoming/kylas/deals/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log('Status:', res.statusCode, '\nBody:', data));
});

req.on('error', console.error);
req.write('{}');
req.end();
