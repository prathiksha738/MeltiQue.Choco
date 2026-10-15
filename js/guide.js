/* MeltiQue Chocoland chocolate guide.
   An original anime-style character (drawn in SVG) that asks the visitor's name, helps them
   choose a chocolate from the real product list, and opens WhatsApp with the right message.
   - Prices come only from MQ.prices in js/config.js. Missing prices are never invented.
   - Voice uses the device's built-in text-to-speech, off with one tap, never automatic on load.
   - The visitor's name stays in sessionStorage in their own browser; it is never sent anywhere.
   - Free text is understood in the browser by keyword/intent matching over the product list (no external AI,
     no keys). Nothing is invented: unknown prices, chocolate types and policies are said to be unconfirmed.
   - Enquiries are POSTed only to MQ.enquiryEndpoint, only after consent + review, and "sent" is shown only
     when the server answers {ok:true}. With no endpoint configured, no personal details are collected. */
(function () {
  'use strict';
  var C = window.MQ || {}, P = window.MQ_PRODUCTS || [], INFO = window.MQ_INFO || {};
  if (!P.length) return;
  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var base = '';
  try { base = new URL('../', doc.currentScript.src).href; } catch (e) { base = ''; }
  var NAME = C.guideName || 'Koko', PRICES = C.prices || {}, BRAND = INFO.brand || 'MeltiQue Chocoland';
  var synth = window.speechSynthesis, canSpeak = !!(synth && window.SpeechSynthesisUtterance);
  var user = '', voiceOn = true, started = false, talking = 0, talkTimer = 0, chain = Promise.resolve();
  try { user = sessionStorage.getItem('kgName') || ''; if (sessionStorage.getItem('kgVoice') === 'off') voiceOn = false; } catch (e) { }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function el(tag, cls, text) { var n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function q(fn) { chain = chain.then(fn).catch(function () { }); return chain; }

  /* ---------- WhatsApp ---------- */
  function waURL(text) {
    var n = C.whatsappNumber ? String(C.whatsappNumber).replace(/\D/g, '') : '';
    return 'https://wa.me/' + n + '?text=' + encodeURIComponent(text);
  }
  function hi() { return 'Hi ' + BRAND + '! ' + (user ? "I'm " + user + '. ' : ''); }
  function actionMsg(p) {
    if (p.action === 'order') return hi() + 'I would like to order: ' + p.name + '.';
    if (p.action === 'preorder') return hi() + 'Pre-order enquiry: ' + p.name + '. Please confirm availability, price, customization requirements and the estimated fulfilment date.';
    if (p.action === 'launch') return hi() + 'Please add me to the launch list for: ' + p.name + '.';
    return hi() + 'I would like to know more about this idea: ' + p.name + '.';
  }
  var BTN = { order: 'Order on WhatsApp', preorder: 'Pre-order Enquiry', explore: 'Explore Idea', launch: 'Join Launch List' };
  var SCLASS = { now: 's-now', pre: 's-pre', concept: 's-concept', soon: 's-soon' };

  /* ---------- the character (original design: chocolate hair, dog ears, gold paw pin) ---------- */
  var DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    '<linearGradient id="kgHair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2618"/><stop offset="1" stop-color="#2a140d"/></linearGradient>' +
    '<radialGradient id="kgIris" cx=".5" cy=".28" r=".8"><stop offset="0" stop-color="#F2D79A"/><stop offset=".45" stop-color="#B97B45"/><stop offset="1" stop-color="#4B2B20"/></radialGradient>' +
    '<linearGradient id="kgSkin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe5d2"/><stop offset="1" stop-color="#f3cfb4"/></linearGradient>' +
    '</defs></svg>';
  function charSVG(vb) {
    return '<svg class="kg-char" viewBox="' + vb + '" aria-hidden="true" focusable="false">' +
      '<path d="M36 108C30 50 66 18 100 18s70 32 64 90c2 42-4 82-14 106H50C40 190 34 150 36 108Z" fill="url(#kgHair)"/>' +
      '<path d="M54 58C30 54 20 92 34 118c10-6 18-26 24-46Z" fill="#B97B45"/><path d="M51 72C39 74 35 92 41 106c6-6 10-18 14-30Z" fill="#8C5638"/>' +
      '<path d="M146 58C170 54 180 92 166 118c-10-6-18-26-24-46Z" fill="#B97B45"/><path d="M149 72C161 74 165 92 159 106c-6-6-10-18-14-30Z" fill="#8C5638"/>' +
      '<path d="M86 152v36c0 9 28 9 28 0v-36Z" fill="#efcfb2"/>' +
      '<path d="M26 262C28 214 64 190 100 190s72 24 74 72Z" fill="#4B2B20"/>' +
      '<path d="M80 191l20 34 20-34c-6-3-13-4-20-4s-14 1-20 4Z" fill="#F6EBDD"/>' +
      '<path d="M78 192l22 38 22-38" fill="none" stroke="#D6AE65" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M100 226l-15-9v18Z M100 226l15-9v18Z" fill="#B97B45"/><circle cx="100" cy="226" r="4.2" fill="#D6AE65"/>' +
      '<path d="M48 100C48 60 72 44 100 44s52 16 52 56c0 28-24 60-52 66-28-6-52-38-52-66Z" fill="url(#kgSkin)"/>' +
      '<ellipse cx="62" cy="139" rx="10" ry="5.5" fill="#f2a29a" opacity=".5"/><ellipse cx="138" cy="139" rx="10" ry="5.5" fill="#f2a29a" opacity=".5"/>' +
      '<g class="kg-eye"><ellipse cx="78" cy="113" rx="14" ry="17" fill="#fff"/><ellipse cx="79" cy="115" rx="10.5" ry="13.5" fill="url(#kgIris)"/><ellipse cx="79" cy="116" rx="5" ry="7" fill="#1a0d08"/><circle cx="74" cy="108" r="4.2" fill="#fff"/><circle cx="84" cy="121" r="2" fill="#fff" opacity=".85"/><path d="M62 107C67 96 88 94 94 104" fill="none" stroke="#1a0d08" stroke-width="3.6" stroke-linecap="round"/></g>' +
      '<g class="kg-eye"><ellipse cx="122" cy="113" rx="14" ry="17" fill="#fff"/><ellipse cx="121" cy="115" rx="10.5" ry="13.5" fill="url(#kgIris)"/><ellipse cx="121" cy="116" rx="5" ry="7" fill="#1a0d08"/><circle cx="126" cy="108" r="4.2" fill="#fff"/><circle cx="116" cy="121" r="2" fill="#fff" opacity=".85"/><path d="M138 107C133 96 112 94 106 104" fill="none" stroke="#1a0d08" stroke-width="3.6" stroke-linecap="round"/></g>' +
      '<path d="M63 93C69 87 82 87 91 92M137 93C131 87 118 87 109 92" fill="none" stroke="#2a140d" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M99 131q-2.5 3.5 1 4.5" fill="none" stroke="#d9a98a" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path class="kg-mc" d="M91 147Q100 156 109 147" fill="none" stroke="#b5503f" stroke-width="2.8" stroke-linecap="round"/>' +
      '<g class="kg-mo"><path d="M91 145Q100 168 109 145Q100 150 91 145Z" fill="#8a2f2a"/><path d="M95 157Q100 162 105 157Q100 153 95 157Z" fill="#e88a85"/></g>' +
      '<path d="M47 96C42 126 46 156 56 184C62 158 58 128 60 100Z" fill="#33190f"/><path d="M153 96C158 126 154 156 144 184C138 158 142 128 140 100Z" fill="#33190f"/>' +
      '<path d="M46 98C46 50 76 34 100 34s54 16 54 64c-12-17-26-26-38-34-6 12-15 21-31 19-10-1-19-7-25-15-8 13-19 22-34 30Z" fill="url(#kgHair)"/>' +
      '<path d="M64 52C80 38 112 36 134 48C110 43 84 46 64 52Z" fill="#fff" opacity=".14"/>' +
      '<use href="#paw" x="128" y="38" width="24" height="24" style="color:#D6AE65"/>' +
      '</svg>';
  }

  /* ---------- build the widget ---------- */
  var root = el('div', 'kg'); root.id = 'kg';
  root.innerHTML = DEFS +
    '<button type="button" class="kg-fab" id="kgFab" aria-expanded="false" aria-controls="kgPanel" aria-label="Chat with ' + esc(NAME) + ', your chocolate guide"><span class="kg-fab-in">' + charSVG('26 14 148 168') + '</span></button>' +
    '<div class="kg-tease" id="kgTease" hidden><button type="button" class="kg-tease-go" id="kgTeaseGo">Need help choosing a chocolate? Chat with ' + esc(NAME) + '.</button><button type="button" class="kg-tease-x" id="kgTeaseX" aria-label="Dismiss">&times;</button></div>' +
    '<section class="kg-panel" id="kgPanel" role="dialog" aria-modal="false" aria-label="' + esc(NAME) + ', your chocolate guide" tabindex="-1" hidden>' +
    '<div class="kg-top"><span class="kg-tag">' + esc(NAME) + ' <small>Chocolate guide</small></span>' +
    '<div class="kg-btns"><button type="button" class="kg-ib" id="kgRestart" aria-label="Restart the conversation"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7Z"/></svg></button><button type="button" class="kg-ib" id="kgVoice" aria-pressed="true" aria-label="Voice on"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4Zm11.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4Zm-2.5-8.7v2.1a7 7 0 0 1 0 13.2v2.1a9 9 0 0 0 0-17.4Z"/></svg></button>' +
    '<button type="button" class="kg-ib" id="kgClose" aria-label="Close chat"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="m6.4 5 5.6 5.6L17.600 5 19 6.400 13.400 12l5.600 5.600-1.400 1.400-5.600-5.600L6.400 19 5 17.600 10.600 12 5 6.400 6.400 5Z"/></svg></button></div>' +
    '<div class="kg-stage">' + charSVG('0 0 200 262') + '</div></div>' +
    '<div class="kg-log" id="kgLog" role="log" aria-live="polite" aria-label="Conversation with ' + esc(NAME) + '"></div>' +
    '<div class="kg-ctl" id="kgCtl"></div>' +
    '<form class="kg-talk" id="kgTalk" autocomplete="off"><label class="sr" for="kgTalkIn">Type your question for ' + esc(NAME) + '</label><input id="kgTalkIn" type="text" maxlength="200" placeholder="Type your question…"><button class="btn btn-gold btn-sm" type="submit">Send</button></form></section>' +
    '<section class="kg-welcome" id="kgWelcome" role="dialog" aria-modal="true" aria-labelledby="kgWT" hidden><div class="kg-wbox"><div class="kg-wchar">' + charSVG('0 0 200 262') + '</div><div class="kg-wtxt"><h2 id="kgWT">Hi, I am ' + esc(NAME) + '!</h2><p>Welcome to ' + esc(BRAND) + '. Tell me what you are looking for and I will help you find the right chocolate: by occasion, taste or budget. You can type, or just tap.</p><div class="kg-wbtn"><button type="button" class="btn btn-gold" id="kgWGo">Start Exploring</button><button type="button" class="btn btn-line" id="kgWLater">Maybe later</button></div></div></div></section>' +
    '<button type="button" class="kg-back" id="kgBack" hidden>&larr; Back to Chat</button>';
  doc.body.appendChild(root);

  var fab = doc.getElementById('kgFab'), panel = doc.getElementById('kgPanel'), log = doc.getElementById('kgLog'), ctl = doc.getElementById('kgCtl');
  var tease = doc.getElementById('kgTease'), vbtn = doc.getElementById('kgVoice');
  if (!canSpeak) vbtn.hidden = true;
  function syncVoiceBtn() { vbtn.setAttribute('aria-pressed', String(voiceOn)); vbtn.setAttribute('aria-label', voiceOn ? 'Voice on. Tap to mute' : 'Voice off. Tap to turn on'); vbtn.classList.toggle('off', !voiceOn); }
  syncVoiceBtn();

  /* ---------- speech ---------- */
  function pickVoice() {
    var vs = (synth.getVoices && synth.getVoices()) || [], best = null, bs = -1;
    vs.forEach(function (v) {
      if (!/^en/i.test(v.lang)) return;
      var s = 0; if (/female|zira|samantha|aria|jenny|heera|veena|karen|moira|tessa|hazel|susan/i.test(v.name)) s += 3; if (/en-IN/i.test(v.lang)) s += 2; if (/en-GB|en-US/i.test(v.lang)) s += 1;
      if (s > bs) { bs = s; best = v; }
    });
    return best;
  }
  function setTalk(on) { root.classList.toggle('talking', on); }
  function talkFor(ms) { clearTimeout(talkTimer); setTalk(true); talkTimer = setTimeout(function () { if (!talking) setTalk(false); }, ms); }
  function speak(text) {
    if (panel.hidden) return;
    if (!voiceOn || !canSpeak) { if (!reduce) talkFor(Math.min(2200, 500 + text.length * 22)); return; }
    try {
      var u = new SpeechSynthesisUtterance(text.replace(/[…]/g, '.').replace(/\s+/g, ' '));
      var v = pickVoice(); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-IN';
      u.pitch = 1.25; u.rate = 1;
      u.onstart = function () { talking++; setTalk(true); };
      var done = function () { talking = Math.max(0, talking - 1); if (!talking) setTalk(false); };
      u.onend = done; u.onerror = done;
      synth.speak(u);
    } catch (e) { }
  }
  function stopSpeech() { try { if (canSpeak) synth.cancel(); } catch (e) { } talking = 0; setTalk(false); }
  vbtn.addEventListener('click', function () {
    voiceOn = !voiceOn; try { sessionStorage.setItem('kgVoice', voiceOn ? 'on' : 'off'); } catch (e) { }
    if (!voiceOn) stopSpeech(); syncVoiceBtn();
  });

  /* ---------- conversation primitives ---------- */
  function toBottom() { log.scrollTop = log.scrollHeight; }
  function typing() { var d = el('div', 'kg-b k kg-dots'); d.innerHTML = '<span></span><span></span><span></span>'; d.setAttribute('aria-hidden', 'true'); log.appendChild(d); toBottom(); return d; }
  function say(text) {
    return q(function () {
      var d = typing();
      return wait(reduce ? 0 : Math.min(800, 300 + text.length * 5)).then(function () { d.remove(); log.appendChild(el('div', 'kg-b k', text)); toBottom(); speak(text); });
    });
  }
  function youSaid(text) { stopSpeech(); log.appendChild(el('div', 'kg-b u', text)); toBottom(); }
  function chip(label, fn, echo) {
    var b = el('button', 'kg-chip', label); b.type = 'button';
    b.addEventListener('click', function () { ctl.innerHTML = ''; if (echo !== false) youSaid(label); fn(); });
    return b;
  }
  function controls(items) {
    return q(function () {
      ctl.innerHTML = ''; items.forEach(function (it) { ctl.appendChild(chip(it[0], it[1])); });
      var b = ctl.querySelector('button,input'); if (b && !panel.hidden) b.focus({ preventScroll: true });
      toBottom(); requestAnimationFrame(toBottom);
    });
  }
  function put(node) { return q(function () { log.appendChild(node); toBottom(); }); }
  function link(href, cls, text, ext) { var a = el('a', cls, text); a.href = href; if (ext) { a.target = '_blank'; a.rel = 'noopener'; } return a; }


  /* ---------- memory (this visit only: preferences and last product, never the chat text) ---------- */
  var prefs = { type: '', occasion: '', taste: '', budget: 0 }, last = null, misses = 0;
  try { var m = JSON.parse(sessionStorage.getItem('kgMem') || 'null'); if (m) { prefs = m.prefs || prefs; last = byName(m.last) || null; } } catch (e) { }
  function remember() { try { sessionStorage.setItem('kgMem', JSON.stringify({ prefs: prefs, last: last ? last.name : '' })); } catch (e) { } }
  function byName(n) { return P.filter(function (p) { return p.name === n; })[0]; }
  function hasTypeData() { return P.some(function (p) { return p.types && p.types.length; }); }
  function typeLabel(t) { return { dark: 'dark', milk: 'milk', white: 'white' }[t] || t; }

  /* ---------- content ---------- */
  function priceText(p) { return PRICES[p.name] ? PRICES[p.name] : null; }
  function priceNum(p) { var s = PRICES[p.name]; var m = s && String(s).replace(/,/g, '').match(/\d+/); return m ? +m[0] : null; }
  function statusLine(p) {
    if (p.status === 'now') return 'You can order it on WhatsApp.';
    if (p.status === 'pre') return 'It is a pre-order, so we confirm availability, price, customization and the date with you first.';
    if (p.status === 'concept') return 'It is still a concept in development, so the final design and availability need to be confirmed.';
    return 'It is coming soon, so it cannot be ordered yet.';
  }
  function typeLine(p) {
    if (p.types && p.types.length) return 'Confirmed chocolate types: ' + p.types.map(typeLabel).join(', ') + '.';
    return 'Dark, milk or white options for this product are not confirmed on the website, so please ask the team.';
  }
  function visual(p) {
    var v = el('div', 'kg-vis');
    if (p.image) { var im = el('img'); im.src = base + p.image; im.alt = p.name; im.loading = 'lazy'; v.appendChild(im); return v; }
    v.classList.add('ph'); v.setAttribute('role', 'img'); v.setAttribute('aria-label', 'Placeholder for ' + p.name);
    v.appendChild(el('span', '', p.status === 'concept' || p.status === 'soon' ? 'Concept: idea in development' : 'Photo coming soon'));
    return v;
  }
  function goExplore(p) { last = p; remember(); try { sessionStorage.setItem('kgFrom', '1'); } catch (e) { } }
  function productCard(p) {
    var c = el('div', 'kg-card'); c.appendChild(visual(p));
    var st = el('span', 'status ' + (SCLASS[p.status] || 's-soon')); st.innerHTML = '<i></i>'; st.appendChild(doc.createTextNode(p.label)); c.appendChild(st);
    c.appendChild(el('strong', '', p.name));
    if (p.status !== 'soon') { var pr = priceText(p); c.appendChild(el('span', 'kg-price' + (pr ? '' : ' none'), pr ? 'Price: ' + pr : 'Price: ask on WhatsApp')); }
    c.appendChild(el('span', 'kg-note', typeLine(p)));
    if (p.note) c.appendChild(el('span', 'kg-note', p.note));
    var row = el('div', 'kg-row');
    row.appendChild(link(waURL(actionMsg(p)), 'btn btn-' + (p.action === 'order' || p.action === 'preorder' ? 'gold' : 'line') + ' btn-sm', BTN[p.action], true));
    var ex = link(base + p.href, 'btn btn-line btn-sm', 'Explore This Product'); ex.setAttribute('aria-label', 'Explore ' + p.name + ' on its own page'); ex.addEventListener('click', function () { goExplore(p); });
    row.appendChild(ex); c.appendChild(row); return c;
  }
  function showProduct(p, back) {
    last = p; remember();
    var pr = priceText(p), text = p.name + '. ' + p.desc + ' ' + statusLine(p);
    if (p.status !== 'soon') text += pr ? ' The price is ' + pr + '.' : ' I do not have a price listed here yet, so please ask on WhatsApp.';
    say(text); put(productCard(p)); say('Would you like to look at anything else?');
    var items = [['Ask the team about this', function () { enquiry('I am interested in: ' + p.name + '.'); }]];
    if (back) items.push(['See more like this', back]);
    items.push(['Recommend something', recommend], ['Back to menu', menu]); controls(items);
  }
  function showList(list, intro, back) {
    say(intro);
    var items = list.map(function (p) { return [p.name, function () { showProduct(p, back); }]; });
    items.push(['Back to menu', menu]); controls(items);
  }
  function pickFrom(cat, intro, extra) {
    var list = P.filter(function (p) { return p.cat === cat; });
    say(intro);
    var items = list.map(function (p) { return [p.name, function () { showProduct(p, function () { pickFrom(cat, 'Which one would you like to see?', extra); }); }]; });
    if (extra) items.push(extra); items.push(['Back to menu', menu]);
    controls(items);
  }
  function taste() {
    say('Tell me what you are in the mood for, and I will point you to one.');
    var m = [['Classic chocolate', 'Chocolate Bars'], ['Coffee flavour', 'Coffee Chocolate'], ['Honey sweetness', 'Honey Chocolate'], ['A nutty bite', 'Nut Chocolate'], ['A cookie with a chocolate centre', 'Cookies with Chocolate Fillings'], ['Fruits and nuts in chocolate', 'Chocolate-covered Fruits and Nuts'], ['A showpiece treat', 'Chocolate Bombs']];
    var items = m.filter(function (x) { return byName(x[1]); }).map(function (x) { return [x[0], function () { showProduct(byName(x[1]), taste); }]; });
    items.push(['Surprise me', function () {
      var a = P.filter(function (p) { return p.cat === 'available'; }), p = a[Math.floor(Math.random() * a.length)];
      say('How about this one?'); showProduct(p, taste);
    }]);
    items.push(['Back to menu', menu]); controls(items);
  }
  function prices() {
    var have = P.filter(function (p) { return PRICES[p.name]; });
    if (have.length) {
      say('Here are the prices I have. For anything not listed, please ask on WhatsApp.');
      var c = el('div', 'kg-card'), ul = el('ul', 'kg-plist');
      have.forEach(function (p) { var li = el('li'); li.appendChild(el('span', '', p.name)); li.appendChild(el('b', '', PRICES[p.name])); ul.appendChild(li); });
      c.appendChild(ul); c.appendChild(link(waURL(hi() + 'Could you please confirm the current prices?'), 'btn btn-gold btn-sm', 'Confirm prices on WhatsApp', true)); put(c);
    } else {
      say('I do not have prices listed on the website yet. The team confirms the price when you message on WhatsApp.');
      var c2 = el('div', 'kg-card'); c2.appendChild(link(waURL(hi() + 'Could you please share the current prices?'), 'btn btn-gold btn-sm', 'Ask for prices on WhatsApp', true)); put(c2);
    }
    controls([['Back to menu', menu]]);
  }
  function bulk() {
    say('For parties, events, functions and corporate gifts, tell us the occasion, quantity, products, customization and the date you need it. Bulk orders are confirmed based on production capacity, pricing and delivery.');
    var c = el('div', 'kg-card'); var r = el('div', 'kg-row');
    r.appendChild(link(base + 'bulk.html', 'btn btn-gold btn-sm', 'Open bulk enquiry form'));
    r.appendChild(link(waURL(hi() + 'Bulk order enquiry.\nOccasion:\nApproximate quantity:\nPreferred products:\nCustomization:\nRequired date:'), 'btn btn-line btn-sm', 'Enquire on WhatsApp', true));
    c.appendChild(r); put(c); controls([['Ask the team here', function () { enquiry('Bulk order enquiry. Occasion, quantity, products and date: '); }], ['Back to menu', menu]]);
  }
  function store() {
    say('Visit our physical store at ' + (INFO.address || 'Parappalayam, Mangalam Road, Tirupur') + '. Please contact us for the exact location and current availability before visiting.');
    var c = el('div', 'kg-card'); var r = el('div', 'kg-row');
    r.appendChild(link(waURL(hi() + 'I would like to visit your store. Could you share the exact location and current availability?'), 'btn btn-gold btn-sm', 'Ask before visiting', true));
    r.appendChild(link(base + 'find-us.html', 'more', 'Find Us page')); c.appendChild(r); put(c); controls([['Back to menu', menu]]);
  }
  function contact() {
    say('You can reach the team on WhatsApp, by email or on Instagram.');
    var c = el('div', 'kg-card'), r = el('div', 'kg-row');
    r.appendChild(link(waURL(hi() + 'I have a question.'), 'btn btn-gold btn-sm', 'WhatsApp', true));
    r.appendChild(link('mailto:MeltiQu.choco@gmail.com', 'btn btn-line btn-sm', 'Email', true));
    if (INFO.instagram) r.appendChild(link(INFO.instagram, 'btn btn-line btn-sm', 'Instagram', true));
    c.appendChild(r); put(c); controls([['Send an enquiry here', function () { enquiry(''); }], ['Back to menu', menu]]);
  }
  function policy() {
    say('I do not have confirmed delivery, payment, cancellation or refund details to quote. Our Terms page lists what is confirmed so far, and the team confirms the rest for each order.');
    var c = el('div', 'kg-card'); c.appendChild(link(base + 'terms.html', 'btn btn-line btn-sm', 'Read the Terms')); put(c);
    controls([['Ask the team', function () { enquiry('I have a question about delivery, payment or cancellation.'); }], ['Back to menu', menu]]);
  }
  function details() {
    say('Ingredient, allergen, dietary and nutrition details are not listed on the website, and I will not guess them. Please ask the team before ordering if this matters to you.');
    controls([['Ask the team', function () { enquiry('Please share ingredient and allergen details for: ' + (last ? last.name : 'the product I am asking about') + '.'); }], ['Back to menu', menu]]);
  }

  /* ---------- chocolate type (dark / milk / white): only what the business has confirmed ---------- */
  function typeFilter(t) {
    prefs.type = t; remember();
    var label = typeLabel(t), ok = P.filter(function (p) { return p.types && p.types.indexOf(t) > -1; });
    if (ok.length) { showList(ok, 'These products are confirmed in ' + label + ' chocolate. Which would you like to see?', function () { typeFilter(t); }); return; }
    say(hasTypeData() ? 'I do not have any product confirmed in ' + label + ' chocolate right now.' : 'The website does not list which products come in dark, milk or white chocolate yet, and I will not guess. The team can confirm what is possible.');
    controls([['Ask the team about ' + label, function () { enquiry('I would like to know which products are available in ' + label + ' chocolate.'); }], ['Show all products', function () { pickFrom('available', 'Here is what you can order now.'); }], ['Back to menu', menu]]);
  }

  /* ---------- recommendations ---------- */
  var OCC = [
    [/birthday|b'?day/, 'birthday'], [/anniversary/, 'anniversary'], [/wedding|marriage|engagement|reception/, 'wedding'],
    [/diwali|deepavali|pongal|festival|christmas|eid|navratri|ugadi|onam/, 'festival'], [/valentine|love|girlfriend|boyfriend|wife|husband|partner|romantic/, 'special someone'],
    [/corporate|office|client|employee|staff|team gift/, 'corporate gift'], [/thank|thanks gift|appreciat/, 'thank-you'], [/farewell|congrat|promotion|graduation/, 'celebration'],
    [/baby shower|kids?|children|party|function|event/, 'party'], [/gift|present|surprise someone/, 'gift']
  ];
  function occasionOf(t) { for (var i = 0; i < OCC.length; i++) if (OCC[i][0].test(t)) return OCC[i][1]; return ''; }
  function budgetOf(t) {
    var m = t.match(/(?:rs\.?|₹|inr|under|below|upto|up to|within|budget(?: of| is)?|around|about)\s*(\d{2,6})/) || t.match(/(\d{2,6})\s*(?:rs|rupees|₹|budget)/);
    return m ? +m[1] : 0;
  }
  function recommend() {
    say(prefs.occasion ? 'Is this for a ' + prefs.occasion + ' still, or something else?' : 'Let me help you choose. What is the occasion?');
    var opts = [['Birthday', 'birthday'], ['Anniversary', 'anniversary'], ['Festival', 'festival'], ['Corporate gift', 'corporate gift'], ['Just for me', 'treat'], ['Not sure', '']];
    var items = opts.map(function (o) { return [o[0], function () { prefs.occasion = o[1]; remember(); recStep2(); }]; });
    controls(items);
  }
  function recStep2() {
    say('Do you prefer dark, milk or white chocolate? I only recommend what the team has confirmed.');
    controls([['Dark', function () { prefs.type = 'dark'; remember(); recStep3(); }], ['Milk', function () { prefs.type = 'milk'; remember(); recStep3(); }], ['White', function () { prefs.type = 'white'; remember(); recStep3(); }], ['No preference', function () { prefs.type = ''; remember(); recStep3(); }]]);
  }
  function recStep3() {
    say('Any budget in mind? You can also type an amount, like "under 500".');
    controls([['No fixed budget', function () { prefs.budget = 0; remember(); recResult(); }], ['I will type it', function () { say('Type your budget in rupees, for example: under 500.'); }]]);
  }
  function recResult() {
    var pool, o = prefs.occasion;
    if (/birthday|anniversary|special|gift|celebration|thank|festival|wedding|party/.test(o)) pool = P.filter(function (p) { return p.cat === 'gift' || p.cat === 'pre'; });
    else if (/corporate/.test(o)) pool = P.filter(function (p) { return p.cat === 'gift' || p.cat === 'pre'; });
    else pool = P.filter(function (p) { return p.cat === 'available'; });
    var notes = [];
    if (prefs.type) {
      if (hasTypeData()) { var t2 = pool.filter(function (p) { return p.types && p.types.indexOf(prefs.type) > -1; }); pool = t2; }
      else notes.push('The website does not confirm which products come in ' + typeLabel(prefs.type) + ' chocolate, so I could not filter by it. The team can confirm.');
    }
    if (prefs.budget) {
      var priced = pool.filter(function (p) { return priceNum(p) != null; });
      if (priced.length) pool = priced.filter(function (p) { return priceNum(p) <= prefs.budget; });
      else notes.push('I do not have prices listed, so I could not filter by your budget of ' + prefs.budget + '. The team will confirm prices.');
    }
    if (!pool.length) { say('I could not find a confirmed match for all of that. The team may be able to suggest something.'); controls([['Ask the team', function () { enquiry(prefSummary()); }], ['Start over', recommend], ['Back to menu', menu]]); return; }
    var top = pool.slice(0, 3);
    say('Here are ' + top.length + ' idea' + (top.length > 1 ? 's' : '') + (o && o !== 'treat' ? ' for your ' + o : '') + '. Availability, price and any customization are always confirmed by the team.');
    top.forEach(function (p) { put(productCard(p)); });
    notes.forEach(function (n) { say(n); });
    last = top[0]; remember();
    controls([['Send these preferences to the team', function () { enquiry(prefSummary(top)); }], ['Change my answers', recommend], ['Back to menu', menu]]);
  }
  function prefSummary(list) {
    var s = 'Preferences: ';
    s += 'occasion: ' + (prefs.occasion || 'not said') + '; chocolate type: ' + (prefs.type ? typeLabel(prefs.type) : 'no preference') + '; budget: ' + (prefs.budget ? prefs.budget + ' rupees' : 'not said') + '.';
    if (list && list.length) s += ' Products I looked at: ' + list.map(function (p) { return p.name; }).join(', ') + '.';
    else if (last) s += ' Product I looked at: ' + last.name + '.';
    return s;
  }
  function compare(a, b) {
    say('Here is how ' + a.name + ' and ' + b.name + ' compare on what the website confirms.');
    var c = el('div', 'kg-card'), ul = el('ul', 'kg-plist');
    [['Status', a.label, b.label], ['Price', priceText(a) || 'ask on WhatsApp', priceText(b) || 'ask on WhatsApp'], ['Chocolate types', a.types.length ? a.types.map(typeLabel).join(', ') : 'not confirmed', b.types.length ? b.types.map(typeLabel).join(', ') : 'not confirmed']].forEach(function (r) {
      var li = el('li'); li.appendChild(el('span', '', r[0])); li.appendChild(el('b', '', r[1] + '  |  ' + r[2])); ul.appendChild(li);
    });
    c.appendChild(ul); put(c);
    controls([[a.name, function () { showProduct(a); }], [b.name, function () { showProduct(b); }], ['Back to menu', menu]]);
  }

  /* ---------- enquiry: consent, review, confirm, then send only to the configured endpoint ---------- */
  function validContact(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || (/^[+\d][\d\s()-]{7,18}$/.test(v) && v.replace(/\D/g, '').length >= 8); }
  function enquiry(prefill) {
    var ep = C.enquiryEndpoint;
    var summary = prefill || (prefs.occasion || prefs.type || prefs.budget || last ? prefSummary() : '');
    if (!ep) {
      say('Sending enquiries from this website is not switched on yet, so I will not collect your details here. You can send the same message straight to the team:');
      var c = el('div', 'kg-card'), r = el('div', 'kg-row');
      r.appendChild(link(waURL(hi() + (summary || 'I have an enquiry.')), 'btn btn-gold btn-sm', 'Send on WhatsApp', true));
      r.appendChild(link('mailto:MeltiQu.choco@gmail.com?subject=' + encodeURIComponent('Enquiry from website') + '&body=' + encodeURIComponent(summary), 'btn btn-line btn-sm', 'Send by email', true));
      c.appendChild(r); put(c); controls([['Back to menu', menu]]); return;
    }
    say('Happy to pass your enquiry to the team. I will only send what you type here, and only after you agree and review it.');
    q(function () {
      ctl.innerHTML = '';
      var f = el('form', 'kg-form kg-enq');
      f.innerHTML = '<label for="kqN">Your name</label><input id="kqN" maxlength="60" autocomplete="name" required>' +
        '<label for="kqC">Phone or email, so the team can reply</label><input id="kqC" maxlength="80" autocomplete="off" required>' +
        '<label for="kqM">Your message</label><textarea id="kqM" rows="3" maxlength="600" required></textarea>' +
        '<div class="kg-hp" aria-hidden="true"><label>Leave this empty<input id="kqH" tabindex="-1" autocomplete="off"></label></div>' +
        '<label class="kg-consent"><input type="checkbox" id="kqK" required> I agree that ' + esc(BRAND) + ' may receive these details to reply to my enquiry. See the <a href="' + base + 'privacy.html" target="_blank" rel="noopener">Privacy page</a>.</label>' +
        '<p class="kg-err" id="kqE" role="alert"></p><div class="kg-row"><button class="btn btn-gold btn-sm" type="submit">Review</button><button class="btn btn-line btn-sm" type="button" id="kqX">Cancel</button></div>';
      f.querySelector('#kqN').value = user; f.querySelector('#kqM').value = summary;
      f.querySelector('#kqX').addEventListener('click', function () { ctl.innerHTML = ''; youSaid('Cancel'); say('No problem. Nothing was sent.'); menu(); });
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var d = { name: f.querySelector('#kqN').value.trim(), contact: f.querySelector('#kqC').value.trim(), message: f.querySelector('#kqM').value.trim(), hp: f.querySelector('#kqH').value }, err = f.querySelector('#kqE');
        if (!d.name || !d.message) { err.textContent = 'Please fill in your name and message.'; return; }
        if (!validContact(d.contact)) { err.textContent = 'Please enter a valid phone number or email address.'; return; }
        if (!f.querySelector('#kqK').checked) { err.textContent = 'Please tick the consent box so I can send this.'; return; }
        ctl.innerHTML = ''; review(d, summary);
      });
      ctl.appendChild(f); if (!panel.hidden) f.querySelector('#kqN').focus({ preventScroll: true }); toBottom();
    });
  }
  function review(d, summary) {
    say('Please check this before I send it. Nothing has been sent yet.');
    var c = el('div', 'kg-card'), ul = el('ul', 'kg-plist');
    [['Name', d.name], ['Contact', d.contact], ['Message', d.message]].forEach(function (r) { var li = el('li'); li.appendChild(el('span', '', r[0])); li.appendChild(el('b', '', r[1])); ul.appendChild(li); });
    c.appendChild(ul); put(c);
    controls([['Send enquiry', function () { send(d, summary); }], ['Edit', function () { enquiry(d.message); }], ['Cancel', function () { say('Cancelled. Nothing was sent.'); menu(); }]]);
  }
  function send(d, summary) {
    var busy = typing(); ctl.setAttribute('aria-busy', 'true');
    var done = function () { try { busy.remove(); } catch (e) { } ctl.removeAttribute('aria-busy'); };
    var ctrl = window.AbortController ? new AbortController() : null, timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
    var body = JSON.stringify({ name: d.name, contact: d.contact, message: d.message, consent: true, hp: d.hp, page: location.pathname });
    fetch(C.enquiryEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, signal: ctrl ? ctrl.signal : undefined })
      .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok && j && j.ok === true, status: res.status }; }); })
      .then(function (r) {
        clearTimeout(timer); done(); d = null;
        if (r.ok) { say('Your enquiry has been received by the team. They will reply on the contact you gave. Thank you!'); controls([['Back to menu', menu]]); }
        else fail(summary);
      })
      .catch(function () { clearTimeout(timer); done(); fail(summary); });
  }
  function fail(summary) {
    say('Sorry, I could not confirm that your enquiry was delivered, so please treat it as not sent. You can try again, or message the team directly.');
    var c = el('div', 'kg-card'), r = el('div', 'kg-row');
    r.appendChild(link(waURL(hi() + (summary || 'I have an enquiry.')), 'btn btn-gold btn-sm', 'Send on WhatsApp', true));
    r.appendChild(link('mailto:MeltiQu.choco@gmail.com', 'btn btn-line btn-sm', 'Email', true)); c.appendChild(r); put(c);
    controls([['Try again', function () { enquiry(summary); }], ['Back to menu', menu]]);
  }

  /* ---------- understanding typed text ---------- */
  var STOP = /^(chocolate|chocolates|with|the|and|for|your|from|have|want|need|some|please|what|about|show|tell|more)$/;
  function norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9₹'\s.\-]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function stem(w) { return w.replace(/(ies)$/, 'y').replace(/s$/, ''); }
  var ALIAS = [
    [/\bbars?\b|plain chocolate/, 'Chocolate Bars'], [/coffee|mocha/, 'Coffee Chocolate'], [/honey/, 'Honey Chocolate'], [/\bnuts?\b|nutty|almond|cashew/, 'Nut Chocolate'],
    [/cookie|biscuit/, 'Cookies with Chocolate Fillings'], [/\bbombs?\b/, 'Chocolate Bombs'], [/fruit/, 'Chocolate-covered Fruits and Nuts'], [/fruits? (and|&) nuts?/, 'Chocolate-covered Fruits and Nuts', 3],
    [/brownie/, 'Brownie Bites'], [/truffle/, 'Cocoa Truffles'], [/\bdips?\b/, 'Chocolate Dips'], [/donut|doughnut/, 'Donut-shaped Chocolates'], [/personali[sz]ed|customi[sz]ed/, 'Personalized Chocolates'],
    [/fudge/, 'Chocolate Fudge'], [/own (chocolate )?box|create your own|build a box/, 'Create Your Own Chocolate Box'], [/secret message|hidden message/, 'Secret Message Chocolate'],
    [/bundle|lifestyle/, 'Chocolate & Lifestyle Gift Bundles'], [/limited|celebration box/, 'Limited-Edition Celebration Boxes'], [/say it/, 'Say It with Chocolate'], [/puzzle/, 'Puzzle Chocolates / Puzzle Packaging'],
    [/discovery|mystery box/, 'Surprise Discovery Box'], [/marshmallow/, 'Chocolate Marshmallows'], [/dessert cup/, 'Dessert Cups'], [/popcorn/, 'Chocolate-covered Popcorn'], [/protein/, 'Protein Chocolates'],
    [/piku|\bdogs?\b|\bpaws?\b|puppy/, 'Piku Chocolate'], [/more (chocolate )?collection/, 'More Chocolate Collections']
  ];
  function matchProducts(t) {
    var score = {}; P.forEach(function (p) { score[p.name] = 0; });
    ALIAS.forEach(function (a) { if (a[0].test(t) && score[a[1]] != null) score[a[1]] += a[2] || 3; });
    var words = t.split(' ').filter(function (w) { return w.length > 3 && !STOP.test(w); }).map(stem);
    P.forEach(function (p) { var pw = norm(p.name).split(' ').map(stem); words.forEach(function (w) { if (pw.indexOf(w) > -1) score[p.name] += 1; }); });
    var best = 0; P.forEach(function (p) { if (score[p.name] > best) best = score[p.name]; });
    if (best < 2) return [];
    return P.filter(function (p) { return score[p.name] === best; });
  }
  function has(t, re) { return re.test(t); }
  function understand(raw) {
    var t = ' ' + norm(raw) + ' ', tt = t.trim(), n;
    if (!tt) return;
    if (has(t, /\b(restart|start over|reset|begin again)\b/)) return restart();
    if (has(t, /^ (thanks?|thank you|thx|ok thanks?|great thanks?) /)) { say('You are welcome' + (user ? ', ' + user : '') + '! Anything else I can help with?'); return controls([['Recommend something', recommend], ['Back to menu', menu]]); }
    if (has(t, /^ (bye|goodbye|see you|that is all|nothing else) /)) { say('Bye' + (user ? ', ' + user : '') + '! Come back any time.'); return; }
    if ((n = tt.match(/^(?:my name is|call me|name is|i am|i'm|im)\s+([a-z][a-z .'-]{1,23})$/)) && (/^(?:my name is|call me|name is)/.test(tt) || (n[1].split(' ').length <= 2 && !matchProducts(' ' + n[1] + ' ').length && !occasionOf(n[1])))) {
      user = clean(n[1]).replace(/\b\w/g, function (c) { return c.toUpperCase(); }); try { sessionStorage.setItem('kgName', user); } catch (e) { }
      say('Nice to meet you, ' + user + '! What can I help you find?'); return controls([['Recommend something', recommend], ['Back to menu', menu]]);
    }
    if (has(t, /^ (hi|hello|hey|hii+|vanakkam|good (morning|afternoon|evening)) /) && tt.split(' ').length <= 4) { say('Hello' + (user ? ' ' + user : '') + '! What are you looking for today?'); return menu(); }
    if (has(t, /\b(design|personali[sz]e my|my own chocolate|customi[sz]e my)\b/)) return designMine();
    if (has(t, /\b(gift box|build a gift|gift architect|gift finder)\b/)) return goPage('gift-architect.html', 'The Gift Architect asks a few questions and suggests ideas from our real catalogue.');
    var bud = budgetOf(tt); if (bud) { prefs.budget = bud; remember(); }
    if (has(t, /\b(enquir|inquir|contact the team|talk to|speak to|call me|reach me|callback|call back|send my details|send (a )?message|ask the team)/)) return enquiry('');
    var types = ['dark', 'milk', 'white'].filter(function (x) { return t.indexOf(' ' + x + ' ') > -1; });
    var prods = matchProducts(t);
    if (has(t, /\b(vs|versus|compare|difference between|or)\b/) && prods.length === 0) { /* fall through */ }
    var two = ALIAS.filter(function (a) { return a[0].test(t); }).map(function (a) { return a[1]; }).filter(function (x, i, arr) { return arr.indexOf(x) === i && byName(x); });
    if (has(t, /\b(vs|versus|compare|difference|better|or)\b/) && two.length === 2) return compare(byName(two[0]), byName(two[1]));
    if (types.length === 1 && !prods.length) return typeFilter(types[0]);
    if (types.length === 1 && prods.length === 1) { prefs.type = types[0]; remember(); var pp = prods[0]; if (pp.types && pp.types.indexOf(types[0]) > -1) say('Yes, ' + pp.name + ' is confirmed in ' + typeLabel(types[0]) + ' chocolate.'); else say('I cannot confirm that ' + pp.name + ' comes in ' + typeLabel(types[0]) + ' chocolate. The team can tell you.'); return showProduct(pp); }
    if (has(t, /\b(recommend|suggest|help me (choose|pick|decide)|what should i|which (one )?should|best|popular)\b/)) { if (occasionOf(tt)) prefs.occasion = occasionOf(tt); remember(); return recommend(); }
    if (has(t, /\b(price|prices|cost|how much|rate|rates|pricing)\b/)) { if (prods.length === 1) return showProduct(prods[0]); if (last && has(t, /\b(it|this|that|one)\b/)) return showProduct(last); return prices(); }
    if (has(t, /\b(delivery|deliver|shipping|ship|courier|cancel|cancellation|refund|payment|pay|advance|return)\b/)) return policy();
    if (has(t, /\b(ingredient|ingredients|allerg|vegan|sugar free|sugarfree|diabet|healthy|health|calorie|nutrition|gluten|eggless|egg|dairy|lactose|shelf life|expiry)\b/)) return details();
    if (has(t, /\b(bulk|wholesale|corporate|in bulk|hundred|large order|many boxes)\b/)) return bulk();
    if (has(t, /\b(store|shop|visit|location|address|where|directions|map|open|timing|hours)\b/) && !prods.length) return store();
    if (has(t, /\b(whatsapp|instagram|insta|email|gmail|phone|number)\b/)) return contact();
    if (has(t, /\b(how (do|to|can) i (order|buy)|order|buy|purchase)\b/) && !prods.length) { say('Pick a product that is available now and tap Order on WhatsApp. For pre-orders, the team confirms availability, price and the date with you first.'); return pickFrom('available', 'These can be ordered on WhatsApp right now.'); }
    if (prods.length === 1) return showProduct(prods[0]);
    if (prods.length > 1 && prods.length <= 5) return showList(prods, 'A few of our products could match. Which one do you mean?');
    var occ = occasionOf(tt);
    if (occ) { prefs.occasion = occ; remember(); say('For a ' + occ + ', our gifting and pre-order ideas are a good place to start. Whether a specific colour, chocolate type or design is possible is confirmed by the team for each order.'); return recStep2(); }
    if (has(t, /\b(pre ?order|preorder)\b/)) return pickFrom('pre', 'These are pre-orders. Which would you like to ask about?');
    if (has(t, /\b(coming soon|upcoming|lab|new ideas|future|experimental|concept)\b/)) return pickFrom('lab', 'These ideas are still in the lab. They cannot be ordered yet.');
    if (has(t, /\b(gift|gifts|gifting|hamper)\b/)) return pickFrom('gift', 'Here are our gifting ideas.', ['Bulk orders for events', bulk]);
    if (has(t, /\b(what do you (have|sell|offer)|menu|products|catalog|catalogue|everything|all|available|options)\b/)) return menu();
    if (bud && !prods.length) { say('Noted: a budget of ' + bud + ' rupees. ' + (Object.keys(PRICES).length ? '' : 'I do not have prices listed yet, so I cannot filter by it, but I can pass it to the team.')); return controls([['Recommend something', recommend], ['Ask the team', function () { enquiry(prefSummary()); }], ['Back to menu', menu]]); }
    if (last && has(t, /\b(more|detail|details|tell me|this one|that one|it)\b/)) return showProduct(last);
    if (has(t, /\b(other|another|else|different|something else)\b/)) { var o2 = P.filter(function (p) { return p.cat === 'available' && p !== last; }); return showList(o2.slice(0, 5), 'Here are some other things you can order now.'); }
    if (has(t, /^ (yes|yeah|yep|sure|ok|okay|please) /)) return menu();
    if (C.api) return askAI(raw);
    misses++;
    say(misses > 1 ? 'I still could not match that to something I know. I can pass your question to the team if you like.' : 'I am not sure I understood that. You can ask about a product, an occasion, prices, bulk orders or visiting the store.');
    controls((misses > 1 ? [['Ask the team', function () { enquiry(raw.slice(0, 300)); }]] : []).concat([['Recommend something', recommend], ['Back to menu', menu]]));
  }
  /* ---------- real AI answers (server-side Claude), only when the API is configured ---------- */
  var hist = [];
  function askAI(raw) {
    hist.push({ role: 'user', content: raw.slice(0, 500) }); hist = hist.slice(-8);
    var busy = typing(); ctl.setAttribute('aria-busy', 'true');
    var fin = function () { try { busy.remove(); } catch (e) { } ctl.removeAttribute('aria-busy'); };
    var ac = window.AbortController ? new AbortController() : null, tm = setTimeout(function () { if (ac) ac.abort(); }, 20000);
    fetch(C.api + '/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ac ? ac.signal : undefined, body: JSON.stringify({ messages: hist, prefs: { occasion: prefs.occasion, type: prefs.type, budget: prefs.budget } }) })
      .then(function (r) { clearTimeout(tm); return r.json().catch(function () { return {}; }).then(function (j) { j.httpOk = r.ok; return j; }); })
      .then(function (j) {
        fin();
        if (!(j.httpOk && j.ok && j.reply)) throw new Error('ai');
        hist.push({ role: 'assistant', content: j.reply }); say(j.reply);
        (j.products || []).map(byName).filter(Boolean).forEach(function (p) { last = p; put(productCard(p)); }); remember();
        var items = [];
        if (j.action === 'studio') items.push(['Design My Chocolate', designMine]);
        if (j.action === 'gift') items.push(['Find a Gift', function () { goPage('gift-architect.html', 'The Gift Architect suggests ideas from our real catalogue.'); }]);
        if (j.action === 'enquiry') items.push(['Ask the team', function () { enquiry(raw.slice(0, 300)); }]);
        items.push(['Back to menu', menu]); controls(items);
      }).catch(function () {
        fin(); clearTimeout(tm); say('Sorry, I could not reach my smart helper just now. I can still use the menu, or pass your question to the team.');
        controls([['Ask the team', function () { enquiry(raw.slice(0, 300)); }], ['Back to menu', menu]]);
      });
  }
  function handle(raw) {
    var text = String(raw).trim().slice(0, 200); if (!text) return;
    ctl.innerHTML = ''; youSaid(text);
    try { var before = misses; understand(text); if (misses === before && misses) misses = 0; } catch (e) {
      say('Sorry, something went wrong on my side. Let us start fresh.'); controls([['Restart', restart]]);
    }
  }
  doc.getElementById('kgTalk').addEventListener('submit', function (e) {
    e.preventDefault(); var i = doc.getElementById('kgTalkIn'), v = i.value; i.value = ''; handle(v);
  });

  function menu() {
    say('What would you like to do?');
    controls([
      ['Find My Chocolate', recommend],
      ['Design My Chocolate', designMine],
      ['Build a Gift Box', function () { goPage('gift-architect.html', 'The Gift Architect asks a few questions and suggests ideas from our real catalogue.'); }],
      ['Find a Gift', function () { goPage('gift-architect.html', 'The Gift Architect asks a few questions and suggests ideas from our real catalogue.'); }],
      ['Explore Collections', collections],
      ['More options', more]
    ]);
  }
  function more() {
    say('Here is everything else I can help with.');
    controls([
      ['Order something now', function () { pickFrom('available', 'These can be ordered on WhatsApp. Which one catches your eye?'); }],
      ['Pre-order something', function () { pickFrom('pre', 'These are pre-orders. We confirm availability, price and the date with you first. Which one would you like to ask about?'); }],
      ['Dark, milk or white?', function () { say('Which chocolate type are you after?'); controls([['Dark', function () { typeFilter('dark'); }], ['Milk', function () { typeFilter('milk'); }], ['White', function () { typeFilter('white'); }], ['Back to menu', menu]]); }],
      ['Help me choose by taste', taste],
      ['What are the prices?', prices],
      ['Bulk orders for events', bulk],
      ['Visit the store', store],
      ['Coming soon ideas', function () { pickFrom('lab', 'These ideas are still in the lab. They cannot be ordered yet, but you can tell us you are interested.'); }],
      ['Send an enquiry', function () { enquiry(''); }],
      ['Back to menu', menu]
    ]);
  }
  function collections() {
    say('Which collection would you like to explore?');
    controls([
      ['Available now', function () { pickFrom('available', 'These can be ordered on WhatsApp.'); }],
      ['Pre-order', function () { pickFrom('pre', 'These are pre-orders.'); }],
      ['Gifts and celebrations', function () { pickFrom('gift', 'Here are our gifting ideas.', ['Bulk orders for events', bulk]); }],
      ['MeltiQue Lab ideas', function () { pickFrom('lab', 'These ideas are in the lab and cannot be ordered yet.'); }],
      ['Celebrations', function () { goPage('celebrations.html', 'Our celebrations page lists upcoming occasions and gifting ideas.'); }],
      ['Back to menu', menu]
    ]);
  }
  function goPage(href, text) {
    say(text); var c = el('div', 'kg-card'); c.appendChild(link(base + href, 'btn btn-gold btn-sm', 'Open it')); put(c); controls([['Back to menu', menu]]);
  }
  function designMine() {
    say('Let us design your own chocolate. I will take you to the Design Studio' + (prefs.type ? ' with ' + typeLabel(prefs.type) + ' chocolate as your preference' : '') + '. The team confirms what can be made before anything is produced.');
    var c = el('div', 'kg-card'), a = link(base + 'studio.html', 'btn btn-gold btn-sm', 'Open the Design Studio');
    a.addEventListener('click', function () { var sd = {}; if (prefs.type) sd.type = prefs.type; if (prefs.occasion) sd.occasion = prefs.occasion.replace(/^\w/, function (x) { return x.toUpperCase(); }); try { sessionStorage.setItem('mqSeed', JSON.stringify(sd)); } catch (e) { } });
    c.appendChild(a); put(c); controls([['Back to menu', menu]]);
  }
  function clean(s) {
    var r; try { r = new RegExp("[^\\p{L}\\p{M}\\s.'-]", 'gu'); } catch (e) { r = /[^A-Za-z\s.'-]/g; }
    return String(s).replace(r, '').replace(/\s+/g, ' ').trim().slice(0, 24);
  }
  function askName() {
    say('Hi! I am ' + NAME + ', your chocolate guide at ' + BRAND + '. You can type to me or tap the buttons.'); say('What is your name?');
    q(function () {
      ctl.innerHTML = '';
      var f = el('form', 'kg-form');
      f.innerHTML = '<label class="sr" for="kgNameIn">Your first name</label><input id="kgNameIn" type="text" maxlength="24" autocomplete="given-name" placeholder="Your first name"><button class="btn btn-gold btn-sm" type="submit">Say hi</button>';
      f.addEventListener('submit', function (e) {
        e.preventDefault(); var v = clean(f.querySelector('input').value); ctl.innerHTML = '';
        if (v) { user = v; try { sessionStorage.setItem('kgName', v); } catch (x) { } youSaid(v); say('Nice to meet you, ' + v + '!'); }
        else { youSaid('Skip'); say('No problem!'); }
        menu();
      });
      var skip = chip('Skip', function () { say('No problem!'); menu(); }); skip.classList.add('kg-skip');
      ctl.appendChild(f); ctl.appendChild(skip);
      if (!panel.hidden) f.querySelector('input').focus({ preventScroll: true });
    });
  }
  function start(returning) {
    if (returning && last) {
      say('Welcome back' + (user ? ', ' + user : '') + '! You were looking at ' + last.name + '.');
      controls([['Continue with ' + last.name, function () { showProduct(last); }], ['Recommend something', recommend], ['Back to menu', menu]]);
    } else if (user) { say('Welcome back, ' + user + '! I am ' + NAME + ', your chocolate guide.'); menu(); } else askName();
  }
  function restart() {
    stopSpeech(); chain = Promise.resolve(); log.innerHTML = ''; ctl.innerHTML = '';
    prefs = { type: '', occasion: '', taste: '', budget: 0 }; last = null; misses = 0; user = '';
    try { sessionStorage.removeItem('kgMem'); sessionStorage.removeItem('kgName'); sessionStorage.removeItem('kgFrom'); } catch (e) { }
    start();
  }
  doc.getElementById('kgRestart').addEventListener('click', restart);

  /* ---------- open / close ---------- */
  var backBtn = doc.getElementById('kgBack'), welcome = doc.getElementById('kgWelcome');
  function openPanel(returning) {
    hideWelcome(true); backBtn.hidden = true;
    panel.hidden = false; root.classList.add('open'); fab.setAttribute('aria-expanded', 'true'); tease.hidden = true;
    try { sessionStorage.setItem('kgTease', '1'); } catch (e) { }
    if (!started) { started = true; start(returning === true); } else { var b = ctl.querySelector('button,input'); if (b) b.focus({ preventScroll: true }); else panel.focus(); }
    if (!ctl.querySelector('button,input')) panel.focus({ preventScroll: true });
  }
  function closePanel() {
    stopSpeech(); panel.hidden = true; root.classList.remove('open'); fab.setAttribute('aria-expanded', 'false'); fab.focus({ preventScroll: true });
  }
  fab.addEventListener('click', function () { panel.hidden ? openPanel() : closePanel(); });
  doc.getElementById('kgClose').addEventListener('click', closePanel);
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!welcome.hidden) hideWelcome(false); else if (!panel.hidden) closePanel();
  });
  window.addEventListener('pagehide', stopSpeech);
  doc.addEventListener('visibilitychange', function () { if (doc.hidden) stopSpeech(); });

  /* ---------- welcome screen: once per visit, dismissible, then only the small button ---------- */
  var wasFocus = null;
  function showWelcome() {
    wasFocus = doc.activeElement; welcome.hidden = false; root.classList.add('welcoming');
    doc.getElementById('kgWGo').focus({ preventScroll: true });
  }
  function hideWelcome(toChat) {
    if (welcome.hidden) return; welcome.hidden = true; root.classList.remove('welcoming');
    if (!toChat) { try { (wasFocus && wasFocus.focus ? wasFocus : fab).focus({ preventScroll: true }); } catch (e) { } }
  }
  welcome.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var b = welcome.querySelectorAll('button'), f = b[0], l = b[b.length - 1];
    if (e.shiftKey && doc.activeElement === f) { e.preventDefault(); l.focus(); } else if (!e.shiftKey && doc.activeElement === l) { e.preventDefault(); f.focus(); }
  });
  doc.getElementById('kgWGo').addEventListener('click', function () { openPanel(); });
  doc.getElementById('kgWLater').addEventListener('click', function () { hideWelcome(false); });
  welcome.addEventListener('click', function (e) { if (e.target === welcome) hideWelcome(false); });

  /* coming back from a product page opened from the chat */
  var fromChat = false; try { fromChat = sessionStorage.getItem('kgFrom') === '1'; } catch (e) { }
  var onExplore = /\/explore\//.test(location.pathname);
  if (fromChat && onExplore) {
    backBtn.hidden = false;
    backBtn.addEventListener('click', function () { try { sessionStorage.removeItem('kgFrom'); } catch (e) { } openPanel(true); });
  }
  var seen = false; try { seen = sessionStorage.getItem('kgWelcome') === '1'; } catch (e) { }
  if (!seen && !(fromChat && onExplore)) {
    try { sessionStorage.setItem('kgWelcome', '1'); } catch (e) { }
    setTimeout(function () { if (panel.hidden) showWelcome(); }, 700);
  }
  doc.getElementById('kgTeaseGo').addEventListener('click', function () { openPanel(); });
  doc.getElementById('kgTeaseX').addEventListener('click', function () { tease.hidden = true; try { sessionStorage.setItem('kgTease', '1'); } catch (e) { } });
})();
