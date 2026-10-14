/* MeltiQue Chocoland chocolate guide.
   An original anime-style character (drawn in SVG) that asks the visitor's name, helps them
   choose a chocolate from the real product list, and opens WhatsApp with the right message.
   - Prices come only from MQ.prices in js/config.js. Missing prices are never invented.
   - Voice uses the device's built-in text-to-speech, off with one tap, never automatic on load.
   - The visitor's name stays in sessionStorage in their own browser; it is never sent anywhere. */
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
    '<div class="kg-btns"><button type="button" class="kg-ib" id="kgVoice" aria-pressed="true" aria-label="Voice on"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4Zm11.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4Zm-2.5-8.7v2.1a7 7 0 0 1 0 13.2v2.1a9 9 0 0 0 0-17.4Z"/></svg></button>' +
    '<button type="button" class="kg-ib" id="kgClose" aria-label="Close chat"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="m6.4 5 5.6 5.6L17.600 5 19 6.400 13.400 12l5.600 5.600-1.400 1.400-5.600-5.600L6.400 19 5 17.600 10.600 12 5 6.400 6.400 5Z"/></svg></button></div>' +
    '<div class="kg-stage">' + charSVG('0 0 200 262') + '</div></div>' +
    '<div class="kg-log" id="kgLog" role="log" aria-live="polite" aria-label="Conversation with ' + esc(NAME) + '"></div>' +
    '<div class="kg-ctl" id="kgCtl"></div></section>';
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

  /* ---------- content ---------- */
  function priceText(p) { return PRICES[p.name] ? PRICES[p.name] : null; }
  function statusLine(p) {
    if (p.status === 'now') return 'You can order it on WhatsApp.';
    if (p.status === 'pre') return 'It is a pre-order, so we confirm availability, price, customization and the date with you first.';
    if (p.status === 'concept') return 'It is still a concept in development, so the final design and availability need to be confirmed.';
    return 'It is coming soon, so it cannot be ordered yet.';
  }
  function productCard(p) {
    var c = el('div', 'kg-card');
    var st = el('span', 'status ' + (SCLASS[p.status] || 's-soon')); st.innerHTML = '<i></i>'; st.appendChild(doc.createTextNode(p.label)); c.appendChild(st);
    c.appendChild(el('strong', '', p.name));
    if (p.status !== 'soon') { var pr = priceText(p); c.appendChild(el('span', 'kg-price' + (pr ? '' : ' none'), pr ? 'Price: ' + pr : 'Price: ask on WhatsApp')); }
    if (p.note) c.appendChild(el('span', 'kg-note', p.note));
    var row = el('div', 'kg-row');
    row.appendChild(link(waURL(actionMsg(p)), 'btn btn-' + (p.action === 'order' || p.action === 'preorder' ? 'gold' : 'line') + ' btn-sm', BTN[p.action], true));
    row.appendChild(link(base + p.href, 'more', 'Explore'));
    c.appendChild(row); return c;
  }
  function showProduct(p, back) {
    var pr = priceText(p), text = p.name + '. ' + p.desc + ' ' + statusLine(p);
    if (p.status !== 'soon') text += pr ? ' The price is ' + pr + '.' : ' I do not have a price listed here yet, so please ask on WhatsApp.';
    say(text); put(productCard(p)); say('Would you like to look at anything else?');
    var items = []; if (back) items.push(['See more like this', back]); items.push(['Back to menu', menu]);
    controls(items);
  }
  function pickFrom(cat, intro, extra) {
    var list = P.filter(function (p) { return p.cat === cat; });
    say(intro);
    var items = list.map(function (p) { return [p.name, function () { showProduct(p, function () { pickFrom(cat, 'Which one would you like to see?', extra); }); }]; });
    if (extra) items.push(extra); items.push(['Back to menu', menu]);
    controls(items);
  }
  function byName(n) { return P.filter(function (p) { return p.name === n; })[0]; }
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
    c.appendChild(r); put(c); controls([['Back to menu', menu]]);
  }
  function store() {
    say('Visit our physical store at ' + (INFO.address || 'Parappalayam, Mangalam Road, Tirupur') + '. Please contact us for the exact location and current availability before visiting.');
    var c = el('div', 'kg-card'); var r = el('div', 'kg-row');
    r.appendChild(link(waURL(hi() + 'I would like to visit your store. Could you share the exact location and current availability?'), 'btn btn-gold btn-sm', 'Ask before visiting', true));
    r.appendChild(link(base + 'find-us.html', 'more', 'Find Us page')); c.appendChild(r); put(c); controls([['Back to menu', menu]]);
  }
  function menu() {
    say('What would you like to do?');
    controls([
      ['Order something now', function () { pickFrom('available', 'These can be ordered on WhatsApp. Which one catches your eye?'); }],
      ['Pre-order something', function () { pickFrom('pre', 'These are pre-orders. We confirm availability, price and the date with you first. Which one would you like to ask about?'); }],
      ['Gifts and celebrations', function () { pickFrom('gift', 'Here are our gifting ideas. Details are always confirmed with you before an order is accepted.', ['Bulk orders for events', bulk]); }],
      ['Help me choose by taste', taste],
      ['What are the prices?', prices],
      ['Bulk orders for events', bulk],
      ['Visit the store', store],
      ['Coming soon ideas', function () { pickFrom('lab', 'These ideas are still in the lab. They cannot be ordered yet, but you can tell us you are interested.'); }]
    ]);
  }
  function clean(s) {
    var r; try { r = new RegExp("[^\\p{L}\\p{M}\\s.'-]", 'gu'); } catch (e) { r = /[^A-Za-z\s.'-]/g; }
    return String(s).replace(r, '').replace(/\s+/g, ' ').trim().slice(0, 24);
  }
  function askName() {
    say('Hi! I am ' + NAME + ', your chocolate guide at ' + BRAND + '.'); say('What is your name?');
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
  function start() {
    if (user) { say('Welcome back, ' + user + '! I am ' + NAME + ', your chocolate guide.'); menu(); } else askName();
  }

  /* ---------- open / close ---------- */
  function openPanel() {
    panel.hidden = false; root.classList.add('open'); fab.setAttribute('aria-expanded', 'true'); tease.hidden = true;
    try { sessionStorage.setItem('kgTease', '1'); } catch (e) { }
    if (!started) { started = true; start(); } else { var b = ctl.querySelector('button,input'); if (b) b.focus({ preventScroll: true }); else panel.focus(); }
    if (!ctl.querySelector('button,input')) panel.focus({ preventScroll: true });
  }
  function closePanel() {
    stopSpeech(); panel.hidden = true; root.classList.remove('open'); fab.setAttribute('aria-expanded', 'false'); fab.focus({ preventScroll: true });
  }
  fab.addEventListener('click', function () { panel.hidden ? openPanel() : closePanel(); });
  doc.getElementById('kgClose').addEventListener('click', closePanel);
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) closePanel(); });
  window.addEventListener('pagehide', stopSpeech);
  doc.addEventListener('visibilitychange', function () { if (doc.hidden) stopSpeech(); });

  /* gentle invitation, once per visit, never takes focus */
  var shown = false; try { shown = sessionStorage.getItem('kgTease') === '1'; } catch (e) { }
  if (!shown) {
    setTimeout(function () { if (panel.hidden) { tease.hidden = false; setTimeout(function () { tease.hidden = true; }, 14000); } }, 7000);
  }
  doc.getElementById('kgTeaseGo').addEventListener('click', openPanel);
  doc.getElementById('kgTeaseX').addEventListener('click', function () { tease.hidden = true; try { sessionStorage.setItem('kgTease', '1'); } catch (e) { } });
})();
