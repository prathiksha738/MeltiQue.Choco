/* Virtual unboxing: shows the visitor's own studio design (a concept illustration) inside an opening 3D box. */
(function () {
  'use strict';
  var root = document.getElementById('unbox'), X = window.MQX; if (!root || !X) return; var el = X.el, svg = '', st = null;
  try { svg = sessionStorage.getItem('mqPreview') || ''; st = JSON.parse(sessionStorage.getItem('mqStudio') || 'null'); } catch (e) { }
  if (!svg) { root.appendChild(el('p', 'callout', 'Design something first and your gift will appear here.')); var a = el('a', 'btn btn-gold', 'Open the Design Studio'); a.href = 'studio.html'; root.appendChild(a); return; }
  var url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  var stage = el('div', 'ub-stage'), box = el('div', 'ub-box'), lid = el('div', 'ub-lid'), base = el('div', 'ub-base'), img = el('img', 'ub-img'), card = el('div', 'ub-card');
  img.src = url; img.alt = 'Your personalised chocolate design inside a gift box (concept illustration)'; card.textContent = st && st.giftMsg ? st.giftMsg : '';
  lid.appendChild(el('span', '', 'MeltiQue')); base.appendChild(img); if (st && st.giftMsg) base.appendChild(card); box.appendChild(base); box.appendChild(lid); stage.appendChild(box); root.appendChild(stage);
  var b = el('button', 'btn btn-gold', 'Open the box'); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
  b.addEventListener('click', function () { var o = box.classList.toggle('open'); b.textContent = o ? 'Close the box' : 'Open the box'; b.setAttribute('aria-pressed', String(o)); });
  var dl = el('button', 'btn btn-line', 'Download preview image'); dl.type = 'button';
  dl.addEventListener('click', function () { var i = new Image(); i.onload = function () { var c = document.createElement('canvas'); c.width = 1600; c.height = 1200; c.getContext('2d').drawImage(i, 0, 0, 1600, 1200); var a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = 'meltique-design.png'; document.body.appendChild(a); a.click(); a.remove(); }; i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('viewBox="0 0 800 600"', 'viewBox="0 0 800 600" width="1600" height="1200"')); });
  var back = el('a', 'btn btn-line', 'Back to customization'); back.href = 'studio.html';
  var row = el('div', 'actions'); row.appendChild(b); row.appendChild(dl); row.appendChild(back); root.appendChild(row);
  root.appendChild(el('p', 'small', 'Concept illustration of your design, not a photo of the finished product. Nothing is shared or uploaded from this page.'));
})();
