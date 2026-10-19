/* =====================================================================
   prof.js — Tennis de table · outil prof
   Récupère les séances des élèves (fichiers JSON, dossier .zip du Nuage,
   QR codes scannés), reconstruit les poules et fait le bilan par élève.
   Données gardées sur cet appareil uniquement (localStorage).
   ===================================================================== */
'use strict';
const CLEP='tte-prof-v1';
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const axe=k=>GA.axes.find(a=>a.k===k);
const COURT={strat:'Stratégie',cont:'Continuité',diff:'Mettre en difficulté',eng:'Engagement',ana:'Analyse',coach:'Coach',arb:'Arbitrage'};
function exInfo(n){for(const t of GA.themes){const e=t.ex.find(x=>x.n===String(n));if(e)return {t,e}}return null}
function critere(n,c){const i=exInfo(n);if(!i)return '';const nv=i.e.nv||[],cols=nv.length===3?[2,3,4]:nv.length===2?[3,4]:[4];if(c===1)return 'pas encore atteint';const k=cols.indexOf(c);return k>=0?nv[k]:''}

/* ---------- Base ---------- */
let DB=charger();
function vide(){return {rec:{},poules:{},alias:{},noms:{},vue:'import',classe:'',seance:1,eleve:null,journal:[]}}
function charger(){try{const o=JSON.parse(localStorage.getItem(CLEP));if(o&&o.rec)return Object.assign(vide(),o)}catch(e){}return vide()}
function sauver(){try{localStorage.setItem(CLEP,JSON.stringify(DB))}catch(e){alert('Mémoire de l’appareil pleine : exporte une sauvegarde.')}}
// Identité d'un élève : classe + nom normalisé, avec les fusions décidées par le prof.
function cleEleve(classe,nom){let k=norm(classe)+'|'+norm(nom);const seen=new Set();while(DB.alias[k]&&!seen.has(k)){seen.add(k);k=DB.alias[k]}return k}
function nomAffiche(k){return DB.noms[k]||k.split('|')[1]}
function retenirNom(k,nom){if(!DB.noms[k])DB.noms[k]=nom}

/* ---------- Import ---------- */
function ajouterRecord(r){
  const k=cleEleve(r.classe,r.eleve);retenirNom(k,r.eleve);
  const id=k+'|'+r.seance,old=DB.rec[id];
  if(old&&(old.ts||0)>(r.ts||0)&&old.src==='fichier')return 'déjà à jour';
  DB.rec[id]=Object.assign({k},r);return old?'mis à jour':'nouveau';
}
function ajouterPoule(classe,seance,b,ts){
  if(!b||!b.joueurs||!b.matchs)return;
  const id=norm(classe)+'|'+seance+'|'+b.num,old=DB.poules[id];
  const joues=x=>x.matchs.filter(m=>TTL.etatMatch(m,x.fmt).fini).length;
  const nv={classe,seance:+seance,num:+b.num,fmt:String(b.fmt||'2'),joueurs:b.joueurs.slice(),matchs:b.matchs.map(m=>({a:m.a,b:m.b,arb:m.arb,f:m.f||null,m:(m.m||[]).map(x=>[+x[0],+x[1]])})),ts:ts||0};
  if(old){
    if(old.joueurs.map(norm).join('|')!==nv.joueurs.map(norm).join('|')){nv.conflit=true}
    if(joues(old)>joues(nv)||(joues(old)===joues(nv)&&(old.ts||0)>=(nv.ts||0)))return;
  }
  DB.poules[id]=nv;
  nv.joueurs.forEach(j=>retenirNom(cleEleve(classe,j),j));
}
// Fichier JSON de l'appli élève
function importerObjet(o,source){
  if(o&&o.carnetTT)throw new Error('C’est la sauvegarde d’un téléphone, pas un fichier de séance.');
  if(!o||o.app!=='tennis-de-table-eleves')throw new Error('Fichier non reconnu');
  const ts=Date.parse(o.exportedAt)/1000||0;
  if(o.poule&&o.poule.brut)ajouterPoule(o.classe,o.seance,o.poule.brut,ts);
  if(o.type==='poule')return 'poule '+(o.poule?o.poule.numero:'');
  const r={classe:o.classe||'',eleve:o.eleve,seance:+o.seance,date:o.date,ts,src:'fichier',
    axes:(o.axes||[]).map(a=>({k:a.axe,val:!!a.valideAujourdhui})),
    chg:(o.changementsAxe||[]).map(c=>({de:c.de,vers:c.vers,motif:c.motif})),
    ex:(o.exercices||[]).map(e=>({axe:e.axe,n:String(e.exercice),niv:e.niveau||0,rq:e.remarque||''})),
    bilan:o.bilan||'',etoile:o.etoile?o.etoile.map(a=>a.degre||0):null,
    grille:o.grilleCoach||null,
    pouleResume:o.poule?{num:o.poule.numero,n:o.poule.nbJoueurs,rang:o.poule.rang,pts:o.poule.points,v:o.poule.victoires,d:o.poule.defaites,mv:o.poule.mouvement||''}:null};
  return ajouterRecord(r);
}
// QR code (format compact)
function importerQR(q){
  const ts=q.ts||Date.parse(q.d)/1000||0;
  if(q.t==='T')throw new Error('C’est un QR de changement de groupe (pour un téléphone élève).');
  if(q.t==='P'){const [num,fmt,joueurs,ms]=q.p;ajouterPoule(q.c,q.s,{num,fmt,joueurs,matchs:ms.map(([a,b,arb,f,sets])=>({a,b,arb,f:f||null,m:sets}))},ts);return 'Poule '+num+' · séance '+q.s}
  if(q.t==='p')return q.e+' : poule seulement';
  const r={classe:q.c||'',eleve:q.e,seance:+q.s,date:q.d,ts,src:'qr',
    axes:(q.x||[]).map(([k,v])=>({k,val:!!v})),
    chg:(q.ch||[]).map(([de,vers,motif])=>({de,vers,motif})),
    ex:(q.ex||[]).map(([a,n,niv,rq])=>({axe:a,n:String(n),niv:niv||0,rq:rq||''})),
    bilan:q.b||'',etoile:q.et||null,
    grille:q.g?{c0:q.g[0],c1:q.g[1],c2:q.g[2],c3:q.g[3],cx:q.g[4],projet:q.pj||'',scoreObserve:q.g[1]+2*q.g[2]+3*q.g[3]}:null,
    pouleResume:q.p?{num:q.p[0],n:q.p[1],rang:q.p[2],pts:q.p[3],mv:q.p[5]||'',v:(q.p[6]||[]).filter(m=>m[1]===1).length,d:(q.p[6]||[]).filter(m=>m[1]===0).length}:null};
  const res=ajouterRecord(r);return q.e+' · séance '+q.s+' ('+res+')';
}
async function importerFichiers(files){
  let ok=0,err=[];
  async function un(nom,texte){try{importerObjet(JSON.parse(texte));ok++}catch(e){err.push(nom+' : '+(e.message||e))}}
  for(const f of files){
    if(/\.zip$/i.test(f.name)){
      try{const z=await JSZip.loadAsync(f);const L=Object.values(z.files).filter(x=>!x.dir&&/\.json$/i.test(x.name));for(const x of L)await un(x.name.split('/').pop(),await x.async('string'))}
      catch(e){err.push(f.name+' : zip illisible')}
    }else if(/\.json$/i.test(f.name)||f.type==='application/json')await un(f.name,await f.text());
    else err.push(f.name+' : ni .json ni .zip');
  }
  journal(ok+' fichier'+(ok>1?'s':'')+' importé'+(ok>1?'s':'')+(err.length?' · '+err.length+' refusé'+(err.length>1?'s':''):''),err);
  choisirClasseParDefaut();sauver();rendre();
}
function journal(t,err){DB.journal.unshift({t,err:err||[],d:new Date().toISOString()});DB.journal=DB.journal.slice(0,20)}
function classes(){const s=new Set();Object.values(DB.rec).forEach(r=>s.add(r.classe||''));Object.values(DB.poules).forEach(p=>s.add(p.classe||''));return [...s].sort()}
function choisirClasseParDefaut(){const C=classes();if(!C.includes(DB.classe))DB.classe=C[0]||''}

/* ---------- Calculs ---------- */
const recsClasse=()=>Object.values(DB.rec).filter(r=>norm(r.classe)===norm(DB.classe));
const poulesClasse=()=>Object.values(DB.poules).filter(p=>norm(p.classe)===norm(DB.classe));
function seancesClasse(){const s=new Set();recsClasse().forEach(r=>s.add(r.seance));poulesClasse().forEach(p=>s.add(p.seance));return [...s].sort((a,b)=>a-b)}
// Résultat de chaque élève dans chaque poule : ligne de classement + ses matchs
function resultatsPoules(){
  const R={};// k -> seance -> {num,n,rang,pts,v,d,mg,mp,pg,pp,matchs:[]}
  poulesClasse().forEach(P=>{
    const n=P.joueurs.length,C=TTL.classement(n,P.matchs,P.fmt);
    P.joueurs.forEach((j,i)=>{
      const k=cleEleve(P.classe,j),c=C.find(x=>x.i===i);
      const ms=P.matchs.filter(m=>m.a===i||m.b===i).map(m=>{const e=TTL.etatMatch(m,P.fmt),cote=m.a===i?'a':'b';return {adv:P.joueurs[m.a===i?m.b:m.a],fini:e.fini,gagne:e.fini?e.w===cote:null,score:e.fini?TTL.texteScore(m,P.fmt,cote):''}});
      let mv='';const tous=P.matchs.every(m=>TTL.etatMatch(m,P.fmt).fini);
      if(tous&&n>1){mv=c.rang===1&&P.num>1?'monte':c.rang===n?'descend':'reste'}
      (R[k]=R[k]||{})[P.seance]={num:P.num,n,rang:c.rang,pts:c.pts,v:c.v,d:c.d,mg:c.mg,mp:c.mp,pg:c.pg,pp:c.pp,matchs:ms,mv,complet:tous,arb:P.matchs.filter(m=>m.arb===i).length};
    });
  });
  // résumés seuls (fichiers anciens ou QR élève sans QR de poule)
  recsClasse().forEach(r=>{if(r.pouleResume&&!(R[r.k]&&R[r.k][r.seance])){const p=r.pouleResume;(R[r.k]=R[r.k]||{})[r.seance]={num:p.num,n:p.n,rang:p.rang,pts:p.pts,v:p.v,d:p.d,mg:null,mp:null,pg:null,pp:null,matchs:[],mv:p.mv,resume:true}}});
  return R;
}
function eleves(){
  const s=new Set();recsClasse().forEach(r=>s.add(r.k));const R=resultatsPoules();Object.keys(R).forEach(k=>s.add(k));
  return [...s].sort((a,b)=>nomAffiche(a).localeCompare(nomAffiche(b),'fr'));
}
function bilanEleve(k,R){
  const S=Object.entries((R||resultatsPoules())[k]||{}).sort((a,b)=>a[0]-b[0]);
  const t={seances:S.length,matchs:0,v:0,d:0,mg:0,mp:0,pg:0,pp:0,rangs:[],poules:[],complet:true};
  S.forEach(([,x])=>{t.v+=x.v||0;t.d+=x.d||0;t.matchs+=(x.v||0)+(x.d||0);if(x.mg==null)t.complet=false;else{t.mg+=x.mg;t.mp+=x.mp;t.pg+=x.pg;t.pp+=x.pp}t.rangs.push(x.rang);t.poules.push(x.num)});
  const moy=a=>a.length?Math.round(a.reduce((s,x)=>s+x,0)/a.length*10)/10:null;
  t.pctV=t.matchs?Math.round(t.v/t.matchs*100):null;t.rangMoy=moy(t.rangs);t.pouleMoy=moy(t.poules);
  t.meilleure=t.poules.length?Math.min(...t.poules):null;t.derniere=t.poules.length?t.poules[t.poules.length-1]:null;
  const recs=recsClasse().filter(r=>r.k===k).sort((a,b)=>a.seance-b.seance);
  t.travail=recs.length;t.exos=recs.reduce((s,r)=>s+r.ex.length,0);t.verts=recs.reduce((s,r)=>s+r.ex.filter(e=>e.niv>=3).length,0);
  t.chg=recs.reduce((s,r)=>s+r.chg.length,0);
  const et=recs.filter(r=>r.etoile&&r.etoile.some(Boolean));t.etDebut=et.length?et[0]:null;t.etFin=et.length>1?et[et.length-1]:null;
  t.mtValides=[...new Set(recs.flatMap(r=>r.axes.filter(a=>a.val).map(a=>a.k)))];
  return t;
}

/* ---------- Affichage ---------- */
const DOT=c=>`<i class="dot p${c}" title="${esc(GA.deg[c-1]||'')}"></i>`;
const famCl=k=>{const a=axe(k);return a?{AFL1:'a1',AFL2:'a2',AFL3:'a3'}[a.afl]:''};
function rendre(){
  const C=classes();
  $('#classes').innerHTML=C.length?`<label class="small">Classe <select id="selClasse">${C.map(c=>`<option${c===DB.classe?' selected':''}>${esc(c||'(sans classe)')}</option>`).join('')}</select></label>`:'';
  const O=[['import','Importer'],['tournoi','Tournoi'],['eleves','Élèves'],['export','Exporter']];
  $('#onglets').innerHTML=O.map(o=>`<button type="button" data-act="vue" data-v="${o[0]}" class="${DB.vue===o[0]?'ici':''}">${o[1]}</button>`).join('');
  const V={import:vImport,tournoi:vTournoi,eleves:vEleves,export:vExport,fiche:vFiche};
  $('#main').innerHTML=V[DB.vue]();
}
function vImport(){
  const nR=Object.keys(DB.rec).length,nP=Object.keys(DB.poules).length;
  return `<h2>Récupérer les séances</h2>
  <div class="grille2">
    <section class="carte"><h3>QR codes</h3><p class="small muted">Les élèves montrent leurs QR en fin de séance : scanne-les à la suite, la caméra reste ouverte.</p>
      <button class="bt orange" type="button" data-act="scanner">Scanner les QR codes</button></section>
    <section class="carte"><h3>Fichiers</h3><p class="small muted">Les fichiers .json déposés par les élèves, ou le dossier du Nuage téléchargé en .zip. Sur ordinateur, tu peux aussi les glisser ici.</p>
      <label class="bt noir" for="fic">Choisir des fichiers</label><input id="fic" type="file" multiple accept=".json,.zip,application/json,application/zip" hidden></section>
  </div>
  <section class="carte"><h3>Dans l’outil</h3><p>${nR} séance${nR>1?'s':''} d’élèves · ${nP} poule${nP>1?'s':''}. Réimporter les mêmes fichiers ne crée pas de doublon.</p>
    ${DB.journal.length?`<ul class="small">${DB.journal.slice(0,6).map(j=>`<li>${new Date(j.d).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})} · ${esc(j.t)}${j.err.length?`<ul>${j.err.slice(0,8).map(e=>`<li class="err">${esc(e)}</li>`).join('')}</ul>`:''}</li>`).join('')}</ul>`:''}</section>
  <section class="carte"><h3>Passer de l’iPad au PC</h3><p class="small muted">Les données restent sur cet appareil. Exporte une sauvegarde, range-la dans ton espace personnel, puis restaure-la sur l’autre appareil.</p>
    <div class="rangee"><button class="bt mini" type="button" data-act="sauvegarde">Exporter une sauvegarde</button><label class="bt mini" for="resto">Restaurer une sauvegarde</label><input id="resto" type="file" accept=".json" hidden>
    <button class="bt mini danger" type="button" data-act="effacer">Tout effacer</button></div></section>`;
}
function vTournoi(){
  const S=seancesClasse();if(!S.length)return `<h2>Tournoi</h2><p class="muted">Aucune donnée pour cette classe : importe d’abord des séances.</p>`;
  if(!S.includes(DB.seance))DB.seance=S[S.length-1];
  const P=poulesClasse().filter(p=>p.seance===DB.seance).sort((a,b)=>a.num-b.num);
  const R=resultatsPoules();
  const sansPoule=eleves().filter(k=>!(R[k]&&R[k][DB.seance])&&recsClasse().some(r=>r.k===k&&r.seance===DB.seance));
  return `<h2>Tournoi · séance ${DB.seance}</h2>
  <div class="strip">${S.map(s=>`<button type="button" data-act="seance" data-v="${s}" class="${s===DB.seance?'ici':''}">${s}</button>`).join('')}</div>
  ${P.length?'':'<p class="muted">Aucune poule complète reçue pour cette séance.</p>'}
  <div class="poules">${P.map(p=>{const n=p.joueurs.length,C=TTL.classement(n,p.matchs,p.fmt),tous=p.matchs.every(m=>TTL.etatMatch(m,p.fmt).fini);
    return `<section class="carte"><h3>Poule ${p.num} <span class="small muted">· ${n} joueurs · ${p.fmt==='1'?'1 manche':p.fmt+' manches gagnantes'}</span></h3>
      ${p.conflit?'<p class="avert small">Deux versions différentes de cette poule ont été reçues : la plus complète est gardée.</p>':''}
      <table class="cl"><thead><tr><th>Rang</th><th>Joueur</th><th>Pts</th><th>V</th><th>D</th><th>Manches</th><th>Points</th><th></th></tr></thead><tbody>
      ${C.map(c=>{const k=cleEleve(p.classe,p.joueurs[c.i]);const mv=tous&&n>1?(c.rang===1&&p.num>1?'↑':c.rang===n?'↓':''):'';
        return `<tr><td>${c.rang}</td><td><button class="lien" type="button" data-act="fiche" data-k="${esc(k)}">${esc(p.joueurs[c.i])}</button></td><td><b>${c.pts}</b></td><td>${c.v}</td><td>${c.d}</td><td>${c.mg}-${c.mp}</td><td>${c.pg}-${c.pp}</td><td class="mv">${mv}</td></tr>`}).join('')}</tbody></table>
      <details><summary class="small">Les ${p.matchs.length} matchs</summary><ul class="matchs">${p.matchs.map(m=>{const e=TTL.etatMatch(m,p.fmt);
        return `<li>${esc(p.joueurs[m.a])} – ${esc(p.joueurs[m.b])} : ${e.fini?`<b>${esc(TTL.texteScore(m,p.fmt,'a'))}</b>`:'<span class="muted">non joué</span>'}${m.arb!=null?` <span class="muted">· arb. ${esc(p.joueurs[m.arb])}</span>`:''}</li>`}).join('')}</ul></details></section>`}).join('')}</div>
  ${sansPoule.length?`<section class="carte"><h3>Sans poule reçue</h3><p class="small">${sansPoule.map(k=>esc(nomAffiche(k))).join(', ')}</p><p class="small muted">Leur poule n’a pas été envoyée (QR « Poule » ou fichier du téléphone qui a saisi les scores).</p></section>`:''}`;
}
function vEleves(){
  const L=eleves();if(!L.length)return `<h2>Élèves</h2><p class="muted">Aucune donnée pour cette classe.</p>`;
  const S=seancesClasse(),R=resultatsPoules();
  return `<h2>Élèves · ${esc(DB.classe||'')}</h2><p class="small muted">Pour chaque séance : n° de poule et rang. Touche un nom pour voir sa fiche.</p>
  <div class="tablewrap"><table class="cl bil"><thead><tr><th>Élève</th>${S.map(s=>`<th>S${s}</th>`).join('')}<th>Matchs</th><th>V</th><th>D</th><th>% V</th><th>Manches G-P</th><th>Points G-P</th><th>Poule moy.</th><th>Exos</th><th>Chgt axe</th></tr></thead><tbody>
  ${L.map(k=>{const t=bilanEleve(k,R),x=R[k]||{};const recs=new Set(recsClasse().filter(r=>r.k===k).map(r=>r.seance));
    return `<tr><td><button class="lien" type="button" data-act="fiche" data-k="${esc(k)}">${esc(nomAffiche(k))}</button></td>${S.map(s=>{const c=x[s];return c?`<td class="rg r${Math.min(c.rang,4)}">P${c.num}·${c.rang}/${c.n}</td>`:`<td class="${recs.has(s)?'':'vide'}">${recs.has(s)?'✓':'–'}</td>`}).join('')}
    <td>${t.matchs}</td><td>${t.v}</td><td>${t.d}</td><td>${t.pctV==null?'–':t.pctV+' %'}</td><td>${t.complet?t.mg+'-'+t.mp:'–'}</td><td>${t.complet?t.pg+'-'+t.pp:'–'}</td><td>${t.pouleMoy==null?'–':String(t.pouleMoy).replace('.',',')}</td><td>${t.exos}${t.verts?` <span class="small muted">(${t.verts} vert)</span>`:''}</td><td>${t.chg||''}</td></tr>`}).join('')}
  </tbody></table></div>
  <p class="small muted">« ✓ » : séance de travail reçue sans poule. « – » : rien reçu. Couleur : rang dans la poule (1er vert).</p>`;
}
function vFiche(){
  const k=DB.eleve;if(!k)return vEleves();
  const R=resultatsPoules(),t=bilanEleve(k,R),x=R[k]||{};
  const recs=recsClasse().filter(r=>r.k===k).sort((a,b)=>a.seance-b.seance);
  const S=[...new Set(Object.keys(x).map(Number).concat(recs.map(r=>r.seance)))].sort((a,b)=>a-b);
  const autres=eleves().filter(e=>e!==k);
  const etoile=(r,lab)=>r?`<div><b>${lab} (séance ${r.seance})</b><div class="et">${GA.axes.map((a,i)=>`<span>${DOT(r.etoile[i]||0)} ${COURT[a.k]}</span>`).join('')}</div></div>`:'';
  return `<button class="bt mini" type="button" data-act="vue" data-v="eleves">← Élèves</button>
  <h2>${esc(nomAffiche(k))}</h2>
  <div class="chiffres"><div><b>${t.matchs}</b>matchs</div><div><b>${t.v}-${t.d}</b>V-D</div><div><b>${t.pctV==null?'–':t.pctV+'%'}</b>victoires</div><div><b>${t.complet?t.mg+'-'+t.mp:'–'}</b>manches</div><div><b>${t.complet?t.pg+'-'+t.pp:'–'}</b>points</div><div><b>${t.pouleMoy==null?'–':String(t.pouleMoy).replace('.',',')}</b>poule moy.</div></div>
  ${t.etDebut?`<section class="carte"><h3>Étoile</h3>${etoile(t.etDebut,'Début')}${etoile(t.etFin,'Fin')}</section>`:''}
  ${t.mtValides.length?`<p><b>Matchs à thème validés :</b> ${t.mtValides.map(a=>`<span class="fam ${famCl(a)}">${esc(COURT[a]||a)}</span>`).join(' ')}</p>`:''}
  ${S.map(s=>{const p=x[s],r=recs.find(y=>y.seance===s);
    return `<section class="carte"><h3>Séance ${s}${r&&r.date?` <span class="small muted">· ${new Date(r.date).toLocaleDateString('fr-FR')}</span>`:''}</h3>
    ${p?`<p><b>Poule ${p.num}</b> · rang ${p.rang}/${p.n} · ${p.pts} pts · ${p.v} V, ${p.d} D${p.mg!=null?` · manches ${p.mg}-${p.mp} · points ${p.pg}-${p.pp}`:''}${p.mv?` · <b>${p.mv}</b>`:''}${p.arb?` · ${p.arb} arbitrage${p.arb>1?'s':''}`:''}</p>
      ${p.matchs.length?`<ul class="matchs">${p.matchs.map(m=>`<li class="${m.gagne?'g':m.gagne===false?'p':''}">${m.gagne?'Gagné':m.gagne===false?'Perdu':'Non joué'} contre ${esc(m.adv)} ${m.score?`: ${esc(m.score)}`:''}</li>`).join('')}</ul>`:p.resume?'<p class="small muted">Résumé seulement (détail des matchs non reçu).</p>':''}`:''}
    ${r?`<div class="travail">${r.axes.map(a=>`<span class="fam ${famCl(a.k)}">${esc(COURT[a.k]||a.k)}${a.val?' ✓ validé':''}</span>`).join(' ')}
      ${r.ex.length?`<ul>${r.ex.map(e=>{const i=exInfo(e.n);return `<li>${e.niv?DOT(e.niv):'<i class="dot"></i>'} Ex. ${esc(e.n)}${i?' · '+esc(i.e.t):''}${e.niv?` <span class="small muted">— ${esc(critere(e.n,e.niv))}</span>`:''}${e.rq?` <i>« ${esc(e.rq)} »</i>`:''}</li>`}).join('')}</ul>`:''}
      ${r.chg.map(c=>`<p class="avert small">Changement d’axe non validé : ${esc(COURT[c.de]||c.de)} → ${esc(COURT[c.vers]||c.vers||'aucun')} · « ${esc(c.motif)} »</p>`).join('')}
      ${r.grille?`<p class="small">Grille du coach : score observé ${r.grille.scoreObserve}${r.grille.projet?` · projet : « ${esc(r.grille.projet)} »`:''}</p>`:''}
      ${r.bilan?`<p class="small"><b>Bilan :</b> ${esc(r.bilan)}</p>`:''}</div>`:''}</section>`}).join('')}
  ${autres.length?`<section class="carte"><h3>Même élève sous un autre nom ?</h3><p class="small muted">Si ${esc(nomAffiche(k))} apparaît aussi avec une faute de frappe, fusionne les deux.</p>
    <div class="rangee"><select id="fusion"><option value="">— Choisir —</option>${autres.map(a=>`<option value="${esc(a)}">${esc(nomAffiche(a))}</option>`).join('')}</select><button class="bt mini" type="button" data-act="fusionner">Fusionner dans ${esc(nomAffiche(k))}</button></div></section>`:''}`;
}
function vExport(){
  return `<h2>Exporter pour la note</h2><p class="muted small">Fichiers .csv à ouvrir dans Excel ou LibreOffice (séparateur point-virgule). Classe : ${esc(DB.classe||'—')}.</p>
  <div class="grille2">
    <section class="carte"><h3>Bilan par élève</h3><p class="small muted">Une ligne par élève : matchs, V, D, % de victoires, manches et points gagnés-perdus, poule moyenne, meilleure et dernière poule, rang moyen, exercices, changements d’axe.</p><button class="bt orange" type="button" data-act="csv" data-v="bilan">Télécharger</button></section>
    <section class="carte"><h3>Tournoi séance par séance</h3><p class="small muted">Une ligne par élève et par séance : poule, rang, points, V, D, manches, points.</p><button class="bt noir" type="button" data-act="csv" data-v="tournoi">Télécharger</button></section>
    <section class="carte"><h3>Séances de travail</h3><p class="small muted">Une ligne par exercice : axes, exercice, niveau atteint, critère, matchs à thème validés, changements d’axe, bilan.</p><button class="bt noir" type="button" data-act="csv" data-v="seances">Télécharger</button></section>
  </div>`;
}

/* ---------- Export CSV ---------- */
function csv(lignes){return '﻿'+lignes.map(l=>l.map(v=>{v=v==null?'':String(v);return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(';')).join('\r\n')}
const dec=x=>x==null?'':String(x).replace('.',',');
function telecharger(nom,texte,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([texte],{type:type||'text/csv;charset=utf-8'}));a.download=nom;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
function exporter(type){
  const R=resultatsPoules(),L=eleves(),cl=DB.classe||'classe',slug=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'');
  let rows;
  if(type==='bilan'){
    rows=[['Classe','Élève','Séances jouées','Matchs','Victoires','Défaites','% victoires','Manches gagnées','Manches perdues','Points gagnés','Points perdus','Poule moyenne','Meilleure poule','Dernière poule','Rang moyen','Séances de travail','Exercices','Niveaux vert ou vert foncé','Changements d’axe non validés','Matchs à thème validés']];
    L.forEach(k=>{const t=bilanEleve(k,R);rows.push([DB.classe,nomAffiche(k),t.seances,t.matchs,t.v,t.d,t.pctV,t.complet?t.mg:'',t.complet?t.mp:'',t.complet?t.pg:'',t.complet?t.pp:'',dec(t.pouleMoy),t.meilleure,t.derniere,dec(t.rangMoy),t.travail,t.exos,t.verts,t.chg,t.mtValides.map(a=>COURT[a]).join(', ')])});
  }else if(type==='tournoi'){
    rows=[['Classe','Élève','Séance','Poule','Rang','Joueurs','Points','Victoires','Défaites','Manches gagnées','Manches perdues','Points gagnés','Points perdus','Ensuite','Arbitrages']];
    L.forEach(k=>Object.entries(R[k]||{}).sort((a,b)=>a[0]-b[0]).forEach(([s,x])=>rows.push([DB.classe,nomAffiche(k),s,x.num,x.rang,x.n,x.pts,x.v,x.d,x.mg,x.mp,x.pg,x.pp,x.mv,x.arb||''])));
  }else{
    rows=[['Classe','Élève','Séance','Date','Axe 1','Axe 2','Exercice','Titre','Niveau','Critère atteint','Remarque','Matchs à thème validés ce jour','Changements d’axe','Bilan']];
    recsClasse().sort((a,b)=>nomAffiche(a.k).localeCompare(nomAffiche(b.k),'fr')||a.seance-b.seance).forEach(r=>{
      const base=[DB.classe,nomAffiche(r.k),r.seance,r.date||'',COURT[(r.axes[0]||{}).k]||'',COURT[(r.axes[1]||{}).k]||''];
      const fin=[r.axes.filter(a=>a.val).map(a=>COURT[a.k]).join(', '),r.chg.map(c=>(COURT[c.de]||c.de)+' → '+(COURT[c.vers]||c.vers||'')+' ('+c.motif+')').join(' ; '),r.bilan];
      if(!r.ex.length)rows.push(base.concat(['','','','','']).concat(fin));
      r.ex.forEach(e=>{const i=exInfo(e.n);rows.push(base.concat([e.n,i?i.e.t:'',e.niv?GA.deg[e.niv-1]:'',e.niv?critere(e.n,e.niv):'',e.rq]).concat(fin))});
    });
  }
  telecharger('TT_'+slug(cl)+'_'+type+'.csv',csv(rows));
}

/* ---------- Évènements ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,v=b.dataset.v;
  switch(a){
    case 'vue':DB.vue=v;break;
    case 'seance':DB.seance=+v;break;
    case 'fiche':DB.eleve=b.dataset.k;DB.vue='fiche';window.scrollTo(0,0);break;
    case 'scanner':{let n0=0;TTQR.scanner(async t=>{const q=await TTQR.decoder(t);const r=importerQR(q);n0++;sauver();return '✓ '+r},{continu:true,titre:'QR codes des élèves',aide:'Montre les QR un par un devant la caméra.',onClose:n=>{if(n)journal(n+' QR code'+(n>1?'s':'')+' scanné'+(n>1?'s':''));choisirClasseParDefaut();sauver();rendre()}});return}
    case 'sauvegarde':telecharger('TT_prof_sauvegarde_'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(Object.assign({ttProf:1},DB)),'application/json');return;
    case 'effacer':if(!confirm('Effacer toutes les données de l’outil sur cet appareil ? (Exporte d’abord une sauvegarde.)'))return;DB=vide();break;
    case 'csv':exporter(v);return;
    case 'fusionner':{const src=$('#fusion').value,dst=DB.eleve;if(!src)return;
      if(!confirm('Fusionner « '+nomAffiche(src)+' » dans « '+nomAffiche(dst)+' » ?'))return;
      DB.alias[src]=dst;Object.keys(DB.rec).forEach(id=>{const r=DB.rec[id];if(r.k===src){delete DB.rec[id];const nid=dst+'|'+r.seance;if(!DB.rec[nid]||(DB.rec[nid].ts||0)<(r.ts||0))DB.rec[nid]=Object.assign(r,{k:dst})}});break}
    default:return;
  }
  sauver();rendre();
});
document.addEventListener('change',async e=>{
  const t=e.target;
  if(t.id==='selClasse'){DB.classe=t.value==='(sans classe)'?'':t.value;DB.eleve=null;if(DB.vue==='fiche')DB.vue='eleves';sauver();rendre()}
  if(t.id==='fic'&&t.files.length){await importerFichiers([...t.files]);t.value=''}
  if(t.id==='resto'&&t.files[0]){try{const o=JSON.parse(await t.files[0].text());if(!o.ttProf)throw 0;if(!confirm('Remplacer les données de cet appareil par cette sauvegarde ?'))return;delete o.ttProf;DB=Object.assign(vide(),o);sauver();rendre()}catch(x){alert('Ce fichier n’est pas une sauvegarde de l’outil prof.')}}
});
['dragover','drop'].forEach(ev=>document.addEventListener(ev,e=>{e.preventDefault();if(ev==='drop'&&e.dataTransfer.files.length){DB.vue='import';importerFichiers([...e.dataTransfer.files])}}));
choisirClasseParDefaut();rendre();
