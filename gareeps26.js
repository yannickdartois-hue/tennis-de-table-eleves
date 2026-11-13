/* =====================================================================
   gareeps26.js — Parcours « GAREEPS 2026 » (SCE / SRP / STOM)
   Ne s'active que pour une classe réglée sur ce parcours par le professeur
   (champ pa:'g26' du QR de la classe). Sinon, l'appli reste exactement
   comme avant : étoile 7 axes, séances, poules.
   Données :
   - S.g26t[séance] = la table de la SCE saisie sur ce téléphone (4 joueurs,
     4 matchs de 12 balles, bonus, observations, bilans) ;
   - rec(élève, séance).g26 = {srp:[matchs à thème], stom:[ateliers]}.
   ===================================================================== */
(function(){
'use strict';
const PA=()=>!!(S&&S.cfg&&S.cfg.pa==='g26');
const PAL=()=>(S&&S.cfg&&Array.isArray(S.cfg.pal)&&S.cfg.pal.length===3)?S.cfg.pal:G26.paliers;
const HIST=()=>(S&&S.cfg&&S.cfg.h)||{};          // {nom:{s:{1:[R,A,K,T],…},ch:[…]}} envoyé par le prof
const prenom=n=>String(n||'').split(/\s+/)[0];
const KS=['R','A','K','T'];
const ROT=G26.rot,NB=G26.balles;

/* ---------- Styles ---------- */
const css=`
.g6tab{width:100%;border-collapse:collapse;font-size:15px}.g6tab td,.g6tab th{padding:7px 5px;border-bottom:1px solid var(--trait);text-align:left;vertical-align:top}
.g6tab th{font:700 13px var(--t);color:var(--repere)}.g6tab tr.ici{background:var(--ligne-pale)}.g6tab .fait{color:var(--vert);font-weight:700}
.g6chips{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px}.g6chips button{min-height:40px;padding:0 12px;border-radius:20px;border:1.5px solid var(--trait);background:var(--craie);font-weight:400;color:var(--encre)}
.g6chips button.on{background:var(--ligne-pale);border-color:var(--ligne);color:var(--ligne-fonce);font-weight:700}
.g6k{font:700 13px var(--t);color:var(--repere);text-transform:uppercase;letter-spacing:.04em;margin:8px 0 2px}
.g6aide{background:var(--vert-pale);border-left:4px solid var(--vert);padding:10px 12px;border-radius:10px;margin:10px 0}
.g6va{border:1.5px dashed var(--ligne);color:var(--ligne-fonce);border-radius:12px;padding:10px 12px;margin:10px 0;background:var(--craie)}
.g6poly{display:block;width:100%;max-width:360px;margin:0 auto}
.g6leg{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;font-size:14px}.g6leg span:before{content:"";display:inline-block;width:18px;height:4px;border-radius:2px;margin-right:5px;vertical-align:middle;background:var(--c)}
.g6pri{display:flex;gap:10px;align-items:flex-start;width:100%;text-align:left;padding:10px;border:1.5px solid var(--trait);border-radius:12px;background:var(--craie);margin:6px 0;color:var(--encre)}
.g6pri .num{width:32px;height:32px;border-radius:50%;flex:none;display:grid;place-items:center;font:900 17px var(--d);color:#fff;background:#9aa3ae}
.g6pri b{font:800 18px/1.15 var(--d);font-stretch:80%}.g6pri small{display:block;color:var(--repere);font-size:max(14px,var(--fs-min,15px));line-height:1.3;margin-top:2px}
.g6sr{display:block;width:100%;text-align:left;background:var(--craie);border:1.5px solid var(--trait);border-left:8px solid var(--c);border-radius:12px;padding:10px 12px;margin:7px 0;color:var(--encre)}
.g6sr.on{border-color:var(--c);box-shadow:0 0 0 2px var(--c)}
.g6sr b{font:800 19px var(--d);font-stretch:80%}.g6sr small{display:block;color:var(--repere)}.g6sr em{font-style:normal;font-weight:700;color:var(--c);font-size:14px}
.g6res{display:flex;text-align:center;gap:6px}.g6res>div{flex:1}.g6res small{display:block;color:var(--repere);font-size:14px}.g6res b{font:900 34px/1.15 var(--d)}
.g6q{padding:6px 0 6px 20px;border-bottom:1px dashed var(--trait);position:relative}.g6q:before{content:"?";position:absolute;left:2px;font-weight:900;color:var(--ligne)}
.g6at{display:flex;gap:10px;align-items:center;width:100%;text-align:left;background:var(--craie);border:1.5px solid var(--trait);border-radius:12px;padding:7px;margin:7px 0;color:var(--encre)}
.g6at img,.g6at .ph{width:110px;height:58px;object-fit:cover;border-radius:8px;flex:none;background:var(--sol);display:grid;place-items:center;font-size:26px}
.g6at b{font:800 18px var(--d);font-stretch:80%}.g6at small{display:block;color:var(--repere)}
.g6nv{display:inline-block;font-size:13px;font-weight:700;padding:2px 9px;border-radius:999px;background:var(--sol);color:var(--repere);margin-top:3px}
.g6nv.n1{background:var(--vert-pale);color:var(--vert)}.g6nv.n2{background:#385723;color:#fff}
.g6ess{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.g6ess label{font-size:13px;color:var(--repere);text-align:center}
.g6ess input{width:100%;min-height:48px;text-align:center;font:800 20px var(--d);border-radius:10px;border:1.5px solid var(--trait);background:var(--craie)}
.g6ess input.ok{border-color:var(--vert);background:var(--vert-pale);color:var(--vert)}
#g6m{position:fixed;inset:0;z-index:36;background:#10161f;color:#fff;display:flex;flex-direction:column;padding:max(10px,env(safe-area-inset-top)) 12px max(10px,env(safe-area-inset-bottom));overflow:auto}
#g6m .bt{background:#fff;color:#172033}
.g6bal{display:flex;gap:4px;margin:8px 0}.g6bal i{flex:1;height:9px;border-radius:5px;background:#2a3647}.g6bal i.a{background:#16A34A}.g6bal i.b{background:#B42318}.g6bal i.x{box-shadow:0 0 0 2px #fff}
.g6side{flex:1;min-height:120px;border:4px solid #2a3647;border-radius:18px;background:#1b2533;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px;width:100%}
.g6side.sert{border-color:var(--ligne);background:#24170d}.g6side.choisi{border-color:#fff}
.g6side .nm{font:800 24px/1.1 var(--d);font-stretch:78%;text-align:center}.g6side .sc{font:800 min(22vw,130px)/1 var(--d)}.g6side .sv{color:#FDBA74;font-weight:700}
.g6bon{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.g6bon button{border:0;border-radius:14px;padding:12px 10px;color:#fff;text-align:left;font:800 20px/1.1 var(--d);font-stretch:80%;min-height:64px}
.g6bon button small{display:block;font:400 14px/1.2 var(--t);opacity:.92;margin-top:3px}
.g6bon .no{grid-column:span 2;background:#3b4452;text-align:center}
.g6pj{font-size:14px;color:#c9d1d9;margin:6px 0 0}
.g6big{display:flex;align-items:center;background:#1b2533;border-radius:16px;padding:10px;margin:8px 0}.g6big>div{flex:1;text-align:center}
.g6big small{display:block;color:#9AA5B3;font-size:14px}.g6big b{display:block;font:900 54px/1.05 var(--d);color:#FDBA74}.g6big b.m{font-size:34px;color:#fff}
nav.onglets.g7{grid-template-columns:repeat(7,1fr)}nav.onglets.g7 button b{font-size:15px}
.g6deg{display:flex;gap:3px;margin-top:10px}.g6deg i{flex:1;font:700 13px var(--d);font-style:normal;text-align:center;padding:6px 0;border-radius:6px;background:#2a3647;color:#9AA5B3}.g6deg i.on{background:var(--ligne);color:#fff}
@media print{#g6m{display:none}}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

/* ---------- Outils ---------- */
const tables=()=>{S.g26t=S.g26t||{};return S.g26t};
const T=()=>tables()[S.seance];
const srvDe=(premier,i)=>Math.floor(i/2)%2===0?premier:(premier==='a'?'b':'a'); // 2 services chacun
function scoreM(m){let a=0,b=0;(m.b||[]).forEach(x=>{if(x[0]==='a')a++;else b++});return {a,b}}
function finiM(m){const s=scoreM(m);return (m.b||[]).length>=NB&&(s.a!==s.b||!!m.dec)}
function gagnantM(m){const s=scoreM(m);return s.a>s.b?'a':s.b>s.a?'b':m.dec||null}
// Bonus d'un joueur (index dans la table) sur toute la SCE
function totaux(t,p){const v={R:0,A:0,K:0,T:0};let vic=0,j=0;
  t.m.forEach((m,mi)=>{const [ia,ib]=ROT[mi],c=ia===p?'a':ib===p?'b':null;if(!c)return;j++;
    (m.b||[]).forEach(x=>{if(x[0]===c&&x[1]&&x[1]!=='-')v[x[1]]++});if(finiM(m)&&gagnantM(m)===c)vic++});
  return {v:KS.map(k=>v[k]),vic,j};
}
function bonusMatch(m,c){const v={R:0,A:0,K:0,T:0};(m.b||[]).forEach(x=>{if(x[0]===c&&x[1]&&x[1]!=='-')v[x[1]]++});return v}
function chips(attr,L,sel,extra){return `<div class="g6chips">${L.map(x=>`<button type="button" data-act="${attr}" data-v="${esc(x)}" ${extra||''} class="${(sel||[]).includes(x)?'on':''}">${esc(x)}</button>`).join('')}</div>`}

/* ---------- Polygone (SVG) ---------- */
const COLS=['#64748b','#EA580C','#0891B2'];
function polygone(series,pal){
  const R=118,cx=170,cy=150,ang=[-90,0,90,180].map(a=>a*Math.PI/180);
  const pt=(i,r)=>[cx+Math.cos(ang[i])*r,cy+Math.sin(ang[i])*r];
  const rr=n=>{const lv=G26.niveau(n,pal);return lv?lv*R/4:R*.08};
  let g='';
  for(let l=1;l<=4;l++)g+=`<polygon points="${[0,1,2,3].map(i=>pt(i,l*R/4).join(',')).join(' ')}" fill="none" stroke="#c8cfd8"/>`;
  [0,1,2,3].forEach(i=>{const [x,y]=pt(i,R);g+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#c8cfd8"/>`});
  series.forEach((s,si)=>{const last=si===series.length-1;
    g+=`<polygon points="${s.v.map((n,i)=>pt(i,rr(n)).join(',')).join(' ')}" fill="${s.c}${last?'38':'14'}" stroke="${s.c}" stroke-width="${last?3.5:2.2}" stroke-linejoin="round"/>`});
  const lab=[[cx,cy-R-12,'middle'],[cx+R+6,cy+5,'start'],[cx,cy+R+22,'middle'],[cx-R-6,cy+5,'end']];
  G26.br.forEach((b,i)=>{const [x,y,a]=lab[i];g+=`<text x="${x}" y="${y}" text-anchor="${a}" font-family="Archivo,Arial" font-weight="800" font-size="15" fill="${b.col}">${b.ic} ${b.n}</text>`});
  return `<svg class="g6poly" viewBox="-75 0 490 300" role="img" aria-label="Polygone des bonus">${g}</svg>
  <div class="g6leg">${series.map(s=>`<span style="--c:${s.c}">${esc(s.l)}</span>`).join('')}</div>
  <p class="small muted" style="text-align:center;margin:4px 0 0">Anneaux du centre vers l’extérieur : 0-${pal[0]-1} · ${pal[0]}-${pal[1]-1} · ${pal[1]}-${pal[2]-1} · ${pal[2]} bonus et +</p>`;
}
// Polygones d'un élève : SCE précédentes (reçues du prof ou saisies ici) + celle du jour
function seriesEleve(nom,jusqua){
  const parSce={},h=HIST()[nom];
  if(h&&h.s)Object.entries(h.s).forEach(([n,v])=>parSce[n]=v);
  Object.entries(tables()).forEach(([sn,t])=>{const p=t.J.indexOf(nom);if(p>=0&&(+sn<=(jusqua||99)))parSce[t.sce]=totaux(t,p).v});
  return Object.keys(parSce).map(Number).sort((a,b)=>a-b).slice(-3).map((n,i,L)=>({l:'SCE '+n,v:parSce[n],c:i===L.length-1?'#EA580C':['#64748b','#0891B2'][i]}));
}
// Dernier bilan (3 choix) d'un élève : saisi ici, sinon reçu du prof
function choixDe(nom){
  let best=null,bs=-1;
  Object.entries(tables()).forEach(([sn,t])=>{const p=t.J.indexOf(nom);const b=p>=0&&t.bil&&t.bil[p];if(b&&b.length&&+sn>bs){bs=+sn;best=b}});
  if(best)return best;const h=HIST()[nom];return h&&h.ch||[];
}

/* =================== SCE =================== */
function vSCE(){
  const t=T();
  if(!t)return vNouvelleTable();
  const fin=t.m.every(finiM)&&t.m.every(m=>m.etape>=3);
  let h=`<h2>SCE n°${t.sce} · Table ${esc(t.tab)}</h2>${t.dsp?`<p class="small" style="margin:-4px 0 10px">🩹 Marqueur : <b>${esc(t.dsp)}</b> (dispensé·e) : il tient le téléphone.</p>`:''}
  <section class="carte"><h3>Ordre des matchs</h3><table class="g6tab"><tr><th>#</th><th>Match (12 balles)</th><th>Observateurs</th></tr>
  ${t.m.map((m,mi)=>{const [a,b,oa,ob]=ROT[mi],s=scoreM(m),ici=mi===t.cur&&!fin;
    return `<tr class="${ici?'ici':''}"><td>${mi+1}</td><td><b>${esc(prenom(t.J[a]))}</b> – <b>${esc(prenom(t.J[b]))}</b>${finiM(m)?` <span class="fait">${s.a}-${s.b}${m.dec?' (pt décisif)':''} ✓</span>`:''}</td><td class="small">${esc(prenom(t.J[oa]))} → ${esc(prenom(t.J[a]))}<br>${esc(prenom(t.J[ob]))} → ${esc(prenom(t.J[b]))}</td></tr>`}).join('')}</table>
  <p class="small muted" style="margin:8px 0 0">Chacun joue 2 matchs. À son 2e match, il affronte un joueur qu’il a observé.</p></section>`;
  if(fin)return h+vResultats(t);
  const mi=t.cur,m=t.m[mi],[ia,ib,oa,ob]=ROT[mi];
  if(m.etape===2)return h+vObserve(t,mi);
  if(m.etape===1||(m.b&&m.b.length))return h+`<section class="carte"><h3>Match ${mi+1} en cours</h3><p>${esc(t.J[ia])} – ${esc(t.J[ib])} · balle ${Math.min(NB,(m.b||[]).length+1)} sur ${NB}</p><button type="button" class="bt orange" data-act="g6marque">Reprendre le match</button></section>`;
  // Avant le match : fiche de chaque joueur
  h+=`<section class="carte"><h3>Avant le match ${mi+1}</h3><p class="small muted">Chaque joueur remplit sa fiche avec son observateur (1 minute).</p>`;
  [['a',ia,ib],['b',ib,ia]].forEach(([c,p,adv])=>{
    const av=(m.av&&m.av[c])||{},vu=t.obs&&t.obs[p+'>'+adv];
    h+=`<div style="border-top:1px solid var(--trait);margin-top:10px;padding-top:8px"><h3 style="font-size:20px">${esc(t.J[p])} <span class="small muted" style="font-weight:400">contre ${esc(t.J[adv])}</span></h3>`;
    if(vu){
      h+=`<p class="ok small" style="margin:0">✓ Tu as observé ${esc(prenom(t.J[adv]))} : vérifie et corrige ses points faibles.</p>`;
      Object.entries(G26.faibles).forEach(([f,F])=>{h+=`<div class="g6k">${esc(F.n)}</div>${chips('g6fai',F.L,(av.f||{})[f],`data-c="${c}" data-f="${f}"`)}`});
    }else{
      h+=`<p class="small muted" style="margin:0">Tu ne l’as pas encore vu jouer : tu joues sur <b>tes points forts</b>.</p><div class="g6k">Mes points forts</div>${chips('g6for',G26.forts,av.fo,`data-c="${c}"`)}`;
    }
    h+=`<label class="ch">Mon projet de jeu</label><textarea data-g6="pj" data-c="${c}" rows="2" placeholder="ex. Je sers coupé sur son revers, puis je le fais bouger.">${esc(av.pj||'')}</textarea></div>`;
  });
  h+=`<p class="small" style="margin-top:10px">🎯 Le bonus <b>Tactique</b> compte si le joueur gagne le point avec son projet.</p>
  <p style="margin:12px 0 4px"><b>Qui sert en premier ?</b> <span class="small muted">(2 services chacun)</span></p>
  <div class="rangee"><button type="button" class="bt orange" data-act="g6go" data-v="a">${esc(prenom(t.J[ia]))}</button><button type="button" class="bt orange" data-act="g6go" data-v="b">${esc(prenom(t.J[ib]))}</button></div></section>`;
  return h;
}
function vNouvelleTable(){
  const L=(S.cfg&&S.cfg.eleves)||[],me=S.eleves.map(e=>e.nom).filter(n=>!dispIci().includes(n));
  const sel=(i)=>`<select id="g6j${i}"><option value="">— Joueur ${'ABCD'[i]} —</option>${L.map(n=>`<option${me[i]===n?' selected':''}>${esc(n)}</option>`).join('')}</select>`;
  // numéro de SCE proposé : la suivante de la dernière connue pour les élèves du groupe
  let der=0;me.forEach(n=>{const h=HIST()[n];if(h&&h.s)Object.keys(h.s).forEach(k=>der=Math.max(der,+k))});
  Object.values(tables()).forEach(t=>{if(t.J.some(j=>me.includes(j)))der=Math.max(der,t.sce)});
  const prop=Math.min(3,der+1);
  return `<h2>SCE · ma table de 4</h2>
  <section class="carte"><p style="margin-top:0">La SCE se joue <b>à 4, à la même table</b>, avec <b>un seul téléphone</b>. Chaque joueur dispute 2 matchs de 12 balles ; les deux autres observent et comptent les bonus.</p>
  <div class="g6k">SCE n°</div><div class="g6chips" id="g6sce">${[1,2,3].map(n=>`<button type="button" data-act="g6scen" data-v="${n}" class="${n===prop?'on':''}">SCE ${n}</button>`).join('')}</div>
  <label class="ch" for="g6tb">Table n°</label><input id="g6tb" type="text" inputmode="numeric" maxlength="2" placeholder="ex. 4" style="max-width:120px">
  <p class="g6k">Les 4 joueurs (de même niveau au classement ATP)</p>${[0,1,2,3].map(sel).join('')}
  <label class="ch" for="g6dsp">Marqueur dispensé(e) (facultatif)</label><select id="g6dsp"><option value="">— aucun —</option>${L.map(n=>`<option${dispIci()[0]===n?' selected':''}>${esc(n)}</option>`).join('')}</select>
  <div class="rangee" style="margin-top:12px"><button type="button" class="bt orange" data-act="g6creer">Créer la table</button></div></section>
  <section class="carte"><h3>Comment ça marche</h3><ol class="small" style="margin:0;padding-left:20px">
    <li>Avant chaque match, chaque joueur note ses points forts (1er match) ou les points faibles de son adversaire (2e match), puis son projet de jeu.</li>
    <li>Pendant le match, un observateur tient le téléphone. À chaque point, on touche le côté du joueur qui marque, puis son bonus : l’observateur de ce joueur l’annonce à voix haute.</li>
    <li>Après les 4 matchs, chacun voit son polygone et choisit ses 3 priorités.</li></ol></section>`;
}
function vObserve(t,mi){
  const m=t.m[mi],[ia,ib,oa,ob]=ROT[mi],s=scoreM(m),w=gagnantM(m);
  let h=`<section class="carte"><h3>Fin du match ${mi+1} : ${esc(prenom(t.J[w==='a'?ia:ib]))} gagne ${Math.max(s.a,s.b)}-${Math.min(s.a,s.b)}${m.dec?' (point décisif)':''}</h3>
  <p class="small muted">Les observateurs notent ce qu’ils ont repéré. Ça servira à l’observateur quand il affrontera ce joueur, à son 2e match.</p>`;
  [[oa,ia,'a'],[ob,ib,'b']].forEach(([o,p,c])=>{
    const key=o+'>'+p,sel=(t.obs&&t.obs[key])||{},bm=bonusMatch(m,c);
    h+=`<div style="border-top:1px solid var(--trait);margin-top:10px;padding-top:8px"><h3 style="font-size:20px">${esc(prenom(t.J[o]))}, qu’as-tu repéré chez ${esc(prenom(t.J[p]))} ?</h3>
    <p class="small muted" style="margin:0">Ses bonus : ${G26.br.map(b=>b.ic+' '+bm[b.k]).join(' · ')}</p>`;
    Object.entries(G26.faibles).forEach(([f,F])=>{h+=`<div class="g6k">${esc(F.n)} : ses points faibles</div>${chips('g6obs',F.L,sel[f],`data-k="${key}" data-f="${f}"`)}`});
    h+=`</div>`;
  });
  h+=`<div class="rangee" style="margin-top:12px"><button type="button" class="bt orange" data-act="g6suivant">${mi<3?'Match suivant →':'Voir les résultats →'}</button></div></section>`;
  return h;
}
function vResultats(t){
  const pal=PAL();
  let h=`<section class="carte"><h3>Résultats de la table</h3><table class="g6tab"><tr><th>Joueur</th>${G26.br.map(b=>`<th title="${esc(b.n)}">${b.ic}</th>`).join('')}<th>Victoires</th></tr>
  ${t.J.map((n,p)=>{const x=totaux(t,p);return `<tr><td><b>${esc(prenom(n))}</b></td>${x.v.map(v=>`<td>${v}</td>`).join('')}<td>${x.vic} / ${x.j}</td></tr>`}).join('')}</table>
  <p class="small muted" style="margin:8px 0 0">Chacun à son tour : son polygone, puis ses 3 priorités.</p></section>`;
  t.J.forEach((nom,p)=>{
    const tot=totaux(t,p),ser=seriesEleve(nom,S.seance),ch=(t.bil&&t.bil[p])||[];
    const min=Math.min(...tot.v),court=G26.br.filter((b,i)=>tot.v[i]===min);
    h+=`<section class="carte"><h3>${esc(nom)}</h3>${polygone(ser.length?ser:[{l:'SCE '+t.sce,v:tot.v,c:'#EA580C'}],pal)}
    ${ser.length>1?`<p class="small" style="text-align:center">${G26.br.map((b,i)=>{const d=tot.v[i]-ser[ser.length-2].v[i];return b.ic+' '+(d>0?'+'+d:d===0?'=':d)}).join(' · ')} <span class="muted">depuis la SCE ${ser[ser.length-2].l.slice(4)}</span></p>`:''}
    <div class="g6aide">💡 Ta branche la plus courte : <b>${court.map(b=>b.ic+' '+b.n).join(', ')}</b>. Tu choisis librement tes priorités.</div>
    <p class="g6k">Mes priorités (touche dans l’ordre : 1, 2, 3)</p>
    ${G26.br.map(b=>{const r=ch.indexOf(b.k);return `<button type="button" class="g6pri" data-act="g6ch" data-p="${p}" data-v="${b.k}"><span class="num" style="${r>=0?'background:'+b.col:''}">${r>=0?r+1:'–'}</span><span><b>${b.ic} ${esc(b.int)}</b><small>Savoir faire : ${esc(b.sf)}</small><small>Intérêt : ${esc(b.ip.join(' '))}</small></span></button>`}).join('')}
    ${ch.length?`<div class="g6va">➡️ Ta prochaine étape : <b>SRP ${G26.brK[ch[0]].srp} · ${esc(G26.srp[G26.brK[ch[0]].srp-1].t)}</b> (onglet SRP, sur le téléphone de ton groupe).</div>`:''}
    </section>`;
  });
  h+=`<section class="carte"><p class="small" style="margin-top:0">Fin de la SCE : envoie les résultats de la table au professeur (onglet <b>Envoyer</b>).</p>
  <button type="button" class="bt mini danger" data-act="g6effacer">Effacer cette table</button></section>`;
  return h;
}

/* ----- Tableau de marque de la SCE (plein écran) ----- */
let MK=null; // {pend:'a'|'b'|null}
function peindreMarque(){
  let z=document.getElementById('g6m');if(!MK){if(z)z.remove();return}
  if(!z){z=document.createElement('div');z.id='g6m';document.body.appendChild(z)}
  const t=T(),mi=t.cur,m=t.m[mi],[ia,ib]=ROT[mi],nom={a:t.J[ia],b:t.J[ib]},s=scoreM(m),n=(m.b||[]).length;
  let h=`<div class="rangee" style="justify-content:space-between"><b>SCE ${t.sce} · Match ${mi+1} · Balle ${Math.min(n+1,NB)} / ${NB}</b><button type="button" class="bt mini" data-act="g6mfermer">Fermer</button></div>
  <div class="g6bal">${[...Array(NB)].map((_,i)=>{const x=(m.b||[])[i];return `<i class="${x?x[0]+(x[1]&&x[1]!=='-'?' x':''):''}"></i>`}).join('')}</div>`;
  if(n>=NB&&s.a===s.b&&!m.dec){
    h+=`<div style="text-align:center;margin:auto"><h2>Égalité ${s.a}-${s.b}</h2><p>Point décisif (il ne compte pas dans les bonus) : qui le gagne ?</p><div class="rangee" style="justify-content:center">${['a','b'].map(c=>`<button type="button" class="bt" data-act="g6dec" data-v="${c}">${esc(nom[c])}</button>`).join('')}</div><p><button type="button" class="bt mini" data-act="g6annule">− Annuler la dernière balle</button></p></div>`;
  }else if(finiM(m)){
    const w=gagnantM(m);
    h+=`<div style="text-align:center;margin:auto"><h2>${esc(nom[w])} gagne ${Math.max(s.a,s.b)}-${Math.min(s.a,s.b)}</h2>
    ${['a','b'].map(c=>{const v=bonusMatch(m,c);return `<p>${esc(prenom(nom[c]))} : ${G26.br.map(b=>b.ic+' '+v[b.k]).join(' · ')}</p>`}).join('')}
    <div class="rangee" style="justify-content:center"><button type="button" class="bt" data-act="g6annule">− Annuler la dernière balle</button><button type="button" class="bt orange" data-act="g6mfin">Terminé</button></div></div>`;
  }else{
    const srv=srvDe(m.srv,n);
    h+=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${['a','b'].map(c=>`<button type="button" class="g6side${srv===c?' sert':''}${MK.pend===c?' choisi':''}" data-act="g6pt" data-v="${c}"><span class="nm">${esc(nom[c])}</span><span class="sc">${s[c]}</span>${srv===c?'<span class="sv">🏓 au service</span>':'<span class="sv">&nbsp;</span>'}</button>`).join('')}</div>`;
    if(MK.pend){const c=MK.pend,pj=m.av&&m.av[c]&&m.av[c].pj;
      h+=`<div style="background:#1b2533;border-radius:16px;padding:10px;margin-top:8px"><b>Point de ${esc(prenom(nom[c]))} : avec quel bonus ?</b>
      <div class="g6bon">${G26.br.filter(b=>b.k!=='R'||srv===c).map(b=>`<button type="button" style="background:${b.col}" data-act="g6bonus" data-v="${b.k}">${b.ic} ${esc(b.n)}<small>${esc(b.def)}</small></button>`).join('')}<button type="button" class="no" data-act="g6bonus" data-v="-">Aucun bonus</button></div>
      ${pj?`<p class="g6pj">🎯 Projet de ${esc(prenom(nom[c]))} : « ${esc(pj)} »</p>`:''}
      <p style="margin:8px 0 0"><button type="button" class="bt mini" data-act="g6pend">Annuler</button></p></div>`}
    else h+=`<p class="small" style="color:#9AA5B3;text-align:center;margin:10px 0">Touchez le côté du joueur qui marque. L’observateur de ce joueur annonce le bonus à voix haute.</p>
      ${n?`<p style="text-align:center"><button type="button" class="bt mini" data-act="g6annule">− Annuler la dernière balle</button></p>`:''}`;
  }
  z.innerHTML=h;
}

/* =================== SRP =================== */
function g6r(E,n){const r=rec(E.id,n==null?S.seance:n);r.g26=r.g26||{srp:[],stom:[]};r.g26.srp=r.g26.srp||[];r.g26.stom=r.g26.stom||[];return r}
function scoreSRP(x){const d=G26.srp.find(s=>s.k===x.k),w=(x.b||'').split('').filter(c=>c==='x'||c==='p').length,bo=(x.b||'').split('').filter(c=>c==='x').length,sc=w+bo*d.x;
  return {w,l:(x.b||'').split('').filter(c=>c==='o').length,bo,sc,deg:G26.degre(sc)}}
function srpFait(nom,k){let L=[];Object.values(S.d).forEach(D=>{});
  const E=S.eleves.find(e=>e.nom===nom);if(!E)return L;
  seancesDe(E.id).forEach(n=>{const r=S.d[E.id][n];((r.g26&&r.g26.srp)||[]).forEach(x=>{if(x.k===k&&(x.b||'').length>=NB)L.push(scoreSRP(x))})});return L}
/* ---------- Élève dispensé : il ne joue pas, il tient des rôles (AFL3) ---------- */
const dispIci=()=>S.eleves.filter(e=>{const r=(S.d[e.id]||{})[S.seance];return r&&r.disp}).map(e=>e.nom);
function caseDisp(r){return `<label class="coche disp" style="margin:0 0 10px"><input type="checkbox" data-ch="disp" ${r.disp?'checked':''}> Aujourd’hui je suis dispensé(e)</label>`}
function vDispense(E,quoi){
  const n=E.nom;let srp=0,arb=0,sce=0;
  S.eleves.forEach(x=>{const r=(S.d[x.id]||{})[S.seance];((r&&r.g26&&r.g26.srp)||[]).forEach(y=>{if(y.obs===n&&(y.b||'').length>=NB)srp++})});
  (S.atp&&S.atp[S.seance]||[]).forEach(m=>{if(m.fini&&m.arb===n)arb++});
  const t=T();if(t&&t.dsp===n)sce=1;
  return `<section class="carte"><h3>🩹 Dispensé(e) : tu tiens des rôles</h3>
  <p style="margin-top:0">${quoi} Tes rôles comptent pour l’<b>AFL3</b> :</p>
  <ul style="margin:0;padding-left:20px">
    <li><b>Marquer une SCE</b> : la table t’inscrit comme « marqueur » en créant la table ; tu tiens le téléphone pendant les 4 matchs et tu fais annoncer les bonus.</li>
    <li><b>Observer une SRP</b> : le joueur te choisit comme « Mon observateur » ; tu comptes ses points et ses bonus. À la fin, dis-lui une chose réussie et une chose à travailler.</li>
    <li><b>Arbitrer au tournoi ATP</b> : onglet ATP, tu saisis les matchs.</li></ul>
  <p class="small" style="margin:10px 0 0"><b>Noté sur ce téléphone aujourd’hui :</b> ${sce?'SCE marquée · ':''}${srp} SRP observée${srp>1?'s':''} · ${arb} match${arb>1?'s':''} ATP arbitré${arb>1?'s':''}. Ce que tu fais sur le téléphone d’un camarade part avec son envoi.</p></section>`;
}
function vSRP(){
  const E=elv(),r=g6r(E),ch=choixDe(E.nom),cur=S.g6k&&S.g6k[E.id]||ch[0]||'R';
  const L=r.g26.srp;
  let h=`<h2>SRP · ${esc(E.nom)}</h2>`+caseDisp(r);
  if(r.disp)return h+vDispense(E,'Pas de match à thème aujourd’hui.');
  const enCours=L.findIndex(x=>(x.b||'').length<NB);
  if(enCours>=0)h+=`<section class="carte"><h3>Match en cours</h3><p>SRP ${G26.brK[L[enCours].k].srp} contre ${esc(L[enCours].adv||'?')} · balle ${L[enCours].b.length+1} sur ${NB}</p><button type="button" class="bt orange" data-act="g6sm" data-v="${enCours}">Reprendre</button></section>`;
  h+=ch.length?`<div class="g6aide">🎯 Ton bilan de SCE : ${ch.map((k,i)=>(i+1)+'. '+G26.brK[k].n).join(' · ')}</div>`:`<p class="small muted">Pas encore de bilan de SCE : choisis la SRP qui te semble utile.</p>`;
  const ord=ch.concat(KS.filter(k=>!ch.includes(k)));
  h+=ord.map(k=>{const d=G26.srp[G26.brK[k].srp-1],b=G26.brK[k],f=srpFait(E.nom,k),r2=ch.indexOf(k);
    return `<button type="button" class="g6sr${cur===k?' on':''}" style="--c:${b.col}" data-act="g6srp" data-v="${k}"><b>SRP ${d.n} · ${esc(d.t)}</b><small>${esc(d.titre)} · bonus ×${d.x}</small>
    <em>${r2>=0?'Mon '+(r2?r2+1+'e':'1er')+' choix · ':''}${f.length?f.length+' match'+(f.length>1?'s':'')+' · meilleur : degré '+Math.max(...f.map(x=>x.deg)):'pas encore jouée'}</em></button>`}).join('');
  const d=G26.srp[G26.brK[cur].srp-1],cl=(S.cfg&&S.cfg.eleves||[]).filter(n=>n!==E.nom),sel=S.g6sel||{};
  h+=`<section class="carte"><h3>SRP ${d.n} · ${esc(d.t)}</h3><p style="margin-top:0">${esc(d.obj)}</p><p class="small"><b>Bonus ×${d.x} :</b> ${esc(d.bon)}.</p>
  <label class="ch" for="g6adv">Adversaire (proche de toi au classement ATP)</label><select id="g6adv"><option value="">— Choisir —</option>${cl.map(n=>`<option${sel.adv===n?' selected':''}>${esc(n)}</option>`).join('')}</select>
  <label class="ch" for="g6ob">Mon observateur</label><select id="g6ob"><option value="">— Choisir —</option>${cl.map(n=>`<option${sel.obs===n?' selected':''}>${esc(n)}</option>`).join('')}</select>
  <p style="margin:12px 0 4px"><b>Qui sert en premier ?</b></p><div class="rangee"><button type="button" class="bt orange" data-act="g6sgo" data-v="moi">${esc(prenom(E.nom))}</button><button type="button" class="bt orange" data-act="g6sgo" data-v="adv">L’adversaire</button></div></section>`;
  const faits=L.map((x,i)=>[x,i]).filter(([x])=>(x.b||'').length>=NB);
  if(faits.length){
    h+=`<section class="carte"><h3>Mes matchs à thème aujourd’hui</h3><table class="g6tab"><tr><th>SRP</th><th>Contre</th><th>Score</th><th>Degré</th></tr>${faits.map(([x,i])=>{const s=scoreSRP(x);return `<tr><td>${G26.brK[x.k].ic} ${G26.brK[x.k].srp}</td><td>${esc(prenom(x.adv))}</td><td><b>${s.sc}</b> <span class="small muted">(${s.w}-${s.l})</span></td><td>${s.deg}</td></tr>`}).join('')}</table></section>`;
    const [x]=faits[faits.length-1],dd=G26.srp.find(s=>s.k===x.k),qs=dd.q[(faits.filter(([y])=>y.k===x.k).length-1)%dd.q.length];
    h+=`<section class="carte"><h3>Des questions à se poser, avec ton observateur</h3>${qs.map(q=>`<div class="g6q">${esc(q)}</div>`).join('')}
    <div class="rangee" style="margin-top:12px"><button type="button" class="bt orange" data-act="g6versstom" data-v="${x.k}">Travailler en STOM →</button></div></section>`;
  }
  return h;
}
let SM=null; // {i}
function peindreSRP(){
  let z=document.getElementById('g6m');if(!SM){if(z)z.remove();return}
  if(!z){z=document.createElement('div');z.id='g6m';document.body.appendChild(z)}
  const E=elv(),r=g6r(E),x=r.g26.srp[SM.i],d=G26.srp.find(s=>s.k===x.k),b=G26.brK[x.k],n=x.b.length,s=scoreSRP(x);
  const moiSert=srvDe(x.srv,n)==='a';
  let h=`<div class="rangee" style="justify-content:space-between"><b>SRP ${d.n} · ${esc(d.t)} · Balle ${Math.min(n+1,NB)} / ${NB}</b><button type="button" class="bt mini" data-act="g6smfermer">Fermer</button></div>
  <div class="g6bal">${[...Array(NB)].map((_,i)=>{const c=x.b[i];return `<i class="${c==='o'?'b':c?'a'+(c==='x'?' x':''):''}"></i>`}).join('')}</div>
  <div class="g6big"><div><small>Score parlant de ${esc(prenom(E.nom))}</small><b>${s.sc}</b><small>degré ${s.deg}</small></div><div><small>Score du match</small><b class="m">${s.w} – ${s.l}</b><small>${esc(prenom(E.nom))} – ${esc(prenom(x.adv))}</small></div></div>
  <p class="small" style="text-align:center;color:#9AA5B3;margin:0">${s.w} point${s.w>1?'s':''} × 1 + ${s.bo} bonus × ${d.x} = ${s.sc}</p>`;
  if(n>=NB){
    h+=`<div style="text-align:center;margin:14px 0"><h2>Fin du match : ${s.sc} points · degré ${s.deg}</h2><p>${s.w>s.l?'Victoire':s.w<s.l?'Défaite':'Égalité'} ${s.w}-${s.l}</p>
    <div class="rangee" style="justify-content:center"><button type="button" class="bt" data-act="g6sannule">− Annuler la dernière balle</button><button type="button" class="bt orange" data-act="g6smfermer">Terminé</button></div></div>`;
  }else if(d.tm&&n===d.tm&&!x.tmok){
    h+=`<div style="background:#1b2533;border-radius:16px;padding:12px;margin-top:10px"><h3 style="color:#fff">Temps mort à 6 balles</h3><p>Avec ton observateur : comment gagnes-tu tes points ? Et lui ? Quel est son point faible majeur ?</p>
    <label class="ch" for="g6tm">Notre tactique pour les balles 7 à 12</label><textarea id="g6tm" rows="2" style="color:#172033">${esc(x.tm||'')}</textarea>
    <p><button type="button" class="bt orange" data-act="g6tmok">Reprendre le match</button></p></div>`;
  }else{
    const bonusOk=(!d.serv||moiSert)&&(!d.tm||n>=d.tm);
    h+=`<p style="margin:10px 0 4px">${moiSert?'🏓 '+esc(prenom(E.nom))+' sert':'🏓 '+esc(prenom(x.adv))+' sert'} · Balle ${n+1} : qui gagne ?</p>
    <div class="g6bon">${bonusOk?`<button type="button" style="background:${b.col};grid-column:span 2" data-act="g6sb" data-v="x">${b.ic} ${esc(prenom(E.nom))} · ${esc(b.n)}<small>${esc(d.bon)} · +${1+d.x}</small></button>`:''}
    <button type="button" style="background:#16A34A" data-act="g6sb" data-v="p">${esc(prenom(E.nom))} · point<small>+1</small></button>
    <button type="button" style="background:#3b4452" data-act="g6sb" data-v="o">${esc(prenom(x.adv))} · point<small>+0</small></button></div>
    ${x.k==='K'?'<p class="g6pj">« PAN ! » crié mais point perdu → point de l’adversaire.</p>':''}
    ${d.serv&&!moiSert?'<p class="g6pj">Bonus seulement sur tes services.</p>':''}${d.tm&&n<d.tm?'<p class="g6pj">Balles 1 à 6 : on observe. Le bonus compte à partir de la balle 7.</p>':''}
    ${n?'<p style="text-align:center"><button type="button" class="bt mini" data-act="g6sannule">− Annuler la dernière balle</button></p>':''}`;
  }
  h+=`<div class="g6deg">${['D1','D2','D3','D4'].map((l,i)=>`<i class="${s.deg===i+1?'on':''}">${l}</i>`).join('')}</div>
  <div class="rangee" style="justify-content:space-between;font-size:12px;color:#9AA5B3;margin-top:2px"><span>0</span><span>${G26.degres[0]}</span><span>${G26.degres[1]}</span><span>${G26.degres[2]}</span><span>130</span></div>`;
  z.innerHTML=h;
}

/* =================== STOM =================== */
function niveauStom(E,k,at){let best=0;seancesDe(E.id).forEach(n=>{const r=S.d[E.id][n];((r.g26&&r.g26.stom)||[]).forEach(y=>{if(y.k===k&&y.at===at)best=Math.max(best,y.ok||0)})});return best}
function okEssai(a,nv,v){if(v===''||v==null||isNaN(v))return false;return a.moins?+v<a.s[nv-1]:+v>=a.s[nv-1]}
function vSTOM(){
  const E=elv(),r=g6r(E),SL=S.g6s||(S.g6s={});
  const ch=choixDe(E.nom),lastS=[...r.g26.srp].reverse().find(x=>(x.b||'').length>=NB);
  const k=SL[E.id]&&SL[E.id].k||(lastS&&lastS.k)||ch[0]||'R',at=SL[E.id]&&SL[E.id].k===k?SL[E.id].at:null;
  const D=G26.stom.find(s=>s.k===k),b=G26.brK[k];
  if(r.disp)return `<h2>STOM · ${esc(E.nom)}</h2>`+caseDisp(r)+vDispense(E,'Pas d’atelier aujourd’hui.')+`<section class="carte"><p class="small" style="margin:0">Tu peux aussi aider un camarade en atelier : compter ses essais et vérifier le critère du niveau.</p></section>`;
  if(at){const a=D.at[at-1];
    let x=r.g26.stom.find(y=>y.k===k&&y.at===at);
    const nv=(x&&x.nv)||Math.min(2,niveauStom(E,k,at)+1);
    const vid=a.ex&&window.VID&&VID.ex[a.ex],src=a.ex&&typeof IMG_EX!=='undefined'&&IMG_EX.has(a.ex)?'img/ex'+a.ex+'.jpg':'';
    const ess=(x&&x.e)||[];
    return `<h2>${b.ic} ${esc(a.jeu)} <span class="small muted" style="font-weight:400">· STOM ${esc(D.t)}, atelier ${a.n}</span></h2>
    <p style="margin:0"><button type="button" class="bt mini" data-act="g6stomliste">← Les 3 ateliers</button></p>
    ${src||vid?illustration(src,vid,a.jeu,''):`<div class="illus sans"><span class="sansimg">${esc(a.t)}</span><span class="lv">Image et vidéo à venir</span></div>`}
    ${a.ex&&(a.pr==='proche'||a.pr==='partielle')?`<p class="avert small">⚠ La vidéo montre une <b>variante</b> de cet atelier : suis la <b>consigne écrite</b> ci-dessous.</p>`:''}${a.vn?`<p class="avert small">⚠ ${esc(a.vn)}</p>`:''}
    <section class="carte"><h3>${esc(a.t)}</h3><p style="margin-top:0"><b>Consigne :</b> ${esc(a.c)} <span class="small muted">(1 joueur, 1 observateur, ${a.b} balles)</span></p>
    <div class="g6k">Critères de réalisation</div><ul class="small" style="margin:0;padding-left:20px">${a.cr.map(c=>`<li>${esc(c)}</li>`).join('')}</ul>
    <div class="g6k">Critères de réussite</div><div class="g6chips">${[1,2].map(v=>`<button type="button" data-act="g6nv" data-v="${v}" class="${nv===v?'on':''}">Niveau ${v} : ${esc(a.nv[v-1])}</button>`).join('')}</div></section>
    <section class="carte"><h3>Mes essais <span class="small muted" style="font-weight:400">· ${esc(a.u)}${a.moins?' (moins, c’est mieux)':''}, sur ${a.b}</span></h3>
    <div class="g6ess">${[0,1,2,3,4].map(i=>`<label>Essai ${i+1}<input type="number" inputmode="numeric" min="0" max="${a.b}" data-g6="ess" data-i="${i}" value="${ess[i]==null?'':esc(ess[i])}" class="${okEssai(a,nv,ess[i])?'ok':''}"></label>`).join('')}</div>
    ${x&&x.ok>=nv?`<div class="g6aide">🎉 Niveau ${nv} atteint !${nv<2?' Essaie maintenant le niveau 2.':''}</div>`:`<p class="small muted">Objectif niveau ${nv} : ${esc(a.nv[nv-1])}.</p>`}
    <p class="small muted">L’observateur compte et note chaque essai.</p></section>
    <div class="g6va">↩️ Après l’atelier, je retourne jouer la <b>SRP ${b.srp} · ${esc(G26.srp[b.srp-1].t)}</b> pour réinvestir. <button type="button" class="bt mini" data-act="g6verssrp" data-v="${k}">Aller en SRP</button></div>`;
  }
  return `<h2>STOM · ${esc(E.nom)}</h2>
  <div class="g6chips">${G26.stom.map(s=>`<button type="button" data-act="g6stom" data-v="${s.k}" class="${s.k===k?'on':''}">${G26.brK[s.k].ic} ${esc(s.t)}</button>`).join('')}</div>
  <section class="carte" style="border-top:6px solid ${b.col}"><h3>STOM ${esc(D.t)}</h3><p class="small muted" style="margin-top:0">${esc(D.titre)} · 3 ateliers au choix, avec ton observateur.</p>
  ${D.at.map(a=>{const lv=niveauStom(E,k,a.n),src=a.ex&&typeof IMG_EX!=='undefined'&&IMG_EX.has(a.ex)?'img/ex'+a.ex+'.jpg':'';
    return `<button type="button" class="g6at" data-act="g6atelier" data-v="${a.n}">${src?`<img src="${src}" alt="" loading="lazy">`:`<span class="ph">${b.ic}</span>`}<span><b>${a.n} · ${esc(a.jeu)}</b><small>${esc(a.t)} · ${a.b} balles</small><span class="g6nv${lv?' n'+lv:''}">${lv?'Niveau '+lv+' ✓':'À faire'}</span></span></button>`}).join('')}</section>
  <div class="g6va">↩️ Règle : après un atelier, je retourne jouer la <b>SRP ${b.srp} · ${esc(G26.srp[b.srp-1].t)}</b>.</div>`;
}

/* =================== Export, fichiers, QR =================== */
function exportEleve(E,n){
  const r=(S.d[E.id]||{})[n];if(!r||!r.g26)return null;
  const srp=(r.g26.srp||[]).filter(x=>(x.b||'').length).map(x=>{const s=scoreSRP(x);return {k:x.k,adv:x.adv||'',obs:x.obs||'',srv:x.srv,b:x.b,tm:x.tm||'',score:s.sc,degre:s.deg,fini:x.b.length>=NB}});
  const stom=(r.g26.stom||[]).filter(y=>(y.e||[]).some(v=>v!==''&&v!=null)).map(y=>({k:y.k,at:y.at,nv:y.nv||1,e:y.e,ok:y.ok||0}));
  return srp.length||stom.length?{srp,stom}:null;
}
function tableBrute(t,n){
  return {app:'tennis-de-table-eleves',version:VERSION,type:'sce',activite:'Tennis de table',classe:S.classe,seance:n,date:today(),exportedAt:new Date().toISOString(),
    sce:t.sce,table:t.tab,joueurs:t.J.slice(),
    matchs:t.m.map((m,mi)=>({ordre:ROT[mi],srv:m.srv||null,b:(m.b||[]).map(x=>x[0]+(x[1]||'-')).join(''),dec:m.dec||null,av:m.av||null})),
    obs:t.obs||{},bilans:t.bil||{},marqueur:t.dsp||'',
    totaux:t.J.map((j,p)=>{const x=totaux(t,p);return {joueur:j,R:x.v[0],A:x.v[1],K:x.v[2],T:x.v[3],victoires:x.vic,choix:(t.bil&&t.bil[p])||[]}}),
    saisiPar:S.eleves.map(e=>e.nom).join(', ')};
}
function fichiers(n){const t=tables()[n],atp=window.ATP26?ATP26.fichiers(n):[];if(!t||!t.m.some(m=>(m.b||[]).length))return atp;
  return atp.concat([{nom:TTL.nomFichier(S.classe,'Table'+t.tab,n,'sce'+t.sce),o:tableBrute(t,n)}])}
async function qrs(n){const t=tables()[n],atp=window.ATP26?await ATP26.qrs(n):[];if(!t||!t.m.some(m=>(m.b||[]).length))return atp;
  const cut=(s,k)=>String(s||'').slice(0,k);
  const q={a:'TTE',v:1,t:'S',c:S.classe,s:n,d:today(),ts:Math.round(Date.now()/1000),n:t.sce,tb:t.tab,j:t.J,
    m:t.m.map(m=>[m.srv||'',(m.b||[]).map(x=>x[0]+(x[1]||'-')).join(''),m.dec||'',m.av?['a','b'].map(c=>m.av[c]?[cut(m.av[c].pj,90),Object.values(m.av[c].f||{}).flat().slice(0,6),(m.av[c].fo||[]).slice(0,4)]:0):0]),
    bl:t.bil||{}};if(t.dsp)q.dsp=t.dsp;
  return atp.concat([{titre:'SCE '+t.sce+' · table '+t.tab+' (les 4 joueurs)',txt:await chaineBrute(q)}]);
}

/* =================== Actions =================== */
const prec=window.EPLUS&&EPLUS.clic;
window.EPLUS=window.EPLUS||{};
EPLUS.clic=async function(a,v,b,ev){
  if(a.slice(0,2)!=='g6')return prec?prec(a,v,b,ev):false;
  if(!S)return true;
  const t=T();
  switch(a){
    case 'g6scen':document.querySelectorAll('#g6sce button').forEach(x=>x.classList.toggle('on',x===b));return true;
    case 'g6creer':{
      const J=[0,1,2,3].map(i=>($('#g6j'+i)||{}).value||'').map(s=>s.trim());
      if(J.some(j=>!j)){toast('Choisis les 4 joueurs.');return true}
      if(new Set(J).size<4){toast('Un joueur est choisi deux fois.');return true}
      const dsp=($('#g6dsp')||{}).value||'',dj=J.find(j=>j===dsp||dispIci().includes(j));
      if(dj){toast(dj+' est dispensé(e) aujourd’hui : il marque, il ne joue pas.');return true}
      const tab=($('#g6tb').value||'').replace(/\D/g,'');if(!tab){toast('Indique le numéro de la table.');return true}
      const sb=document.querySelector('#g6sce button.on');
      tables()[S.seance]={sce:sb?+sb.dataset.v:1,tab,J,m:ROT.map(()=>({b:[],etape:0,av:{}})),obs:{},bil:{},cur:0};if(dsp)tables()[S.seance].dsp=dsp;
      modif();sauver();rendre();window.scrollTo(0,0);return true}
    case 'g6fai':case 'g6for':{const m=t.m[t.cur],c=b.dataset.c;m.av=m.av||{};const av=m.av[c]=m.av[c]||{};
      if(a==='g6fai'){av.f=av.f||{};const L=av.f[b.dataset.f]=av.f[b.dataset.f]||[];const i=L.indexOf(v);if(i>=0)L.splice(i,1);else L.push(v)}
      else{av.fo=av.fo||[];const i=av.fo.indexOf(v);if(i>=0)av.fo.splice(i,1);else av.fo.push(v)}
      b.classList.toggle('on');modif();sauver();return true}
    case 'g6obs':{t.obs=t.obs||{};const o=t.obs[b.dataset.k]=t.obs[b.dataset.k]||{},L=o[b.dataset.f]=o[b.dataset.f]||[];const i=L.indexOf(v);if(i>=0)L.splice(i,1);else L.push(v);
      b.classList.toggle('on');modif();sauver();return true}
    case 'g6go':{const m=t.m[t.cur];m.srv=v;m.etape=1;
      // le 2e match : la fiche « points faibles » part de ce que le joueur a observé
      modif();sauver();MK={pend:null};peindreMarque();return true}
    case 'g6marque':MK={pend:null};peindreMarque();return true;
    case 'g6mfermer':MK=null;peindreMarque();rendre();return true;
    case 'g6pt':MK.pend=MK.pend===v?null:v;peindreMarque();return true;
    case 'g6pend':MK.pend=null;peindreMarque();return true;
    case 'g6bonus':{const m=t.m[t.cur];if(!MK||!MK.pend)return true;m.b.push([MK.pend,v]);MK.pend=null;modif();sauver();
      try{navigator.vibrate&&navigator.vibrate(20)}catch(e){}peindreMarque();return true}
    case 'g6annule':{const m=t.m[t.cur];if(m.dec)delete m.dec;else m.b.pop();modif();sauver();peindreMarque();return true}
    case 'g6dec':{const m=t.m[t.cur];m.dec=v;modif();sauver();peindreMarque();return true}
    case 'g6mfin':{const m=t.m[t.cur];m.etape=2;MK=null;peindreMarque();modif();sauver();rendre();window.scrollTo(0,0);return true}
    case 'g6suivant':{const m=t.m[t.cur];m.etape=3;
      // préremplir la fiche du match suivant à partir de l'observation
      if(t.cur<3){t.cur++;const nm=t.m[t.cur],[ia,ib]=ROT[t.cur];nm.av=nm.av||{};
        [['a',ia,ib],['b',ib,ia]].forEach(([c,p,adv])=>{const o=t.obs&&t.obs[p+'>'+adv];if(o&&!nm.av[c])nm.av[c]={f:JSON.parse(JSON.stringify(o))}})}
      modif();sauver();rendre();window.scrollTo(0,0);return true}
    case 'g6ch':{const p=+b.dataset.p;t.bil=t.bil||{};const L=t.bil[p]=t.bil[p]||[];const i=L.indexOf(v);if(i>=0)L.splice(i,1);else if(L.length<3)L.push(v);else{toast('3 priorités au maximum : retire-en une.');return true}
      modif();sauver();rendre();return true}
    case 'g6effacer':if(!confirm('Effacer toute la table de cette séance (scores, bonus, bilans) ?'))return true;delete tables()[S.seance];modif();sauver();rendre();return true;
    // SRP
    case 'g6srp':{S.g6k=S.g6k||{};S.g6k[elv().id]=v;sauver();rendre();return true}
    case 'g6sgo':{const E=elv(),r=g6r(E),adv=$('#g6adv').value,obs=$('#g6ob').value,k=(S.g6k&&S.g6k[E.id])||choixDe(E.nom)[0]||'R';
      if(!adv){toast('Choisis ton adversaire.');return true}
      if(obs&&obs===adv){toast('L’observateur ne peut pas être ton adversaire.');return true}
      S.g6sel={adv,obs};r.g26.srp.push({k,adv,obs,srv:v==='moi'?'a':'b',b:''});touche(r);sauver();SM={i:r.g26.srp.length-1};peindreSRP();return true}
    case 'g6sm':SM={i:+v};peindreSRP();return true;
    case 'g6smfermer':SM=null;peindreSRP();rendre();return true;
    case 'g6sb':{const r=g6r(elv()),x=r.g26.srp[SM.i];if(x.b.length>=NB)return true;x.b+=v;touche(r);sauver();try{navigator.vibrate&&navigator.vibrate(20)}catch(e){}peindreSRP();return true}
    case 'g6sannule':{const r=g6r(elv()),x=r.g26.srp[SM.i];x.b=x.b.slice(0,-1);if(x.b.length<6)delete x.tmok;touche(r);sauver();peindreSRP();return true}
    case 'g6tmok':{const r=g6r(elv()),x=r.g26.srp[SM.i];x.tm=($('#g6tm').value||'').trim();x.tmok=1;touche(r);sauver();peindreSRP();return true}
    case 'g6versstom':S.g6s=S.g6s||{};S.g6s[elv().id]={k:v,at:null};S.tab='stom';sauver();rendre();window.scrollTo(0,0);return true;
    case 'g6verssrp':S.g6k=S.g6k||{};S.g6k[elv().id]=v;S.tab='srp';sauver();rendre();window.scrollTo(0,0);return true;
    // STOM
    case 'g6stom':S.g6s=S.g6s||{};S.g6s[elv().id]={k:v,at:null};sauver();rendre();return true;
    case 'g6atelier':{S.g6s=S.g6s||{};const E=elv(),cur=S.g6s[E.id]||{};const r=g6r(E),lastS=[...r.g26.srp].reverse().find(x=>(x.b||'').length>=NB);
      S.g6s[E.id]={k:cur.k||(lastS&&lastS.k)||choixDe(E.nom)[0]||'R',at:+v};sauver();rendre();window.scrollTo(0,0);return true}
    case 'g6stomliste':{const E=elv();S.g6s[E.id].at=null;sauver();rendre();return true}
    case 'g6nv':{const E=elv(),r=g6r(E),{k,at}=S.g6s[E.id];let x=r.g26.stom.find(y=>y.k===k&&y.at===at);if(!x){x={k,at,nv:+v,e:[],ok:0};r.g26.stom.push(x)}x.nv=+v;
      const a=G26.stom.find(s=>s.k===k).at[at-1];x.ok=Math.max(x.ok||0,...[1,2].filter(l=>x.e.some(e=>okEssai(a,l,e))&&l<=x.nv));touche(r);sauver();rendre();return true}
  }
  return true;
};
// Saisies (texte, essais)
document.addEventListener('input',ev=>{
  const t=ev.target,c=t.dataset&&t.dataset.g6;if(!c||!S)return;
  if(c==='pj'){const tb=T(),m=tb.m[tb.cur];m.av=m.av||{};const av=m.av[t.dataset.c]=m.av[t.dataset.c]||{};av.pj=t.value;modif();sauver();return}
  if(c==='ess'){const E=elv(),r=g6r(E),{k,at}=S.g6s[E.id],a=G26.stom.find(s=>s.k===k).at[at-1];
    let x=r.g26.stom.find(y=>y.k===k&&y.at===at);
    if(!x){x={k,at,nv:Math.min(2,niveauStom(E,k,at)+1),e:[],ok:0};r.g26.stom.push(x)}
    const v=t.value.replace(/\D/g,'').slice(0,3);x.e[+t.dataset.i]=v===''?'':Math.min(a.b,+v);
    t.classList.toggle('ok',okEssai(a,x.nv,x.e[+t.dataset.i]));
    const avant=x.ok||0;if(okEssai(a,x.nv,x.e[+t.dataset.i]))x.ok=Math.max(avant,x.nv);
    touche(r);sauver();if(x.ok>avant){toast('🎉 Niveau '+x.ok+' atteint !');setTimeout(rendre,50)}
  }
});

/* =================== Branchement dans l'appli =================== */
window.G26V={
  actif:PA,
  onglets:()=>[['sce','🧪','SCE'],['srp','🏓','SRP'],['stom','🛠️','STOM'],['atp','🥇','ATP'],['poule','🏆','Poule'],['regles','📖','Règles'],['envoi','📤','Envoyer']],
  vues:()=>({sce:vSCE,srp:vSRP,stom:vSTOM,atp:()=>window.ATP26?ATP26.vue():''}),
  parEleve:['srp','stom'],
  export:exportEleve,fichiers,qrs,
  polygone,totaux
};
})();
