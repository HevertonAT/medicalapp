const fs = require('fs');
const u='https://n8n-automations-production-0614.up.railway.app/api/v1/workflows/vWrY0r0Ao46nLppt';
const k='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNzQ3MGExZC1hZmE4LTQ3ZjEtODhiNy0yZTlmOTI2NDNjODkiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiOTUyZmFmMWQtZWRjMS00ZmFhLWI5NDYtODgxMzExNGNlYzNkIiwiaWF0IjoxNzc5NzYwMDA2fQ.ZnCinJdwPSWD0o_LST4VI6zQpYB_7BNUb0fxeTFZ_zU';

async function fix() {
  const r = await fetch(u, {headers:{'X-N8N-API-KEY':k}});
  const w = await r.json();

  // Find the WhatsApp Trigger node
  const waIdx = w.nodes.findIndex(n => n.name === 'WhatsApp Trigger');
  if(waIdx === -1) return console.log('not found');
  const waNode = w.nodes[waIdx];

  // Modify it so it is a standard webhook
  const hookNode = {
    parameters: {
      httpMethod: 'POST',
      path: 'c7e46f35-fc57-4aba-9bf2-db42cf75ee71/webhook',
      responseMode: 'onReceived',
      options: {}
    },
    id: 'custom-wa-webhook',
    name: 'WhatsApp Webhook Custom',
    type: 'n8n-nodes-base.webhook',
    typeVersion: 1,
    position: waNode.position
  };

  // Add the node
  w.nodes.push(hookNode);

  // Re-wire connections
  if (!w.connections['WhatsApp Webhook Custom']) w.connections['WhatsApp Webhook Custom'] = {};
  
  // Wire POST route to wherever WhatsApp Trigger went!
  w.connections['WhatsApp Webhook Custom']['main'] = w.connections[waNode.name]['main'];

  // Remove WhatsApp Trigger
  w.nodes.splice(waIdx, 1);
  delete w.connections[waNode.name];

  w.active = true;

  const update = await fetch(u, {
    method: 'PUT',
    headers:{'X-N8N-API-KEY':k,'Content-Type':'application/json'},
    body: JSON.stringify(w)
  });
  console.log(await update.json());
}
fix();
