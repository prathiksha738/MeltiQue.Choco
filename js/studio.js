/* MeltiQue Chocoland Design Studio.
   Live SVG preview -> PNG export -> optional submission to the configured API.
   Options come from window.MQ_STUDIO (built from STUDIO in _build/build.py). Nothing is promised that the
   owner has not confirmed: statuses are shown on every option, and "sent" appears only when the API
   answers {ok:true} after storing the design. Name/contact are never kept in browser storage. */
(function () {
  'use strict';
  var S = window.MQ_STUDIO || {}, C = window.MQ || {}, root = document.getElementById('studio');
  if (!root) return;
  /* missing configuration must never break the studio: fall back to sensible defaults */
  var DEF = { shapes: [{ id: 'bar', name: 'Chocolate Bar', status: 'standard', max: 24, lines: 2, types: [] }, { id: 'heart', name: 'Heart', status: 'standard', max: 12, lines: 2, types: [] }, { id: 'round', name: 'Round', status: 'standard', max: 16, lines: 2, types: [] }],
    text_styles: [{ id: 'serif', name: 'Classic serif' }], decorations: [], box_styles: [{ id: 'classic', name: 'Classic box' }], colours: [{ id: 'espresso', name: 'Espresso', hex: '#3a2118' }], flowers: [], occasions: [] };
  Object.keys(DEF).forEach(function (k) { if (!S[k] || !S[k].length) S[k] = DEF[k]; });
  S.shapes.forEach(function (x) { x.types = x.types || []; x.max = x.max || 16; x.lines = x.lines || 1; });
  var API = C.api || '';
  var doc = document;
  function h(tag, attrs, kids) {
    var n = doc.createElement(tag); attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k]; else if (k === 'text') n.textContent = attrs[k]; else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]); else if (attrs[k] !== false && attrs[k] != null) n.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    });
    [].concat(kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === 'string' ? doc.createTextNode(c) : c); });
    return n;
  }
  var TYPES = { dark: { name: 'Dark chocolate', c1: '#5a3020', c2: '#2a140d', ink: '#e8c981' }, milk: { name: 'Milk chocolate', c1: '#a8703f', c2: '#6f4125', ink: '#f6e3b4' }, white: { name: 'White chocolate', c1: '#fbf1d8', c2: '#e6d5ae', ink: '#6b4430' } };
  var FONT = { serif: "Georgia,'Times New Roman',serif", script: "'Brush Script MT','Segoe Script','Snell Roundhand',cursive", bold: "'Arial Black',Arial,sans-serif" };
  var ST = { standard: 'Standard design option', custom: 'Custom shape: needs manual confirmation', confirmed: '', enquire: '', concept: 'Custom shape: needs manual confirmation' };
  var st = { shape: S.shapes[0].id, type: 'dark', text: '', style: 'serif', decor: [], colour: S.colours[0].id, box: 'classic', flowerWanted: 'none', flower: '', giftMsg: '', qty: 1, occasion: '', notes: '', name: '', contact: '', consent: false };
  var step = 0, last = null, busy = false;

  /* ---- load state: saved studio, product link, seeds from the guide / message generator ---- */
  try { var sv = JSON.parse(sessionStorage.getItem('mqStudio') || 'null'); if (sv) Object.keys(sv).forEach(function (k) { if (k in st) st[k] = sv[k]; }); } catch (e) { }
  try {
    var p = new URLSearchParams(location.search).get('product');
    var map = { 'Chocolate Bars': 'bar', 'Donut-shaped Chocolates': 'donut', 'Piku Chocolate': 'paw', 'Secret Message Chocolate': 'round', 'Say It with Chocolate': 'round' };
    if (p && map[p]) st.shape = map[p];
    var seed = JSON.parse(sessionStorage.getItem('mqSeed') || 'null');
    if (seed) { Object.keys(seed).forEach(function (k) { if (k in st) st[k] = seed[k]; }); sessionStorage.removeItem('mqSeed'); }
    var mg = sessionStorage.getItem('mqMsg'); if (mg) { st.giftMsg = mg.slice(0, 160); sessionStorage.removeItem('mqMsg'); }
  } catch (e) { }
  function shapeOf() { return S.shapes.filter(function (s) { return s.id === st.shape; })[0] || S.shapes[0]; }
  function save() { try { var c = {}; Object.keys(st).forEach(function (k) { if (k !== 'name' && k !== 'contact' && k !== 'consent') c[k] = st[k]; }); sessionStorage.setItem('mqStudio', JSON.stringify(c)); } catch (e) { } }
  function clip(sh) { st.text = st.text.slice(0, sh.max); }
  clip(shapeOf());

  /* ---- preview ---- */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function rnd(seedN) { var x = seedN; return function () { x = (x * 9301 + 49297) % 233280; return x / 233280; }; }
  function shapeEl(id, extra) {
    switch (id) {
      case 'heart': return '<path d="M0 78C-165 -22 -100 -120 0 -52C100 -120 165 -22 0 78Z" ' + extra + '/>';
      case 'square': return '<rect x="-112" y="-112" width="224" height="224" rx="20" ' + extra + '/>';
      case 'nameplate': return '<rect x="-165" y="-62" width="330" height="124" rx="62" ' + extra + '/>';
      case 'star': return '<path d="M0-122L33-40 120-34 52 22 74 108 0 60-74 108-52 22-120-34-33-40Z" stroke-linejoin="round" ' + extra + '/>';
      case 'flower': return '<g ' + extra + '><ellipse cy="-70" rx="46" ry="62"/><ellipse cy="70" rx="46" ry="62"/><ellipse cx="-70" rx="62" ry="46"/><ellipse cx="70" rx="62" ry="46"/><ellipse transform="rotate(45)" cy="-70" rx="40" ry="54"/><ellipse transform="rotate(45)" cy="70" rx="40" ry="54"/><ellipse transform="rotate(45)" cx="-70" rx="54" ry="40"/><ellipse transform="rotate(45)" cx="70" rx="54" ry="40"/><circle r="60"/></g>';
      case 'celebration': return '<path d="M0-118l26 22 34-10 12 33 35 3-7 35 29 21-23 28 12 33-34 11-6 35-35-5-21 29-27-20-31 17-16-31-35-1 3-35-29-21 20-28-8-34 34-10 5-35 35 6Z" ' + extra + '/>';
      case 'round': return '<circle r="108" ' + extra + '/>';
      case 'donut': return '<path fill-rule="evenodd" d="M-112 0a112 112 0 1 0 224 0a112 112 0 1 0 -224 0ZM-38 0a38 38 0 1 1 76 0a38 38 0 1 1 -76 0Z" ' + extra + '/>';
      case 'paw': return '<g ' + extra + '><ellipse cx="0" cy="34" rx="76" ry="58"/><ellipse cx="-92" cy="-26" rx="27" ry="36" transform="rotate(-24 -92 -26)"/><ellipse cx="-36" cy="-78" rx="28" ry="38" transform="rotate(-8 -36 -78)"/><ellipse cx="36" cy="-78" rx="28" ry="38" transform="rotate(8 36 -78)"/><ellipse cx="92" cy="-26" rx="27" ry="36" transform="rotate(24 92 -26)"/></g>';
      default: return '<rect x="-150" y="-88" width="300" height="176" rx="16" ' + extra + '/>';
    }
  }
  function wrap(s, n) { var w = String(s).split(/\s+/), out = [], cur = ''; w.forEach(function (x) { if ((cur + ' ' + x).trim().length > n && cur) { out.push(cur); cur = x; } else cur = (cur + ' ' + x).trim(); }); if (cur) out.push(cur); return out.slice(0, 4); }
  function buildSVG(w, hgt) {
    var sh = shapeOf(), t = TYPES[st.type], col = S.colours.filter(function (c) { return c.id === st.colour; })[0] || S.colours[0], r = rnd(7), o = [];
    var lines = st.text ? st.text.split('\n').slice(0, sh.lines) : [];
    o.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"' + (w ? ' width="' + w + '" height="' + hgt + '"' : ' role="img" aria-label="Live preview of your chocolate design"') + '>');
    o.push('<defs><radialGradient id="bg"><stop offset="0" stop-color="#4a2a1d"/><stop offset="1" stop-color="#150b07"/></radialGradient>' +
      '<linearGradient id="ch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + t.c1 + '"/><stop offset="1" stop-color="' + t.c2 + '"/></linearGradient>' +
      '<linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<filter id="sd" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#000" flood-opacity=".55"/></filter>' +
      '<clipPath id="cp"><g>' + shapeEl(sh.id, '') + '</g></clipPath></defs>');
    o.push('<rect width="800" height="600" fill="url(#bg)"/>');
    /* box */
    if (st.box) {
      var bx = col.hex;
      o.push('<g filter="url(#sd)"><rect x="50" y="62" width="700" height="470" rx="26" fill="' + bx + '"/></g><rect x="74" y="86" width="652" height="422" rx="18" fill="#000" opacity=".28"/><rect x="74" y="86" width="652" height="422" rx="18" fill="none" stroke="#d6ae65" stroke-width="2" opacity=".7"/>');
      if (st.box === 'window') o.push('<rect x="96" y="104" width="608" height="386" rx="40" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3"/><path d="M120 130L330 110" stroke="#fff" stroke-opacity=".3" stroke-width="6" stroke-linecap="round"/>');
      if (st.box === 'ribbon') o.push('<rect x="380" y="62" width="40" height="470" fill="#d6ae65" opacity=".92"/><rect x="50" y="280" width="700" height="40" fill="#d6ae65" opacity=".0"/>');
    }
    /* chocolate */
    o.push('<g transform="translate(400 300)"><g filter="url(#sd)">' + shapeEl(sh.id, 'fill="url(#ch)"') + '</g>');
    if (sh.id === 'bar') o.push('<g stroke="#000" stroke-opacity=".28" stroke-width="3"><path d="M-75 -88V88M0 -88V88M75 -88V88M-150 0H150"/></g><g stroke="#fff" stroke-opacity=".12" stroke-width="2"><path d="M-72 -88V88M3 -88V88M78 -88V88M-150 3H150"/></g>');
    o.push(shapeEl(sh.id, 'fill="url(#gl)"'));
    o.push('<g clip-path="url(#cp)">');
    if (st.decor.indexOf('gold') > -1) for (var i = 0; i < 46; i++) o.push('<circle cx="' + ((r() - .5) * 280).toFixed(0) + '" cy="' + ((r() - .5) * 170).toFixed(0) + '" r="' + (1 + r() * 2.6).toFixed(1) + '" fill="#e8c981" opacity="' + (.5 + r() * .5).toFixed(2) + '"/>');
    if (st.decor.indexOf('sprinkles') > -1) { var cs = ['#f2a29a', '#f6e3b4', '#9ec9a3', '#a9c4ea']; for (var j = 0; j < 30; j++) o.push('<rect x="' + ((r() - .5) * 270).toFixed(0) + '" y="' + ((r() - .5) * 160).toFixed(0) + '" width="14" height="4" rx="2" fill="' + cs[j % 4] + '" transform="rotate(' + (r() * 180).toFixed(0) + ')"/>'); }
    if (st.decor.indexOf('stars') > -1) for (var k = 0; k < 7; k++) o.push('<path transform="translate(' + ((r() - .5) * 250).toFixed(0) + ' ' + ((r() - .5) * 150).toFixed(0) + ') scale(' + (.7 + r() * .6).toFixed(2) + ')" d="M0-9L2.6-3 9-2.8 4 1.4 5.700 8 0 4.400-5.700 8-4 1.400-9-2.800-2.600-3Z" fill="#e8c981"/>');
    o.push('</g>');
    if (st.decor.indexOf('border') > -1) o.push(shapeEl(sh.id, 'transform="scale(.88)" fill="none" stroke="#e8c981" stroke-width="2.4" stroke-opacity=".85"'));
    /* text */
    if (lines.length) {
      var longest = Math.max.apply(null, lines.map(function (l) { return l.length; })), width = ({ bar: 250, nameplate: 290, square: 190, paw: 100, donut: 130, star: 100, flower: 120, celebration: 140 })[sh.id] || 150;
      var fs = Math.max(14, Math.min(st.style === 'bold' ? 38 : 46, width / (longest * (st.style === 'bold' ? .62 : .5)))), y0 = (sh.id === 'paw' ? 40 : 0) - (lines.length - 1) * fs * .55 + fs * .3;
      var ts = lines.map(function (l, ix) { return '<tspan x="0" y="' + (y0 + ix * fs * 1.1).toFixed(1) + '">' + esc(l) + '</tspan>'; }).join('');
      var fam = 'font-family="' + FONT[st.style].replace(/"/g, "'") + '" font-size="' + fs.toFixed(1) + '" text-anchor="middle" ' + (st.style === 'serif' ? 'font-style="italic" ' : '') + (st.style === 'bold' ? 'font-weight="900" ' : '');
      o.push('<text ' + fam + 'fill="#000" opacity=".35" transform="translate(1.500 2)">' + ts + '</text><text ' + fam + 'fill="' + t.ink + '">' + ts + '</text>');
    }
    o.push('</g>');
    /* flowers: illustrative preview only (final flowers depend on local availability) */
    if (st.flowerWanted === 'flowers' && st.flower) {
      var FS = { rose: { c: ['#b3263a', '#d1405a'], k: 'rose' }, tulip: { c: ['#e5557a', '#f08aa5', '#f6c1cf'], k: 'tulip' }, sunflower: { c: ['#f2b705'], k: 'sun' }, daisy: { c: ['#ffffff'], k: 'daisy' }, mixed: { c: ['#e58fb0', '#f2c14e', '#a58de0', '#d1405a'], k: 'rose' }, premium: { c: ['#f6e3d4', '#d1405a', '#e8c981', '#a58de0'], k: 'rose' }, pink: { c: ['#f5a3c0', '#f9c9da', '#e8789f'], k: 'rose' } };
      var fd = FS[st.flower] || FS.rose, big = st.flower === 'premium' ? 1.2 : 1, pos = [[-4, -6], [-50, 32], [52, 32], [-22, -40], [26, -40]];
      o.push('<g transform="translate(650 400) scale(' + big + ')"><path d="M-30 110L-4 0M0 112V0M30 110L6 0M-10 112L-50 40M12 112L52 40" stroke="#3f6b45" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-40 70q-22-8-26-26q22 0 26 26ZM40 70q22-8 26-26q-22 0-26 26Z" fill="#3f6b45"/>');
      pos.forEach(function (b, ix) {
        var c = fd.c[ix % fd.c.length], g = '<g transform="translate(' + b[0] + ' ' + b[1] + ')">';
        if (fd.k === 'tulip') g += '<path d="M-20 6Q-24-28 -8-30Q0-20 0-20Q0-20 8-30Q24-28 20 6Q10 24 0 24Q-10 24-20 6Z" fill="' + c + '"/><path d="M-6 -22Q0 6 0 22M6 -22Q0 6 0 22" stroke="#000" stroke-opacity=".15" fill="none"/>';
        else if (fd.k === 'sun') { for (var a = 0; a < 14; a++) g += '<ellipse cx="0" cy="-30" rx="6.500" ry="15" fill="#f2b705" transform="rotate(' + a * 25.7 + ')"/>'; g += '<circle r="16" fill="#5a3418"/><circle r="9" fill="#3a2010"/>'; }
        else if (fd.k === 'daisy') { for (var d = 0; d < 12; d++) g += '<ellipse cx="0" cy="-22" rx="5.500" ry="13" fill="#fff" stroke="#00000022" transform="rotate(' + d * 30 + ')"/>'; g += '<circle r="9" fill="#f2c14e"/>'; }
        else g += '<circle r="28" fill="' + c + '"/><circle r="19" fill="#000" opacity=".12"/><circle r="11" fill="' + c + '"/><circle r="4.500" fill="#000" opacity=".2"/>';
        o.push(g + '</g>');
      });
      o.push('<path d="M-32 100Q0 70 32 100L20 130H-20Z" fill="#f6ebdd" opacity=".95"/></g><text x="760" y="556" fill="#f6ebdd" font-size="12" text-anchor="end" font-family="Arial,sans-serif" opacity=".85">Flowers: illustrative preview, final flowers depend on local availability</text>');
    }
    /* gift card */
    if (st.giftMsg) {
      var ls = wrap(st.giftMsg, 22);
      o.push('<g transform="translate(160 440) rotate(-4)"><rect x="-95" y="-52" width="190" height="104" rx="8" fill="#f6ebdd"/><rect x="-95" y="-52" width="190" height="8" fill="#d6ae65"/><text x="-84" y="-30" font-size="10" fill="#8a6a3a" font-family="Arial,sans-serif" letter-spacing="1.500">GIFT MESSAGE</text>' +
        ls.map(function (l, ix) { return '<text x="-84" y="' + (-10 + ix * 17) + '" font-size="13.500" font-style="italic" fill="#3a2118" font-family="Georgia,serif">' + esc(l) + '</text>'; }).join('') + '</g>');
    }
    o.push('<text x="400" y="578" fill="#d6ae65" font-size="13" text-anchor="middle" font-family="Arial,sans-serif" opacity=".85">MeltiQue Chocoland · design preview · a reference, not a guarantee of the finished product</text></svg>');
    return o.join('');
  }
  var pv = h('div', { class: 'st-pv' });
  function draw() { var v = buildSVG(); pv.innerHTML = v; save(); try { sessionStorage.setItem('mqPreview', v); } catch (e) { } }
  function png() {
    return new Promise(function (res, rej) {
      var img = new Image(), url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(buildSVG(1600, 1200));
      img.onload = function () { try { var c = doc.createElement('canvas'); c.width = 1600; c.height = 1200; c.getContext('2d').drawImage(img, 0, 0, 1600, 1200); res(c.toDataURL('image/png')); } catch (e) { rej(e); } };
      img.onerror = function () { rej(new Error('render')); }; img.src = url;
    });
  }

  /* ---- controls ---- */
  function opt(name, checked, onchange, label, sub, disabled) {
    var i = h('input', { type: 'radio', name: name, checked: !!checked, disabled: !!disabled, onchange: onchange });
    return h('label', { class: 'st-opt' + (disabled ? ' off' : '') }, [i, h('span', { text: label }), sub ? h('small', { text: sub }) : null]);
  }
  function chk(checked, onchange, label, sub) { return h('label', { class: 'st-opt' }, [h('input', { type: 'checkbox', checked: !!checked, onchange: onchange }), h('span', { text: label }), sub ? h('small', { text: sub }) : null]); }
  function fs(title, hint, kids, cls) { return h('fieldset', { class: 'st-fs' + (cls ? ' ' + cls : '') }, [h('legend', { text: title }), hint ? h('p', { class: 'small', text: hint }) : null].concat(kids)); }
  var TITLES = ['1. Shape', '2. Chocolate type', '3. Personalise', '4. Flowers', '5. Gift message', '6. Preview & send'];
  function stepBody() {
    var sh = shapeOf(), box = h('div');
    if (step === 0) {
      box.appendChild(fs('Choose a shape', 'Standard design options can be previewed right away. Custom shapes need manual confirmation. Every design is subject to production feasibility.', S.shapes.map(function (s) {
        return opt('shape', st.shape === s.id, function () { st.shape = s.id; clip(s); if (s.types.length && s.types.indexOf(st.type) < 0) st.type = s.types[0]; draw(); render(); }, s.name, ST[s.status] || '');
      })));
    }
    if (step === 1) {
      var conf = sh.types && sh.types.length;
      box.appendChild(fs('Dark, milk or white?', conf ? 'These types are confirmed for this shape.' : 'Pick the chocolate you would like. It is a requested preference that the business will review. Not every type is available for every shape.',
        Object.keys(TYPES).map(function (k) {
          var dis = conf && sh.types.indexOf(k) < 0;
          return opt('type', st.type === k, function () { st.type = k; draw(); }, TYPES[k].name, dis ? 'Not available for this shape' : (conf ? 'Confirmed' : 'Requested preference'), dis);
        })));
    }
    if (step === 2) {
      var ta = h('textarea', { id: 'stText', rows: sh.lines, maxlength: sh.max, 'aria-describedby': 'stCnt' });
      ta.value = st.text; var cnt = h('p', { class: 'small', id: 'stCnt', role: 'status' }), warn = h('p', { class: 'st-warn', role: 'status' });
      function upd() {
        var v = ta.value.split('\n').slice(0, sh.lines).join('\n'); if (v !== ta.value) ta.value = v; st.text = ta.value; cnt.textContent = st.text.length + ' / ' + sh.max + ' characters, up to ' + sh.lines + ' line' + (sh.lines > 1 ? 's' : '');
        warn.textContent = st.text.length > sh.max * .75 ? 'This is a lot of text for this shape. Letters may be small or unclear when made. Shorter is safer.' : ''; draw();
      }
      ta.addEventListener('input', upd); upd();
      box.appendChild(fs('Name, initials or short message', null, [h('label', { for: 'stText', class: 'sr', text: 'Text on the chocolate' }), ta, cnt, warn]));
      box.appendChild(fs('Text style', null, S.text_styles.map(function (x) { return opt('tstyle', st.style === x.id, function () { st.style = x.id; draw(); }, x.name); })));
      box.appendChild(fs('Decorations', 'Digital options. The business reviews what can be made.', S.decorations.map(function (d) {
        return chk(st.decor.indexOf(d.id) > -1, function (e) { st.decor = st.decor.filter(function (x) { return x !== d.id; }); if (e.target.checked) st.decor.push(d.id); draw(); }, d.name);
      })));
      box.appendChild(fs('Gift box', null, [opt('box', !st.box, function () { st.box = ''; draw(); }, 'No box')].concat(S.box_styles.map(function (b) { return opt('box', st.box === b.id, function () { st.box = b.id; draw(); }, b.name); }))));
      box.appendChild(fs('Packaging colour', 'A preview colour. The business reviews what is available.', S.colours.map(function (c) { return opt('col', st.colour === c.id, function () { st.colour = c.id; draw(); }, c.name); })));
    }
    if (step === 3) {
      box.appendChild(fs('Local Store Flowers \uD83C\uDF38\uD83C\uDF3A\uD83C\uDF3B\uD83C\uDF39\uD83C\uDF37\uD83C\uDF3C\uD83D\uDC90 Inc.', 'Flower and bouquet styles sourced through local flower shops. These are requested styles shown as illustrations, not a promise of stock: the final flowers depend on local availability.',
        [opt('fw', st.flowerWanted === 'none', function () { st.flowerWanted = 'none'; st.flower = ''; draw(); render(); }, 'Chocolate only'), opt('fw', st.flowerWanted === 'flowers', function () { st.flowerWanted = 'flowers'; if (!st.flower && S.flowers.length) st.flower = S.flowers[0].id; draw(); render(); }, 'Chocolate and flowers')], 'fw'));
      if (st.flowerWanted === 'flowers') box.appendChild(fs('Choose a flower style', null, S.flowers.map(function (f) { return opt('fl', st.flower === f.id, function () { st.flower = f.id; draw(); }, (f.emoji ? f.emoji + ' ' : '') + f.name, 'Requested style'); })));
    }
    if (step === 4) {
      var gm = h('textarea', { id: 'stGm', rows: 3, maxlength: 160 }); gm.value = st.giftMsg;
      var gc = h('p', { class: 'small', role: 'status' }); function gu() { st.giftMsg = gm.value; gc.textContent = gm.value.length + ' / 160 characters'; draw(); } gm.addEventListener('input', gu); gu();
      box.appendChild(fs('Gift card message (optional)', 'Nothing is printed until the team confirms your order.', [h('label', { for: 'stGm', class: 'sr', text: 'Gift message' }), gm, gc,
        h('a', { class: 'btn btn-line btn-sm', href: 'messages.html', text: 'Help me write one' })]));
    }
    if (step === 5) box.appendChild(finalStep());
    return box;
  }
  function summary() {
    var sh = shapeOf(), rows = [['Shape', sh.name + (ST[sh.status] ? ' (' + ST[sh.status].toLowerCase() + ')' : '')], ['Chocolate type', TYPES[st.type].name + ((sh.types || []).length ? '' : ' (preference, to be confirmed)')], ['Text', st.text.replace(/\n/g, ' / ') || 'none'], ['Style', st.style],
      ['Decorations', st.decor.join(', ') || 'none'], ['Box', st.box || 'none'], ['Packaging colour', st.colour], ['Flowers', st.flowerWanted === 'flowers' ? ((S.flowers.filter(function (f) { return f.id === st.flower; })[0] || {}).name || '') + ' (requested style, subject to local availability)' : 'chocolate only'], ['Gift message', st.giftMsg || 'none']];
    var dl = h('dl', { class: 'st-sum' }); rows.forEach(function (r) { dl.appendChild(h('dt', { text: r[0] })); dl.appendChild(h('dd', { text: r[1] })); }); return dl;
  }
  var out = h('div', { class: 'st-out', role: 'status', 'aria-live': 'polite' });
  function say(msg, cls) { out.className = 'st-out ' + (cls || ''); out.textContent = msg; }
  function finalStep() {
    var w = h('div'); w.appendChild(h('p', { class: 'callout-s', text: 'The preview is a design reference. The finished handmade product may differ in details, and every design is subject to production feasibility.' })); w.appendChild(summary());
    var f = h('form', { class: 'st-form', novalidate: true });
    function fld(id, label, attrs, tag) { var i = h(tag || 'input', Object.assign({ id: id }, attrs)); return h('label', { for: id }, [label, i]); }
    var qty = fld('stQ', 'Quantity', { type: 'number', min: 1, max: 9999, value: st.qty });
    var occ = h('select', { id: 'stO' }, [h('option', { value: '', text: 'Occasion (optional)' })].concat(S.occasions.map(function (o) { var e = h('option', { value: o, text: o }); if (st.occasion === o) e.selected = true; return e; })));
    var nm = fld('stN', 'Your name', { maxlength: 60, autocomplete: 'name' }), ct = fld('stC', 'Phone or email, so the team can reply', { maxlength: 80, autocomplete: 'off' }), nt = fld('stNt', 'Extra instructions (optional)', { maxlength: 800, rows: 3 }, 'textarea');
    var hp = h('div', { class: 'hp', 'aria-hidden': 'true' }, [h('input', { id: 'stH', tabindex: '-1', autocomplete: 'off' })]);
    var cons = h('label', { class: 'st-opt cons' }, [h('input', { type: 'checkbox', id: 'stK' }), h('span', {}, ['I agree that MeltiQue Chocoland may receive my name, contact, and this design so they can reply. See the ', h('a', { href: 'privacy.html', target: '_blank', rel: 'noopener', text: 'Privacy page' }), '.'])]);
    qty.querySelector('input').addEventListener('input', function (e) { st.qty = Math.max(1, Math.min(9999, parseInt(e.target.value, 10) || 1)); });
    occ.addEventListener('change', function () { st.occasion = occ.value; });
    var dlb = h('button', { class: 'btn btn-line', type: 'button', text: 'Download preview image', onclick: function () { png().then(function (u) { var a = h('a', { href: u, download: 'meltique-design.png' }); doc.body.appendChild(a); a.click(); a.remove(); say('Image downloaded.', 'ok'); }).catch(function () { say('Could not create the image on this device.', 'err'); }); } });
    var ub = h('a', { class: 'btn btn-line', href: 'unbox.html', text: 'Open virtual unboxing', onclick: save });
    var send = h('button', { class: 'btn btn-gold', type: 'submit', text: 'Send My Design to MeltiQue' });
    f.appendChild(qty); f.appendChild(h('label', { for: 'stO' }, ['Occasion', occ])); f.appendChild(nm); if (API) f.appendChild(ct); f.appendChild(nt); if (API) { f.appendChild(hp); f.appendChild(cons); }
    f.appendChild(h('div', { class: 'actions' }, [send, dlb, ub]));
    if (!API) f.appendChild(h('p', { class: 'small', text: 'Pressing the button prepares your design image and a ready-to-send message. You then send it to us yourself on WhatsApp, so nothing leaves your device until you do.' }));
    f.addEventListener('submit', function (e) {
      e.preventDefault(); if (busy) return;
      var d = { name: nm.querySelector('input').value.trim(), contact: ct.querySelector('input').value.trim(), notes: nt.querySelector('textarea').value.trim(), hp: hp.querySelector('input').value };
      if (!API) { localSend(d); return; }
      if (!d.name) { say('Please enter your name.', 'err'); return; }
      if (!(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.contact) || (/^[+\d][\d\s()-]{7,18}$/.test(d.contact) && d.contact.replace(/\D/g, '').length >= 8))) { say('Please enter a valid phone number or email.', 'err'); return; }
      if (!f.querySelector('#stK').checked) { say('Please tick the consent box so we can send your design.', 'err'); return; }
      busy = true; send.disabled = true; say('Preparing and sending your design…', 'wait');
      var sh = shapeOf();
      png().then(function (img) {
        var ctl = window.AbortController ? new AbortController() : null, tm = setTimeout(function () { if (ctl) ctl.abort(); }, 25000);
        return fetch(API + '/design', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl ? ctl.signal : undefined, body: JSON.stringify({
          name: d.name, contact: d.contact, notes: d.notes, hp: d.hp, consent: true, image: img, shape: sh.name, shapeStatus: sh.status, type: st.type, text: st.text.replace(/\n/g, ' / '), textStyle: st.style, decorations: st.decor, packagingColour: st.colour, boxStyle: st.box,
          flower: st.flowerWanted === 'flowers' ? st.flower : '', flowerWanted: st.flowerWanted, giftMessage: st.giftMsg, quantity: st.qty, occasion: st.occasion }) })
          .then(function (r) { clearTimeout(tm); return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.ok === true, id: j.id }; }); });
      }).then(function (r) {
        busy = false; send.disabled = false;
        if (r.ok) { last = r.id; say('Your personalized chocolate design has been submitted to MeltiQue Chocoland! We will review your selections and confirm feasibility and availability before production. Design reference: ' + r.id, 'ok'); try { sessionStorage.removeItem('mqStudio'); } catch (x) { } f.reset(); }
        else say('Sorry, we could not confirm that your design was submitted, so please treat it as not sent. You can try again, or download the image and send it on WhatsApp or email.', 'err');
      }).catch(function () { busy = false; send.disabled = false; say('Sorry, we could not confirm that your design was submitted, so please treat it as not sent. You can try again, or download the image and send it on WhatsApp or email.', 'err'); });
    });
    w.appendChild(f); w.appendChild(out); return w;
  }

  /* ---- no server needed: prepare the image + message, the customer sends it on WhatsApp / email herself ---- */
  function summaryText(ref, d) {
    var sh = shapeOf(), fl = st.flowerWanted === 'flowers' ? (S.flowers.filter(function (f) { return f.id === st.flower; })[0] || {}).name : 'none';
    return ['MeltiQue Chocoland: my chocolate design', 'Design reference: ' + ref, d.name ? 'Name: ' + d.name : '', 'Shape: ' + sh.name, 'Chocolate type (requested): ' + TYPES[st.type].name, 'Text: ' + (st.text.replace(/\n/g, ' / ') || 'none'), 'Text style: ' + st.style,
      'Decorations: ' + (st.decor.join(', ') || 'none'), 'Box: ' + (st.box || 'none'), 'Packaging colour: ' + st.colour, 'Flowers (requested style): ' + (fl || 'none'), 'Gift message: ' + (st.giftMsg || 'none'), 'Quantity: ' + st.qty,
      st.occasion ? 'Occasion: ' + st.occasion : '', d.notes ? 'Notes: ' + d.notes : '', '(The design image is attached.)'].filter(Boolean).join('\n');
  }
  function localSend(d) {
    var ref = 'MQ-' + Math.random().toString(36).slice(2, 8).toUpperCase(), text = summaryText(ref, d);
    say('Preparing your design…', 'wait');
    png().then(function (u) {
      var a = h('a', { href: u, download: 'meltique-design-' + ref + '.png' }); doc.body.appendChild(a); a.click(); a.remove();
      out.className = 'st-out ok'; out.textContent = '';
      out.appendChild(h('p', { text: 'Your design image (' + ref + ') has been saved to your device and your message is ready. It has NOT been sent yet: tap WhatsApp, attach the saved image, and press send.' }));
      var row = h('div', { class: 'actions' });
      var wa = h('a', { class: 'btn btn-gold btn-sm', target: '_blank', rel: 'noopener', href: 'https://wa.me/' + String(C.whatsappNumber || '').replace(/\D/g, '') + '?text=' + encodeURIComponent(text), text: 'Open WhatsApp with my message' });
      var em = h('a', { class: 'btn btn-line btn-sm', href: 'mailto:MeltiQu.choco@gmail.com?subject=' + encodeURIComponent('Chocolate design ' + ref) + '&body=' + encodeURIComponent(text), text: 'Send by email' });
      row.appendChild(wa); row.appendChild(em);
      fetch(u).then(function (r) { return r.blob(); }).then(function (b) {
        var file = new File([b], 'meltique-design-' + ref + '.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) row.appendChild(h('button', { class: 'btn btn-line btn-sm', type: 'button', text: 'Share image and message', onclick: function () { navigator.share({ files: [file], text: text }).catch(function () { }); } }));
      }).catch(function () { });
      out.appendChild(row); out.appendChild(h('p', { class: 'small', text: 'We review every design and confirm feasibility and availability before anything is made.' }));
    }).catch(function () { say('Could not create the image on this device. Please try another browser.', 'err'); });
  }

  /* ---- layout ---- */
  var left = h('div', { class: 'st-ctl' });
  function render() {
    left.textContent = '';
    var nav = h('ol', { class: 'st-steps', 'aria-label': 'Steps' }); TITLES.forEach(function (t, i) { var li = h('li'); li.appendChild(h('button', { type: 'button', class: i === step ? 'on' : '', 'aria-current': i === step ? 'step' : false, text: t, onclick: function () { step = i; render(); } })); nav.appendChild(li); });
    left.appendChild(nav); left.appendChild(stepBody());
    var row = h('div', { class: 'actions' });
    if (step > 0) row.appendChild(h('button', { class: 'btn btn-line btn-sm', type: 'button', text: 'Back', onclick: function () { step--; render(); } }));
    if (step < TITLES.length - 1) row.appendChild(h('button', { class: 'btn btn-gold btn-sm', type: 'button', text: 'Next', onclick: function () { step++; render(); } }));
    left.appendChild(row);
  }
  root.appendChild(left); root.appendChild(h('div', { class: 'st-right' }, [pv, h('p', { class: 'small', text: 'Live preview. Shapes, colours and decorations are digital design options; the final design is subject to production feasibility.' })]));
  draw(); render();
  window.MQ_STUDIO_API = { png: png, state: function () { return JSON.parse(JSON.stringify(st)); }, svg: buildSVG };
})();
