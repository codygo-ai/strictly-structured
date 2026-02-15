import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerValidateSchemaTool } from "./tools/validateSchema";
import { registerListGroupsTool } from "./tools/listGroups";
import { registerFixSchemaTool } from "./tools/fixSchema";
import { registerConvertCodeTool } from "./tools/convertCode";
import { registerValidateCodeTool } from "./tools/validateCode";
import { registerPreviewSdkTransformTool } from "./tools/previewSdkTransform";
import { registerFixCodeTool } from "./tools/fixCode";
import { registerListSdksTool } from "./tools/listSdks";

declare const PKG_VERSION: string;

export function createServer(): McpServer {
  const server = new McpServer({
    name: "ssv-mcp-server",
    version: PKG_VERSION,
  });

  // Existing tools
  registerValidateSchemaTool(server);
  registerListGroupsTool(server);
  registerFixSchemaTool(server);

  // Code & SDK tools
  registerConvertCodeTool(server);
  registerValidateCodeTool(server);
  registerPreviewSdkTransformTool(server);
  registerFixCodeTool(server);
  registerListSdksTool(server);

  return server;
}
