import { defineConfig } from "tsup";
import pkg from "./package.json" assert { type: "json" };

const deps = (pkg.dependencies as Record<string, string> | undefined) ?? {};
const external = Object.keys(deps);

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  target: "node22",
  outDir: "dist",
  // clean: true,
  splitting: false,
  sourcemap: true,
  external,
  // async onSuccess() {
  //   writeFileSync(
  //     join(cwd, "dist", "package.json"),
  //     JSON.stringify(
  //       { ...distPkg, main: "index.js" }, //files: ["index.js", "index.js.map", "package.json"]
  //       null,
  //       2,
  //     ),
  //   );
  //   execSync(`rm -rf __dist/ && mv -f dist/ __dist/`, { stdio: "inherit" });
  //   execSync(
  //     // `pnpm --filter ${pkg.name}  deploy --prod .dist-tmp --force && cp -r .dist-tmp/node_modules dist/  `,
  //     `pnpm --filter ${pkg.name} deploy --prod dist --force`,
  //     { stdio: "inherit" },
  //   );
  //   execSync(`cp -rf __dist/ dist && rm -fr __dist`, { stdio: "inherit" });
  // },
});
