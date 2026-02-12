/**
 * Local dev server – invokes the Lambda handler with a minimal API Gateway v2 event.
 * Not deployed. Run: pnpm run dev
 */

import { createServer } from "node:http";
import { handler } from "./handler.js";

const PORT = Number(process.env.PORT) || 3001;

function toEvent(method: string, path: string, body: string): import("aws-lambda").APIGatewayProxyEventV2 {
  return {
    version: "2.0",
    routeKey: "$default",
    rawPath: path,
    rawQueryString: "",
    headers: {},
    requestContext: {
      accountId: "local",
      apiId: "local",
      domainName: "localhost",
      domainPrefix: "localhost",
      http: {
        method,
        path,
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "local",
      },
      requestId: "local",
      routeKey: "$default",
      stage: "local",
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
    },
    body: body || undefined,
    isBase64Encoded: false,
  };
}

const server = createServer(async (req, res) => {
  const method = req.method ?? "GET";
  const path = req.url?.split("?")[0] ?? "/";

  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    });
    res.end();
    return;
  }

  if (method !== "POST" || (path !== "/validate" && path !== "/")) {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed. POST /validate to validate." }));
    return;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString("utf-8");

  const event = toEvent(method, path, body);
  try {
    const result = await handler(event);
    res.writeHead(result.statusCode, result.headers as Record<string, string>);
    res.end(result.body);
  } catch (err) {
    console.error(err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }));
  }
});

server.listen(PORT, () => {
  console.log(`\n  Lambda dev server → http://localhost:${PORT}`);
  console.log(`  POST /validate to test (reloads on file change)\n`);
});
