# Backend setup (Cloudflare, about 30 minutes, free tier is enough to start)

GitHub Pages cannot keep secrets, store images or send email, so these features run in one Worker you own.
**Until you deploy it, the site says each feature is "not switched on" and collects nothing.**

What it powers: design submissions (PNG + specs), enquiries, Lab votes, the AI concierge, the message
generator, and the owner dashboard at `<worker-url>/admin`.

## One-time setup
1. Accounts: cloudflare.com (free), resend.com (free tier, for email), console.anthropic.com (API key, pay per use).
2. Install and log in: `npm i -g wrangler && wrangler login`
3. From this `worker/` folder:
   - `wrangler kv namespace create DB` -> paste the id into `wrangler.toml`
   - `wrangler r2 bucket create meltique-designs`
   - `wrangler secret put ANTHROPIC_API_KEY` and `wrangler secret put RESEND_API_KEY`
   - Edit `[vars]` in `wrangler.toml` (OWNER_EMAIL, FROM_EMAIL). Testing sender: `onboarding@resend.dev` (delivers only to your own Resend email); for real use verify your own domain in Resend.
4. Protect the dashboard: Cloudflare dashboard > Zero Trust > Access > Applications > Add > Self-hosted.
   Domain = your worker host, path `/admin*`. Policy: allow only your email. Copy the **Application Audience (AUD) tag** and your
   team domain (`yourteam.cloudflareaccess.com`) into `wrangler.toml` (`ACCESS_AUD`, `ACCESS_TEAM_DOMAIN`).
   The Worker also verifies the Access login itself and only accepts OWNER_EMAIL.
5. `wrangler deploy` -> note the URL (like `https://meltique-api.you.workers.dev`).
6. Connect the site: `MQ_API_URL=https://meltique-api.you.workers.dev python3 _build/build.py`, commit, push.

## How it behaves
- A design is "submitted" only after the image is saved in R2 and the record in KV. Email is sent too; if email fails the design is still in the dashboard (status shows `failed`).
- Dashboard: view/download images, read specs, set status (New Enquiry ... Unavailable), enter a confirmed quote, add notes. Changes are saved in KV.
- The AI only sees the catalogue generated from `_build/build.py` (`catalogue.js`, regenerated on every build; redeploy the Worker after changing products/prices).
- Limits: image up to ~3 MB, 30 writes and 40 AI chats per IP per hour (approximate). Add a Cloudflare rate-limit rule for stronger protection.
- Not in the dashboard (edit `_build/build.py` and rebuild): product info, prices, customisation options, seasonal campaigns, gallery photos.

## Tests
`node test.js` (from this folder) runs 28 checks against mocked storage, email, AI and Access login.
