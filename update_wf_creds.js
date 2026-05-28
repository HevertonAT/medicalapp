const url = "https://n8n-automations-production-0614.up.railway.app/api/v1/workflows/vWrY0r0Ao46nLppt";
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNzQ3MGExZC1hZmE4LTQ3ZjEtODhiNy0yZTlmOTI2NDNjODkiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiOTUyZmFmMWQtZWRjMS00ZmFhLWI5NDYtODgxMzExNGNlYzNkIiwiaWF0IjoxNzc5NzYwMDA2fQ.ZnCinJdwPSWD0o_LST4VI6zQpYB_7BNUb0fxeTFZ_zU";

fetch(url, { headers: { "X-N8N-API-KEY": apiKey } })
  .then(res => res.json())
  .then(workflow => {
    // Attach whatsAppApi to nodes
    workflow.nodes.forEach(node => {
      if (node.name === "Download Audio (Meta API)") {
        node.credentials = {
          whatsAppApi: {
            id: "DYcydcnV4Yvq7aMA",
            name: "WhatsApp account"
          }
        };
      }
      if (node.name === "WhatsApp") {
        node.credentials = {
          whatsAppApi: {
            id: "DYcydcnV4Yvq7aMA",
            name: "WhatsApp account"
          }
        };
      }
    });

    // Save it back
    return fetch(url, {
      method: "PUT",
      headers: { 
        "X-N8N-API-KEY": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(workflow)
    });
  })
  .then(res => res.json())
  .then(data => console.log("Success:", data.id))
  .catch(err => console.error(err));
