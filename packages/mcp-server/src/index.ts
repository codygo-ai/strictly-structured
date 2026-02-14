import { startStdio } from "./transports/stdio";
import { startHttp } from "./transports/http";

const args = process.argv.slice(2);
const isHttp = args.includes("--http") || process.env["SSV_TRANSPORT"] === "http";

if (isHttp) {
  const portIdx = args.indexOf("--port");
  const port = portIdx !== -1 ? Number(args[portIdx + 1]) : 3100;
  startHttp(port).catch((error: unknown) => {
    console.error("Failed to start HTTP server:", error);
    process.exit(1);
  });
} else {
  startStdio().catch((error: unknown) => {
    console.error("Failed to start stdio server:", error);
    process.exit(1);
  });
}
