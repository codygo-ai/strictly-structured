import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerExplainErrorsPrompt } from './prompts/explainErrors';
import { registerFixSchemaPrompt } from './prompts/fixSchema';
import { registerGenerateSchemaPrompt } from './prompts/generateSchema';
import { registerConvertCodeTool } from './tools/convertCode';
import { registerFixCodeTool } from './tools/fixCode';
import { registerFixSchemaTool } from './tools/fixSchema';
import { registerListGroupsTool } from './tools/listGroups';
import { registerListSdksTool } from './tools/listSdks';
import { registerPreviewSdkTransformTool } from './tools/previewSdkTransform';
import { registerValidateCodeTool } from './tools/validateCode';
import { registerValidateSchemaTool } from './tools/validateSchema';

declare const PKG_VERSION: string;

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'ssv-mcp-server',
    version: PKG_VERSION,
  });

  registerValidateSchemaTool(server);
  registerListGroupsTool(server);
  registerFixSchemaTool(server);
  registerConvertCodeTool(server);
  registerValidateCodeTool(server);
  registerPreviewSdkTransformTool(server);
  registerFixCodeTool(server);
  registerListSdksTool(server);

  registerFixSchemaPrompt(server);
  registerGenerateSchemaPrompt(server);
  registerExplainErrorsPrompt(server);

  return server;
}
