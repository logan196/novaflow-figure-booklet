(()=>{
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>n==null||n===''?'—':Number(n).toLocaleString('en-US');
let D=null, TY={}, ST={q:'',part:'all',type:'',lang:'',sort:'rank'};
const app=$('#app');
const T=k=>`img/thumbs/${k}.webp`, F=k=>`img/full/${k}.webp`, O=i=>`img/orig/${i.key}.png`;
const rankOf=p=>p.part==='I'?(p.top?.rank??999):(p.niche?.rank??999);
const prettyVar=v=>v.replace(/^v(\d+)_/,'V$1 · ').replace(/_/g,' ');
function langs(){const s=new Set();D.packages.forEach(p=>p.lang.split('/').forEach(l=>s.add(l)));return [...s].sort()}

fetch('data/catalog.json').then(r=>r.json()).then(d=>{D=d;D.types.forEach(t=>TY[t.key]=t);
  D.packages.forEach((p,i)=>{p.i=i;p.hay=[p.name,p.dir,p.category,p.lang,p.top?.figtypes,p.niche?.sig,p.header].join(' ').toLowerCase()});
  route();}).catch(e=>{app.innerHTML=`<div class="loading">Failed to load catalog: ${esc(e)}</div>`});
addEventListener('hashchange',route);

function route(){
  const h=location.hash.replace(/^#\/?/,'');const [r,a]=h.split('/');
  $$('.nav nav a[data-r]').forEach(x=>x.classList.toggle('on',x.dataset.r===(r||'home')));
  if(r==='p'&&a) pkgPage(decodeURIComponent(a));
  else if(r==='gallery') gallery();
  else if(r==='tables') tables();
  else if(r==='methods') methods();
  else home();
  if(r!=='' || !ST._kept) scrollTo(0,0);
}

/* ---------------- HOME ---------------- */
function home(){
  const P=D.packages, nI=P.filter(p=>p.part==='I').length, nII=P.length-nI;
  const mosaic=P.slice(0,24).map(p=>p.images[0]).filter(Boolean).map(i=>`<img src="${T(i.key)}" alt="" loading="lazy">`).join('');
  app.innerHTML=`
  <section class="hero"><div class="mos">${mosaic}</div><div class="shade"></div>
   <div class="wrap"><div class="in">
    <div class="kicker">Neuro-omics · 2023–26 · systematic review</div>
    <h1>The <span class="a">figure</span><br>packages behind<br><span class="n">neuro-omics.</span></h1>
    <p class="dek">The plotting packages and analysis tools used in neuroscience bulk, single-cell and spatial omics papers, ranked by how many papers name them in their methods. Every figure here was recreated with runnable code. Click any figure to open it full screen.</p>
    <div class="stats">
     <div class="stat" style="--c:var(--blue)"><b>17,768</b><span>open-access papers, 2023–26 (Europe PMC)</span></div>
     <div class="stat" style="--c:var(--vio)"><b>${P.length}</b><span>packages profiled: ${nI} mainstream + ${nII} niche</span></div>
     <div class="stat" style="--c:var(--ne)"><b>${D.n_images}</b><span>recreated figure variations</span></div>
     <div class="stat" style="--c:var(--cyan)"><b>212</b><span>candidate tools screened</span></div>
    </div></div></div></section>
  <div class="controls"><div class="wrap">
   <div class="ctl">
    <div class="search"><input id="q" placeholder="Search packages, figure types, categories…  ( / )" value="${esc(ST.q)}"></div>
    <div class="seg" id="part"><button data-v="all">All</button><button data-v="I">Mainstream</button><button data-v="II">Niche &amp; cool</button></div>
    <select id="lang"><option value="">All languages</option>${langs().map(l=>`<option ${ST.lang===l?'selected':''}>${esc(l)}</option>`).join('')}</select>
    <select id="sort"><option value="rank">Sort: rank</option><option value="name">Sort: A–Z</option><option value="figs">Sort: most variations</option></select>
    <span class="count" id="cnt"></span>
   </div>
   <div class="chips" id="types">${D.types.map(t=>`<button class="chip" data-t="${t.key}" style="--c:${t.color}"><i></i>${esc(t.name)}</button>`).join('')}</div>
  </div></div>
  <div class="wrap" id="res"></div>`;
  $('#sort').value=ST.sort;
  const q=$('#q');q.addEventListener('input',()=>{ST.q=q.value;grid()});
  $$('#part button').forEach(b=>b.onclick=()=>{ST.part=b.dataset.v;grid()});
  $('#lang').onchange=e=>{ST.lang=e.target.value;grid()};
  $('#sort').onchange=e=>{ST.sort=e.target.value;grid()};
  $$('#types .chip').forEach(b=>b.onclick=()=>{ST.type=ST.type===b.dataset.t?'':b.dataset.t;grid()});
  grid();
}
function filtered(){
  const q=ST.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let L=D.packages.filter(p=>(ST.part==='all'||p.part===ST.part)&&(!ST.lang||p.lang.split('/').includes(ST.lang))&&(!ST.type||p.types.includes(ST.type))&&q.every(w=>p.hay.includes(w)));
  if(ST.sort==='name')L.sort((a,b)=>a.name.localeCompare(b.name));
  else if(ST.sort==='figs')L.sort((a,b)=>b.images.length-a.images.length);
  return L;
}
function card(p,k){
  const i=p.images[0], ii=p.part==='II';
  const maxP=D.packages[0].top?.papers||1;
  const big=ii?`<b>${p.niche?.growth!=null?p.niche.growth.toFixed(1)+'×':'—'}</b><span>growth in usage rate, 2023 → 2025–26</span>`
              :`<b>${fmt(p.top?.papers)}</b><span>papers · ${p.top?.pct}% of corpus</span>`;
  const w=ii?Math.min(100,(p.niche?.pctile||0)*100):Math.max(2,100*(p.top?.papers||0)/maxP);
  return `<a class="card" href="#/p/${encodeURIComponent(p.dir)}" style="animation-delay:${Math.min(k,24)*25}ms">
   <div class="th" data-lb="${p.i}">${i?`<img src="${T(i.key)}" alt="${esc(p.name)} example" loading="lazy">`:''}<span class="rk ${ii?'ii':''}">${ii?'N':'#'}${rankOf(p)}</span><span class="nv">${p.images.length} figs ⤢</span></div>
   <div class="bd"><h3>${esc(p.name)}</h3><div class="meta">${esc(p.lang)} · ${esc(p.category)}</div>
   <div class="big">${big}</div><div class="bar ${ii?'ii':''}"><i style="width:${w}%"></i></div></div></a>`;
}
function grid(){
  $$('#part button').forEach(b=>b.classList.toggle('on',b.dataset.v===ST.part));
  $$('#types .chip').forEach(b=>b.classList.toggle('on',b.dataset.t===ST.type));
  const L=filtered(); $('#cnt').textContent=`${L.length} / ${D.packages.length} packages`;
  const I=L.filter(p=>p.part==='I'), II=L.filter(p=>p.part==='II');
  let h='';let k=0;
  if(I.length)h+=`<section class="sec"><div class="sech"><h2>Part I · Mainstream workhorses</h2><span class="lbl">ranked by papers naming the package in Methods</span></div><div class="grid">${I.map(p=>card(p,k++)).join('')}</div></section>`;
  if(II.length)h+=`<section class="sec"><div class="sech"><h2>Part II · Niche &amp; cool</h2><span class="lbl">fast-growing tools with distinctive figures</span></div><div class="grid">${II.map(p=>card(p,k++)).join('')}</div></section>`;
  $('#res').innerHTML=h||'<div class="empty">No packages match these filters.</div>';
  $$('#res .th').forEach(t=>t.addEventListener('click',e=>{e.preventDefault();const p=D.packages[+t.dataset.lb];openLB(p.images.map(im=>({p,im})),0)}));
}
addEventListener('keydown',e=>{if(e.key==='/'&&$('#q')&&document.activeElement!==$('#q')&&$('#lb').hidden){e.preventDefault();$('#q').focus()}});

/* ---------------- PACKAGE ---------------- */
function hl(code,lang){
  const isR=/^R/.test(lang)&&!/Python/.test(lang.split('/')[0]);
  const kw=isR?'function|if|else|for|while|in|library|require|return|TRUE|FALSE|NULL|NA':'def|import|from|as|for|in|if|else|elif|return|with|lambda|True|False|None|and|or|not|class';
  const re=new RegExp(`(#[^\\n]*)|("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*')|\\b(\\d+(?:\\.\\d+)?)\\b|\\b(${kw})\\b|([A-Za-z_][\\w.]*)(?=\\()`,'g');
  let out='',last=0,m;
  while((m=re.exec(code))){out+=esc(code.slice(last,m.index));
    const c=m[1]?'c':m[2]?'s':m[3]?'n':m[4]?'k':'f';out+=`<span class="tk-${c}">${esc(m[0])}</span>`;last=re.lastIndex}
  return out+esc(code.slice(last));
}
function pkgPage(dir){
  const p=D.packages.find(x=>x.dir===dir); if(!p){app.innerHTML='<div class="loading">Package not found. <a href="#/">Back</a></div>';return}
  const ii=p.part==='II', t=p.top, n=p.niche;
  const kp=ii?[
    [n?.growth!=null?n.growth.toFixed(1)+'×':'—','growth ratio (broad usage rate 2025–26 vs 2023)'],
    [n?.r23!=null?n.r23.toFixed(3):'—','usage per 1k papers, 2023'],
    [n?.r2526!=null?n.r2526.toFixed(3):'—','usage per 1k papers, 2025–26'],
    [fmt(n?.neuro_total),'neuro-corpus papers (2023–26)'],
    [n?.stars!=null?fmt(n.stars):'—','GitHub stars'],
    [p.images.length,'recreated variations']]
   :[[fmt(t?.papers),'papers naming it in Methods'],[(t?.pct??'—')+'%','of the 17,768-paper corpus'],[fmt(t?.fulltext),'papers mentioning it anywhere'],[esc(t?.role||'—'),'role'],[p.images.length,'recreated variations']];
  const bestFor=ii?n?.sig:t?.figtypes;
  const spark=ii&&n?.years?`<div class="panel"><h4>Neuro-corpus papers per year</h4><div class="spark">${n.years.map((v,k)=>{const mx=Math.max(...n.years,1);return `<div style="height:${Math.max(4,100*v/mx)}%" title="${v}"><span>${['2023','2024','2025','2026*'][k]}: ${v}</span></div>`}).join('')}</div><div style="height:20px"></div><p class="lbl">* 2026 partial year</p></div>`:'';
  const ex=p.examples.length?p.examples.map(x=>`<div class="ex"><div class="t">${esc(x.title)}</div><div class="j">${esc(x.journal)} · ${esc(x.year)}${x.fig_label?' · '+esc(x.fig_label):''}</div>
     ${x.evidence?`<div class="ev">${esc(x.evidence)}</div>`:''}
     ${x.fig?`<a class="lnk" href="${esc(x.fig)}" target="_blank" rel="noopener">${x.offpmc?'Article ↗':'View figure ↗'}</a>`:''}${x.doi?`<a class="lnk" href="${esc(x.doi)}" target="_blank" rel="noopener">DOI ↗</a>`:''}</div>`).join('')
    :p.corpus_examples.length?`<p class="lbl" style="margin-bottom:6px">Corpus papers mentioning ${esc(p.corpus_alias||p.name)} (${fmt(p.corpus_count)} total). Figure-level links not mined for niche tools.</p>`+p.corpus_examples.map(x=>`<div class="ex"><div class="t">${esc(x.title)}</div><div class="j">${esc(x.journal)} · ${esc(x.year)}${x.cited!=null?' · cited '+x.cited:''}</div>${x.doi?`<a class="lnk" href="${esc(x.doi)}" target="_blank" rel="noopener">DOI ↗</a>`:''}${x.pmcid?`<a class="lnk" href="https://pmc.ncbi.nlm.nih.gov/articles/${esc(x.pmcid)}/" target="_blank" rel="noopener">PMC ↗</a>`:''}</div>`).join('')
    :`<p>No neuro-corpus example papers found for this tool${n?.repo?"; see the repository":""}.</p>`;
  const idx=D.packages.indexOf(p), pv=D.packages[idx-1], nx=D.packages[idx+1];
  app.innerHTML=`
  <div class="wrap"><section class="ph"><a class="back" href="#/">← All packages</a>
   <div class="row"><div><div class="kicker">${ii?'Part II · Niche & cool':'Part I · Mainstream'}</div><h1>${esc(p.name)}</h1>
    <div class="tags"><span class="tag">${esc(p.lang)}</span><span class="tag">${esc(p.category)}</span>${p.types.map(k=>`<span class="tag" style="border-color:${TY[k].color};color:#fff">${esc(TY[k].name)}</span>`).join('')}${n?.repo?`<a class="tag" href="${esc(n.repo)}" target="_blank" rel="noopener">GitHub ↗</a>`:''}</div></div>
    <div class="rank ${ii?'ii':''}"><b>${ii?'N':'#'}${rankOf(p)}</b><div class="lbl">${ii?'niche-cool rank':'rank by papers'}</div></div></div>
   <div class="kpis">${kp.map(([a,b])=>`<div><b>${a}</b><span>${b}</span></div>`).join('')}</div></section>
  <div class="cols"><div>
   ${bestFor?`<div class="panel"><h4>Best for</h4><p>${esc(bestFor)}</p></div>`:''}
   ${p.header?`<div class="panel"><h4>What the recreation shows</h4><p>${esc(p.header)}</p></div>`:''}
   ${spark}
   <div class="code"><div class="bar2"><span>${esc(p.script_src||'')}${p.code_line?` · from line ${p.code_line}`:''}</span><span class="act"><button class="btn" id="cp">Copy</button>${p.script?`<a class="btn" href="${esc(p.script)}" target="_blank">Full script ↗</a>`:''}</span></div><pre><code>${hl(p.code||'',p.lang)}</code></pre></div>
   ${p.limits.length?`<div class="panel" style="margin-top:18px"><h4 style="color:var(--amb)">Limitations &amp; notes</h4><ul class="lim">${p.limits.map(l=>`<li>${esc(l)}</li>`).join('')}</ul></div>`:''}
   ${t?.note?`<div class="caveat" style="margin-top:12px"><b>Note:</b> ${esc(t.note)}</div>`:''}
  </div><div><div class="panel"><h4>Example papers (neuro corpus)</h4>${ex}</div></div></div>
  <div class="sech"><h2>Gallery</h2><span class="lbl">${p.images.length} variations · click to enlarge</span></div>
  <div class="gal">${p.images.map((im,k)=>`<div class="fig" data-k="${k}"><div class="im"><img src="${T(im.key)}" alt="${esc(p.name+' '+im.var)}" loading="lazy"></div><div class="c"><b>${esc(prettyVar(im.var))}</b><span>${esc(TY[im.type]?.name||im.type)}</span></div></div>`).join('')}</div>
  <div class="pn">${pv?`<a href="#/p/${encodeURIComponent(pv.dir)}"><span class="lbl">← Previous</span><b>${esc(pv.name)}</b></a>`:'<span></span>'}${nx?`<a class="r" href="#/p/${encodeURIComponent(nx.dir)}"><span class="lbl">Next →</span><b>${esc(nx.name)}</b></a>`:''}</div></div>`;
  $('#cp').onclick=()=>{navigator.clipboard.writeText(p.code||'').then(()=>toast('Copied to clipboard'),()=>toast('Copy failed'))};
  const items=p.images.map(im=>({p,im}));
  $$('.gal .fig').forEach(f=>f.onclick=()=>openLB(items,+f.dataset.k));
  document.title=`${p.name} · Novaflow Figure-Package Atlas`;
}

/* ---------------- GALLERY ---------------- */
function gallery(){
  const all=[];D.packages.forEach(p=>p.images.forEach(im=>all.push({p,im})));
  app.innerHTML=`<div class="wrap"><section class="ph"><div class="kicker">Visual index</div><h1>All ${all.length} figures</h1>
   <div class="chips" id="gt"><button class="chip on" data-t="">All</button>${D.types.map(t=>`<button class="chip" data-t="${t.key}" style="--c:${t.color}"><i></i>${esc(t.name)}</button>`).join('')}</div></section>
   <div class="sec"><div class="mason" id="ms"></div></div></div>`;
  let cur=all;
  const draw=t=>{cur=t?all.filter(x=>x.im.type===t):all;
    $('#ms').innerHTML=cur.map((x,k)=>`<div class="fig" data-k="${k}"><div class="im"><img src="${T(x.im.key)}" width="${x.im.w}" height="${x.im.h}" style="height:auto" alt="" loading="lazy"></div><div class="c"><b>${esc(x.p.name)}</b><span>${esc(prettyVar(x.im.var))}</span></div></div>`).join('');
    $$('#ms .fig').forEach(f=>f.onclick=()=>openLB(cur,+f.dataset.k));};
  $$('#gt .chip').forEach(b=>b.onclick=()=>{$$('#gt .chip').forEach(c=>c.classList.toggle('on',c===b));draw(b.dataset.t)});
  draw('');document.title='Gallery · Novaflow Figure-Package Atlas';
}

/* ---------------- TABLES ---------------- */
function tables(){
  const dirs=new Set(D.packages.map(p=>p.dir));
  const link=(d,txt)=>d&&dirs.has(d)?`<a href="#/p/${encodeURIComponent(d)}">${esc(txt)}</a>`:esc(txt);
  const T1=[['rank','#','n'],['package','Package'],['language','Lang'],['category','Category'],['paper_count','Papers','n'],['pct_corpus','% corpus','n'],['fulltext_any_count','Full-text any','n'],['typical_figure_types','Typical figures'],['n_variations','Recreated','n']];
  const T2=[['niche_rank','#','n'],['tool','Tool'],['language','Lang'],['category','Category'],['signature_visual','Signature visual'],['growth_ratio','Growth ×','n'],['neuro_total','Neuro papers','n'],['github_stars','Stars','n'],['n_variations','Recreated','n']];
  const mk=(id,cols,rows,nameKey)=>`<div class="tw"><table id="${id}"><thead><tr>${cols.map((c,k)=>`<th data-k="${k}">${c[1]}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td class="${c[2]||''}">${c[0]===nameKey?link(r.recreation_dir,r[c[0]]):c[0]==='growth_ratio'&&r[c[0]]!==''?Number(r[c[0]]).toFixed(1):esc(r[c[0]])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  app.innerHTML=`<div class="wrap"><section class="ph"><div class="kicker">Rankings</div><h1>Ranked tables</h1><p class="lbl" style="margin-top:10px">Click a column header to sort. Linked names open the package page.</p></section>
  <div class="sec"><div class="sech"><h2>Top 100 · by Methods mentions</h2></div>${mk('t1',T1,D.top100,'package')}
  <div class="sech"><h2>Niche &amp; cool · ${D.niche.length} tools</h2></div>${mk('t2',T2,D.niche,'tool')}</div></div>`;
  $$('table').forEach(tb=>$$('th',tb).forEach(th=>th.onclick=()=>{const k=+th.dataset.k,b=$('tbody',tb),rs=[...b.rows];const asc=th.dataset.s!=='a';$$('th',tb).forEach(x=>delete x.dataset.s);th.dataset.s=asc?'a':'d';
    rs.sort((x,y)=>{const a=x.cells[k].textContent,c=y.cells[k].textContent,na=parseFloat(a.replace(/,/g,'')),nc=parseFloat(c.replace(/,/g,''));const r=!isNaN(na)&&!isNaN(nc)?na-nc:a.localeCompare(c);return asc?r:-r});rs.forEach(r=>b.appendChild(r))}));
  document.title='Rankings · Novaflow Figure-Package Atlas';
}

/* ---------------- METHODS ---------------- */
function methods(){
  app.innerHTML=`<div class="wrap"><div class="md" id="md"><div class="loading">Loading…</div></div></div>`;
  Promise.all(['data/METHODS.md','data/SUMMARY.md'].map(u=>fetch(u).then(r=>r.text()))).then(([m,s])=>{
    const cav=`<div class="caveat" style="margin-bottom:26px"><b>Caveats.</b> The corpus is open-access full text only, so paywalled papers are missed. A Methods mention shows a package was used, not that it drew a given published figure. Niche-tool growth ratios come from small counts. The recreations use public demo data (airway, Zeisel 2015 and others listed below), and deepTools uses simulated bigWigs.</div>`;
    const r=t=>window.marked?marked.parse(t):`<pre>${esc(t)}</pre>`;
    $('#md').innerHTML=cav+r(m)+'<hr style="border-color:#1b2330;margin:40px 0">'+r(s);});
  document.title='Methods · Novaflow Figure-Package Atlas';
}

/* ---------------- LIGHTBOX ---------------- */
const lb=$('#lb'),stage=$('#lbStage'),img=$('#lbImg');let L=[],ix=0,z=1,tx=0,ty=0;
function apply(){img.style.transform=`translate(${tx}px,${ty}px) scale(${z})`}
function reset(){z=1;tx=ty=0;apply()}
function show(){const {p,im}=L[ix];reset();img.src=T(im.key);
  const full=new Image();full.onload=()=>{if(L[ix]?.im===im)img.src=full.src};full.src=F(im.key);
  img.alt=`${p.name} — ${im.var}`;
  $('#lbCount').textContent=`${ix+1} / ${L.length}`;
  $('#lbDl').href=O(im);$('#lbDl').setAttribute('download',`${p.dir}_${im.var}.png`);
  $('#lbCap').innerHTML=`<b>${esc(p.name)}</b><span class="v">${esc(prettyVar(im.var))}</span><div class="s">${esc(TY[im.type]?.name||'')} · ${im.w}×${im.h}px · <a href="#/p/${encodeURIComponent(p.dir)}" id="lbGo">package page →</a></div>`;
  $('#lbGo').onclick=closeLB;
  [ix-1,ix+1].forEach(j=>{if(L[j]){const q=new Image();q.src=F(L[j].im.key)}});}
function openLB(items,k){L=items;ix=k;lb.hidden=false;document.body.style.overflow='hidden';show()}
function closeLB(){lb.hidden=true;document.body.style.overflow='';img.src=''}
const go=d=>{ix=(ix+d+L.length)%L.length;show()};
const zoom=(f,cx,cy)=>{const nz=Math.min(8,Math.max(1,z*f));if(cx!=null){const r=stage.getBoundingClientRect(),ox=cx-r.left-r.width/2,oy=cy-r.top-r.height/2;tx=ox-(ox-tx)*nz/z;ty=oy-(oy-ty)*nz/z}z=nz;if(z===1){tx=ty=0}apply()};
$('#lbX').onclick=closeLB;$('#lbP').onclick=()=>go(-1);$('#lbN').onclick=()=>go(1);
$('#lbZi').onclick=()=>zoom(1.5);$('#lbZo').onclick=()=>zoom(1/1.5);$('#lbZr').onclick=reset;
lb.addEventListener('click',e=>{if(e.target===lb||e.target===stage)closeLB()});
stage.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1.15:1/1.15,e.clientX,e.clientY)},{passive:false});
img.addEventListener('dblclick',e=>{z>1?reset():zoom(2.5,e.clientX,e.clientY)});
let drag=null;const pts=new Map();let pinch=null;
stage.addEventListener('pointerdown',e=>{pts.set(e.pointerId,e);stage.setPointerCapture(e.pointerId);
  if(pts.size===2){const [a,b]=[...pts.values()];pinch={d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),z};drag=null}
  else drag={x:e.clientX,y:e.clientY,tx,ty,moved:false};stage.classList.add('drag')});
stage.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,e);
  if(pinch&&pts.size===2){const [a,b]=[...pts.values()];const d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);z=Math.min(8,Math.max(1,pinch.z*d/pinch.d));if(z===1)tx=ty=0;apply();return}
  if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)drag.moved=true;
    if(z>1){tx=drag.tx+dx;ty=drag.ty+dy;apply()}}});
const up=e=>{pts.delete(e.pointerId);stage.classList.remove('drag');
  if(drag&&z===1&&drag.moved){const dx=e.clientX-drag.x;if(Math.abs(dx)>60)go(dx<0?1:-1)}
  if(pts.size<2)pinch=null;drag=null};
stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',up);
addEventListener('keydown',e=>{if(lb.hidden)return;
  if(e.key==='Escape')closeLB();else if(e.key==='ArrowRight')go(1);else if(e.key==='ArrowLeft')go(-1);
  else if(e.key==='+'||e.key==='=')zoom(1.5);else if(e.key==='-')zoom(1/1.5);else if(e.key==='0')reset();});
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),1600)}
window.__atlas={openLB,closeLB,state:()=>({open:!lb.hidden,ix,z,n:L.length,src:img.src})};
})();
