import path from 'node:path';
import { parseArgs } from 'node:util';

import { RULE_SET_IDS } from '@ssv/schemas/types';
import type { RuleSetId } from '@ssv/schemas/types';

import { printReport, writeReport } from './report';
import type { VerifyOptions } from './types';
import { runVerify } from './verify';

// pnpm --filter sets CWD to the package dir; INIT_CWD is the original invocation dir
const CALLER_CWD = process.env.INIT_CWD ?? process.cwd();

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    rulesets: { type: 'string', short: 'r' },
    output: { type: 'string', short: 'o' },
    'no-llm': { type: 'boolean', default: false },
    'no-fix': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (values.help || positionals.length === 0) {
  console.log(`Usage: pnpm --filter @ssv/verify run verify <path...> [options]

Arguments:
  path          File or directory containing JSON schema documents (recursive)

Options:
  -r, --rulesets  Comma-separated ruleSet IDs (default: all)
                  Available: ${RULE_SET_IDS.join(', ')}
  -o, --output    Write JSON report to file
  --no-llm        Skip LLM validation (offline mode)
  --no-fix        Skip auto-fix for failing schemas
  -h, --help      Show this help
`);
  process.exit(0);
}

function parseRuleSetIds(raw: string | undefined): RuleSetId[] | undefined {
  if (!raw) return undefined;
  const ids = raw.split(',').map((s) => s.trim());
  for (const id of ids) {
    if (!(RULE_SET_IDS as readonly string[]).includes(id)) {
      throw new Error(`Unknown ruleSetId: ${id}. Available: ${RULE_SET_IDS.join(', ')}`);
    }
  }
  return ids as RuleSetId[];
}

const opts: VerifyOptions = {
  ruleSetIds: parseRuleSetIds(values.rulesets),
  outputPath: values.output,
  skipLlm: values['no-llm'],
  skipFix: values['no-fix'],
};

const resolvedPaths = positionals.map((p) => path.resolve(CALLER_CWD, p));
const report = await runVerify(resolvedPaths, opts);
printReport(report);

if (opts.outputPath) {
  writeReport(report, opts.outputPath);
}
