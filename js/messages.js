/* Message generator: calls the server's /ai/message (Claude). No API configured = clearly unavailable, never fake. */
(function () {
  'use strict';
  var root = document.getElementById('msgs'), X = window.MQX; if (!root || !X) return; var el = X.el;
  /* on-device message helper: tone templates, no server, nothing leaves the browser */
  var T = {
    'Romantic': ['{n}, you make every day sweeter.', 'Sweet like you, {n}.', 'Forever yours, {n}.', 'For {n}, with all my love.', 'You are my favourite, {n}.'],
    'Funny': ['{n}, you are my cocoa-nut.', 'Life is short, eat this, {n}.', 'Chocolate: cheaper than therapy, {n}.', 'For {n}, because snacks.', '{n}, I would share my chocolate. Maybe.'],
    'Friendship': ['{n}, friends like you are rare.', 'To {n}, my sweetest friend.', 'Thanks for being you, {n}.', 'For {n}, with friendship.', 'Better together, {n}.'],
    'Gratitude': ['Thank you, {n}.', '{n}, thank you for everything.', 'With thanks, {n}.', 'Grateful for you, {n}.', 'A small thank you, {n}.'],
    'Birthday wishes': ['Happy birthday, {n}!', '{n}, have a sweet birthday!', 'Cheers to you, {n}!', 'Many happy returns, {n}.', 'Make a wish, {n}!'],
    'Congratulations': ['Congratulations, {n}!', 'Well done, {n}!', 'So proud of you, {n}.', 'Cheers to you, {n}!', 'You did it, {n}!'],
    'Apology': ['{n}, I am sorry.', 'Sorry, {n}. Friends?', 'With a sweet sorry, {n}.', '{n}, forgive me?', 'I am sorry, {n}.'],
    'Encouragement': ['You can do it, {n}.', '{n}, believe in yourself.', 'Keep going, {n}.', 'Proud of you, {n}.', 'One step at a time, {n}.'],
    'Family celebration': ['To {n} and family, cheers!', 'Celebrating with you, {n}.', 'Family is sweet, {n}.', 'Joy to your home, {n}.', 'With love, for {n}.']
  };
  function local(name, tone, occ, mx) {
    var n = name || 'dear one', base = (T[tone] || T['Gratitude']).slice(), o = [];
    if (occ) base.unshift(occ + ', ' + n + '!');
    base.forEach(function (t) { var v = t.replace(/\{n\}/g, n); if (v.length <= mx && o.indexOf(v) < 0) o.push(v); });
    if (!o.length) o.push(n.slice(0, mx));
    return { httpOk: true, ok: true, options: o.slice(0, 3) };
  }
  var f = el('form', 'form'); f.noValidate = true;
  f.innerHTML = '<label>Name of the person<input name="who" maxlength="40"></label><label>Tone<select name="tone"><option>Romantic</option><option>Funny</option><option>Friendship</option><option>Gratitude</option><option>Birthday wishes</option><option>Congratulations</option><option>Apology</option><option>Encouragement</option><option>Family celebration</option></select></label><label>Occasion (optional)<input name="occ" maxlength="40"></label><label>Longest message<select name="max"><option value="30">30 characters</option><option value="60" selected>60 characters</option><option value="100">100 characters</option></select></label><button class="btn btn-gold" type="submit">Write messages</button><p class="vmsg" role="status" aria-live="polite"></p>';
  var out = el('div', 'gift-out'); root.appendChild(f); root.appendChild(out); var msg = f.querySelector('.vmsg'), btn = f.querySelector('button');
  f.addEventListener('submit', function (e) {
    e.preventDefault(); btn.disabled = true; msg.textContent = 'Writing…'; out.textContent = ''; var mx = parseInt(f.max.value, 10);
    (X.api ? X.post('/ai/message', { recipient: f.who.value.trim(), tone: f.tone.value, occasion: f.occ.value.trim(), maxChars: mx }) : Promise.resolve(local(f.who.value.trim(), f.tone.value, f.occ.value.trim(), mx))).then(function (j) {
      btn.disabled = false;
      if (!(j.httpOk && j.ok)) { msg.textContent = j.error === 'rate' ? 'Too many requests right now. Please try again later.' : 'Sorry, the message helper is not available right now. You can type your own message in the Design Studio.'; return; }
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
