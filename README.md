# vinext-starter

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

This starter does not use `wrangler.jsonc`.

## Included Shape

- edit site code under `app/`
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build the starter and verify its rendered loading skeleton
- `npm run db:generate`: generate Drizzle migrations after schema changes
- `npm run deploy`: deploy the Worker + D1-backed app straight to Cloudflare (see below)

## Live deployment (Cloudflare Workers + D1)

The app is deployed at **https://kms-banana-desk.kmsbanana.workers.dev** on a
Cloudflare account, using `wrangler.deploy.jsonc` (separate from the vite/vinext
dev config, which uses a placeholder local D1 binding). To redeploy after
making changes:

```bash
export CLOUDFLARE_API_TOKEN=...   # Account API token: D1:Edit, Workers Scripts:Edit
export CLOUDFLARE_ACCOUNT_ID=...
npm run deploy
```

The Worker bootstraps its own D1 schema on first request (`worker/schema.ts`),
so a fresh database needs no manual migration step.

### Email provider

`worker/email.ts` sends real email via **SendGrid**, using **Single Sender
Verification** rather than full domain verification — this lets you send to
any recipient by verifying just one email address you already have access
to, no domain purchase required. (Resend was tried first, but its free tier
only allows sending to the account owner's own inbox without a verified
domain, which doesn't work for a multi-staff app.)

Setup:

1. Sign up free at [sendgrid.com](https://sendgrid.com) — no card required
   for the free tier (100 emails/day).
2. Settings → Sender Authentication → **Verify a Single Sender** → enter the
   email address the app should send *from* (click the confirmation link
   SendGrid emails to that address).
3. Settings → API Keys → Create API Key (Restricted Access → Mail Send:
   Full Access is enough).
4. Set the secret and the matching `EMAIL_FROM` var (must exactly match the
   verified sender), then redeploy:
   ```bash
   npx wrangler secret put SENDGRID_API_KEY --config wrangler.deploy.jsonc
   npm run deploy
   ```

Without `SENDGRID_API_KEY` configured, `/api/auth/request` falls back to
returning the OTP directly in the API response (and the login screen shows
it on-screen) instead of emailing it — fine for local dev, but on a live
deployment it means anyone who knows an allowlisted staff email can log in
without touching that person's inbox. Configure SendGrid before trusting
this with real farmer/vendor financial data.

### First login becomes the owner

The very first successful login on a fresh database is automatically granted
the `owner` role (full access, including managing other staff). Log in with
whichever email should be the business owner's account first — don't use a
throwaway/test email for that first login.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
