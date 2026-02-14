import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerValidateSchemaTool } from "./tools/validateSchema";
import { registerListGroupsTool } from "./tools/listGroups";
import { registerFixSchemaTool } from "./tools/fixSchema";

declare const PKG_VERSION: string;

export function createServer(): McpServer {
  const server = new McpServer({
    name: "ssv-mcp-server",
    version: PKG_VERSION,
  });

  registerValidateSchemaTool(server);
  registerListGroupsTool(server);
  registerFixSchemaTool(server);

  return server;
}
