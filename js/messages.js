/* Message generator: calls the server's /ai/message (Claude). No API configured = clearly unavailable, never fake. */
(function () {
  'use strict';
  var root = document.getElementById('msgs'), X = window.MQX; if (!root || !X) return; var el = X.el;
  if (!X.api) { root.appendChild(el('p', 'callout', 'The AI message writer is not switched on yet on this site (it needs the server in worker/README.md). You can still type your own message in the Design Studio.')); var a = el('a', 'btn btn-gold', 'Go to the Design Studio'); a.href = 'studio.html'; root.appendChild(a); return; }
  var f = el('form', 'form'); f.noValidate = true;
  f.innerHTML = '<label>Name of the person<input name="who" maxlength="40"></label><label>Tone<select name="tone"><option>Romantic</option><option>Funny</option><option>Friendship</option><option>Gratitude</option><option>Birthday wishes</option><option>Congratulations</option><option>Apology</option><option>Encouragement</option><option>Family celebration</option></select></label><label>Occasion (optional)<input name="occ" maxlength="40"></label><label>Longest message<select name="max"><option value="30">30 characters</option><option value="60" selected>60 characters</option><option value="100">100 characters</option></select></label><button class="btn btn-gold" type="submit">Write messages</button><p class="vmsg" role="status" aria-live="polite"></p>';
  var out = el('div', 'gift-out'); root.appendChild(f); root.appendChild(out); var msg = f.querySelector('.vmsg'), btn = f.querySelector('button');
  f.addEventListener('submit', function (e) {
    e.preventDefault(); btn.disabled = true; msg.textContent = 'Writing…'; out.textContent = ''; var mx = parseInt(f.max.value, 10);
    X.post('/ai/message', { recipient: f.who.value.trim(), tone: f.tone.value, occasion: f.occ.value.trim(), maxChars: mx }).then(function (j) {
      btn.disabled = false;
      if (!(j.httpOk && j.ok)) { msg.textContent = j.error === 'rate' ? 'Too many requests right now. Please try again later.' : 'Sorry, the message writer is not available right now. You can type your own message in the Design Studio.'; return; }
      msg.textContent = 'Edit any message, then choose it. Nothing is printed until the team confirms your order.';
      j.options.forEach(function (o) {
        var box = el('div', 'callout'), ta = el('textarea'); ta.value = o; ta.maxLength = mx; ta.rows = 2; ta.setAttribute('aria-label', 'Message option');
        var cnt = el('p', 'small', ''); function u() { cnt.textContent = ta.value.length + ' / ' + mx + ' characters'; } ta.addEventListener('input', u); u();
        var use = el('button', 'btn btn-gold btn-sm', 'Use in my design'); use.type = 'button';
        use.addEventListener('click', function () { if (!ta.value.trim() || ta.value.length > mx) { cnt.textContent = 'Please keep it within ' + mx + ' characters.'; return; } try { sessionStorage.setItem('mqMsg', ta.value.trim()); } catch (x) { } location.href = 'studio.html'; });
        box.appendChild(ta); box.appendChild(cnt); box.appendChild(use); out.appendChild(box);
      });
    }).catch(function () { btn.disabled = false; msg.textContent = 'Sorry, the message writer is not available right now.'; });
  });
})();
