/* =====================================================================
   atp26.js — Tournoi ATP (règlement d'Arnaud Boissière), parcours GAREEPS 2026
   - L'arbitre saisit le match sur le téléphone de la table (11 points, 10-10 = point décisif).
   - Le match est gardé sur le téléphone (S.atp[séance]) et part avec la séance (fichier ou QR).
   - Si le professeur a réglé un document Grist (lien dans le QR de la classe), chaque match
     part aussi tout de suite dans Grist (prénom + initiale seulement) : classement en direct
     sur l'écran du professeur. Sans réseau, il attend et repart dès que possible.
   ===================================================================== */
(function(){
'use strict';
const A=G26.atp;
const liste=()=>(S&&S.cfg&&S.cfg.eleves)||[];
let LIVE=null; // {t, m:[{a,b,sa,sb,ts}], ref:{nom:nombre de refus du jour}} lu dans Grist
const depart=()=>(S&&S.cfg&&S.cfg.atp)||null;        // {s:séance, p:{nom:points cumulés}} envoyé par le prof
const rangs=()=>G26.rangs(liste(),(depart()||{}).p);
// Rangs pour le calcul des points : sans les absents du jour (liste envoyée par le prof), rang égal à points égaux
const absJour=()=>{const d=depart();return d&&d.s===S.seance&&Array.isArray(d.ab)?d.ab:[]};
const joueJour=()=>matchs().flatMap(m=>[m.a,m.b]).concat(LIVE?LIVE.m.flatMap(m=>[m.a,m.b]):[]);
const rangsG=()=>G26.rangsG(liste(),(depart()||{}).p,absJour(),joueJour());
const pts=n=>+(((depart()||{}).p||{})[n]||0);
const matchs=()=>{S.atp=S.atp||{};return S.atp[S.seance]||(S.atp[S.seance]=[])};
const prenom=n=>String(n||'').split(/\s+/).find(x=>!(x.length>1&&x===x.toUpperCase()))||String(n||'').split(/\s+/)[0];
const gristDoc=()=>{const u=S&&S.cfg&&S.cfg.gr;if(!u)return null;const m=/^(https:\/\/[^/]+)\/(?:o\/[^/]+\/)?(?:doc\/)?([A-Za-z0-9]{8,})/.exec(u);return m?{base:m[1],id:m[2]}:null};

/* ---------- Envoi vers Grist ---------- */
let envoiEnCours=false;
async function envoyer(){
  const g=gristDoc();if(!g||!S||envoiEnCours||!navigator.onLine)return;
  const att=[];Object.entries(S.atp||{}).forEach(([n,L])=>L.forEach(m=>{if(!m.gr&&m.fini)att.push([+n,m])}));
  if(!att.length)return;
  envoiEnCours=true;
  const C=G26.courts(liste()),c=n=>C[n]||G26.court(n);
  const url=g.base+'/api/docs/'+g.id+'/tables/'+A.table+'/records';
  const corps=JSON.stringify({records:att.map(([n,m])=>({fields:{uid:m.id,classe:S.classe,seance:n,date:m.d,j1:c(m.a),j2:c(m.b),s1:m.sa,s2:m.sb,arb:m.arb?c(m.arb):'',ts:m.ts,av1:m.av1||'',av2:m.av2||''}}))});
  try{
    let r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:corps});
    if(r.status===404||r.status===400){ // la table n'existe pas encore : on la crée
      await fetch(g.base+'/api/docs/'+g.id+'/tables',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tables:[{id:A.table,columns:[
        {id:'uid',fields:{label:'Identifiant'}},{id:'classe',fields:{label:'Classe'}},{id:'seance',fields:{label:'Séance',type:'Int'}},{id:'date',fields:{label:'Date'}},
        {id:'j1',fields:{label:'Joueur 1'}},{id:'j2',fields:{label:'Joueur 2'}},{id:'s1',fields:{label:'Score 1',type:'Int'}},{id:'s2',fields:{label:'Score 2',type:'Int'}},
        {id:'arb',fields:{label:'Arbitre'}},{id:'ts',fields:{label:'Horodatage',type:'Int'}},{id:'av1',fields:{label:'Avatar 1'}},{id:'av2',fields:{label:'Avatar 2'}}]}]})});
      r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:corps});
    }
    if(r.status===400){ // table créée avant les avatars : on ajoute les colonnes
      await fetch(g.base+'/api/docs/'+g.id+'/tables/'+A.table+'/columns',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({columns:[{id:'av1',fields:{label:'Avatar 1'}},{id:'av2',fields:{label:'Avatar 2'}}]})});
      r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:corps});
    }
    if(r.ok){att.forEach(([n,m])=>m.gr=Date.now());sauver();if(S.tab==='atp')rendre()}
  }catch(e){}
  envoiEnCours=false;
}
setInterval(envoyer,20000);window.addEventListener('online',envoyer);

/* ---------- Classement en direct (mode en ligne : lu dans Grist) ---------- */
// LIVE : voir plus haut
async function lireDirect(){
  const g=gristDoc();if(!g||!S||!navigator.onLine)return;
  try{const r=await fetch(g.base+'/api/docs/'+g.id+'/tables/'+A.table+'/records?filter='+encodeURIComponent(JSON.stringify({classe:[S.classe],seance:[S.seance]})));
    if(!r.ok)return;const C=G26.courts(liste()),inv={};Object.entries(C).forEach(([n,k])=>inv[k]=n);
    const vus={},L=[],ref={};(await r.json()).records.forEach(({fields:f})=>{if(!f.uid||vus[f.uid])return;vus[f.uid]=1;
      if(f.j2==='REFUS'){const n=inv[f.j1]||f.j1;if(+f.s1)ref[n]=+f.s1;return} // refus notés par le professeur
      L.push({id:f.uid,a:inv[f.j1]||f.j1,b:inv[f.j2]||f.j2,sa:+f.s1,sb:+f.s2,ts:+f.ts||0})});
    // les matchs de ce téléphone pas encore partis comptent aussi
    matchs().filter(m=>m.fini&&!vus[m.id]).forEach(m=>L.push({id:m.id,a:m.a,b:m.b,sa:m.sa,sb:m.sb,ts:m.ts}));
    LIVE={t:Date.now(),m:L,ref};
    const f=document.activeElement;if(S.tab==='atp'&&!MQ6&&!document.querySelector('#modal .voile')&&!(f&&/SELECT|INPUT|TEXTAREA/.test(f.tagName)))rendre();
  }catch(e){}
}
setInterval(()=>{if(S&&S.tab==='atp')lireDirect()},15000);
function vDirect(){
  const g=gristDoc(),R=rangs(),RG=rangsG(),L=liste();
  const ens=LIVE&&g&&navigator.onLine&&Date.now()-LIVE.t<60000;
  const tot={},J={};L.forEach(n=>{tot[n]=pts(n);J[n]={v:0,d:0,g:0,r:0}});
  if(ens)LIVE.m.forEach(m=>{const w=m.sa>m.sb?m.a:m.b,l=w===m.a?m.b:m.a;if(!(w in tot)||!(l in tot))return;const gn=G26.atpGain(RG[w]||L.length,RG[l]||L.length);tot[w]+=gn;tot[l]+=A.perdu;J[w].v++;J[w].g+=gn;J[l].d++;J[l].g+=A.perdu});
  if(ens)Object.entries(LIVE.ref||{}).forEach(([n,nb])=>{if(n in tot){tot[n]+=A.refus*nb;J[n].g+=A.refus*nb;J[n].r=nb}});
  const RT=G26.rangs(L,tot),ord=L.slice().sort((x,y)=>RT[x]-RT[y]),mine=new Set(S.eleves.map(e=>e.nom));
  return `<section class="carte"><h3>${ens?'🔴 Classement en direct':'Classement de départ'}</h3>
  <p class="small muted" style="margin-top:0">${ens?'Mis à jour toutes les 15 s depuis les matchs de toute la classe.':g?'Pas de réseau pour l’instant : classement du début de séance. Le direct est sur la borne.':'Classement du début de séance. Le classement en direct est sur la borne.'} Les points de chaque match se calculent avec le classement de départ${absJour().length?', sans compter les absents du jour':''}.${ens?' Les refus notés par le professeur comptent (−2).':' <b>Points provisoires</b> : les refus notés par le professeur n’apparaissent qu’avec internet ou au cours suivant. La borne fait foi.'}</p>
  <details${ens?' open':''}><summary class="small">Voir les ${ord.length} élèves</summary><table class="g6tab"><tr><th>Rang</th><th>Joueur</th><th>Pts</th>${ens?'<th>Aujourd’hui</th><th></th>':''}</tr>
  ${ord.map(n=>{const d=R[n]-RT[n];return `<tr${mine.has(n)?' style="background:var(--ligne-pale);font-weight:700"':''}><td>${RT[n]}</td><td>${esc(n)}</td><td>${(Math.round(tot[n]*10)/10).toLocaleString('fr')}</td>${ens?`<td>${J[n].v||J[n].d||J[n].r?J[n].v+'-'+J[n].d+' ('+(J[n].g>=0?'+':'')+J[n].g.toLocaleString('fr')+')'+(J[n].r?' · '+J[n].r+' refus':''):'—'}</td><td>${d>0?'<b style="color:var(--vert)">▲'+d+'</b>':d<0?'<b style="color:var(--alerte)">▼'+(-d)+'</b>':''}</td>`:''}</tr>`}).join('')}</table></details></section>`;
}

/* ---------- Écran ATP ---------- */
let F={a:'',b:'',arb:''};
/* ---------- Avatars (débloqués par palier de points) ---------- */
const PAL=()=>(S&&S.cfg&&S.cfg.atpPal)||[10,20,30];
const palierDe=n=>G26AV.palier(pts(n),PAL());
function vAvatars(){
  if(!window.G26AV)return '';
  return `<section class="carte"><h3>Nos avatars</h3><div class="av-grp">${S.eleves.map((E,i)=>{const p=palierDe(E.nom),a=G26AV.de((S.av||{})[E.nom],E.nom);
    return `<button type="button" class="av-moi" data-act="atpav" data-v="${i}">${G26AV.svg(a,72)}<b>${esc(prenom(E.nom))}</b><small>${G26AV.ICO[p]} ${G26AV.NOMS[p]} · ${pts(E.nom)} pts</small><span class="bt mini">Changer</span></button>`}).join('')}</div>
  <div class="rangee" style="margin-top:8px">${S.eleves.map((E,i)=>`<button type="button" class="bt mini" data-act="atpavqr" data-v="${i}">📷 Avatar de ${esc(prenom(E.nom))} → borne</button>`).join('')}</div>
  <p class="small muted" style="margin:6px 0 0">Ton avatar apparaît sur la borne quand tu joues. Plus tu marques de points au tournoi, plus tu débloques de personnages.</p></section>`;
}
function fenAvatars(i){
  const E=S.eleves[i],p=palierDe(E.nom),S3=PAL(),cur=G26AV.de((S.av||{})[E.nom],E.nom).id;
  fen(`<h3>Avatar de ${esc(prenom(E.nom))}</h3><p class="small muted">${G26AV.ICO[p]} Palier ${G26AV.NOMS[p]} · ${pts(E.nom)} points</p>
  ${[0,1,2,3].map(t=>`<p class="av-t">${G26AV.ICO[t]} ${G26AV.NOMS[t]}${t?' · dès '+S3[t-1]+' points':''}</p><div class="av-choix">${G26AV.AV.filter(a=>a.t===t).map(a=>{const ok=t<=p;
    return `<button type="button" class="${a.id===cur?'on':''}${ok?'':' lock'}" ${ok?`data-act="atpavok" data-i="${i}" data-v="${a.id}"`:'disabled'} title="${esc(a.n)}">${G26AV.svg(a,56,!ok)}<small>${ok?esc(a.n):'🔒'}</small></button>`}).join('')}</div>`).join('')}
  <div class="rangee" style="margin-top:12px"><button class="bt" type="button" data-act="fermer">Fermer</button></div>`,'large');
}
// Nouveau palier franchi depuis la dernière fois : on fête le déblocage
function verifierDeblocage(){
  if(!window.G26AV||document.querySelector('#modal .voile'))return;S.avPal=S.avPal||{};
  for(const E of S.eleves){const p=palierDe(E.nom),av=S.avPal[E.nom]||0;
    if(p>av){S.avPal[E.nom]=p;sauver();const nv=G26AV.AV.filter(a=>a.t>av&&a.t<=p);
      setTimeout(()=>fen(`<div class="av-unlock"><p class="t">NOUVEAUX AVATARS DÉBLOQUÉS !</p><p>${esc(prenom(E.nom))} passe ${G26AV.ICO[p]} <b>${G26AV.NOMS[p].toUpperCase()}</b></p>
        <div class="av-choix">${nv.map(a=>`<button type="button" data-act="atpavok" data-i="${S.eleves.indexOf(E)}" data-v="${a.id}">${G26AV.svg(a,64)}<small>${esc(a.n)}</small></button>`).join('')}</div>
        <p class="small">Touche un personnage pour le prendre, ou garde le tien.</p><button class="bt" type="button" data-act="fermer">Plus tard</button></div>`,'large'),300);return}
    if(p<av){S.avPal[E.nom]=p;sauver()}}
}
const cssAv=document.createElement('style');cssAv.textContent=`
.av-grp{display:flex;gap:10px;flex-wrap:wrap}.av-moi{flex:1;min-width:120px;display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px;border-radius:14px;border:2px solid #312e81;background:radial-gradient(circle at 50% 35%,#3b2f7a,#14102e 75%);color:#fff}
.av-moi b{font:800 18px var(--d)}.av-moi small{color:#c4b5fd;font-size:14px}.av-moi .bt{margin-top:4px}
.av16{image-rendering:pixelated}.av-t{font:800 16px var(--d);margin:12px 0 4px}
.av-choix{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:8px}
.av-choix button{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 4px;border-radius:12px;border:2px solid var(--trait);background:#1a1240;color:#fff}
.av-choix button.on{border-color:#facc15;box-shadow:0 0 0 2px #facc15}.av-choix button.lock{opacity:.75;background:#111}.av-choix small{font-size:12px;color:#ddd6fe;text-align:center;line-height:1.1}
.av-unlock{text-align:center;background:#07031a;color:#fff;border-radius:14px;padding:14px;margin:-6px}.av-unlock .t{font:900 24px "Courier New",monospace;color:#ffe600;text-shadow:0 0 12px #ffe600;margin:4px 0;animation:avp .6s cubic-bezier(.2,1.6,.4,1)}
@keyframes avp{from{transform:scale(.3)}to{transform:scale(1)}}`;document.head.appendChild(cssAv);

function gainTexte(a,b){const R=rangs(),G=rangsG(),n=liste().length;if(!a||!b)return '';
  return `Si <b>${esc(prenom(a))}</b> (${R[a]}ᵉ) gagne : +${G26.atpGain(G[a]||n,G[b]||n)} · si <b>${esc(prenom(b))}</b> (${R[b]}ᵉ) gagne : +${G26.atpGain(G[b]||n,G[a]||n)} · le perdant : +${A.perdu}${absJour().length?' <small class="muted">(absents du jour non comptés dans l’écart)</small>':''}`}
function alertes(a,b){const w=[];if(!a||!b)return w;
  const n=matchs().filter(m=>m.fini&&((m.a===a&&m.b===b)||(m.a===b&&m.b===a))).length;
  if(n>=A.maxMemeAdv)w.push(`${esc(prenom(a))} et ${esc(prenom(b))} se sont déjà affrontés ${n} fois aujourd’hui : ${A.maxMemeAdv} au maximum par séance.`);
  return w}
function vATP(){
  const L=liste(),R=rangs(),RG=rangsG(),nL=L.length,D=depart(),M=matchs(),g=gristDoc();
  const ord=L.slice().sort((x,y)=>R[x]-R[y]);
  const opt=(sel,ex)=>`<option value="">— Choisir —</option>`+ord.map(n=>`<option value="${esc(n)}"${n===sel?' selected':''}${ex.includes(n)?' disabled':''}>${R[n]}. ${esc(n)} (${pts(n)} pts)</option>`).join('');
  const encours=M.find(m=>!m.fini);
  const att=Object.values(S.atp||{}).flat().filter(m=>m.fini&&!m.gr).length;
  verifierDeblocage();
  let h=`<h2>Tournoi ATP · séance ${S.seance}</h2>${vAvatars()}
  ${D?`<p class="small muted">Classement de départ : séance ${D.s}.</p>`:'<p class="avert small">Classement pas encore reçu du professeur : tout le monde part à égalité. Les matchs comptent quand même.</p>'}`;
  if(gristDoc()&&(!LIVE||Date.now()-LIVE.t>15000))setTimeout(lireDirect,50);
  h+=vDirect();
  if(encours)h+=`<section class="carte"><h3>Match en cours</h3><p>${esc(encours.a)} – ${esc(encours.b)} : ${encours.sa}-${encours.sb}</p><button type="button" class="bt orange" data-act="atpmq">Reprendre le match</button></section>`;
  else h+=`<section class="carte"><h3>Nouveau match (11 points)</h3><p class="small muted" style="margin-top:0">C’est l’<b>arbitre</b> qui saisit. Tout élève qui attend arbitre, puis il choisit son adversaire en priorité.</p>
  <label class="ch" for="atp-arb">Arbitre</label><select id="atp-arb" data-atp="arb">${opt(F.arb,[F.a,F.b])}</select>
  <label class="ch" for="atp-a">Joueur 1</label><select id="atp-a" data-atp="a">${opt(F.a,[F.b,F.arb])}</select>
  <label class="ch" for="atp-b">Joueur 2</label><select id="atp-b" data-atp="b">${opt(F.b,[F.a,F.arb])}</select>
  <p class="small" id="atp-gain" style="margin:8px 0 0">${gainTexte(F.a,F.b)}</p>
  <div id="atp-al">${alertes(F.a,F.b).map(x=>`<p class="avert small">⚠ ${x}</p>`).join('')}</div>
  <p style="margin:10px 0 4px"><b>Qui sert en premier ?</b></p><div class="rangee"><button type="button" class="bt orange" data-act="atpgo" data-v="a">Joueur 1</button><button type="button" class="bt orange" data-act="atpgo" data-v="b">Joueur 2</button></div></section>`;
  const faits=M.filter(m=>m.fini);
  h+=`<section class="carte"><h3>Matchs saisis sur ce téléphone (${faits.length})</h3>${faits.length?`<table class="g6tab"><tr><th>Match</th><th>Score</th><th></th></tr>${faits.slice().reverse().map(m=>{const w=m.sa>m.sb?m.a:m.b,l=w===m.a?m.b:m.a;
    return `<tr><td><b>${esc(prenom(w))}</b> bat ${esc(prenom(l))}<br><small class="muted">+${G26.atpGain(RG[w]||nL,RG[l]||nL)} / +${A.perdu}${m.arb?' · arbitre '+esc(prenom(m.arb)):''}</small></td><td>${Math.max(m.sa,m.sb)}-${Math.min(m.sa,m.sb)}</td><td style="white-space:nowrap">${g?(m.gr?'☁️':'⏳'):''} <button type="button" class="bt mini" data-act="atpqr" data-v="${esc(m.id)}" title="QR à scanner à la borne">QR</button></td></tr>`}).join('')}</table>`:'<p class="small muted">Aucun pour l’instant.</p>'}
  ${g?`<p class="small muted" style="margin:8px 0 0">☁️ envoyé en direct au professeur · ⏳ en attente de réseau${att?` <button type="button" class="bt mini" data-act="atpenvoi">Réessayer (${att})</button>`:''}</p>`:'<p class="small muted" style="margin:8px 0 0">Les matchs partent avec la séance (onglet Envoyer).</p>'}</section>
  <section class="carte"><h3>Barème (règlement du tournoi)</h3><table class="g6tab"><tr><th>Victoire contre un joueur classé…</th><th>Points</th></tr>
  ${[5,4,3,2,1].map(k=>`<tr><td>${k===5?'5 rangs au-dessus et plus':k+' rang'+(k>1?'s':'')+' au-dessus'}</td><td>${A.dessus[k-1]}</td></tr>`).join('')}
  ${[1,2,3,4,5].map(k=>`<tr><td>${k===5?'5 rangs en dessous et moins':k+' rang'+(k>1?'s':'')+' en dessous'}</td><td>${A.dessous[k-1]}</td></tr>`).join('')}
  <tr><td>Match perdu</td><td>${A.perdu}</td></tr><tr><td>Match refusé</td><td>${A.refus}</td></tr></table>
  <p class="small muted" style="margin:8px 0 0">2 matchs au maximum contre le même adversaire par séance. Le classement de départ de la séance suivante = les points cumulés.</p></section>`;
  return h;
}
/* ---------- Tableau de marque (11 points, 2 services chacun, 10-10 : point décisif) ---------- */
let MQ6=false;
function peindre(){
  let z=document.getElementById('g6m');if(!MQ6){if(z)z.remove();return}
  if(!z){z=document.createElement('div');z.id='g6m';document.body.appendChild(z)}
  const m=matchs().find(x=>!x.fini)||matchs()[matchs().length-1];if(!m){MQ6=false;z.remove();return}
  const n=m.sa+m.sb,dec=m.sa===10&&m.sb===10,fin=(m.sa>=11||m.sb>=11)&&!dec||(m.dec);
  const srv=dec?(m.srv):(Math.floor(n/2)%2===0?m.srv:(m.srv==='a'?'b':'a'));
  let h=`<div class="rangee" style="justify-content:space-between"><b>ATP · ${esc(prenom(m.a))} – ${esc(prenom(m.b))}${m.arb?' · arbitre '+esc(prenom(m.arb)):''}</b><button type="button" class="bt mini" data-act="atpfermer">Fermer</button></div>`;
  if(fin){const w=m.sa>m.sb?'a':'b';
    h+=`<div style="text-align:center;margin:auto"><h2>${esc(m[w])} gagne ${Math.max(m.sa,m.sb)}-${Math.min(m.sa,m.sb)}</h2>
    <div class="rangee" style="justify-content:center"><button type="button" class="bt" data-act="atpmoins">− Annuler le dernier point</button><button type="button" class="bt orange" data-act="atpvalider">Valider le match</button></div></div>`;
  }else{
    h+=`${dec?'<p style="text-align:center;color:#FDBA74;font-weight:700">10-10 : point décisif</p>':''}<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;flex:1">${['a','b'].map(c=>`<button type="button" class="g6side${srv===c?' sert':''}" data-act="atppt" data-v="${c}"><span class="nm">${esc(m[c])}</span><span class="sc">${m['s'+c]}</span><span class="sv">${srv===c?'🏓 au service':'&nbsp;'}</span></button>`).join('')}</div>
    <p class="small" style="color:#9AA5B3;text-align:center">Touchez le côté du joueur qui marque.</p>${n?'<p style="text-align:center"><button type="button" class="bt mini" data-act="atpmoins">− Annuler le dernier point</button></p>':''}`;
  }
  z.innerHTML=h;
}

/* ---------- Actions ---------- */
const prec=EPLUS.clic;
EPLUS.clic=async function(a,v,b,ev){
  if(a.slice(0,3)!=='atp')return prec(a,v,b,ev);
  if(!S)return true;
  const M=matchs();
  switch(a){
    case 'atpgo':{if(!F.a||!F.b){toast('Choisis les 2 joueurs.');return true}if(F.a===F.b){toast('Deux joueurs différents.');return true}
      const al=alertes(F.a,F.b);if(al.length&&!confirm(al.join('\n').replace(/<[^>]+>/g,'')+'\n\nJouer quand même ?'))return true;
      M.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),a:F.a,b:F.b,av1:(S.av||{})[F.a]||'',av2:(S.av||{})[F.b]||'',arb:F.arb||'',sa:0,sb:0,srv:v,h:[],d:today(),ts:0,fini:false});
      modif();sauver();MQ6=true;peindre();return true}
    case 'atpmq':MQ6=true;peindre();return true;
    case 'atpfermer':MQ6=false;peindre();rendre();return true;
    case 'atppt':{const m=M.find(x=>!x.fini);if(!m)return true;if(m.sa===10&&m.sb===10){m.dec=v}m['s'+v]++;m.h.push(v);modif();sauver();try{navigator.vibrate&&navigator.vibrate(20)}catch(e){}peindre();return true}
    case 'atpmoins':{const m=M.find(x=>!x.fini);if(!m||!m.h.length)return true;const c=m.h.pop();m['s'+c]--;if(m.dec)delete m.dec;modif();sauver();peindre();return true}
    case 'atpvalider':{const m=M.find(x=>!x.fini);if(!m)return true;m.fini=true;m.ts=Math.round(Date.now()/1000);delete m.h;
      F={a:'',b:'',arb:''};MQ6=false;peindre();modif();sauver();rendre();envoyer();montrerQRMatch(m);return true}
    case 'atpqr':{const m=Object.values(S.atp||{}).flat().find(x=>x.id===v);if(m)montrerQRMatch(m);return true}
    case 'atpavqr':{const E=S.eleves[+v];if(!E)return true;const id=G26AV.de((S.av||{})[E.nom],E.nom).id;
      const txt=await chaineBrute({a:'TTE',v:1,t:'V',c:S.classe,e:E.nom,av:id,ts:Math.round(Date.now()/1000)});
      fen(`<h3>Avatar de ${esc(prenom(E.nom))}</h3><div style="text-align:center">${G26AV.svg(G26AV.parId[id],96)}</div><p>Montre ce QR à la <b>borne</b> : ton avatar s’affichera dans le tableau.</p><div class="qrbox">${qrSvg(txt)}</div><div class="rangee" style="margin-top:10px"><button class="bt" type="button" data-act="fermer">Fait</button></div>`);return true}
    case 'atpenvoi':envoyer();toast('Envoi en cours…');return true;
    case 'atpav':fenAvatars(+v);return true;
    case 'atpavok':{const E=S.eleves[+b.dataset.i];if(!E)return true;S.av=S.av||{};S.av[E.nom]=v;modif();sauver();fermer();rendre();toast('Avatar choisi : '+G26AV.parId[v].n);return true}
  }
  return true;
};
document.addEventListener('change',ev=>{const t=ev.target,k=t.dataset&&t.dataset.atp;if(!k||!S)return;F[k]=t.value;
  // le formulaire se met à jour sans perdre la saisie
  rendre();});

/* ---------- QR d'un match, à scanner à la borne ---------- */
async function montrerQRMatch(m){
  // l'avatar de chaque joueur connu sur ce téléphone voyage avec le match
  const av=n=>(S.av||{})[n]||'';const n=Object.keys(S.atp||{}).find(k=>(S.atp[k]||[]).includes(m))||S.seance;
  const txt=await chaineBrute({a:'TTE',v:1,t:'A',c:S.classe,s:+n,d:today(),ts:Math.round(Date.now()/1000),m:[[m.id,m.a,m.b,m.arb||'',m.sa,m.sb,m.ts,m.av1||av(m.a),m.av2||av(m.b)]]});
  const w=m.sa>m.sb?m.a:m.b;
  fen(`<h3>🏓 ${esc(prenom(w))} gagne ${Math.max(m.sa,m.sb)}-${Math.min(m.sa,m.sb)}</h3>
  <p>Va montrer ce QR à la <b>borne</b> : le classement se met à jour tout de suite.${gristDoc()?' <span class="small muted">(Il part aussi tout seul par internet : si la borne le lit, il n’est pas compté deux fois.)</span>':''}</p>
  <div class="qrbox">${qrSvg(txt)}</div><div class="rangee" style="margin-top:10px"><button class="bt orange" type="button" data-act="fermer">Fait</button></div>`);
}

/* ---------- Export ---------- */
function brut(n){return ((S.atp||{})[n]||[]).filter(m=>m.fini).map(m=>({id:m.id,a:m.a,b:m.b,arb:m.arb||'',sa:m.sa,sb:m.sb,ts:m.ts,d:m.d,av1:m.av1||'',av2:m.av2||''}))}
window.ATP26={
  vue:vATP,envoyer,
  fichiers(n){const L=brut(n);if(!L.length)return [];
    return [{nom:TTL.nomFichier(S.classe,'ATP_'+(S.eleves.map(e=>prenom(e.nom)).join('-')||'tel'),n,'atp'),o:{app:'tennis-de-table-eleves',version:VERSION,type:'atp',activite:'Tennis de table',classe:S.classe,seance:n,date:today(),exportedAt:new Date().toISOString(),saisiPar:S.eleves.map(e=>e.nom).join(', '),matchs:L}}]},
  async qrs(n){const L=brut(n);if(!L.length)return [];
    return [{titre:'Tournoi ATP ('+L.length+' match'+(L.length>1?'s':'')+')',txt:await chaineBrute({a:'TTE',v:1,t:'A',c:S.classe,s:n,d:today(),ts:Math.round(Date.now()/1000),m:L.map(m=>[m.id,m.a,m.b,m.arb,m.sa,m.sb,m.ts,m.av1,m.av2])})}]}
};
})();
