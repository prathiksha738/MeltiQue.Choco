(function () {
  'use strict';
  var C = window.MQ || {};
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer:fine)').matches;
  var phone = function () { return window.matchMedia('(max-width: 640px)').matches; };
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }

  /* ---------- WhatsApp: apply the configured number ---------- */
  var num = C.whatsappNumber ? String(C.whatsappNumber).replace(/\D/g, '') : '';
  var waBase = num ? 'https://wa.me/' + num : 'https://wa.me/';
  $$('[data-wa]').forEach(function (a) { a.href = waBase + '?text=' + encodeURIComponent(a.getAttribute('data-wa')); });

  /* bulk enquiry form composes a WhatsApp message in the browser */
  var bf = $('#bulkForm'), bs = $('#bulkSend');
  if (bf && bs) {
    var build = function () {
      var v = function (id) { var e = $('#' + id); return e && e.value.trim() ? e.value.trim() : '(not given yet)'; };
      var t = 'Hi MeltiQue Chocoland! Bulk order enquiry.\nOccasion or event: ' + v('b-occ') + '\nApproximate quantity: ' + v('b-qty') +
        '\nPreferred products: ' + v('b-prod') + '\nRequired date: ' + v('b-date') + '\nCustomization needs: ' + v('b-cus');
      bs.href = waBase + '?text=' + encodeURIComponent(t);
    };
    bf.addEventListener('input', build); bf.addEventListener('submit', function (e) { e.preventDefault(); });
    build();
  }

  /* optional logo image */
  if (C.logoSrc) $$('[data-logo]').forEach(function (n) {
    var i = doc.createElement('img'); i.src = C.logoSrc; i.alt = 'MeltiQue Chocoland logo'; i.style.height = '38px'; i.style.width = 'auto'; n.replaceWith(i);
  });
  var yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- header ---------- */
  var nav = $('#nav');
  var always = !$('#hero');
  function onScroll() { nav.classList.toggle('solid', always || window.scrollY > 40); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- circular navigation ---------- */
  var ring = $('#ring'), ringBtn = $('#ringBtn'), ringClose = $('#ringClose'), stage = $('#ringStage'), list = $('#ringList');
  var rot = 0, rafR = 0, lastFocus = null, drag = null, moved = false, hovered = false;
  function spin() {
    rafR = requestAnimationFrame(spin);
    if (phone() || reduce || drag || hovered) return;
    rot += .05; list.style.setProperty('--rot', rot + 'deg');
  }
  function openRing(from) {
    if (!ring || !ring.hidden) return;
    lastFocus = doc.activeElement;
    var r = (from || ringBtn).getBoundingClientRect();
    ring.style.setProperty('--cx', (r.left + r.width / 2) + 'px'); ring.style.setProperty('--cy', (r.top + r.height / 2) + 'px');
    ring.hidden = false; ringBtn.setAttribute('aria-expanded', 'true'); doc.body.style.overflow = 'hidden';
    if (!reduce) { ring.classList.add('opening'); setTimeout(function () { ring.classList.remove('opening'); }, 850); }
    cancelAnimationFrame(rafR); spin();
    var first = $('a', list); if (first) first.focus({ preventScroll: true });
  }
  function closeRing(restore) {
    if (!ring || ring.hidden) return;
    var done = function () {
      ring.hidden = true; ring.classList.remove('closing'); doc.body.style.overflow = '';
      ringBtn.setAttribute('aria-expanded', 'false'); cancelAnimationFrame(rafR);
      if (restore !== false && lastFocus) lastFocus.focus({ preventScroll: true });
    };
    if (reduce) return done();
    ring.classList.add('closing'); setTimeout(done, 620);
  }
  if (ring && ringBtn) {
    ringBtn.addEventListener('click', function () { openRing(); });
    ringClose.addEventListener('click', function () { closeRing(); });
    var ex = $('#exploreRing');
    if (ex) ex.addEventListener('click', function (e) { e.preventDefault(); openRing(ex); });
    doc.addEventListener('keydown', function (e) {
      if (ring.hidden) return;
      if (e.key === 'Escape') { closeRing(); return; }
      if (e.key === 'Tab') {
        var f = $$('a,button', ring).filter(function (n) { return n.offsetParent !== null; });
        if (!f.length) return;
        var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && doc.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
    list.addEventListener('pointerenter', function () { hovered = true; });
    list.addEventListener('pointerleave', function () { hovered = false; });
    list.addEventListener('focusin', function () { hovered = true; });
    list.addEventListener('focusout', function () { hovered = false; });
    /* drag the ring to turn it (mouse and touch) */
    function ang(e) { var b = stage.getBoundingClientRect(); return Math.atan2(e.clientY - (b.top + b.height / 2), e.clientX - (b.left + b.width / 2)) * 180 / Math.PI; }
    stage.addEventListener('pointerdown', function (e) { if (phone()) return; drag = { a: ang(e), r: rot }; moved = false; });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return; var d = ang(e) - drag.a;
      if (Math.abs(d) > 2) moved = true;
      rot = drag.r + d; list.style.setProperty('--rot', rot + 'deg');
    });
    window.addEventListener('pointerup', function () { drag = null; });
    stage.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  }

  /* ---------- portal page transitions (normal links, history keeps working) ---------- */
  function samePageHash(a) {
    var u = new URL(a.href, location.href);
    return u.origin === location.origin && u.pathname === location.pathname && (u.hash || u.href === location.href);
  }
  doc.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.origin !== location.origin || !/^https?:$|^file:$/.test(u.protocol)) return;
    if (samePageHash(a)) { if (ring && !ring.hidden) closeRing(false); return; }
    if (reduce) return;
    e.preventDefault();
    var x = e.clientX || innerWidth / 2, y = e.clientY || innerHeight / 2;
    try { sessionStorage.setItem('mqPortal', JSON.stringify({ x: x, y: y })); } catch (z) { }
    var p = doc.createElement('div'); p.className = 'portal'; doc.body.appendChild(p);
    var go = function () { location.href = a.href; };
    try {
      var an = p.animate([{ clipPath: 'circle(0 at ' + x + 'px ' + y + 'px)' }, { clipPath: 'circle(150vmax at ' + x + 'px ' + y + 'px)' }], { duration: 520, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' });
      an.onfinish = go;
    } catch (z2) { go(); }
    setTimeout(go, 900);
  });
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { $$('.portal').forEach(function (n) { n.remove(); }); root.classList.remove('p-arrive'); if (ring && !ring.hidden) { ring.hidden = true; doc.body.style.overflow = ''; } }
  });
  setTimeout(function () { root.classList.remove('p-arrive'); }, 1200);

  /* ---------- heading letter reveal + explosion ---------- */
  var xps = [];
  $$('[data-xp]').forEach(function (h) {
    var text = h.textContent; h.setAttribute('aria-label', text.replace(/\s+/g, ' ').trim());
    h.textContent = '';
    var w = doc.createElement('span'); w.className = 'xp'; w.setAttribute('aria-hidden', 'true');
    text.split(' ').forEach(function (word, wi, arr) {
      var ws = doc.createElement('span'); ws.style.cssText = 'display:inline-block;white-space:nowrap';
      Array.from(word).forEach(function (c) { var s = doc.createElement('span'); s.className = 'ch'; s.textContent = c; ws.appendChild(s); });
      w.appendChild(ws); if (wi < arr.length - 1) w.appendChild(doc.createTextNode(' '));
    });
    h.appendChild(w); xps.push(w);
  });
  function assemble(w, base) {
    if (reduce) return;
    $$('.ch', w).forEach(function (c, i) {
      var a = Math.random() * 6.283, d = 60 + Math.random() * 120;
      c.animate([{ opacity: 0, transform: 'translate(' + Math.cos(a) * d + 'px,' + Math.sin(a) * d + 'px) rotate(' + (Math.random() * 120 - 60) + 'deg) scale(.4)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }],
        { duration: 1300, delay: (base || 0) + i * 22, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
    });
  }
  function explode(w) {
    if (reduce) return;
    $$('.ch', w).forEach(function (c) {
      var a = Math.random() * 6.283, d = 40 + Math.random() * 90;
      c.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(' + Math.cos(a) * d + 'px,' + Math.sin(a) * d + 'px) rotate(' + (Math.random() * 90 - 45) + 'deg)', opacity: .25, offset: .4 }, { transform: 'none', opacity: 1 }],
        { duration: 1500, easing: 'cubic-bezier(.2,.7,.2,1)' });
    });
  }
  if (fine) xps.forEach(function (w) { w.parentNode.addEventListener('pointerenter', function () { explode(w); }); });
  var played = new WeakSet();
  xps.forEach(function (w) { if (!w.closest('.reveal')) { played.add(w); assemble(w, 300); } });

  /* ---------- scroll reveal: in on the way down, out on the way up ---------- */
  var rv = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        e.target.classList.toggle('in', e.isIntersecting);
        if (e.isIntersecting) $$('.xp', e.target).forEach(function (x) { if (!played.has(x)) { played.add(x); assemble(x, 150); } });
      });
    }, { threshold: .1 });
    rv.forEach(function (r) { io.observe(r); });
  } else rv.forEach(function (r) { r.classList.add('in'); });

  /* ---------- parallax (scroll on all devices, pointer on desktop) ---------- */
  if (!reduce) {
    var scenes = $$('.scene').map(function (s) { return { el: s, items: $$('.fl', s), vis: false }; });
    var pxv = 0, tick = false;
    if ('IntersectionObserver' in window) {
      var so = new IntersectionObserver(function (es) { es.forEach(function (e) { scenes.forEach(function (s) { if (s.el === e.target) s.vis = e.isIntersecting; }); }); apply(); });
      scenes.forEach(function (s) { so.observe(s.el); });
    } else scenes.forEach(function (s) { s.vis = true; });
    function apply() {
      tick = false; var vh = innerHeight;
      scenes.forEach(function (s) {
        if (!s.vis) return; var r = s.el.getBoundingClientRect(), off = r.top + r.height / 2 - vh / 2;
        s.items.forEach(function (n) { var d = parseFloat(n.getAttribute('data-depth')) || .3; n.style.setProperty('--py', (-off * d * .14).toFixed(1) + 'px'); n.style.setProperty('--px', (pxv * d * 46).toFixed(1) + 'px'); });
      });
    }
    function req() { if (!tick) { tick = true; requestAnimationFrame(apply); } }
    window.addEventListener('scroll', req, { passive: true }); window.addEventListener('resize', req);
    if (fine) window.addEventListener('pointermove', function (e) { pxv = e.clientX / innerWidth - .5; req(); }, { passive: true });
    req();
    var tilt = $('[data-tilt]');
    if (tilt && fine) {
      var hero = tilt.closest('section');
      hero.addEventListener('pointermove', function (e) { var b = hero.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5; tilt.style.transform = 'rotateY(' + (x * 9).toFixed(2) + 'deg) rotateX(' + (-y * 6).toFixed(2) + 'deg)'; });
      hero.addEventListener('pointerleave', function () { tilt.style.transform = ''; });
    }
  }
})();
