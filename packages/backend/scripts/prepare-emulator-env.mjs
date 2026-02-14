#!/usr/bin/env node
/**
 * Copies packages/backend/.env to packages/backend/.deployed/.env when source exists,
 * and ensures .deployed/.gcloudignore contains .env so deploy never uploads it.
 * Run before starting the Firebase emulator so functions load env from .deployed/.env.
 */

import { copyFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ENV_SOURCE = join(ROOT, ".env");
const DEPLOYED_DIR = join(ROOT, ".deployed");
const ENV_DEST = join(DEPLOYED_DIR, ".env");
const GCLOUDIGNORE_PATH = join(DEPLOYED_DIR, ".gcloudignore");
const GCLOUDIGNORE_CONTENT = `.env
`;

function main() {
  if (!existsSync(DEPLOYED_DIR)) {
    return;
  }
  if (existsSync(ENV_SOURCE)) {
    copyFileSync(ENV_SOURCE, ENV_DEST);
  }
  try {
    writeFileSync(GCLOUDIGNORE_PATH, GCLOUDIGNORE_CONTENT);
  } catch {
    mkdirSync(DEPLOYED_DIR, { recursive: true });
    writeFileSync(GCLOUDIGNORE_PATH, GCLOUDIGNORE_CONTENT);
  }
}

main();
