import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsup';
import pkg from './package.json' assert { type: 'json' };
const cwd = dirname(fileURLToPath(import.meta.url));

const deps = (pkg.dependencies as Record<string, string> | undefined) ?? {};
const external = Object.keys(deps);
const { devDependencies: _, ...distPkg } = pkg;



export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  target: "node22",
  outDir: "dist",
  clean: true,
  splitting: false,
  sourcemap: true,
  external,
  async onSuccess(){
  writeFileSync(
    join(cwd, "dist", "package.json"),
    JSON.stringify(distPkg, null, 2),
  );
  }
});
