/* Site extras: shared helpers (MQX), Treasure hunt clues, Lab votes, Celebrations countdown.
   Treasure hunt progress lives only in this browser session. No rewards are promised. */
(function () {
  'use strict';
  var C = window.MQ || {}, doc = document, API = C.api || '';
  function el(t, c, x) { var n = doc.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function validContact(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || (/^[+\d][\d\s()-]{7,18}$/.test(v) && v.replace(/\D/g, '').length >= 8); }
  function post(path, obj, ms) {
    var ctl = window.AbortController ? new AbortController() : null, t = setTimeout(function () { if (ctl) ctl.abort(); }, ms || 20000);
    return fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { clearTimeout(t); return r.json().catch(function () { return {}; }).then(function (j) { j.httpOk = r.ok; return j; }); });
  }
  function waURL(text) { return 'https://wa.me/' + String(C.whatsappNumber || '').replace(/\D/g, '') + '?text=' + encodeURIComponent(text); }

  /* consent-based enquiry form; with no API configured it collects nothing and offers WhatsApp / email */
  function enquiryForm(box, prefill) {
    box.textContent = '';
    if (!API) {
      box.appendChild(el('p', 'small', 'Sending enquiries from this website is not switched on yet, so nothing is collected here. Message the team directly:'));
      var r = el('div', 'actions'), a = el('a', 'btn btn-gold btn-sm', 'Send on WhatsApp'); a.href = waURL('Hi MeltiQue Chocoland! ' + (prefill || 'I have an enquiry.')); a.target = '_blank'; a.rel = 'noopener';
      var b = el('a', 'btn btn-line btn-sm', 'Send by email'); b.href = 'mailto:MeltiQu.choco@gmail.com?subject=' + encodeURIComponent('Enquiry from website') + '&body=' + encodeURIComponent(prefill || ''); r.appendChild(a); r.appendChild(b); box.appendChild(r); return;
    }
    var f = el('form', 'form'); f.noValidate = true;
    f.innerHTML = '<label>Your name<input name="n" maxlength="60" autocomplete="name"></label><label>Phone or email, so the team can reply<input name="c" maxlength="80" autocomplete="off"></label><label>Your message<textarea name="m" maxlength="600" rows="4"></textarea></label><div class="hp" aria-hidden="true"><input name="h" tabindex="-1" autocomplete="off"></div><label class="chk"><input type="checkbox" name="k"> I agree that MeltiQue Chocoland may receive these details to reply to my enquiry. See the <a href="privacy.html" target="_blank" rel="noopener">Privacy page</a>.</label><button class="btn btn-gold" type="submit">Send enquiry</button><p class="vmsg" role="status" aria-live="polite"></p>';
    f.m.value = prefill || ''; var msg = f.querySelector('.vmsg'), btn = f.querySelector('button'), busy = false;
    f.addEventListener('submit', function (e) {
      e.preventDefault(); if (busy) return;
      var n = f.n.value.trim(), c = f.c.value.trim(), m = f.m.value.trim();
      if (!n || !m) { msg.textContent = 'Please fill in your name and message.'; return; }
      if (!validContact(c)) { msg.textContent = 'Please enter a valid phone number or email.'; return; }
      if (!f.k.checked) { msg.textContent = 'Please tick the consent box so we can send this.'; return; }
      busy = true; btn.disabled = true; msg.textContent = 'Sending…';
      post('/enquiry', { name: n, contact: c, message: m, consent: true, hp: f.h.value, page: location.pathname }).then(function (j) {
        busy = false; btn.disabled = false;
        if (j.httpOk && j.ok === true) { msg.textContent = 'Your enquiry has been received by the team. Reference: ' + j.id + '. They will reply on the contact you gave.'; f.reset(); }
        else msg.textContent = 'Sorry, we could not confirm that your enquiry was delivered, so please treat it as not sent. Try again, or message us on WhatsApp.';
      }).catch(function () { busy = false; btn.disabled = false; msg.textContent = 'Sorry, we could not confirm that your enquiry was delivered, so please treat it as not sent. Try again, or message us on WhatsApp.'; });
    });
    box.appendChild(f);
  }
  window.MQX = { el: el, post: post, api: API, waURL: waURL, enquiryForm: enquiryForm, validContact: validContact };

  /* ---------- treasure hunt: digital clues, session only ---------- */
  var page = (location.pathname.split('/').pop() || 'index.html'), CLUES = ['index.html', 'about.html', 'find-us.html', 'lab.html', 'piku.html', 'studio.html', 'celebrations.html', 'gift-architect.html'];
  if (page === '') page = 'index.html';
  function found() { try { return JSON.parse(sessionStorage.getItem('mqHunt') || '[]'); } catch (e) { return []; } }
  var idx = CLUES.indexOf(page);
  if (idx > -1 && !/\/explore\//.test(location.pathname)) {
    var m = doc.getElementById('main'); if (m) {
      var b = el('button', 'clue'); b.type = 'button'; b.setAttribute('aria-label', 'A hidden paw clue. Tap to collect it.'); b.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22"><use href="#paw"/></svg>';
      var pos = [[8, 6], [14, 90], [22, 12], [10, 80], [18, 50], [12, 30], [26, 70], [9, 62]][idx]; b.style.bottom = pos[0] + 'px'; b.style.left = pos[1] + '%';
      if (found().indexOf(page) > -1) b.classList.add('got');
      b.addEventListener('click', function () {
        var f = found(); if (f.indexOf(page) < 0) { f.push(page); try { sessionStorage.setItem('mqHunt', JSON.stringify(f)); } catch (e) { } }
        b.classList.add('got'); toast(f.length + ' of ' + CLUES.length + ' digital clues found this visit.');
      });
      m.style.position = m.style.position || 'relative'; m.appendChild(b);
    }
  }
  function toast(t) { var n = doc.getElementById('mqToast') || el('div', 'toast'); n.id = 'mqToast'; n.setAttribute('role', 'status'); n.textContent = t; if (!n.parentNode) doc.body.appendChild(n); n.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { n.classList.remove('on'); }, 3500); }
  var hp = doc.getElementById('huntProgress');
  if (hp) { var f = found(); hp.querySelector('.hn').textContent = f.length + ' of ' + CLUES.length; var ul = hp.querySelector('ul'); CLUES.forEach(function (c, i) { var li = el('li', f.indexOf(c) > -1 ? 'got' : '', (i + 1) + (f.indexOf(c) > -1 ? ' found' : ' hidden')); ul.appendChild(li); }); }

  /* ---------- lab votes ---------- */
  [].forEach.call(doc.querySelectorAll('form.votef'), function (f) {
    var msg = f.querySelector('.vmsg'), btn = f.querySelector('button'), busy = false, inputs = f.querySelectorAll('input');
    f.addEventListener('submit', function (e) {
      e.preventDefault(); if (busy) return;
      if (!API) { msg.textContent = 'Voting is not switched on yet, so nothing was recorded.'; return; }
      var contact = inputs[1].value.trim(); if (contact && !validContact(contact)) { msg.textContent = 'Please enter a valid phone number or email, or leave it empty.'; return; }
      busy = true; btn.disabled = true; msg.textContent = 'Sending…';
      post('/vote', { concept: f.getAttribute('data-vote'), contact: contact, consent: inputs[0].checked, hp: inputs[2].value }).then(function (j) {
        busy = false; btn.disabled = false; msg.textContent = j.httpOk && j.ok === true ? 'Thank you, your vote was recorded. Voting does not guarantee that this idea will be made.' : 'Sorry, your vote could not be confirmed. Please try again.';
      }).catch(function () { busy = false; btn.disabled = false; msg.textContent = 'Sorry, your vote could not be confirmed. Please try again.'; });
    });
  });

  /* ---------- celebrations: only current items, owner-edited in build.py ---------- */
  var camps = doc.getElementById('camps');
  if (camps) {
    var now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate()), shown = 0, P = window.MQ_PRODUCTS || [];
    (window.MQ_CAMPAIGNS || []).forEach(function (c) {
      var d = c.date ? new Date(c.date + 'T00:00:00') : null; if (d && d < today) return;
      shown++; var s = el('section', 'camp'); s.id = c.id; s.appendChild(el('h2', '', c.name));
      if (d) { var days = Math.round((d - today) / 86400000); s.appendChild(el('p', 'cd', days === 0 ? 'Today' : days + ' day' + (days > 1 ? 's' : '') + ' to go')); }
      s.appendChild(el('p', '', c.blurb));
      var row = el('div', 'actions');
      (c.products || []).forEach(function (n) { var p = P.filter(function (x) { return x.name === n; })[0]; if (p) { var a = el('a', 'btn btn-line btn-sm', p.name); a.href = p.href; row.appendChild(a); } });
      var w = el('a', 'btn btn-gold btn-sm', 'Ask about ' + c.name); w.href = waURL('Hi MeltiQue Chocoland! I would like to know about ' + c.name + ' gifting options and pre-order details.'); w.target = '_blank'; w.rel = 'noopener'; row.appendChild(w);
      var st = el('a', 'btn btn-line btn-sm', 'Design a gift'); st.href = 'studio.html'; row.appendChild(st);
      s.appendChild(row); camps.appendChild(s);
    });
    if (!shown) camps.appendChild(el('p', 'callout', 'No upcoming celebrations are listed right now. Please ask us about gifting.'));
  }
})();
