/* Gift Architect: guided questions -> ideas taken only from the real catalogue (MQ_PRODUCTS). */
(function () {
  'use strict';
  var root = document.getElementById('gift'), P = window.MQ_PRODUCTS || [], S = window.MQ_STUDIO || {}, C = window.MQ || {}, X = window.MQX;
  if (!root || !X) return; var el = X.el;
  var a = { who: '', occasion: '', type: '', personal: 'no', flowers: 'no', msg: 'no', qty: 1 };
  var f = el('form', 'form'); f.noValidate = true;
  function sel(id, label, opts) { return '<label>' + label + '<select name="' + id + '">' + opts.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') + '</select></label>'; }
  f.innerHTML = '<label>Who is the gift for?<input name="who" maxlength="40" placeholder="e.g. my sister, a client"></label>' +
    sel('occasion', 'Occasion', [['', 'Choose one'], ['Birthday', 'Birthday'], ['Anniversary', 'Anniversary'], ['Festival', 'Festival'], ['Wedding', 'Wedding'], ['Thank you', 'Thank you'], ['Corporate gift', 'Corporate gift'], ['Just because', 'Just because']]) +
    sel('type', 'Chocolate preference', [['', 'No preference'], ['dark', 'Dark'], ['milk', 'Milk'], ['white', 'White']]) +
    sel('personal', 'Personalised chocolates?', [['no', 'No'], ['yes', 'Yes']]) + sel('flowers', 'Flowers from a local flower shop?', [['no', 'No'], ['yes', 'Yes, I am interested']]) + sel('msg', 'A gift message?', [['no', 'No'], ['yes', 'Yes']]) +
    '<label>Quantity<input name="qty" type="number" min="1" max="9999" value="1"></label><button class="btn btn-gold" type="submit">Show gift ideas</button>';
  var out = el('div', 'gift-out'); out.setAttribute('role', 'region'); out.setAttribute('aria-label', 'Gift ideas'); root.appendChild(f); root.appendChild(out);
  f.addEventListener('submit', function (e) {
    e.preventDefault(); var d = new FormData(f); Object.keys(a).forEach(function (k) { a[k] = d.get(k) || a[k]; }); a.qty = Math.max(1, Math.min(9999, parseInt(a.qty, 10) || 1));
    out.textContent = ''; var notes = [];
    var pool = P.filter(function (p) { return (p.cat === 'gift' || p.cat === 'pre') && p.status !== 'soon'; });
    if (a.personal === 'yes') { var pe = P.filter(function (p) { return /personali|secret message|say it/i.test(p.name); }); pool = pe.concat(pool.filter(function (p) { return pe.indexOf(p) < 0; })); }
    if (a.type) { var any = P.some(function (p) { return p.types && p.types.length; }); if (any) pool = pool.filter(function (p) { return p.types.indexOf(a.type) > -1; }); else notes.push('Dark, milk and white options are not confirmed per product yet, so I could not filter by ' + a.type + '. The team confirms what is possible.'); }
    var top = pool.slice(0, 3);
    out.appendChild(el('h2', '', 'Gift ideas' + (a.who ? ' for ' + a.who : '') + (a.occasion ? ': ' + a.occasion : '')));
    if (!top.length) out.appendChild(el('p', 'callout', 'I could not find a confirmed match for all of that. The team may be able to suggest something.'));
    var list = el('div', 'list'); top.forEach(function (p) {
      var c = el('article', 'item'); c.appendChild(el('span', 'status s-' + p.status, p.label)); c.appendChild(el('h3', '', p.name)); c.appendChild(el('p', '', p.desc));
      var r = el('div', 'row'), l = el('a', 'more', 'Explore'); l.href = p.href; r.appendChild(l); c.appendChild(r); list.appendChild(c);
    }); out.appendChild(list);
    var ex = el('div', 'callout'); ex.appendChild(el('h2', '', 'Also consider'));
    var ul = el('ul', 'ask'); (S.box_styles || []).forEach(function (b) { ul.appendChild(el('li', '', 'Gift box: ' + b.name + ' (the team confirms availability)')); });
    if (a.flowers === 'yes') ul.appendChild(el('li', '', 'Local Store Flowers: pick a flower style in the Design Studio to preview it with your chocolate. Final flowers depend on local availability.'));
    if (a.msg === 'yes') { var li = el('li', '', 'A gift message: '), ma = el('a', '', 'write one with the message generator'); ma.href = 'messages.html'; li.appendChild(ma); ul.appendChild(li); }
    ex.appendChild(ul); out.appendChild(ex); notes.forEach(function (n) { out.appendChild(el('p', 'note', n)); });
    var acts = el('div', 'actions'), cu = el('a', 'btn btn-gold', 'Customize this gift'); cu.href = 'studio.html'; cu.addEventListener('click', function () { try { sessionStorage.setItem('mqSeed', JSON.stringify({ occasion: a.occasion, flowerWanted: a.flowers === 'yes' ? 'flowers' : 'none', flower: a.flowers === 'yes' && S.flowers ? S.flowers[0].id : '', qty: a.qty })); } catch (x) { } });
    acts.appendChild(cu); out.appendChild(acts);
    var eq = el('div', 'callout'); eq.appendChild(el('h2', '', 'Send an enquiry')); var bx = el('div'); eq.appendChild(bx); out.appendChild(eq);
    X.enquiryForm(bx, 'Gift enquiry. For: ' + (a.who || 'not said') + '. Occasion: ' + (a.occasion || 'not said') + '.  Chocolate type: ' + (a.type || 'no preference') + '. Personalised: ' + a.personal + '. Flowers: ' + a.flowers + '. Message: ' + a.msg + '. Quantity: ' + a.qty + '.' + (top.length ? ' Ideas viewed: ' + top.map(function (p) { return p.name; }).join(', ') + '.' : ''));
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
