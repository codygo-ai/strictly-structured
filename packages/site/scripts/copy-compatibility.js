const fs = require("fs");
const path = require("path");
const p = require.resolve("@ssv/compatibility-data/data/compatibility.json");
const out = path.join(__dirname, "..", "public", "compatibility.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.copyFileSync(p, out);
