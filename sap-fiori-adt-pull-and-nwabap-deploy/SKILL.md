---
name: SAP Fiori ADT pull and nwabap deploy
description: >-
  Use when pulling On-Premise SAP Fiori/UI5 BSP apps for local VS Code work
  without Web IDE or an empty Fiori Download wizard, starting/previewing them
  locally with ui5 serve, or deploying those apps back to ABAP with
  nwabap-ui5uploader.
---
# SAP Fiori: ADT BSP pull + local preview + nwabap deploy

Reusable runbook for On-Premise ABAP UI5 BSP apps when Fiori tools **Download Application** is empty and Web IDE / BAS is unavailable.

## When this applies
- User wants local VS Code + SAP Fiori tools for an existing BSP app
- Download wizard lists nothing (only ADT Quick Fiori Generator apps appear there)
- No Web IDE / Business Application Studio export
- Local **start / preview** with `ui5 serve`
- Deploy back to ABAP BSP via **`nwabap-ui5uploader`** (ADT), not Cloud Foundry

## Do not put in this skill (blacklist)

| Do not | Why | Do instead |
|--------|-----|------------|
| Put real passwords, tokens, or TR numbers in SKILL.md or chat logs | Secrets leak | `.env` / Connection Manager / vault |
| Invent a download path when ADT filestore fails | Wrong tooling, silent wrong sources | Follow pull failure table; ask user |
| Run `nwabap upload` without package/TR (non-`$TMP`) | Breaks transport / wrong package | 🔴 STOP at deploy checkpoint |
| Ship local-only ushell/`getComponentData` guards to productive TR without review | Breaks FLP | 🔴 STOP productive-deploy checkpoint |
| One-off app bugfixes unrelated to pull/preview/deploy | Skill scope creep | Fix in the app repo, not this skill |

---

## 1) Prerequisites
- VS Code with **SAP Fiori tools** (and typically ABAP Connection Manager configured)
- Reachable ABAP HTTPS host + client; user needs ADT (`/sap/bc/adt`) and BSP maintain auth
- Node.js + npm for local UI5 tooling

🔴 **CHECKPOINT** · 🛑 **STOP** before any download: confirm with the user **system URL**, **client**, **BSP app name(s)** (e.g. `Z…_TA`), and local folder. Do not start the filestore pull until they confirm or already provided these values in the same ask.

---

## 2) Pull sources via ADT UI5 BSP filestore

**Not** Git, **not** the Fiori Download wizard, **not** Web IDE.

Base API:
```text
https://<host>:<port>/sap/bc/adt/filestore/ui5-bsp/objects
```
Use Basic Auth (or equivalent), pass `sap-client=<client>`.

Typical flow:
1. List / open entry for `/{BSP_NAME}` (folder atom entry).
2. Walk `…/{BSP_NAME}/content` (and nested folders) and download files into a local project tree.
3. Prefer landing under something like `…/fiori-apps/<app_slug>/` with a `webapp/` layout matching the BSP.

### Failure modes (pull)

| Trigger | First fix | Still failing |
|---------|-----------|---------------|
| Filestore 401/403 | Recheck user/password, client, and BSP maintain auth | Stop; ask user for an account with ADT + BSP rights — do not invent another download path |
| Filestore 404 on BSP name | Confirm exact BSP id in system (case) | List `/sap/bc/adt/filestore/ui5-bsp/objects` and match the folder id with the user |
| SSL / cert errors | Retry with tooling `ignoreCertErrors` / non-strict SSL only if the org allows | Stop and ask for a reachable HTTPS endpoint or VPN |
| SICF ADT inactive | User activates `/sap/bc/adt` (Basis) | Do not switch to Web IDE/Download wizard unless the user asks |

---

## 3) Make it a Fiori tools project

In the app root, ensure at least:
- `package.json` with `@ui5/cli`, `@sap/ux-ui5-tooling`
- `ui5.yaml` / `ui5-local.yaml` with **fiori-tools-proxy**:
  - UI5 resources from `https://ui5.sap.com` (pin the FLP UI5 version; ask the user if unknown)
  - backend `path: /sap` → ABAP `url` + `client` + Basic auth
  - `ignoreCertErrors: true` only when the system uses a problematic cert
- `webapp/` (Component, manifest, views, i18n, etc.)
- `.env` (gitignored), e.g. `FIORI_TOOLS_USER` / `FIORI_TOOLS_PASSWORD` — tooling reads these for the proxy
- `.gitignore`: `node_modules/`, `dist/`, `.env`, `.nwabaprc`, `.nwabaprc.generated`

`package.json` scripts to add (change port / hash per app):
```json
{
  "scripts": {
    "start": "ui5 serve --port 8080 --open \"test/flpSandbox.html#<semanticObject>-tile\"",
    "start-index": "ui5 serve --port 8080 --open index.html",
    "start-local": "ui5 serve --config ./ui5-local.yaml --port 8080 --open \"test/flpSandbox.html#<semanticObject>-tile\"",
    "start-mock": "ui5 serve --config ./ui5-mock.yaml --port 8080 --open \"test/flpSandbox.html#<semanticObject>-tile\"",
    "build": "ui5 build --config=ui5.yaml --clean-dest --dest dist"
  }
}
```

Second app on the same machine: use another port (e.g. **8081**).

---

## 4) Local start and preview (do this every time)

### First time in a project
```bash
cd <app-root>
npm install
```
Confirm `.env` has working ABAP user/password for the proxy.

### Daily start
Pick one entry from this table (default: `start-index` unless the user named FLP sandbox or mock):

| Goal | Command | Opens |
|------|---------|--------|
| Standalone app page | `npm run start-index` | `http://localhost:<port>/index.html` |
| FLP sandbox tile | `npm run start` | `…/test/flpSandbox.html#…-tile` |
| Offline / mock OData | `npm run start-mock` | sandbox or index per script |
| Alternate yaml | `npm run start-local` | uses `ui5-local.yaml` |

Default preview URL pattern: **`http://localhost:8080/index.html`** (or the port in the script).

After UI changes: tell the user to **hard refresh** (Ctrl+F5). Live reload via `fiori-tools-appreload` may already be on if configured in `ui5.yaml`.

### What “preview works” means
- Browser shows the app shell (list/master or first screen), not a blank white page
- OData calls go through the proxy to the real system (Network tab: `/sap/opu/odata/...` → 200), unless mock mode was requested
- No endless ushell / Component bootstrap errors in the console

### Failure modes (preview)

| Trigger | First fix | Still failing |
|---------|-----------|---------------|
| White screen / empty shell; ushell or `getComponentData` errors | Add **local-only** null-safe guards; keep them gated for `index.html` preview | Diff against FLP behavior; 🔴 do not ship guards to productive TR without the deploy checkpoint |
| `/sap/...` OData 401/403 via proxy | Fix `.env` user/password or `client` in `ui5.yaml` | Verify Connection Manager / ABAP user lock; switch to `start-mock` only if user accepts mock data |
| Port in use | Change `--port` (e.g. 8081) or stop the other `ui5 serve` | Tell user the conflicting process and the new URL |
| Wrong HTML / hash | Use `start-index` vs `start` per the table above | Open the exact URL you send the user; hard refresh (Ctrl+F5) |
| UI5 version mismatch | Pin `ui5.yaml` version closer to system/FLP | Ask user for FLP UI5 version and realign |

When preview is up, send the user the exact URL and which script you used.

---

## 5) Deploy with `nwabap-ui5uploader`

Dedicated npm deployer over ADT (same family of APIs as the pull).

```bash
npm i -D nwabap-ui5uploader
```

Provide config (**never** commit real passwords; use `.env` + generated rc):

**`.nwabaprc.example`** (safe to share):
```json
{
  "base": "./dist",
  "files": "**/*.*",
  "conn_server": "https://<host>:<port>",
  "conn_client": "<client>",
  "conn_user": "REPLACE_WITH_USER",
  "conn_password": "REPLACE_WITH_PASSWORD",
  "conn_usestrictssl": false,
  "abap_package": "REPLACE_WITH_PACKAGE",
  "abap_bsp": "<BSP_NAME>",
  "abap_bsp_text": "<description>",
  "abap_transport": "REPLACE_WITH_TRANSPORT",
  "abap_language": "ZH",
  "calcappindex": true
}
```

Deploy script must do these steps in order:
1. `ui5 build` → `dist/`
2. Load user/password from `.env`
3. Require `NWABAP_PACKAGE` and (unless `$TMP`) `NWABAP_TRANSPORT`
4. `npx nwabap upload --nwabaprc <generated-or-local-rc>`

Example scripts:
```json
{
  "scripts": {
    "deploy:abap": "node ./scripts/nwabap-deploy.js",
    "upload:abap": "npx nwabap upload"
  }
}
```

🔴 **CHECKPOINT** · 🛑 **STOP** before first real upload: collect from the user **ABAP package name**, **transport request** (or confirm `$TMP`), and confirm **BSP name** matches the existing repository object (overwrite). Do not run `nwabap upload` / `npm run deploy:abap` until those are set.

🔴 **CHECKPOINT** · 🛑 **STOP** before productive deploy: show the user any local-only FLP / `getComponentData` guards and get explicit OK to ship or strip them. Do not upload a production TR until that review is done.

### Failure modes (deploy)

| Trigger | First fix | Still failing |
|---------|-----------|---------------|
| Missing package / TR | 🔴 STOP — set `NWABAP_PACKAGE` / `NWABAP_TRANSPORT` (or `$TMP`) | Do not upload |
| `nwabap` auth failure | Reuse `.env` credentials; set `conn_usestrictssl: false` only if cert blocks | Confirm ADT path `/sap/bc/adt` and BSP change rights |
| Upload rejects / partial BSP | Re-run `npm run build` then upload; confirm `abap_bsp` name | Ask Basis/dev lead; do not invent a second BSP name |
| Wrong tool path | Prefer `nwabap-ui5uploader` when user asked for it | Only then offer `@sap-ux/deploy-tooling` if `/UI5/ABAP_REPOSITORY_SRV` works |

Alternative (official): `@sap-ux/deploy-tooling` / Fiori **Add Deployment Configuration** → `ui5-deploy.yaml` via `/UI5/ABAP_REPOSITORY_SRV`. Prefer that when the UI5 repository OData service is available and the user wants Fiori tools–native deploy; use **nwabap** when they explicitly want ADT upload or that service is missing.

---

## 6) Checklist before saying “done”
- [ ] Sources pulled into local tree with `webapp/`
- [ ] `npm install` done
- [ ] Preview started with a named script; user has the URL (e.g. `http://localhost:8080/index.html`)
- [ ] App UI loads; backend or mock path confirmed
- [ ] Local-only FLP guards identified
- [ ] `nwabap-ui5uploader` installed; example RC + deploy script present (if deploy was asked)
- [ ] Package + TR obtained before any upload
- [ ] User told exact command: `npm run deploy:abap` (when deploying)

## 7) Optional follow-ups (only if asked)
- Mirror preview/deploy setup on sibling apps (`*_TA01`, etc.)
- `git init` / change history
- Notion runbook page (private draft unless they name a parent)
- Revert local preview hacks, then deploy
