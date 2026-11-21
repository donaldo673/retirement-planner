# Cloudflare deployment

This project is deployed as a Cloudflare Worker serving a Next.js static
export. `next.config.ts` sets `output: "export"`, so `npm run build` writes the
site to `out/`. `wrangler.jsonc` points the Worker at that directory.

Configure the Cloudflare Worker build as follows:

- Root directory: `/`
- Build command: `npm run build`
- Deploy command: `npm run deploy`

Do not use the Next.js/OpenNext Worker preset or `npx wrangler deploy` without
the repository's Wrangler configuration. Those paths treat the app as a
server-rendered Next.js application and expect server output that this static
export does not generate.

To check the generated output locally in PowerShell:

```powershell
npm.cmd run build
Test-Path .\out\index.html
```

The check should return `True`. To test the Worker bundle without publishing:

```powershell
npm.cmd run deploy -- --dry-run
```

This deployment serves static assets only. If the application later needs
server-side Next.js features, its Cloudflare deployment configuration will
need to change.
