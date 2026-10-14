# Enquiry function (one-time setup, about 10 minutes)

GitHub Pages cannot keep secrets or send email, so enquiries go through a tiny function you own.
Until this is set up, the guide collects **no** personal details and offers WhatsApp / email instead.

1. Create free accounts at cloudflare.com and resend.com. In Resend create an API key.
2. Cloudflare dashboard > Workers & Pages > Create > Worker. Paste `enquiry-worker.js`, Deploy.
3. Worker > Settings > Variables and Secrets:
   - `RESEND_API_KEY` (Secret) = your Resend key
   - `OWNER_EMAIL` = where enquiries should arrive
   - `FROM_EMAIL` = a sender verified in Resend (testing: `onboarding@resend.dev`, which only delivers to your own Resend email)
   - `ALLOWED_ORIGIN` = `https://prathiksha738.github.io`
4. Copy the Worker URL (like `https://meltique-enquiry.<you>.workers.dev`).
5. Rebuild the site with it: `MQ_ENQUIRY_URL=<that url> python3 _build/build.py`, then commit and push.
   (The URL is public by design; the key is not in the site.)
6. Optional: add a Cloudflare rate-limiting rule on the Worker to slow spam further.

Test: open the site, chat with Koko, send an enquiry. "Received" appears only if the email provider accepted it.
