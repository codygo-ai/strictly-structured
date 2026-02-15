const BLOCKED_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bimport\s*\(/, reason: "Dynamic import() is not allowed" },
  { pattern: /\brequire\s*\(/, reason: "require() is not allowed" },
  { pattern: /\bfetch\s*\(/, reason: "fetch() is not allowed" },
  { pattern: /\bprocess\b/, reason: "process access is not allowed" },
  { pattern: /\bglobalThis\b/, reason: "globalThis access is not allowed" },
  { pattern: /\beval\s*\(/, reason: "eval() is not allowed" },
  { pattern: /\bnew\s+Function\b/, reason: "new Function() is not allowed" },
  { pattern: /\bFunction\s*\(/, reason: "Function() constructor is not allowed" },
  { pattern: /\b__proto__\b/, reason: "__proto__ access is not allowed" },
  { pattern: /\bconstructor\s*\[/, reason: "constructor[] access is not allowed" },
  { pattern: /\bProxy\s*\(/, reason: "Proxy constructor is not allowed" },
  { pattern: /\bReflect\b/, reason: "Reflect access is not allowed" },
  { pattern: /\bchild_process\b/, reason: "child_process access is not allowed" },
  { pattern: /\bexecSync\b/, reason: "execSync is not allowed" },
  { pattern: /\bspawnSync\b/, reason: "spawnSync is not allowed" },
  { pattern: /\bfs\b\s*\./, reason: "fs module access is not allowed" },
  { pattern: /\breadFileSync\b/, reason: "readFileSync is not allowed" },
  { pattern: /\bwriteFileSync\b/, reason: "writeFileSync is not allowed" },
  { pattern: /\bsetTimeout\b/, reason: "setTimeout is not allowed" },
  { pattern: /\bsetInterval\b/, reason: "setInterval is not allowed" },
  { pattern: /\bwhile\s*\(true\)/, reason: "Infinite loops are not allowed" },
  { pattern: /\bfor\s*\(\s*;\s*;\s*\)/, reason: "Infinite loops are not allowed" },
];

export interface SecurityScanResult {
  safe: boolean;
  violations: string[];
}

export function scanZodCode(code: string): SecurityScanResult {
  // Strip import statements for zod — those are expected
  const stripped = code.replace(
    /import\s*\{?\s*z\s*\}?\s*from\s*["']zod["']\s*;?\n?/g,
    "",
  );

  const violations: string[] = [];

  for (const { pattern, reason } of BLOCKED_PATTERNS) {
    if (pattern.test(stripped)) {
      violations.push(reason);
    }
  }

  return { safe: violations.length === 0, violations };
}
