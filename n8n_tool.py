import json
import sys
import subprocess
import os

def call_mcp_tool(tool_name, arguments):
    env = os.environ.copy()
    env["N8N_API_URL"] = "https://n8n-automations-production-0614.up.railway.app"
    env["N8N_BASE_URL"] = "https://n8n-automations-production-0614.up.railway.app"
    env["N8N_API_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNzQ3MGExZC1hZmE4LTQ3ZjEtODhiNy0yZTlmOTI2NDNjODkiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiOTUyZmFmMWQtZWRjMS00ZmFhLWI5NDYtODgxMzExNGNlYzNkIiwiaWF0IjoxNzc5NzYwMDA2fQ.ZnCinJdwPSWD0o_LST4VI6zQpYB_7BNUb0fxeTFZ_zU"
    
    proc = subprocess.Popen(
        ['node', r'C:\Users\hever\AppData\Roaming\npm\node_modules\n8n-mcp\dist\mcp\index.js'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=sys.stderr,
        text=True,
        env=env
    )
    
    init_req = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "python-client", "version": "1.0.0"}
        }
    }
    proc.stdin.write(json.dumps(init_req) + '\n')
    proc.stdin.flush()
    
    while True:
        line = proc.stdout.readline()
        if not line:
            return "Process closed before init response"
        try:
            msg = json.loads(line)
            if msg.get('id') == 1:
                break
        except json.JSONDecodeError:
            pass

    init_notif = {
        "jsonrpc": "2.0",
        "method": "notifications/initialized"
    }
    proc.stdin.write(json.dumps(init_notif) + '\n')
    proc.stdin.flush()
    
    tool_req = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }
    proc.stdin.write(json.dumps(tool_req) + '\n')
    proc.stdin.flush()
    
    while True:
        line = proc.stdout.readline()
        if not line:
            proc.terminate()
            return "Process closed before tool response"
        try:
            msg = json.loads(line)
            if msg.get('id') == 2:
                proc.terminate()
                return msg.get('result')
        except json.JSONDecodeError:
            pass

if __name__ == '__main__':
    tool = sys.argv[1]
    args = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    res = call_mcp_tool(tool, args)
    print(json.dumps(res, indent=2))
