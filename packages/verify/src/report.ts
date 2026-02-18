import fs from 'node:fs';
import path from 'node:path';

import type { VerifyReport, DocumentReport, RuleSetReport } from './types';

function statusIcon(valid: boolean): string {
  return valid ? 'PASS' : 'FAIL';
}

function llmStatusIcon(rs: RuleSetReport): string {
  return rs.llmTest.skipped ? 'SKIP' : statusIcon(rs.llmTest.valid);
}

function formatRuleSetLine(rs: RuleSetReport): string {
  const parts = [
    `    [${rs.ruleSetId}]`,
    `validation=${statusIcon(rs.validation.valid)}`,
    `llm=${llmStatusIcon(rs)}`,
    rs.llmTest.error && !rs.llmTest.skipped ? `(${rs.llmTest.error.slice(0, 80)})` : '',
  ];

  if (rs.fix) {
    const fixStatus =
      rs.fix.postFixValidation.valid && rs.fix.postFixLlmTest.valid ? 'PASS' : 'PARTIAL';
    parts.push(
      `| fix=${fixStatus} (${rs.fix.appliedFixes.length} applied, ${rs.fix.unresolvedErrors.length} unresolved)`,
    );
  }

  return parts.filter(Boolean).join(' ');
}

function formatDocument(doc: DocumentReport): string {
  const lines = [`  ${doc.path}  structural=${statusIcon(doc.structural.valid)}`];
  if (!doc.structural.valid) {
    for (const e of doc.structural.errors.slice(0, 5)) {
      lines.push(`    structural: ${e}`);
    }
  }
  for (const rs of doc.ruleSetResults) {
    lines.push(formatRuleSetLine(rs));
  }
  return lines.join('\n');
}

export function printReport(report: VerifyReport): void {
  console.log('\n===== Verification Report =====\n');

  for (const doc of report.documents) {
    console.log(formatDocument(doc));
    console.log();
  }

  const s = report.summary;
  console.log('--- Summary ---');
  console.log(`  Documents: ${s.totalDocuments}`);
  console.log(`  Tests:     ${s.totalTests}`);
  console.log(`  Passed:    ${s.passedBoth}`);
  console.log(`  Failed validation only: ${s.failedValidationOnly}`);
  console.log(`  Failed LLM only:       ${s.failedLlmOnly}`);
  console.log(`  Failed both:           ${s.failedBoth}`);
  if (s.llmSkipped > 0) {
    console.log(`  LLM skipped:           ${s.llmSkipped}`);
  }
  if (s.fixAttempted > 0) {
    console.log(`  Fix attempted: ${s.fixAttempted}, succeeded: ${s.fixSucceeded}`);
  }
  console.log();
}

export function writeReport(report: VerifyReport, outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (dir !== '.') fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`Report written to ${outputPath}`);
}
