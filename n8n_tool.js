const { spawn } = require('child_process');

const toolName = process.argv[2];
const toolArgs = process.argv[3] ? JSON.parse(process.argv[3]) : {};

const env = Object.assign({}, process.env, {
  N8N_API_URL: "https://n8n-automations-production-0614.up.railway.app",
  N8N_BASE_URL: "https://n8n-automations-production-0614.up.railway.app",
  N8N_API_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNzQ3MGExZC1hZmE4LTQ3ZjEtODhiNy0yZTlmOTI2NDNjODkiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiOTUyZmFmMWQtZWRjMS00ZmFhLWI5NDYtODgxMzExNGNlYzNkIiwiaWF0IjoxNzc5NzYwMDA2fQ.ZnCinJdwPSWD0o_LST4VI6zQpYB_7BNUb0fxeTFZ_zU"
});

const child = spawn('node', [
  'C:\\Users\\hever\\AppData\\Roaming\\npm\\node_modules\\n8n-mcp\\dist\\mcp\\index.js'
], { env, stdio: ['pipe', 'pipe', 'pipe'] });

let buffer = '';
let initialized = false;

child.stdout.on('data', (data) => {
  buffer += data.toString();
  let lines = buffer.split('\n');
  buffer = lines.pop();

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id === 1) {
        // init response received
        child.stdin.write(JSON.stringify({
          jsonrpc: "2.0",
          method: "notifications/initialized"
        }) + '\n');
        
        // now call tool
        child.stdin.write(JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: toolName,
            arguments: toolArgs
          }
        }) + '\n');
      } else if (msg.id === 2) {
        console.log(JSON.stringify(msg.result, null, 2));
        process.exit(0);
      }
    } catch(e) {}
  }
});

// 1. send initialize
child.stdin.write(JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "node-wrapper", version: "1.0.0" }
  }
}) + '\n');

setTimeout(() => {
  console.error("Timeout");
  process.exit(1);
}, 10000);
