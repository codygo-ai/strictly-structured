/**
 * Build script for the validate-schema skill plugin.
 * Assembles a dist directory with all artifacts needed for distribution.
 *
 * Usage: tsx build.ts [--out-dir <path>]
 */

import { cpSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const outDirIdx = args.indexOf("--out-dir");
const outDir = outDirIdx !== -1 ? args[outDirIdx + 1] : join(__dirname, "dist");

const rulesSource = join(__dirname, "..", "schemas", "data", "structured_output_groups.json");
const skillDir = join(__dirname, "skills", "validate-schema");
const validateScript = join(__dirname, "src", "validate.mjs");

// Clean and create output
if (existsSync(outDir)) rmSync(outDir, { recursive: true });

const pluginRoot = join(outDir, "validate-schema");
const pluginSkillDir = join(pluginRoot, "skills", "validate-schema");

mkdirSync(join(pluginRoot, ".claude-plugin"), { recursive: true });
mkdirSync(join(pluginSkillDir, "scripts"), { recursive: true });
mkdirSync(join(pluginSkillDir, "rules"), { recursive: true });
mkdirSync(join(pluginSkillDir, "reference"), { recursive: true });
mkdirSync(join(pluginSkillDir, "examples"), { recursive: true });

// Copy plugin.json
cpSync(
  join(__dirname, "plugin.json"),
  join(pluginRoot, ".claude-plugin", "plugin.json")
);

// Copy SKILL.md
cpSync(
  join(skillDir, "SKILL.md"),
  join(pluginSkillDir, "SKILL.md")
);

// Copy validate.mjs
cpSync(validateScript, join(pluginSkillDir, "scripts", "validate.mjs"));

// Copy rules JSON
cpSync(rulesSource, join(pluginSkillDir, "rules", "structured_output_groups.json"));

// Copy reference docs
cpSync(
  join(skillDir, "reference"),
  join(pluginSkillDir, "reference"),
  { recursive: true }
);

// Copy examples
cpSync(
  join(skillDir, "examples"),
  join(pluginSkillDir, "examples"),
  { recursive: true }
);

console.log(`Skill plugin built to: ${pluginRoot}`);
