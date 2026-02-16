import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ConversionResult, ConversionWarning } from '../types';

import { checkPython } from './checkPython';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let cachedRunnerPath: string | undefined;

function getRunnerPath(): string {
  if (cachedRunnerPath) return cachedRunnerPath;

  // Same directory (running from source: src/pydantic/)
  const sameDirPath = join(__dirname, 'runner.py');
  if (existsSync(sameDirPath)) {
    cachedRunnerPath = sameDirPath;
    return sameDirPath;
  }

  // From dist → src (running from dist/)
  const distToSrcPath = join(__dirname, '..', '..', 'src', 'pydantic', 'runner.py');
  if (existsSync(distToSrcPath)) {
    cachedRunnerPath = distToSrcPath;
    return distToSrcPath;
  }

  throw new Error(
    'Could not find runner.py. Ensure the @ssv/codegen package is properly installed.',
  );
}

interface RunnerOutput {
  schema?: Record<string, unknown>;
  modelName?: string;
  allModels?: string[];
  error?: string;
}

export async function pydanticToJsonSchema(pydanticCode: string): Promise<ConversionResult> {
  const pythonCheck = checkPython();
  if (!pythonCheck.available || !pythonCheck.pythonPath) {
    throw new Error(
      pythonCheck.error ??
        'Python 3.10+ with pydantic>=2 required. Paste the output of YourModel.model_json_schema() as JSON Schema instead.',
    );
  }

  const runnerPath = getRunnerPath();

  let stdout: string;
  try {
    stdout = execFileSync(pythonCheck.pythonPath, [runnerPath], {
      input: pydanticCode,
      encoding: 'utf-8',
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Python subprocess failed: ${message}`);
  }

  let result: RunnerOutput;
  try {
    result = JSON.parse(stdout) as RunnerOutput;
  } catch {
    throw new Error(`Failed to parse Python output: ${stdout.slice(0, 500)}`);
  }

  if (result.error) {
    throw new Error(result.error);
  }

  if (!result.schema) {
    throw new Error('Python runner did not return a schema');
  }

  const warnings: ConversionWarning[] = [];

  if (result.allModels && result.allModels.length > 1) {
    warnings.push({
      message: `Multiple models found: ${result.allModels.join(', ')}. Using "${result.modelName}" (last defined).`,
      severity: 'info',
    });
  }

  const schema = result.schema;
  if (schema['title']) {
    delete schema['title'];
    warnings.push({
      message:
        "Removed Pydantic-generated 'title' field from root (not supported by most providers).",
      severity: 'info',
    });
  }

  return { schema, warnings, unsupported: [] };
}
