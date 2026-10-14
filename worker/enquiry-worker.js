/* MeltiQue Chocoland enquiry function (Cloudflare Worker). Deploy it in YOUR Cloudflare account.
   The website only ever sees this function's URL. The email key lives here as a secret and is
   never put in the website's JavaScript.

   Secrets / variables to set (see worker/README.md):
     RESEND_API_KEY  (secret)  API key from resend.com
     OWNER_EMAIL     (var)     where enquiries are delivered, e.g. MeltiQu.choco@gmail.com
     FROM_EMAIL      (var)     a sender verified in Resend, e.g. "MeltiQue Enquiries <enquiries@yourdomain>"
                               (for testing: "onboarding@resend.dev", delivers only to your Resend account email)
     ALLOWED_ORIGIN  (var)     https://prathiksha738.github.io
   Nothing is stored: the function validates, forwards by email and answers {ok:true} only when the
   email provider accepted it. */
const MAX = { name: 60, contact: 80, message: 600 };

function cors(origin, allowed) {
  return { 'Access-Control-Allow-Origin': origin === allowed ? origin : allowed, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
}
function reply(status, obj, h) { return new Response(JSON.stringify(obj), { status, headers: Object.assign({ 'Content-Type': 'application/json' }, h) }); }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export default {
  async fetch(request, env) {
    const allowed = env.ALLOWED_ORIGIN || '', origin = request.headers.get('Origin') || '', h = cors(origin, allowed);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    if (request.method !== 'POST') return reply(405, { ok: false, error: 'method' }, h);
    if (!allowed || origin !== allowed) return reply(403, { ok: false, error: 'origin' }, h);
    if (!env.RESEND_API_KEY || !env.OWNER_EMAIL || !env.FROM_EMAIL) return reply(500, { ok: false, error: 'not configured' }, h);
    let d;
    try { if (+(request.headers.get('Content-Length') || 0) > 5000) throw 0; d = await request.json(); } catch (e) { return reply(400, { ok: false, error: 'bad request' }, h); }
    if (d.hp) return reply(200, { ok: true }, h); /* honeypot: pretend success to bots, send nothing */
    const name = String(d.name || '').trim(), contact = String(d.contact || '').trim(), message = String(d.message || '').trim();
    if (d.consent !== true) return reply(400, { ok: false, error: 'consent' }, h);
    if (!name || !message || name.length > MAX.name || contact.length > MAX.contact || message.length > MAX.message) return reply(400, { ok: false, error: 'invalid' }, h);
    const okContact = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact) || (/^[+\d][\d\s()-]{7,18}$/.test(contact) && contact.replace(/\D/g, '').length >= 8);
    if (!okContact) return reply(400, { ok: false, error: 'contact' }, h);
    let res;
    try {
      res = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: env.FROM_EMAIL, to: [env.OWNER_EMAIL], subject: 'Website enquiry from ' + name.replace(/[\r\n]/g, ' '), reply_to: contact.includes('@') ? contact : undefined,
          html: '<p><b>Name:</b> ' + esc(name) + '</p><p><b>Contact:</b> ' + esc(contact) + '</p><p><b>Message:</b><br>' + esc(message).replace(/\n/g, '<br>') + '</p><p style="color:#888">Sent with the visitor\'s consent from the website chat.</p>' })
      });
    } catch (e) { return reply(502, { ok: false, error: 'upstream' }, h); }
    return res.ok ? reply(200, { ok: true }, h) : reply(502, { ok: false, error: 'upstream' }, h);
  }
};
