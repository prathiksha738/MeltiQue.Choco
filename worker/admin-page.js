/* Owner dashboard (served by the Worker at /admin, behind Cloudflare Access). No secrets here. */
export default `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MeltiQue owner dashboard</title>
<style>
:root{color-scheme:dark}body{margin:0;font:15px/1.5 system-ui,sans-serif;background:#1b100c;color:#f6ebdd}
header{padding:14px 18px;border-bottom:1px solid #5a3a2a;display:flex;gap:12px;align-items:center;flex-wrap:wrap}h1{font:600 1.1rem Georgia,serif;margin:0;color:#d6ae65;flex:1}
nav button,.b{background:#2c1a12;color:#f6ebdd;border:1px solid #d6ae65;border-radius:999px;padding:8px 14px;cursor:pointer;font:inherit;text-decoration:none;display:inline-block}
nav button[aria-pressed=true]{background:#d6ae65;color:#281611}main{padding:16px 18px;max-width:1100px;margin:auto}
.card{border:1px solid #5a3a2a;border-radius:12px;padding:14px;margin:0 0 14px;background:#241510;display:grid;gap:8px}
.card.d{grid-template-columns:minmax(0,260px) 1fr}@media(max-width:700px){.card.d{grid-template-columns:1fr}}
img{max-width:100%;border-radius:8px;background:#000}dl{margin:0;display:grid;grid-template-columns:max-content 1fr;gap:2px 12px}dt{color:#d6ae65}dd{margin:0;overflow-wrap:anywhere}
label{display:grid;gap:3px;font-size:.8rem;color:#d6ae65}select,input,textarea{font:inherit;padding:8px;border-radius:8px;border:1px solid #5a3a2a;background:#fff8ee;color:#281611}
.ok{color:#9fe3a1}.err{color:#ffb4a8}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #5a3a2a;padding:6px;text-align:left}
</style></head><body><header><h1>MeltiQue Chocoland: owner dashboard</h1><nav><button data-t="designs" aria-pressed="true">Designs</button> <button data-t="enquiries" aria-pressed="false">Enquiries</button> <button data-t="votes" aria-pressed="false">Lab interest</button> <button id="rf">Refresh</button></nav></header>
<main id="m" aria-live="polite">Loading…</main>
<script>
var D=null,T='designs',m=document.getElementById('m');
function el(t,c,x){var n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;return n}
function api(p,o){return fetch(p,o).then(function(r){if(!r.ok)throw new Error(r.status);return r})}
function load(){m.textContent='Loading…';api('/admin/api/list').then(function(r){return r.json()}).then(function(d){D=d;draw()}).catch(function(){m.textContent='Could not load. Make sure you are signed in with the owner account.'})}
function editor(rec){
 var f=el('div'),s=el('select');D.statuses.forEach(function(x){var o=el('option','',x);o.value=x;if(x===rec.status)o.selected=true;s.appendChild(o)});
 var n=el('textarea');n.value=rec.note||'';n.maxLength=800;n.rows=2;
 var b=el('button','b','Save'),msg=el('span');
 b.onclick=function(){msg.className='';msg.textContent='Saving…';api('/admin/api/update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:rec.id,status:s.value,note:n.value})}).then(function(r){return r.json()}).then(function(j){if(!j.ok)throw 0;rec.status=j.record.status;msg.className='ok';msg.textContent='Saved'}).catch(function(){msg.className='err';msg.textContent='Not saved. Try again.'})};
 [['Status',s],['Internal note',n]].forEach(function(p){var l=el('label','',p[0]);l.appendChild(p[1]);f.appendChild(l)});
 f.appendChild(b);f.appendChild(msg);return f}
function dl(o){var d=el('dl');Object.keys(o).forEach(function(k){var v=o[k];if(v==null||v===''||(Array.isArray(v)&&!v.length))return;d.appendChild(el('dt','',k));d.appendChild(el('dd','',Array.isArray(v)?v.join(', '):String(v)))});return d}
function draw(){m.textContent='';
 document.querySelectorAll('nav button[data-t]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.t===T))});
 if(T==='designs'){if(!D.designs.length)m.textContent='No design submissions yet.';D.designs.forEach(function(r){var c=el('section','card d'),l=el('div'),im=el('img');im.alt='Design '+r.id;im.src='/admin/api/image/'+r.id;l.appendChild(im);var a=el('a','b','Download image');a.href=im.src;a.download=r.id+'.png';l.appendChild(a);c.appendChild(l);
  var rt=el('div');rt.appendChild(el('h2','',r.id+' · '+r.name));rt.appendChild(dl(Object.assign({Contact:r.contact,Received:r.created,Email:r.email||'not sent'},r.spec)));rt.appendChild(editor(r));c.appendChild(rt);m.appendChild(c)})}
 if(T==='enquiries'){if(!D.enquiries.length)m.textContent='No enquiries yet.';D.enquiries.forEach(function(r){var c=el('section','card');c.appendChild(el('h2','',r.id+' · '+r.name));c.appendChild(dl({Contact:r.contact,Message:r.message,Received:r.created,Email:r.email||'not sent'}));c.appendChild(editor(r));m.appendChild(c)})}
 if(T==='votes'){var t=el('table'),h=el('tr');['Concept','Votes'].forEach(function(x){h.appendChild(el('th','',x))});t.appendChild(h);D.votes.forEach(function(v){var r=el('tr');r.appendChild(el('td','',v.concept));r.appendChild(el('td','',v.votes));t.appendChild(r)});m.appendChild(t);
  m.appendChild(el('h2','','People who asked to be told ('+D.interest.length+')'));D.interest.forEach(function(i){m.appendChild(el('p','',i.concept+': '+i.contact+' ('+i.created+')'))})}}
document.querySelectorAll('nav button[data-t]').forEach(function(b){b.onclick=function(){T=b.dataset.t;draw()}});document.getElementById('rf').onclick=load;load();
</script></body></html>`;
