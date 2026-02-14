#!/usr/bin/env node
/**
 * Reads packages/backend/.env and creates/updates the three API key secrets
 * via Firebase CLI (Secret Manager). Run before firebase deploy so functions have secrets.
 * Requires: firebase login (same auth as firebase deploy).
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const REPO_ROOT = join(ROOT, "..", "..");
const ENV_PATH = join(ROOT, ".env");

const SECRET_NAMES = [
  "OPENAI_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "ANTHROPIC_API_KEY",
];

function parseEnv(content) {
  const out = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { stdio: "pipe", encoding: "utf8", ...opts });
}

function setSecret(name, value) {
  const r = run(
    "pnpm",
    ["exec", "firebase", "functions:secrets:set", name, "--data-file=-", "--force"],
    { input: value, cwd: REPO_ROOT }
  );
  if (r.status !== 0) {
    console.error(`Failed to set secret ${name}:`, r.stderr || r.stdout);
    process.exit(1);
  }
}

function main() {
  if (!existsSync(ENV_PATH)) {
    console.error(`Missing ${ENV_PATH}. Create it with OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, ANTHROPIC_API_KEY.`);
    process.exit(1);
  }

  const content = readFileSync(ENV_PATH, "utf8");
  const env = parseEnv(content);

  const missing = SECRET_NAMES.filter((k) => !env[k] || env[k].trim() === "");
  if (missing.length > 0) {
    console.error(`Missing or empty in .env: ${missing.join(", ")}`);
    process.exit(1);
  }

  for (const name of SECRET_NAMES) {
    setSecret(name, env[name]);
  }
  console.log("Secrets updated:", SECRET_NAMES.join(", "));
}

main();
