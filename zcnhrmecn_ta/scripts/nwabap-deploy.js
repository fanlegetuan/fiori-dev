/**
 * Build then deploy to ABAP BSP via nwabap-ui5uploader.
 * Reads credentials from .env (FIORI_TOOLS_USER / FIORI_TOOLS_PASSWORD)
 * and package/transport from NWABAP_PACKAGE / NWABAP_TRANSPORT (or .nwabaprc).
 *
 * Usage:
 *   npm run deploy:abap
 *   NWABAP_PACKAGE=ZXXX NWABAP_TRANSPORT=XXXX123456 npm run deploy:abap
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");
const rcPath = path.join(root, ".nwabaprc");
const examplePath = path.join(root, ".nwabaprc.example");

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile(envPath);

const baseRc = fs.existsSync(rcPath)
  ? JSON.parse(fs.readFileSync(rcPath, "utf8"))
  : fs.existsSync(examplePath)
    ? JSON.parse(fs.readFileSync(examplePath, "utf8"))
    : {};

const cfg = {
  ...baseRc,
  base: "./dist",
  files: baseRc.files || "**/*.*",
  conn_server: baseRc.conn_server || "https://fiori.ticel.cl:44302",
  conn_client: String(baseRc.conn_client || "400"),
  conn_user: process.env.FIORI_TOOLS_USER || baseRc.conn_user,
  conn_password: process.env.FIORI_TOOLS_PASSWORD || baseRc.conn_password,
  conn_usestrictssl:
    baseRc.conn_usestrictssl === undefined ? false : baseRc.conn_usestrictssl,
  abap_package: process.env.NWABAP_PACKAGE || baseRc.abap_package,
  abap_transport: process.env.NWABAP_TRANSPORT || baseRc.abap_transport,
  abap_bsp: baseRc.abap_bsp || "ZCNHRMECN_TA",
  abap_bsp_text:
    baseRc.abap_bsp_text ||
    "Fiori application of My Attendance Data Correction",
  abap_language: baseRc.abap_language || "ZH",
  calcappindex:
    baseRc.calcappindex === undefined ? true : baseRc.calcappindex,
};

function bad(v) {
  return (
    !v ||
    /^REPLACE_/i.test(String(v)) ||
    String(v).includes("REPLACE_WITH")
  );
}

const missing = [];
if (bad(cfg.conn_user) || bad(cfg.conn_password)) {
  missing.push("FIORI_TOOLS_USER / FIORI_TOOLS_PASSWORD in .env");
}
if (bad(cfg.abap_package)) {
  missing.push("NWABAP_PACKAGE (env) or abap_package in .nwabaprc");
}
if (bad(cfg.abap_transport) && cfg.abap_package !== "$TMP") {
  missing.push("NWABAP_TRANSPORT (env) or abap_transport in .nwabaprc");
}
if (missing.length) {
  console.error("Missing deploy settings:\n- " + missing.join("\n- "));
  console.error(
    "\nCopy .nwabaprc.example to .nwabaprc and fill package/transport,\nor set NWABAP_PACKAGE / NWABAP_TRANSPORT."
  );
  process.exit(1);
}

const tmpRc = path.join(root, ".nwabaprc.generated");
fs.writeFileSync(tmpRc, JSON.stringify(cfg, null, 2), { encoding: "utf8" });

console.log("Building dist...");
let r = spawnSync("npm", ["run", "build"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});
if (r.status !== 0) {
  try { fs.unlinkSync(tmpRc); } catch (e) {}
  process.exit(r.status || 1);
}

if (!fs.existsSync(path.join(root, "dist"))) {
  console.error("dist/ missing after build");
  try { fs.unlinkSync(tmpRc); } catch (e) {}
  process.exit(1);
}

console.log(
  `Uploading BSP ${cfg.abap_bsp} -> package ${cfg.abap_package}` +
    (cfg.abap_transport ? ` (TR ${cfg.abap_transport})` : "")
);
r = spawnSync(
  "npx",
  ["nwabap", "upload", "--nwabaprc", tmpRc],
  { cwd: root, stdio: "inherit", shell: true }
);
try { fs.unlinkSync(tmpRc); } catch (e) {}
process.exit(r.status || 0);
