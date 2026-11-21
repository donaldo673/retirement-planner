# Cloudflare deployment

This project is deployed with the OpenNext for Cloudflare adapter. `next.config.ts`
uses `output: "standalone"` and `wrangler.jsonc` serves the generated
`.open-next/assets` directory with the `.open-next/worker.js` entry point.

Configure the Cloudflare build settings as follows:

- Root directory: `/`
- Build command: `npx opennextjs-cloudflare build`
- Deploy command: `npx opennextjs-cloudflare deploy`

Do not return to the static-export configuration or use `npm run build` as the
Cloudflare build command. OpenNext must run after the Next.js build to generate
the Worker bundle.

To build locally in PowerShell:

```powershell
npx opennextjs-cloudflare build
```

The build should create `.open-next/worker.js` and `.open-next/assets/`.

To preview or deploy locally:

```powershell
npm.cmd run preview
npm.cmd run deploy
```
