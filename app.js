/* =====================================================================
   app.js — Tennis de table · appli élève (GAREEPS)
   Lycée Georges Pompidou · un téléphone pour 2 ou 3 élèves
   Données gardées sur le téléphone uniquement (localStorage).
   ===================================================================== */
'use strict';
/* Envoi en ligne : lien de dépôt du Nuage (« Demande de fichier – Téléversement seulement »).
   Réglé ici par le professeur uniquement ; il n'apparaît jamais à l'écran. Vide = envoi en ligne pas encore activé. */
const DEPOT_DEFAUT='';
const lienEnvoi=()=>(S.cfg&&S.cfg.lien)||DEPOT_DEFAUT;
const AXES_DISP=['ana','coach','arb']; // dispensé : axes d'analyse et de rôle seulement
const CLE='tte-v1',NB_SEANCES=9,VERSION=1;
const COURT={strat:'Stratégie',cont:'Continuité',diff:'Mettre en difficulté',eng:'Engagement',ana:'Analyse',coach:'Coach',arb:'Arbitrage'};
const MOTIFS=['C’est trop difficile pour l’instant','Je m’ennuie, c’est trop facile','J’ai repéré un autre problème en match','Conseil du professeur'];

const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9);
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const axe=k=>GA.axes.find(a=>a.k===k);
const theme=n=>GA.themes.find(t=>t.n===n);
const famCl=a=>a?{AFL1:'a1',AFL2:'a2',AFL3:'a3'}[a.afl]:'';
function exInfo(n){for(const t of GA.themes){const e=t.ex.find(x=>x.n===n);if(e)return {t,e}}return null}

/* ---------- État ---------- */
/* Une tablette sert à plusieurs groupes et plusieurs classes. Chaque groupe a son carnet,
   CHIFFRÉ avec son code secret (4 chiffres) : un autre groupe ne peut ni l'ouvrir ni le lire.
   ROOT = {v:3, groupes:{id:{classe,noms,sel,iv,data,vu}}, classes:{classe:{classe,eleves,lien}}}
   S = carnet du groupe ouvert (en mémoire seulement), CLEF = sa clé de chiffrement. */
function vide(){return {v:VERSION,classe:'',eleves:[],depot:'',cur:0,seance:1,tab:'seance',d:{},poules:{},envoi:{},hist:{},cfg:null}}
function charger(){
  let o=null;try{o=JSON.parse(localStorage.getItem(CLE))}catch(e){}
  const R={v:3,groupes:{},classes:{}};
  if(o&&o.v===3&&o.groupes)return Object.assign(R,o);
  // anciennes versions : carnets en clair, ils seront chiffrés au premier code choisi
  if(o&&o.v===2&&o.groupes){R.classes=o.classes||{};Object.entries(o.groupes).forEach(([id,g])=>{R.groupes[id]={classe:g.classe||'',noms:(g.eleves||[]).map(e=>e.nom.split(/\s+/)[0]),clair:g}})}
  else if(o&&o.v&&o.eleves){R.groupes[uid()]={classe:o.classe||'',noms:o.eleves.map(e=>e.nom.split(/\s+/)[0]),clair:o};if(o.cfg)R.classes[o.cfg.classe]=o.cfg}
  return R;
}
let ROOT=charger(),S=null,ACTIF=null,CLEF=null;
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
function ecrireRoot(){try{localStorage.setItem(CLE,JSON.stringify(ROOT))}catch(e){toast('Mémoire pleine : envoie les fichiers puis supprime les anciens groupes.')}}
const b64=u=>{let x='';new Uint8Array(u).forEach(c=>x+=String.fromCharCode(c));return btoa(x)};
const deb64=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0));
async function deriver(code,sel){
  const base=await crypto.subtle.importKey('raw',new TextEncoder().encode('tte|'+code),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt:sel,iterations:150000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
let tSauve=null;
function sauver(){clearTimeout(tSauve);tSauve=setTimeout(enregistrer,200)}
async function enregistrer(){
  clearTimeout(tSauve);
  if(!S||!ACTIF||!CLEF){ecrireRoot();return}
  const g=ROOT.groupes[ACTIF]||(ROOT.groupes[ACTIF]={});
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},CLEF,new TextEncoder().encode(JSON.stringify(S)));
  Object.assign(g,{classe:S.classe,noms:S.eleves.map(e=>e.nom.split(/\s+/)[0]),iv:b64(iv),data:b64(ct),vu:Date.now(),nonEnv:nonEnvoyees()});delete g.clair;
  ecrireRoot();
}
async function ouvrir(id,code){
  const g=ROOT.groupes[id];
  if(g.clair){const sel=crypto.getRandomValues(new Uint8Array(16));g.sel=b64(sel);CLEF=await deriver(code,sel);S=Object.assign(vide(),g.clair)}
  else{const k=await deriver(code,deb64(g.sel));
    let txt;try{txt=new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:deb64(g.iv)},k,deb64(g.data)))}catch(e){throw new Error('Code faux.')}
    CLEF=k;S=Object.assign(vide(),JSON.parse(txt))}
  ACTIF=id;
  if(S.classe&&ROOT.classes[S.classe])S.cfg=JSON.parse(JSON.stringify(ROOT.classes[S.classe])); // liste de classe la plus récente
  if(!S.eleves.length)S.tab='groupe';else S.tab='seance';
  S.cur=0;S.tour=1;seanceDuJour();
  await enregistrer();
}
// La séance s'ouvre toute seule : celle déjà notée aujourd'hui, sinon la suivante de la dernière faite un autre jour.
function seanceDuJour(){
  const t=today();S.jours=S.jours||{};
  if(S.jours[t]){S.seance=S.jours[t];return}
  let der=0,dd='';
  S.eleves.forEach(e=>Object.entries(S.d[e.id]||{}).forEach(([n,r])=>{if(r.date&&+n>der){der=+n;dd=r.date}}));
  Object.keys(S.poules).forEach(k=>{if(+k>der)der=Math.floor(+k)});
  if(der&&dd!==t){S.seance=Math.min(NB_SEANCES,der+1);setTimeout(()=>toast('Séance '+S.seance+' aujourd’hui (touche un autre numéro si besoin).'),400)}
  S.jours[t]=S.seance;
}
async function verrouiller(){await enregistrer();S=null;ACTIF=null;CLEF=null}
async function nouveauGroupe(classe,code){
  const id=uid(),sel=crypto.getRandomValues(new Uint8Array(16));
  ROOT.groupes[id]={classe:classe||'',noms:[],sel:b64(sel)};
  CLEF=await deriver(code,sel);ACTIF=id;S=vide();
  const C=classe&&ROOT.classes[classe];if(C){S.cfg=JSON.parse(JSON.stringify(C));S.classe=classe}
  S.tab='groupe';await enregistrer();
}
// Verrouillage automatique : tablette mise en veille ou 10 min sans toucher l'écran.
let tInactif=null;
function reveil(){clearTimeout(tInactif);if(S)tInactif=setTimeout(async()=>{if(S){await verrouiller();fermer();rendre();toast('Carnet verrouillé (10 min sans activité).')}},10*60*1000)}
['click','input','touchstart'].forEach(e=>document.addEventListener(e,reveil,{passive:true}));
document.addEventListener('visibilitychange',()=>{if(document.hidden&&S)enregistrer()});
/* Saisie du code secret */
let CODE_CB=null;
function demanderCode(titre,texte,cb,creer){
  CODE_CB={cb,creer,premier:null};
  fen(`<h3>${esc(titre)}</h3><p class="small muted">${esc(texte)}</p>
    <input id="code" class="code" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" aria-label="Code à 4 chiffres">
    <p id="code-msg" class="small" style="min-height:1.4em;font-weight:700;color:var(--alerte)"></p>
    <div class="rangee" style="justify-content:space-between"><button class="bt" type="button" data-act="fermer">Annuler</button><button class="bt noir" type="button" data-act="codeok">Valider</button></div>
    ${creer?'':'<p class="small" style="margin-top:12px"><button class="lien" type="button" data-act="codeoubli">Code oublié ?</button></p>'}`);
  setTimeout(()=>{const i=$('#code');if(i)i.focus()},50);
}
async function validerCode(){
  const i=$('#code'),m=$('#code-msg'),c=(i.value||'').trim();
  if(!/^\d{4}$/.test(c)){m.textContent='4 chiffres.';return}
  const st=CODE_CB;
  if(st.creer&&!st.premier){st.premier=c;i.value='';m.textContent='Retape le même code pour confirmer.';i.focus();return}
  if(st.creer&&st.premier!==c){st.premier=null;i.value='';m.textContent='Les deux codes sont différents : recommence.';return}
  m.textContent='Ouverture…';
  try{await st.cb(c);CODE_CB=null;fermer();rendre();window.scrollTo(0,0)}catch(e){i.value='';m.textContent=e.message||'Erreur';i.focus()}
}

const elv=()=>S.eleves[S.cur]||S.eleves[0];
function rec(id,n,creer=true){
  S.d[id]=S.d[id]||{};
  let r=S.d[id][n];
  if(!r&&creer){r=S.d[id][n]={date:null,axes:axesDefaut(id,n),chg:[],exos:[],val:{},rq:'',etoile:null,grille:null}}
  return r;
}
const ICOFAM={AFL1:'🎯 ',AFL2:'🧠 ',AFL3:'🤝 '};
function touche(r){if(!r.date)r.date=today();modif()}
// Séance modifiée depuis le dernier envoi (QR ou en ligne) ?
function modif(n){if(!S)return;S.mod=S.mod||{};S.mod[n==null?S.seance:n]=Date.now()}
function nonEnvoyees(){if(!S||!S.mod)return [];return Object.keys(S.mod).map(Number).filter(n=>{const ev=(S.envoi||{})[n]||{};return S.mod[n]>Math.max(ev.qr||0,ev.fichier||0)&&fichiers(n).length}).sort((a,b)=>a-b)}
function seancesDe(id){return Object.keys(S.d[id]||{}).map(Number).sort((a,b)=>a-b)}
function axesDefaut(id,n){
  const prev=seancesDe(id).filter(x=>x<n).reverse();
  for(const p of prev){const a=S.d[id][p].axes;if(a&&(a[0]||a[1]))return a.slice()}
  const et=derniereEtoile(id,n);
  return et?plusFaibles(et.e):[null,null];
}
function derniereEtoile(id,n){const L=seancesDe(id).filter(x=>x<=n).reverse();for(const p of L){const e=S.d[id][p].etoile;if(e&&Object.keys(e).length)return {s:p,e}}return null}
function premiereEtoile(id){for(const p of seancesDe(id)){const e=S.d[id][p].etoile;if(e&&Object.keys(e).length)return {s:p,e}}return null}
function plusFaibles(e){
  const set=GA.axes.filter(a=>e[a.k]);if(set.length<3)return [null,null];
  const o=set.slice().sort((x,y)=>e[x.k]-e[y.k]||GA.axes.indexOf(x)-GA.axes.indexOf(y));
  return [o[0].k,o[1]?o[1].k:null];
}
function valideQuand(id,k){for(const p of seancesDe(id)){const r=S.d[id][p];if(r.val&&r.val[k])return p}return null}

/* ---------- Affichage ---------- */
function vChoix(){
  const G=Object.entries(ROOT.groupes).sort((a,b)=>(a[1].classe||'').localeCompare(b[1].classe||'','fr')||(b[1].vu||0)-(a[1].vu||0));
  const nom=g=>g.noms&&g.noms.length?g.noms.map(esc).join(' · '):'Groupe à compléter';
  const parC={};G.forEach(([id,g])=>(parC[g.classe||'Sans classe']=parC[g.classe||'Sans classe']||[]).push([id,g]));
  const C=Object.keys(ROOT.classes).sort();
  return `<h2>Qui utilise la tablette ?</h2><p class="small muted">Chaque groupe ouvre son carnet avec son code secret.</p>
  ${G.length?Object.entries(parC).map(([c,L])=>`<section class="carte"><h3>${esc(c)}</h3><div class="choix">${L.map(([id,g])=>{const ne=g.nonEnv&&g.nonEnv.length;return `<button type="button" class="bt grp${ne?' nonenv':''}" data-act="choisir" data-v="${id}">🔒 ${nom(g)}<small>${ne?'⚠ Séance '+g.nonEnv.join(', ')+' non envoyée':g.clair?'à protéger par un code':'code secret du groupe'}</small></button>`}).join('')}</div></section>`).join(''):'<p class="muted">Aucun groupe sur cette tablette.</p>'}
  <section class="carte"><h3>Nouveau groupe</h3>
    ${C.length?`<p class="small muted">Classes déjà enregistrées sur la tablette :</p><div class="rangee">${C.map(c=>`<button type="button" class="bt" data-act="nouveau" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div><p class="small muted" style="margin-top:10px">Autre classe :</p>`:''}
    <button type="button" class="bt orange" data-act="nouveauqr">Scanner le QR de la classe</button></section>`+(window.boutonDemo?boutonDemo():'');
}
function rendre(){
  document.querySelectorAll('.barre .bt').forEach(x=>x.hidden=!S);
  if(!S){$('#sous').textContent='Choisis ton groupe';$('#seances').hidden=true;$('#qui').hidden=true;$('#onglets').hidden=true;$('#main').innerHTML=vChoix();return}
  const g=S.eleves.length>0;
  if(!g)S.tab='groupe';
  $('#sous').textContent=g?(S.classe?S.classe+' · ':'')+S.eleves.map(e=>e.nom.split(/\s+/)[0]).join(', '):'Crée ton groupe pour commencer';
  // séances
  const faites=new Set();S.eleves.forEach(e=>seancesDe(e.id).forEach(n=>{if(S.d[e.id][n].date)faites.add(n)}));Object.keys(S.poules).forEach(n=>faites.add(+n));
  $('#seances').innerHTML=g?`<span class="lab">Séance</span><div class="strip">${[...Array(NB_SEANCES)].map((_,i)=>`<button type="button" data-act="seance" data-v="${i+1}" class="${S.seance===i+1?'ici':''} ${faites.has(i+1)?'fait':''}" aria-label="Séance ${i+1}">${i+1}</button>`).join('')}</div>`:'';
  $('#seances').hidden=!g;
  // qui saisit
  const parEleve=['seance','etoile','poule','progres'].includes(S.tab)&&S.eleves.length>1;
  $('#qui').hidden=!parEleve;
  $('#qui').innerHTML=parEleve?S.eleves.map((e,i)=>`<button type="button" data-act="qui" data-v="${i}" class="${S.cur===i?'ici':''}">${esc(e.nom.split(/\s+/)[0]||e.nom)}</button>`).join(''):'';
  // onglets
  const O=[['seance','🏓','Séance'],['etoile','⭐','Étoile'],['poule','🏆','Poule'],['progres','📈','Progrès'],['regles','📖','Règles'],['envoi','📤','Envoyer']];
  const ne2=nonEnvoyees().length;
  $('#onglets').innerHTML=O.map(o=>`<button type="button" data-act="tab" data-v="${o[0]}" class="${S.tab===o[0]?'ici':''}${o[0]==='envoi'&&ne2?' alerte':''}"><i aria-hidden="true">${o[1]}</i><b>${o[2]}</b></button>`).join('');
  $('#onglets').hidden=!g;
  const V={progres:()=>window.vProgres?vProgres():'',regles:vRegles,groupe:vGroupe,seance:vSeance,etoile:vEtoile,poule:vPoule,envoi:vEnvoi};
  const ne=nonEnvoyees();
  $('#main').innerHTML=(ne.length&&S.tab!=='envoi'&&S.tab!=='groupe'?`<button type="button" class="nonenvoye" data-act="tab" data-v="envoi">⚠ Séance ${ne.join(', ')} non envoyée au professeur — touche ici pour l’envoyer</button>`:'')+(V[S.tab]||vSeance)();
}

/* ----- Groupe ----- */
function vGroupe(){
  const L=S.eleves.length?S.eleves.slice():[];while(L.length<3)L.push({id:'',nom:''});
  const C=S.cfg;
  const choix=(e,i)=>{const pris=new Set(S.eleves.filter((x,j)=>j!==i).map(x=>x.nom));
    const hors=e.nom&&!C.eleves.includes(e.nom);
    return `<select id="g-e${i}" data-id="${esc(e.id)}"><option value="">${i===2?'— (si vous êtes 3) —':'— Choisir —'}</option>${hors?`<option selected>${esc(e.nom)}</option>`:''}${C.eleves.filter(n=>!pris.has(n)||n===e.nom).map(n=>`<option${n===e.nom?' selected':''}>${esc(n)}</option>`).join('')}</select>`};
  return `<h2>Mon groupe</h2>
  ${C?`<div class="carte"><p style="margin:0"><b>Classe ${esc(C.classe)}</b> <span class="small muted">· liste reçue du professeur (${C.eleves.length} élèves)</span></p>
      ${L.map((e,i)=>`<label class="ch" for="g-e${i}">Élève ${'ABC'[i]}</label>${choix(e,i)}`).join('')}
      <div class="rangee" style="margin-top:14px"><button class="bt orange" type="button" data-act="gvalider">Enregistrer le groupe</button><button class="bt mini" type="button" data-act="qrclasse">Nouvelle liste de classe (QR)</button></div></div>`
   :`<div class="carte"><h3>1. Scanner le QR de la classe</h3><p class="small muted">Le professeur l’affiche au premier cours. Il donne la classe et la liste des élèves.</p>
      <button class="bt orange" type="button" data-act="qrclasse">Scanner le QR de la classe</button></div>
    <details class="carte"><summary class="small">Pas de QR ? Saisir à la main</summary>
      <label class="ch" for="g-classe">Classe</label><input id="g-classe" type="text" placeholder="1G3" value="${esc(S.classe)}" autocomplete="off">
      ${L.map((e,i)=>`<label class="ch" for="g-e${i}">Élève ${'ABC'[i]}${i===2?' (si vous êtes 3)':''}</label><input id="g-e${i}" data-id="${esc(e.id)}" type="text" placeholder="Prénom Nom" value="${esc(e.nom)}" autocomplete="off">`).join('')}
      <div class="rangee" style="margin-top:14px"><button class="bt orange" type="button" data-act="gvalider">Enregistrer le groupe</button></div></details>`}
  <div class="carte"><h3>Un élève change de groupe</h3>
    <p class="small muted">Son étoile, ses axes, ses matchs à thème validés et ses poules le suivent sur l’autre téléphone.</p>
    ${S.eleves.length?`<p class="small"><b>Il part d’ici :</b></p><div class="rangee">${S.eleves.map((e,i)=>`<button class="bt mini" type="button" data-act="tpartir" data-v="${i}">${esc(e.nom.split(/\s+/)[0]||e.nom)} part</button>`).join('')}</div>`:''}
    ${S.eleves.length<3?`<p class="small" style="margin-top:12px"><b>Il arrive ici :</b></p><button class="bt orange mini" type="button" data-act="tarrive">Scanner le QR de l’élève qui arrive</button>`:'<p class="small muted" style="margin-top:12px">Le groupe est complet (3) : pour accueillir un élève, retire d’abord quelqu’un.</p>'}
  </div>
  <div class="carte"><h3>Changer de tablette</h3>
    <p class="small muted">Le carnet du groupe est gardé sur cette tablette. Pour continuer sur une autre, enregistre-le ici, puis reprends-le là-bas.</p>
    <div class="rangee"><button class="bt mini" type="button" data-act="sauvegarde">Enregistrer le carnet du groupe</button>
    <label class="bt mini" for="reprise">Reprendre un carnet</label><input id="reprise" type="file" accept=".json,application/json" hidden></div>
  </div>
  <div class="carte"><button class="bt mini danger" type="button" data-act="toutEffacer">Supprimer ce groupe de la tablette</button></div>
  <p class="rgpd">Les données restent sur ce téléphone. Elles partent seulement quand tu les envoies à ton professeur (QR code ou envoi en ligne).</p>`;
}

/* ----- Séance ----- */
function optAxes(cur,autre,id,disp){
  return `<option value="">— Choisir un axe —</option>`+['AFL1','AFL2','AFL3'].filter(f=>!disp||f!=='AFL1').map(f=>`<optgroup label="${f}">${GA.axes.filter(a=>a.afl===f&&(!disp||AXES_DISP.includes(a.k))).map(a=>`<option value="${a.k}"${a.k===cur?' selected':''}${a.k===autre?' disabled':''}>${esc(a.n)}${valideQuand(id,a.k)?' ✓':''}</option>`).join('')}</optgroup>`).join('');
}
function optExos(k,cur){
  const a=axe(k);if(!a)return '';
  return `<option value="">— N° d’exercice —</option>`+a.th.map(n=>{const t=theme(n);return `<optgroup label="Thème ${n} · ${esc(t.t)}">${t.ex.map(e=>`<option value="${esc(e.n)}"${e.n===cur?' selected':''}>${esc(e.n)} · ${esc(e.t)}</option>`).join('')}</optgroup>`}).join('');
}
/* Critères de la fiche GAREEPS par couleur. Les fiches donnent 3 niveaux (jaune, vert, vert foncé) pour les thèmes 2 et 6,
   2 niveaux (vert, vert foncé) pour les autres, 1 seul pour les rôles. Rouge = le premier niveau n'est pas encore atteint. */
function criteresEx(e){
  const nv=e.nv||[],cols=nv.length===3?[2,3,4]:nv.length===2?[3,4]:[4];
  return [{c:1,t:'Pas encore atteint : '+(nv[0]?'« '+nv[0]+' »':'le niveau demandé')}].concat(nv.map((t,i)=>({c:cols[i],t})));
}
function critereDe(e,c){const r=criteresEx(e).find(x=>x.c===c);return r?r.t:''}
function choixCriteres(e,i,v){
  return `<div class="crit" role="radiogroup" aria-label="Niveau atteint">${criteresEx(e).map(r=>`<button type="button" role="radio" aria-checked="${v===r.c}" data-act="niv" data-i="${i}" data-v="${r.c}" class="${v===r.c?'on':''}"><i class="p${r.c}"></i><span><small>${esc(GA.deg[r.c-1])}</small>${esc(r.t)}</span><em aria-hidden="true">${v===r.c?'✓':''}</em></button>`).join('')}</div>`;
}
// Le niveau compte vraiment quand un camarade (l'observateur) l'a vu et le confirme.
function verifPar(E,i,x){
  const autres=S.eleves.filter(e=>e.id!==E.id).map(e=>e.nom);
  return `<label class="ch">👀 Vérifié par l’observateur</label><div class="verif">${autres.map(n=>`<button type="button" data-act="verif" data-i="${i}" data-v="${esc(n)}" class="${x.obs===n?'on':''}">${x.obs===n?'✓ ':''}${esc(n.split(/\s+/)[0])}</button>`).join('')}<button type="button" data-act="verif" data-i="${i}" data-v="Professeur" class="${x.obs==='Professeur'?'on':''}">${x.obs==='Professeur'?'✓ ':''}Prof</button></div>
  ${x.obs?'':'<p class="small muted" style="margin:4px 0 0">Pas encore vérifié : l’observateur regarde l’exercice et confirme le niveau.</p>'}`;
}
function puces(nb,i){const l=nb===3?['●','●●','●●●']:nb===2?['●●','●●●']:['●●●'];return l[i]||'●●●'}
const IMG_EX=new Set(['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','A1','A2','A3','A4','R1','R2','R3','R4','R5','R6','R7','R8','R9','R10','R11']);
const IMG_MT=new Set([1,2,3,4,5,6,7]);
const duree=d=>d<60?d+' s':Math.floor(d/60)+' min '+String(d%60).padStart(2,'0');
// Image d'illustration (fiche GAREEPS) : un toucher ouvre la vidéo de l'exercice.
function illustration(src,vid,alt,principe){
  if(!src&&!vid)return '';
  const pr=principe?`<p class="principe"><b>Le principe</b> ${esc(principe)}</p>`:'';
  const img=src?`<img src="${src}" alt="${esc(alt)}" loading="lazy">`:`<span class="sansimg">${esc(alt)}</span>`;
  return vid?`<button type="button" class="illus" data-act="video" data-u="${vid.u}" data-t="${esc(vid.t)}">${img}<span class="play" aria-hidden="true">▶</span><span class="lv">Voir la vidéo · ${duree(vid.d)}</span></button>${pr}`
            :`<div class="illus sans">${img}<span class="lv">Pas encore de vidéo</span></div>${pr}`;
}
function voirAussi(n){
  const L=(VID.voirAussi[n]||[]).map(i=>VID.autres[i]);
  return L.length?`<div class="rangee" style="margin-top:6px">${L.map(v=>`<button type="button" class="bt mini" data-act="video" data-u="${v.u}" data-t="${esc(v.t)}">▶ ${esc(v.t)}</button>`).join('')}</div>`:'';
}
function fiche(n){
  const x=exInfo(n);if(!x)return '';const e=x.e;
  return illustration(IMG_EX.has(n)?'img/ex'+n+'.jpg':'',VID.ex[n],'Exercice '+n+' : '+e.t,PRINCIPE.ex[n])+voirAussi(n)+(window.outilsFiche?outilsFiche('ex',n):'')+`<details class="fiche"><summary>Voir l’exercice ${esc(e.n)} : ${esc(e.t)}</summary><dl class="f">
    <dt>Consigne</dt><dd>${esc(e.c)}</dd>
    ${e.j?`<dt>Joueur</dt><dd>${esc(e.j)}</dd>`:''}
    ${e.p?`<dt>Partenaires</dt><dd>${esc(e.p)}</dd>`:''}
    ${e.cr&&e.cr.length?`<dt>💡 Critères</dt><dd><ul>${e.cr.map(c=>`<li>${esc(c)}</li>`).join('')}</ul></dd>`:''}
    ${e.nv&&e.nv.length?`<dt>Niveaux à valider</dt><dd><ul class="nvl">${criteresEx(e).slice(1).map(r=>`<li><i class="dot p${r.c}"></i> ${esc(r.t)}</li>`).join('')}</ul></dd>`:''}
  </dl></details>`;
}
function pastilles(act,attrs,v){
  return `<div class="niv">${GA.deg.map((d,i)=>`<button type="button" data-act="${act}" ${attrs} data-v="${i+1}" class="${v===i+1?'on':''}" aria-pressed="${v===i+1}"><i class="p${i+1}"></i>${esc(d)}</button>`).join('')}</div>`;
}
function vSeance(){
  const E=elv(),n=S.seance,r=rec(E.id,n);
  let h=`<h2>Séance ${n} · ${esc(E.nom)}</h2>
  <label class="coche disp"><input type="checkbox" data-ch="disp" ${r.disp?'checked':''}> Aujourd’hui je suis dispensé(e)</label>
  ${r.disp?'<p class="avert small">Dispensé(e) : tu travailles un rôle (coach, arbitrage) ou l’analyse, et tu arbitres en poule.</p>':'<p class="muted small">Tes 2 axes de travail, l’exercice choisi pour chacun, et le niveau atteint.</p>'}`;
  if(!r.axes[0]&&!r.axes[1]&&!derniereEtoile(E.id,n))h+=`<p class="avert">Commence par ton étoile (onglet Étoile) : elle te propose tes 2 axes les plus faibles.</p>`;
  [0,1].forEach(sl=>{
    const k=r.axes[sl],a=axe(k),q=valideQuand(E.id,k);
    if(k&&!r.exos.some(x=>x.slot===sl))r.exos.push({slot:sl,ex:null,niv:0,rq:''});
    h+=`<section class="carte axe ${famCl(a)}"><h3>Axe ${sl+1}</h3>
      <select data-ch="axe" data-slot="${sl}" aria-label="Axe ${sl+1}">${optAxes(k,r.axes[1-sl],E.id,r.disp)}</select>`;
    if(a){
      h+=`<p style="margin:8px 0 0"><span class="fam ${famCl(a)}">${ICOFAM[a.afl]||''}${a.afl}</span> ${q?`<span class="ok">✓ match à thème validé${q!==n?' (séance '+q+')':''}</span>`:'<span class="small muted">match à thème pas encore validé</span>'}</p>`;
      h+=`<details class="fiche"><summary>Le match à thème de cet axe</summary>${a.th.map(t=>{const T=theme(t);return `<dl class="f"><dt>Thème ${t} · ${esc(T.t)}</dt><dd>${illustration(IMG_MT.has(t)?'img/mt'+t+'.jpg':'',VID.mt[t],'Match à thème '+t,PRINCIPE.mt[t])}${window.outilsFiche?outilsFiche('mt',t):''}</dd><dt>Règle complète</dt><dd>${esc(T.match)}</dd><dt>Je me reconnais si…</dt><dd><ul>${T.prob.map(p=>`<li>${esc(p)}</li>`).join('')}</ul></dd></dl>`}).join('')}</details>`;
      r.exos.forEach((x,i)=>{if(x.slot!==sl)return;
        const solo=r.exos.filter(y=>y.slot===sl).length===1;
        h+=`<div class="exo"><label class="ch">Exercice choisi</label><select data-ch="ex" data-i="${i}" aria-label="Numéro d’exercice">${optExos(k,x.ex)}</select>
          ${x.ex?fiche(x.ex)+`<label class="ch" style="margin-top:12px">J’ai atteint… <span class="small muted" style="font-weight:400">(touche ta ligne)</span></label>${choixCriteres(exInfo(x.ex).e,i,x.niv)}${x.niv?verifPar(E,i,x):''}${x.niv&&window.prochainPas?prochainPas(E,k,sl,x,i):''}
          <label class="ch">Remarque</label><input type="text" data-ch="exrq" data-i="${i}" value="${esc(x.rq)}" placeholder="ex. 6 sur 10, revers à revoir">`:''}
          ${solo?'':`<div style="margin-top:8px"><button class="bt mini" type="button" data-act="delex" data-i="${i}">Retirer cet exercice</button></div>`}</div>`;
      });
      h+=`<div class="rangee" style="margin-top:10px"><button class="bt mini" type="button" data-act="addex" data-slot="${sl}">＋ Un autre exercice sur cet axe</button></div>
        <label class="coche"><input type="checkbox" data-ch="val" data-k="${k}" ${r.val[k]?'checked':''}> Match à thème validé aujourd’hui</label>`;
    }
    h+=`</section>`;
  });
  h+=`<section class="carte"><label class="ch" for="bilan">Bilan : ce que j’ai appris, ce que je travaille la prochaine fois</label><textarea id="bilan" data-ch="bilan">${esc(r.rq)}</textarea></section>`;
  return h;
}

/* ----- Étoile ----- */
function radar(e,ref){
  const N=GA.axes.length,cx=210,cy=200,R=135,pt=(i,rr)=>{const t=-Math.PI/2+i*2*Math.PI/N;return [cx+rr*Math.cos(t),cy+rr*Math.sin(t)]};
  const rad=d=>R*(d-0.5)/3.5;
  let g=`<svg viewBox="-95 0 610 410" role="img" aria-label="Mon étoile">`;
  GA.axes.forEach((a,i)=>{const [x,y]=pt(i,R+8);g+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#9AA3AE" stroke-width="4" stroke-linecap="round"/>`});
  const poly=(v,st)=>GA.axes.every(a=>v[a.k])?`<polygon points="${GA.axes.map((a,i)=>pt(i,rad(v[a.k])).join(',')).join(' ')}" ${st}/>`:'';
  if(ref)g+=poly(ref,'fill="none" stroke="#5A6475" stroke-width="2.5" stroke-dasharray="7 5"');
  g+=poly(e,'fill="rgba(234,88,12,.18)" stroke="#EA580C" stroke-width="3"');
  const col=['#FF0000','#FFFF00','#70AD47','#385723'];
  GA.axes.forEach((a,i)=>{for(let d=1;d<=4;d++){const [x,y]=pt(i,rad(d)),on=e[a.k]===d;
    g+=`<g data-act="et" data-k="${a.k}" data-v="${d}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="17" fill="transparent"/>${on?`<circle cx="${x}" cy="${y}" r="13" fill="none" stroke="#172033" stroke-width="3"/>`:''}<circle cx="${x}" cy="${y}" r="${on?9:7}" fill="${col[d-1]}" stroke="#444" stroke-width="1.2"/></g>`}});
  const fam={AFL1:['#F4B183','#833C0B'],AFL2:['#FFD966','#7F6000'],AFL3:['#A9D18E','#385723']};
  GA.axes.forEach((a,i)=>{const [x,y]=pt(i,R+34),L=(a.k==='diff'?'Mettre en|difficulté':COURT[a.k]).split('|'),w=Math.max(...L.map(l=>l.length))*9.6+16,hh=L.length*20+6,anc=Math.abs(x-cx)<12?'middle':x>cx?'start':'end';
    const rx=anc==='middle'?x-w/2:anc==='start'?x-4:x-w+4,tx=anc==='middle'?x:anc==='start'?x+4:x-4;
    g+=`<rect x="${rx}" y="${y-hh/2}" width="${w}" height="${hh}" rx="6" fill="${fam[a.afl][0]}"/><text text-anchor="${anc}" font-family="Atkinson,Arial" font-weight="700" font-size="17" fill="${fam[a.afl][1]}">${L.map((l,j)=>`<tspan x="${tx}" y="${y-hh/2+19+j*20}">${l}</tspan>`).join('')}</text>`});
  return g+`</svg>`;
}
function vEtoile(){
  const E=elv(),n=S.seance,r=rec(E.id,n),e=r.etoile||{},gr=r.grille||{c0:0,c1:0,c2:0,c3:0,cx:0,projet:''};
  const first=premiereEtoile(E.id),ref=first&&first.s!==n?first.e:null;
  const score=gr.c1+2*gr.c2+3*gr.c3;
  let h=`<h2>Mon étoile · ${esc(E.nom)}</h2><p class="muted small">Séance ${n}. À faire en début de cycle, puis à refaire en fin de cycle pour voir tes progrès.</p>`;
  h+=`<details class="carte"${r.grille||n===1?' open':''}><summary><h3 style="display:inline">1 · Grille du coach</h3></summary>
    <p class="small muted">Pendant le match, le coach compte comment son joueur gagne ses points.</p>
    <div class="compteurs">${GA.obs.map(([c,l])=>{const k='c'+c;return `<div title="${esc(l)}"><span class="code">${c}</span><b>${gr[k]||0}</b><button type="button" data-act="cpt" data-k="${k}" data-v="1" aria-label="ajouter un ${c}">+</button><button type="button" data-act="cpt" data-k="${k}" data-v="-1" aria-label="enlever un ${c}">−</button></div>`}).join('')}</div>
    <ul class="small">${GA.obs.map(([c,l])=>`<li><b>${c}</b> : ${esc(l)}</li>`).join('')}</ul>
    ${window.codesDuJour?codesDuJour(E,n):''}
    <p><b>Score observé : ${score}</b> <span class="small muted">(1 × les 1 + 2 × les 2 + 3 × les 3)</span></p>
    <label class="ch" for="projet">Je prévois de gagner en…</label><input id="projet" type="text" data-ch="projet" value="${esc(gr.projet)}" placeholder="ex. service sur le revers et smash dès que possible">
  </details>`;
  h+=`<section class="carte"><h3>2 · Je me situe sur mon étoile</h3><p class="small muted">Touche la pastille qui te décrit sur chaque axe. On se situe avec les faits notés, pas avec l’impression.</p>
    <div class="radar">${radar(e,ref)}</div>
    ${ref?`<p class="small muted" style="text-align:center">Pointillés : ta 1re étoile (séance ${first.s}).</p>`:''}
    <div class="grille-etoile">${GA.axes.map(a=>`<div class="ax-row carte axe ${famCl(a)}" style="margin:0"><b>${esc(a.n)}</b> <span class="fam ${famCl(a)}">${ICOFAM[a.afl]||''}${a.afl}</span>
      ${pastilles('et',`data-k="${a.k}"`,e[a.k]||0)}<div class="desc">${e[a.k]?esc(a.d[e[a.k]-1]):''}</div></div>`).join('')}</div></section>`;
  const set=GA.axes.filter(a=>e[a.k]);
  h+=`<section class="carte"><h3>Mes pistes de travail</h3>`;
  if(set.length<3)h+=`<p class="muted">Place au moins 3 axes pour obtenir des pistes.</p>`;
  else{
    const [k1,k2]=plusFaibles(e);
    h+=`<p>Tes 2 axes les plus faibles :</p><ul>${[k1,k2].filter(Boolean).map(k=>{const a=axe(k);return `<li><b>${esc(a.n)}</b> (${GA.deg[e[k]-1].toLowerCase()}) → ${a.th.map(t=>`thème ${t} « ${esc(theme(t).t)} »`).join(' ; ')}</li>`}).join('')}</ul>
      <button class="bt orange" type="button" data-act="prendreAxes">Prendre ces 2 axes pour ma séance</button>`;
  }
  return h+`</section>`;
}

/* ----- Poule ----- */
// Plusieurs tours de poule dans une même séance (évaluation : 4 tours). Clé : « 8 » pour le tour 1, « 8.2 » pour le tour 2…
const NB_TOURS=4;
const cleTour=(n,t)=>t>1?n+'.'+t:String(n);
const pk=()=>cleTour(S.seance,S.tour||1);
const labS=x=>{x=+x;return Number.isInteger(x)?String(x):Math.floor(x)+' · tour '+Math.round((x%1)*10)};
function toursDe(n){const L=[];for(let t=1;t<=9;t++){const P=S.poules[cleTour(n,t)];if(P&&P.matchs)L.push([t,P])}return L}
function choixTour(){const t=S.tour||1;return `<div class="tours"><span class="small">Tour</span>${[...Array(NB_TOURS)].map((_,i)=>{const P=S.poules[cleTour(S.seance,i+1)];return `<button type="button" data-act="tour" data-v="${i+1}" class="${t===i+1?'ici':''} ${P&&P.matchs?'fait':''}">${i+1}</button>`}).join('')}<span class="small muted">un seul tour d’habitude ; 4 le jour de l’évaluation</span></div>`}
function vPoule(){
  const n=S.seance,P=S.poules[pk()];
  if(!P||P.edit)return choixTour()+formPoule(P);
  const need={'1':1,'2':3,'3':5}[P.fmt];
  let h=choixTour()+`<h2>Poule ${P.num} · séance ${n}${(S.tour||1)>1?' · tour '+S.tour:''}</h2><p class="muted small">${P.joueurs.length} joueurs · ${P.fmt==='1'?'1 manche':P.fmt+' manches gagnantes'} · un seul téléphone par poule saisit les scores.</p>`;
  h+=`<section class="carte"><h3>Les matchs</h3>${P.matchs.map((m,i)=>{const e=TTL.etatMatch(m,P.fmt),A=P.joueurs[m.a],B=P.joueurs[m.b];
    return `<div class="match"><div class="tete"><b>${i+1}. ${esc(A)} – ${esc(B)}</b><span id="mb-${i}">${badge(P,m)}</span></div>
      <div class="rangee mq"><button type="button" class="bt mini orange" data-act="marque" data-m="${i}">🏓 Tableau de marque</button><button type="button" class="bt mini" data-act="projets" data-m="${i}">Projets${m.pj&&(m.pj[0]!=null||m.pj[1]!=null)?' ✓':''}</button></div>
      ${m.pj&&(m.pj[0]!=null||m.pj[1]!=null)?`<div class="small">${[0,1].filter(j=>m.pj[j]!=null).map(j=>`${esc((j?B:A).split(/\s+/)[0])} : ${esc(TTL.PROJETS[m.pj[j]])}${m.pjok&&m.pjok[j]!=null?(m.pjok[j]?' ✓ réussi':' ✗ non réussi'):''}`).join(' · ')}</div>`:''}
      <div class="small muted">${P.arbDisp?'🧑‍⚖️ Arbitre : '+esc(P.arbDisp)+' (dispensé)':m.arb!=null?'🧑‍⚖️ Arbitre-coach : '+esc(P.joueurs[m.arb]):'Pas d’arbitre libre : les joueurs comptent'}</div>
      <div class="sets">${[...Array(need)].map((_,s)=>{const v=(m.m||[])[s]||['',''];return `<span class="set"><input inputmode="numeric" pattern="[0-9]*" maxlength="2" data-ch="set" data-m="${i}" data-s="${s}" data-c="0" value="${esc(v[0])}" aria-label="Manche ${s+1}, points de ${esc(A)}">–<input inputmode="numeric" pattern="[0-9]*" maxlength="2" data-ch="set" data-m="${i}" data-s="${s}" data-c="1" value="${esc(v[1])}" aria-label="Manche ${s+1}, points de ${esc(B)}"></span>`}).join('')}
      <select data-ch="forf" data-m="${i}" style="width:auto;min-height:44px" aria-label="Forfait"><option value="">Joué</option><option value="a"${m.f==='a'?' selected':''}>Forfait ${esc(A)}</option><option value="b"${m.f==='b'?' selected':''}>Forfait ${esc(B)}</option></select></div></div>`}).join('')}</section>`;
  h+=`<section class="carte"><h3>Classement</h3><div id="pcl">${htmlClassement(P)}</div>
    <div class="rangee"><button class="bt mini" type="button" data-act="pedit">Modifier la poule</button></div></section>`;
  h+=historique();
  return h;
}
function badge(P,m){const e=TTL.etatMatch(m,P.fmt);return e.fini?`<span class="badge v">${esc(P.joueurs[e.w==='a'?m.a:m.b])} gagne ${e.forfait?'(forfait)':e.ma+'-'+e.mb}</span>`:''}
function htmlClassement(P){
  const C=TTL.classement(P.joueurs.length,P.matchs,P.fmt),total=P.matchs.length,joues=P.matchs.filter(m=>TTL.etatMatch(m,P.fmt).fini).length,moi=elv()?elv().nom:'';
  return `<p class="small muted">${joues}/${total} matchs joués.</p><table class="cl"><thead><tr><th>Rang</th><th>Joueur</th><th>Pts</th><th>V</th><th>D</th><th>Manches</th></tr></thead><tbody>${C.map(c=>`<tr class="${P.joueurs[c.i]===moi?'moi':''}"><td>${c.rang}</td><td>${esc(P.joueurs[c.i])}</td><td>${c.pts}</td><td>${c.v}</td><td>${c.d}</td><td>${c.mg}-${c.mp}</td></tr>`).join('')}</tbody></table>
    <p class="small muted">Victoire 2 pts, défaite 1, forfait 0. Égalité : matchs entre ex aequo, puis manches, puis points.</p>
    ${P.mouv&&joues===total&&total?`<p><b>${esc(P.joueurs[C[0].i])}</b> ${P.num>1?'monte en poule '+(P.num-1):'reste en poule 1'} · <b>${esc(P.joueurs[C[C.length-1].i])}</b> descend en poule ${P.num+1}</p>`:''}`;
}
function formPoule(P){
  const disp=S.eleves.filter(e=>{const r=(S.d[e.id]||{})[S.seance];return r&&r.disp}).map(e=>e.nom);
  const d=P||{num:1,fmt:'2',mouv:true,joueurs:S.eleves.map(e=>e.nom).filter(n=>!disp.includes(n)),arbDisp:disp[0]||''};
  const J=d.joueurs.slice();while(J.length<3)J.push('');
  const liste=S.cfg?S.cfg.eleves:null;
  const champ=(j,i)=>liste?`<select class="pj" aria-label="Joueur ${i+1}" style="margin-bottom:6px"><option value="">—</option>${j&&!liste.includes(j)?`<option selected>${esc(j)}</option>`:''}${liste.map(n=>`<option${n===j?' selected':''}>${esc(n)}</option>`).join('')}</select>`
    :`<input type="text" class="pj" value="${esc(j)}" placeholder="Prénom Nom" style="margin-bottom:6px" autocomplete="off" aria-label="Joueur ${i+1}">`;
  return `<h2>Ma poule · séance ${S.seance}${(S.tour||1)>1?' · tour '+S.tour:''}</h2>
  <p class="muted small">Le professeur donne les poules. Recopiez votre poule ici, sur un seul téléphone par poule. Écris chaque nom en entier.</p>
  <div class="carte">
    <label class="ch" for="p-num">Numéro de poule</label><select id="p-num">${[...Array(15)].map((_,i)=>`<option${d.num===i+1?' selected':''}>${i+1}</option>`).join('')}</select>
    <label class="ch" for="p-fmt">Format des matchs</label><select id="p-fmt"><option value="1"${d.fmt==='1'?' selected':''}>1 manche</option><option value="2"${d.fmt==='2'?' selected':''}>2 manches gagnantes</option><option value="3"${d.fmt==='3'?' selected':''}>3 manches gagnantes</option></select>
    <label class="ch">Joueurs (2 à 6)</label><div id="p-joueurs">${J.map(champ).join('')}</div>
    <div class="rangee"><button class="bt mini" type="button" data-act="pplus">＋ Un joueur</button></div>
    <label class="ch" for="p-arb">Arbitre dispensé(e) (facultatif)</label><select id="p-arb"><option value="">— aucun —</option>${(liste||S.eleves.map(e=>e.nom)).map(n=>`<option${n===d.arbDisp?' selected':''}>${esc(n)}</option>`).join('')}</select>
    <label class="coche"><input type="checkbox" id="p-mouv" ${d.mouv?'checked':''}> Le 1er monte, le dernier descend</label>
    ${P&&P.matchs&&P.matchs.some(m=>(m.m||[]).length||m.f)?'<p class="avert">Si tu changes les joueurs, les scores déjà saisis sont effacés.</p>':''}
    <div class="rangee" style="margin-top:12px"><button class="bt orange" type="button" data-act="pcreer">Créer les matchs</button>${P?'<button class="bt" type="button" data-act="pannuler">Annuler</button>':''}</div>
  </div>${historique()}`;
}
function historique(){
  const E=elv();if(!E)return '';
  const R={};
  (S.hist[E.id]||[]).forEach(h=>{R[h[0]]={num:h[1],rang:h[2],n:h[3],v:h[4],d:h[5],mv:h[6]||''}});
  Object.keys(S.poules).forEach(k=>{const n=+k,P=S.poules[n],i=P.joueurs.indexOf(E.nom);if(i<0||!P.matchs)return;const r=TTL.resumePoule(P,i);R[n]={num:P.num,rang:r.rang,n:r.nbJoueurs,v:r.victoires,d:r.defaites,mv:r.mouvement||''}});
  const L=Object.keys(R).map(Number).sort((a,b)=>a-b).map(n=>{const r=R[n];return `<tr><td>${labS(n)}</td><td>${r.num}</td><td>${r.rang}/${r.n}</td><td>${r.v}-${r.d}</td><td class="small">${esc(r.mv)}</td></tr>`});
  return L.length?`<section class="carte" id="phist"><h3>Mes poules · ${esc(E.nom)}</h3><table class="cl"><thead><tr><th>Séance</th><th>Poule</th><th>Rang</th><th>V-D</th><th>Ensuite</th></tr></thead><tbody>${L.join('')}</tbody></table></section>`:'';
}

/* ----- Règles du jeu et gestes techniques ----- */
function vRegles(){
  const R={};VID.autres.forEach(v=>(R[v.r]=R[v.r]||[]).push(v));
  const carte=v=>`<button type="button" class="vcarte" data-act="video" data-u="${v.u}" data-t="${esc(v.t)}"><span class="play" aria-hidden="true">▶</span><span><b>${esc(v.t)}</b><small>${duree(v.d)}</small></span></button>`;
  return `<h2>Règles du jeu et gestes techniques</h2><p class="muted small">Les vidéos s’ouvrent avec internet.</p>
  ${Object.keys(R).map(r=>`<section class="carte"><h3>${esc(r)}</h3><div class="vliste">${R[r].map(carte).join('')}</div></section>`).join('')}
  <section class="carte"><h3>Les matchs à thème</h3><div class="vliste">${Object.keys(VID.mt).sort((a,b)=>a-b).map(k=>carte(Object.assign({},VID.mt[k],{t:VID.mt[k].t+' · '+theme(+k).t}))).join('')}</div></section>
  <p class="small"><a href="${VID.chaine}" target="_blank" rel="noopener">Toutes les vidéos de la chaîne</a></p>`;
}
function ouvrirVideo(u,t){
  const page=VID.base+'/w/'+u;
  if(navigator.onLine===false){fen(`<h3>${esc(t)}</h3><p class="avert">Pas de connexion internet : la vidéo ne peut pas s’ouvrir.</p><div class="rangee"><button class="bt noir" type="button" data-act="fermer">Fermer</button></div>`);return}
  fen(`<h3>${esc(t)}</h3><div class="video"><iframe src="${VID.base}/videos/embed/${u}?autoplay=1&title=0&warningTitle=0&peertubeLink=0" title="${esc(t)}" allow="autoplay; fullscreen" allowfullscreen sandbox="allow-same-origin allow-scripts allow-popups allow-presentation"></iframe></div>
    <div class="rangee" style="margin-top:12px;justify-content:space-between"><a class="bt mini" href="${page}" target="_blank" rel="noopener">Ouvrir sur le site</a><button class="bt noir" type="button" data-act="fermer">Fermer</button></div>`,'large');
}

/* ----- Envoi ----- */
function exportEleve(E,n){
  const P=S.poules[n],pi=P&&P.matchs?P.joueurs.indexOf(E.nom):-1;
  let r=(S.d[E.id]||{})[n];
  if(r&&r.imp&&!r.date)r=null; // reçu d'un autre téléphone, déjà envoyé de là-bas
  const arbitre=P&&P.matchs&&P.arbDisp===E.nom?{numero:P.num,matchs:P.matchs.filter(m=>TTL.etatMatch(m,P.fmt).fini).length}:null;
  const tours=toursDe(n).filter(([t])=>t>1).map(([t,Q])=>{const i=Q.joueurs.indexOf(E.nom);
    if(i>=0)return Object.assign({tour:t},TTL.resumePoule(Q,i),{brut:pouleBrute(Q)});
    if(Q.arbDisp===E.nom)return {tour:t,arbitre:true,numero:Q.num,brut:pouleBrute(Q)};
    return null}).filter(Boolean);
  if(!r){if(pi<0&&!arbitre&&!tours.length)return null;r={date:today(),axes:[],chg:[],exos:[],val:{},rq:'',etoile:null,grille:null}} // dans la poule mais rien d'autre saisi
  return {app:'tennis-de-table-eleves',version:VERSION,activite:'Tennis de table',classe:S.classe,eleve:E.nom,seance:n,date:r.date||today(),exportedAt:new Date().toISOString(),
    axes:r.axes.filter(Boolean).map(k=>{const a=axe(k);return {axe:k,nom:a.n,afl:a.afl,valideAujourdhui:!!r.val[k],valideDepuisSeance:valideQuand(E.id,k)}}),
    changementsAxe:r.chg.map(c=>({de:c.de,vers:c.vers,motif:c.motif,quand:c.ts})),
    exercices:r.exos.filter(x=>x.ex).map(x=>{const i=exInfo(x.ex);return {axe:r.axes[x.slot],exercice:x.ex,theme:i?i.t.n:null,titre:i?i.e.t:'',niveau:x.niv||null,niveauLibelle:x.niv?GA.deg[x.niv-1]:'',critereAtteint:x.niv&&i?critereDe(i.e,x.niv):'',verifiePar:x.niv&&x.obs?x.obs:'',remarque:x.rq||''}}),
    bilan:r.rq||'',dispense:!!r.disp,groupe:S.eleves.map(e=>e.nom),
    etoile:r.etoile&&Object.keys(r.etoile).length?GA.axes.map(a=>({axe:a.k,nom:a.n,degre:r.etoile[a.k]||null,libelle:r.etoile[a.k]?GA.deg[r.etoile[a.k]-1]:''})):null,
    grilleCoach:r.grille?Object.assign({scoreObserve:r.grille.c1+2*r.grille.c2+3*r.grille.c3},r.grille):null,
    poule:pi>=0?Object.assign(TTL.resumePoule(P,pi),{brut:pouleBrute(P)}):null,
    arbitrePoule:arbitre?Object.assign(arbitre,{brut:pouleBrute(P)}):null,
    tours:tours.length?tours:undefined};
}
// La poule complète (tous les matchs, manche par manche) : l'outil prof reconstruit le tableau et le classement.
function pouleBrute(P){return {num:P.num,fmt:P.fmt,arbDisp:P.arbDisp||'',joueurs:P.joueurs.slice(),matchs:P.matchs.map(m=>({a:m.a,b:m.b,arb:m.arb,f:m.f||null,pj:m.pj||null,pjok:m.pjok||null,co:m.codes||null,m:(m.m||[]).filter(x=>x&&x[0]!==''&&x[1]!==''&&x[0]!=null&&x[1]!=null).map(x=>[+x[0],+x[1]])}))}}
function fichiers(n){
  const L=[];
  S.eleves.forEach(E=>{const o=exportEleve(E,n);if(o)L.push({nom:TTL.nomFichier(S.classe,E.nom,n),o})});
  // joueurs des poules saisies ici qui ne sont pas du groupe : un fichier « poule » chacun (tous les tours)
  const mine=new Set(S.eleves.map(e=>e.nom)),autres={};
  toursDe(n).forEach(([t,P])=>P.joueurs.forEach((j,i)=>{if(mine.has(j))return;const o=autres[j]||(autres[j]={tours:[]});
    const res=Object.assign(TTL.resumePoule(P,i),{brut:pouleBrute(P)});if(t===1)o.poule=res;else o.tours.push(Object.assign({tour:t},res))}));
  Object.entries(autres).forEach(([j,x])=>L.push({nom:TTL.nomFichier(S.classe,j,n,'poule'),o:{app:'tennis-de-table-eleves',version:VERSION,type:'poule',activite:'Tennis de table',classe:S.classe,eleve:j,seance:n,date:today(),exportedAt:new Date().toISOString(),saisiPar:S.eleves.map(e=>e.nom).join(', '),poule:x.poule||null,tours:x.tours.length?x.tours:undefined}}));
  return L;
}
function vEnvoi(){
  const n=S.seance,F=fichiers(n),ev=S.envoi[n]||{},LET='ABC';
  const resume=o=>{const nx=o.exercices.length,nn=o.exercices.filter(e=>e.niveau).length,L=[];
    if(o.axes.length)L.push(o.axes.length+' axe'+(o.axes.length>1?'s':''));
    if(nx)L.push(nx+' exercice'+(nx>1?'s':'')+(nn?' ('+nn+' niveau'+(nn>1?'x':'')+' coché'+(nn>1?'s':'')+')':''));
    if(o.dispense)L.unshift('dispensé(e)');if(o.arbitrePoule)L.push('arbitre poule '+o.arbitrePoule.numero);
    if(o.etoile)L.push('étoile');if(o.poule)L.push('poule '+o.poule.numero+', rang '+o.poule.rang);if(o.tours)L.push(o.tours.length+' autre'+(o.tours.length>1?'s':'')+' tour'+(o.tours.length>1?'s':''));
    return L.join(', ')};
  const lignes=S.eleves.map((E,k)=>{const o=exportEleve(E,n);
    return `<li class="${o?'':'manque'}"><span class="lettre">${LET[k]}</span><span><b>${esc(E.nom)}</b><small>${o?esc(resume(o))||'séance ouverte, rien de coché':'rien de saisi'}</small></span>${o?'<em>✓</em>':''}</li>`}).join('');
  const autres=F.filter(f=>f.o.type==='poule');
  const heure=t=>new Date(t).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  return `<h2>Fin de séance ${n}</h2>
  <section class="carte"><h3>Ma séance du jour</h3><ul class="envoi">${lignes}</ul>
    ${autres.length?`<p class="small muted">Résultats de poule envoyés aussi pour : ${autres.map(f=>esc(f.o.eleve)).join(', ')}.</p>`:''}
    ${S.eleves.some(E=>!exportEleve(E,n))?`<p class="avert small">Chaque élève choisit son prénom en haut de l’écran avant de saisir ses exercices.</p>`:''}</section>
  <div class="gros">
    <button class="bt orange" type="button" data-act="enligne" ${F.length?'':'disabled'}>Envoyer ma séance du jour en ligne</button>
    ${ev.fichier?`<p class="ok small">✓ envoyée à ${heure(ev.fichier)}</p>`:''}
    <button class="bt noir" type="button" data-act="qr" ${F.length?'':'disabled'}>Montrer le QR code</button>
    ${ev.qr?`<p class="ok small">✓ QR montré à ${heure(ev.qr)}</p>`:''}
  </div>`;
}

/* ---------- Transfert d'un élève vers un autre téléphone ---------- */
function historiqueEleve(E){
  const h={s:[],p:[]};
  seancesDe(E.id).forEach(n=>{const r=S.d[E.id][n];const val=Object.keys(r.val||{}).filter(k=>r.val[k]);
    const et=r.etoile&&Object.keys(r.etoile).length?GA.axes.map(a=>r.etoile[a.k]||0):0;
    if(r.axes.some(Boolean)||val.length||et)h.s.push([n,r.axes.map(x=>x||''),val,et])});
  const R={};(S.hist[E.id]||[]).forEach(x=>R[x[0]]=x);
  Object.keys(S.poules).forEach(k=>{const n=+k,P=S.poules[n],i=P.joueurs.indexOf(E.nom);if(i<0||!P.matchs)return;const r=TTL.resumePoule(P,i);R[n]=[n,P.num,r.rang,r.nbJoueurs,r.victoires,r.defaites,r.mouvement||'']});
  h.p=Object.values(R).sort((a,b)=>a[0]-b[0]);
  return {a:'TTE',v:1,t:'T',c:S.classe,e:E.nom,h};
}
async function montrerTransfert(i){
  const E=S.eleves[i],txt=await chaineBrute(historiqueEleve(E));
  let svg;try{svg=qrSvg(txt)}catch(e){svg='<p class="avert">Historique trop long pour un QR.</p>'}
  fen(`<h3>${esc(E.nom)} change de groupe</h3><p class="small muted">Sur le téléphone de son nouveau groupe : Groupe → « Scanner le QR de l’élève qui arrive ».</p><div class="qrbox">${svg}</div>
    <div class="rangee" style="margin-top:12px;justify-content:space-between"><button class="bt" type="button" data-act="fermer">Fermer</button><button class="bt danger" type="button" data-act="tretirer" data-v="${i}">C’est fait : retirer ${esc(E.nom.split(/\s+/)[0])} d’ici</button></div>`);
}
function recevoirClasse(o){
  if(o.t!=='C')throw new Error('Ce n’est pas le QR de la classe.');
  const cfg={classe:o.c,eleves:o.l||[],lien:o.u||'',k:o.k||''};
  ROOT.classes[o.c]=cfg;
  ecrireRoot(); // les autres groupes de la classe recevront la nouvelle liste à leur ouverture
  if(!S||(S.eleves.length&&S.classe&&S.classe!==o.c)){setTimeout(()=>{if(S)verrouiller().then(rendre);demanderCode('Nouveau groupe · '+o.c,'Choisissez un code secret de 4 chiffres. Retenez-le : il sera demandé à chaque cours.',c=>nouveauGroupe(o.c,c),true)},300);return 'Classe '+o.c+' enregistrée.'}
  S.cfg=JSON.parse(JSON.stringify(cfg));S.classe=o.c;sauver();rendre();
  return 'Classe '+o.c+' : '+(o.l||[]).length+' élèves.';
}
function accueillir(o){
  if(o.t!=='T')throw new Error('Ce n’est pas un QR de changement de groupe.');
  if(S.eleves.some(e=>e.nom.toLowerCase()===String(o.e).toLowerCase()))throw new Error(o.e+' est déjà dans ce groupe.');
  if(S.eleves.length>=3)throw new Error('Le groupe est déjà complet (3 élèves).');
  const id=uid();S.eleves.push({id,nom:o.e});if(!S.classe&&o.c)S.classe=o.c;
  S.d[id]={};
  ((o.h&&o.h.s)||[]).forEach(([n,ax,val,et])=>{const e={};if(et)GA.axes.forEach((a,k)=>{if(et[k])e[a.k]=et[k]});
    S.d[id][n]={date:null,imp:true,axes:[ax[0]||null,ax[1]||null],chg:[],exos:[],val:Object.fromEntries((val||[]).map(k=>[k,true])),rq:'',etoile:Object.keys(e).length?e:null,grille:null}});
  S.hist[id]=(o.h&&o.h.p)||[];
  S.cur=S.eleves.length-1;sauver();rendre();
  return o.e+' a rejoint le groupe.';
}

/* ---------- Projets de jeu ---------- */
function fenProjets(i){
  const P=S.poules[pk()],m=P.matchs[i],noms=[P.joueurs[m.a],P.joueurs[m.b]],pj=m.pj||[null,null],ok=m.pjok||[null,null],fini=TTL.etatMatch(m,P.fmt).fini;
  fen(`<h3>Projets de jeu · match ${i+1}</h3><p class="small muted">Chaque joueur annonce à l’arbitre comment il prévoit de gagner. Après le match, l’arbitre dit si le projet a été réalisé.</p>
    ${[0,1].map(j=>`<div class="carte" style="margin:8px 0"><b>${esc(noms[j])}</b>
      <select data-ch="pj" data-m="${i}" data-j="${j}" style="margin-top:6px"><option value="">— Pas de projet annoncé —</option>${TTL.PROJETS.map((t,k)=>`<option value="${k}"${pj[j]===k?' selected':''}>${esc(t)}</option>`).join('')}</select>
      ${pj[j]!=null?`<div class="rangee" style="margin-top:8px"><span class="small">Réalisé ?</span><button type="button" class="bt mini${ok[j]===true?' noir':''}" data-act="pjok" data-m="${i}" data-j="${j}" data-v="1">Oui</button><button type="button" class="bt mini${ok[j]===false?' noir':''}" data-act="pjok" data-m="${i}" data-j="${j}" data-v="0">Non</button>${fini?'':'<span class="small muted">(après le match)</span>'}</div>`:''}</div>`).join('')}
    <div class="rangee" style="justify-content:flex-end"><button class="bt noir" type="button" data-act="fermerRendre">Fermer</button></div>`);
}

/* ---------- Tableau de marque (bord de table) ---------- */
let MQ=null; // {i, cote: false = A à gauche}
function ouvrirMarque(i){
  const P=S.poules[pk()],m=P.matchs[i];
  if(TTL.etatMatch(m,P.fmt).fini&&!confirm('Ce match est déjà terminé. Le rejouer au tableau de marque efface son score ?'))return;
  if(TTL.etatMatch(m,P.fmt).fini){m.m=[];delete m.live}
  MQ={i,inv:false};peindreMarque();
}
function peindreMarque(){
  let z=document.getElementById('marque');if(!MQ){if(z)z.remove();return}
  if(!z){z=document.createElement('div');z.id='marque';document.body.appendChild(z)}
  const P=S.poules[pk()],m=P.matchs[MQ.i],e=TTL.etatMatch(m,P.fmt),noms={a:P.joueurs[m.a],b:P.joueurs[m.b]};
  const need={'1':1,'2':2,'3':3}[P.fmt]||2,mset=(m.m||[]).filter(x=>x&&x[0]!==''&&x[1]!=='').length;
  const arb=P.arbDisp||(m.arb!=null?P.joueurs[m.arb]:'');
  let h=`<div class="mq-haut"><b>Match ${MQ.i+1}${arb?' · arbitre '+esc(arb.split(/\s+/)[0]):''}</b><span>Manches ${e.ma}-${e.mb} · ${need===1?'1 manche':need+' manches gagnantes'}</span><button type="button" class="bt mini" data-act="mqfermer">Fermer</button></div>`;
  if(e.fini){
    const pj=m.pj||[null,null],ok=m.pjok||[null,null];
    h+=`<div class="mq-fin">${window.barreCodes&&MQ.code?barreCodes(m,noms):''}<h2>${esc(noms[e.w])} gagne ${e.w==='a'?e.ma+'-'+e.mb:e.mb+'-'+e.ma}</h2><p>${esc(TTL.texteScore(m,P.fmt,e.w))}</p>
      ${[0,1].filter(j=>pj[j]!=null).map(j=>`<div class="carte"><b>${esc(j?noms.b:noms.a)}</b> · ${esc(TTL.PROJETS[pj[j]])}<div class="rangee" style="margin-top:8px;justify-content:center"><span>Projet réalisé ?</span><button type="button" class="bt${ok[j]===true?' noir':''}" data-act="pjok" data-m="${MQ.i}" data-j="${j}" data-v="1">Oui</button><button type="button" class="bt${ok[j]===false?' noir':''}" data-act="pjok" data-m="${MQ.i}" data-j="${j}" data-v="0">Non</button></div></div>`).join('')}
      <button type="button" class="bt orange" data-act="mqfermer" style="margin-top:12px">Terminé</button></div>`;
  }else if(!m.live){
    const prec=m.premier0;// qui a servi en premier à la manche précédente
    h+=`<div class="mq-fin">${window.barreCodes&&MQ.code?barreCodes(m,noms):''}<h2>Manche ${mset+1}</h2>${mset===0&&!(m.pj&&(m.pj[0]!=null||m.pj[1]!=null))?`<p><button type="button" class="bt" data-act="projets" data-m="${MQ.i}">Annoncer les projets de jeu</button></p>`:''}
      <p>Qui sert en premier ?</p><div class="rangee" style="justify-content:center">${['a','b'].map(c=>`<button type="button" class="bt${prec&&prec!==c?' orange':''}" data-act="mqservice" data-v="${c}">${esc(noms[c])}</button>`).join('')}</div>
      ${prec?'<p class="small muted">À la manche suivante, l’autre joueur sert en premier.</p>':''}</div>`;
  }else{
    const L=m.live,srv=TTL.serveur(L.p,L.a,L.b),cotes=MQ.inv?['b','a']:['a','b'];
    h+=`<div class="mq-jeu">${cotes.map(c=>`<div class="mq-cote${srv===c?' sert':''}">
        <button type="button" class="mq-plus" data-act="mqpoint" data-v="${c}" aria-label="Point pour ${esc(noms[c])}"><span class="mq-nom">${esc(noms[c])}</span><span class="mq-score">${L[c]}</span>${srv===c?'<span class="mq-srv">🏓 au service</span>':''}${m.pj&&m.pj[c==='a'?0:1]!=null?`<span class="mq-pj">${esc(TTL.PROJETS[m.pj[c==='a'?0:1]])}</span>`:''}</button>
        <button type="button" class="bt mini" data-act="mqmoins" data-v="${c}">− 1</button></div>`).join('')}</div>
      ${window.barreCodes?barreCodes(m,noms):''}
      <div class="mq-bas"><button type="button" class="bt mini" data-act="mqinv">⇄ Côtés</button><button type="button" class="bt mini${m.coach?' on':''}" data-act="mqcoach" aria-pressed="${!!m.coach}">🗣️ Codes du coach${m.coach?' ✓':''}</button><button type="button" class="bt mini" data-act="tempsmort">⏸ Temps mort</button><span class="small">Touchez le côté du joueur qui marque.</span></div>`;
  }
  z.innerHTML=h;
}
function pointMarque(c,d){
  const P=S.poules[pk()],m=P.matchs[MQ.i],L=m.live;if(!L)return;
  if(window.codePoint)codePoint(m,c,d,L);
  L[c]=Math.max(0,L[c]+d);modif();
  if(TTL.mancheFinie(L.a,L.b)){m.m=(m.m||[]).filter(x=>x&&x[0]!==''&&x[1]!=='');m.m.push([L.a,L.b]);m.premier0=L.p;delete m.live;
    if(!TTL.etatMatch(m,P.fmt).fini)MQ.inv=!MQ.inv; // on change de côté à chaque manche
    try{navigator.vibrate&&navigator.vibrate([60,60,60])}catch(e){}}
  QRS=null;sauver();peindreMarque();
}

/* ---------- Fenêtres ---------- */
function fen(html,cl){$('#modal').innerHTML=`<div class="voile" data-act="fermerVoile"><div class="fen ${cl||''}" role="dialog" aria-modal="true">${html}</div></div>`}
function fermer(){$('#modal').innerHTML='';PENDING=null;QRS=null}
let toastT;function toast(t){clearTimeout(toastT);let d=$('.toast');if(!d){d=document.createElement('div');d.className='toast';document.body.appendChild(d)}d.textContent=t;toastT=setTimeout(()=>d.remove(),2600)}
let PENDING=null,QRS=null;
function avertirAxe(sl,de,vers){
  PENDING={sl,de,vers};
  const a=axe(de),b=vers?axe(vers):null;
  fen(`<h3>⚠️ Attention</h3><p>Tu changes d’axe alors que ton match à thème <b>« ${esc(a.n)} »</b> n’est pas validé.</p>
    ${b?`<p class="small muted">Nouvel axe : ${esc(b.n)}</p>`:''}
    <p><b>Pourquoi changes-tu ?</b></p>
    <div style="display:grid;gap:8px">${MOTIFS.map((m,i)=>`<button class="bt" type="button" data-act="motif" data-v="${i}">${esc(m)}</button>`).join('')}</div>
    <div class="rangee" style="margin-top:14px"><button class="bt noir" type="button" data-act="garder">Garder mon axe</button></div>`,'alerte');
}
function changerAxe(r,sl,vers,motif){
  const de=r.axes[sl];
  r.axes[sl]=vers;touche(r);
  if(motif)r.chg.push({de,vers,motif,ts:new Date().toISOString()});
  r.exos=r.exos.filter(x=>x.slot!==sl);
  if(vers)r.exos.push({slot:sl,ex:null,niv:0,rq:''});
}
function qrSvg(txt){
  const q=qrcode(0,'L');q.addData(txt,'Byte');q.make();
  const c=q.getModuleCount(),m=4;let p='';
  for(let y=0;y<c;y++)for(let x=0;x<c;x++)if(q.isDark(y,x))p+=`M${x+m} ${y+m}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${c+2*m} ${c+2*m}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="100%" height="100%" fill="#fff"/><path d="${p}" fill="#000"/></svg>`;
}
async function montrerQR(i){
  if(!QRS){const n=S.seance;const F=fichiers(n);
    // un QR par élève du groupe ; la poule (autres joueurs) part dans un seul QR
    const el=F.filter(f=>f.o.type!=='poule');QRS=[];
    for(const f of el){const k=S.eleves.findIndex(E=>E.nom===f.o.eleve);QRS.push({titre:(k>=0?'ABC'[k]+' · ':'')+f.o.eleve,txt:await TTL.chaineQR(f.o)})}
    for(const [t,P] of toursDe(n)){
      const q={a:'TTE',v:1,t:'P',c:S.classe,s:+cleTour(n,t),d:today(),ts:Math.round(Date.now()/1000),p:[P.num,P.fmt,P.joueurs,P.arbDisp||'',P.matchs.map(m=>[m.a,m.b,m.arb,m.f||'',(m.m||[]).filter(x=>x&&x[0]!==''&&x[1]!=='').map(x=>[+x[0],+x[1]]),m.pj||0,m.pjok||0,m.codes?[m.codes.a,m.codes.b]:0])]};
      QRS.push({titre:'Poule '+P.num+(t>1?' · tour '+t:'')+' (tous les matchs)',txt:await chaineBrute(q)})}
  }
  const k=Math.max(0,Math.min(i,QRS.length-1)),Q=QRS[k];
  let svg;try{svg=qrSvg(Q.txt)}catch(e){svg='<p class="avert">Trop de données pour un QR : utilise l’envoi en ligne.</p>'}
  fen(`<h3>${esc(Q.titre)} · séance ${S.seance}</h3><p class="small muted">QR ${k+1} sur ${QRS.length}</p><div class="qrbox">${svg}</div>
    <div class="rangee" style="margin-top:12px;justify-content:space-between"><button class="bt" type="button" data-act="qrnav" data-v="${k-1}" ${k?'':'disabled'}>← Précédent</button>
    ${k<QRS.length-1?`<button class="bt noir" type="button" data-act="qrnav" data-v="${k+1}">Suivant →</button>`:`<button class="bt orange" type="button" data-act="qrfin">Terminé</button>`}</div>`);
}
async function chaineBrute(q){ // même encodage que TTL.chaineQR, pour un objet déjà compact
  const raw=new TextEncoder().encode(JSON.stringify(q));
  const b=u=>{let s='';u.forEach(c=>s+=String.fromCharCode(c));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
  try{if(typeof CompressionStream==='function'){const buf=await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer();return 'TTE1:'+b(new Uint8Array(buf))}}catch(e){}
  return 'TTE0:'+b(raw);
}
function telecharger(nom,texte){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([texte],{type:'application/json'}));a.download=nom;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
async function enregistrerFichiers(){
  const F=fichiers(S.seance);if(!F.length)return false;
  const files=F.map(f=>new File([JSON.stringify(f.o,null,1)],f.nom,{type:'application/json'})).concat(window.fichierSecours?await fichierSecours():[]);
  let ok=false;
  try{if(navigator.canShare&&navigator.canShare({files})){await navigator.share({files,title:'Tennis de table · séance '+S.seance});ok=true}}catch(e){if(e&&e.name==='AbortError')return false}
  if(!ok){for(let i=0;i<F.length;i++){telecharger(F[i].nom,JSON.stringify(F[i].o,null,1));await new Promise(r=>setTimeout(r,400))}
    for(const f of files.slice(F.length)){telecharger(f.name,await f.text());await new Promise(r=>setTimeout(r,400))}}
  S.envoi[S.seance]=Object.assign(S.envoi[S.seance]||{},{fichier:Date.now()});sauver();rendre();
  return true;
}

/* ---------- Évènements ---------- */
document.addEventListener('click',async ev=>{
  const b=ev.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act,v=b.dataset.v;
  if(window.EPLUS&&EPLUS.clic&&await EPLUS.clic(a,v,b,ev))return;
  if(a==='fermerVoile'){if(ev.target===b&&!PENDING)fermer();return}
  if(a==='choisir'){const g=ROOT.groupes[v];
    if(g.clair)demanderCode('Protéger votre carnet','Choisissez un code secret de 4 chiffres pour votre groupe. Retenez-le : il sera demandé à chaque cours.',c=>ouvrir(v,c),true);
    else demanderCode('Code du groupe '+(g.noms||[]).join(' · '),'Tapez votre code secret à 4 chiffres.',c=>ouvrir(v,c),false);
    CODE_CB.id=v;return}
  if(a==='nouveau'){demanderCode('Nouveau groupe · '+v,'Choisissez un code secret de 4 chiffres. Retenez-le : il sera demandé à chaque cours, et personne d’autre ne pourra ouvrir votre carnet.',c=>nouveauGroupe(v,c),true);return}
  if(a==='codeok'){await validerCode();return}
  if(a==='codeoubli'){const id=CODE_CB&&CODE_CB.id;if(!id)return;
    fen(`<h3>Code oublié</h3><p>Sans le code, ce carnet ne peut pas être ouvert, même par le professeur.</p><p class="small">Supprimez-le et créez un nouveau groupe. Le professeur vous donnera un <b>QR de reprise</b> pour chaque élève (étoile, axes, matchs à thème validés, poules) : dans le nouveau groupe, Mon groupe → « Scanner le QR de l’élève qui arrive ».</p>
      <div class="rangee" style="justify-content:space-between"><button class="bt" type="button" data-act="fermer">Annuler</button><button class="bt danger" type="button" data-act="suppridoublie" data-v="${id}">Supprimer ce carnet</button></div>`);return}
  if(a==='suppridoublie'){if(!confirm('Supprimer définitivement ce carnet ?'))return;delete ROOT.groupes[v];ecrireRoot();fermer();rendre();return}
  if(a==='nouveauqr'||(a==='qrclasse'&&!S)){TTQR.scanner(async t=>recevoirClasse(await TTQR.decoder(t)),{titre:'QR de la classe',aide:'Scanne le QR affiché par le professeur.'});return}
  if(a==='changer'){const ne=S?nonEnvoyees():[];
    if(ne.length&&!confirm('⚠ Séance '+ne.join(', ')+' non envoyée au professeur.\n\nOK = changer quand même\nAnnuler = rester pour envoyer')){fermer();S.tab='envoi';rendre();return}
    fermer();await verrouiller();rendre();window.scrollTo(0,0);return}
  if(a==='video'){ouvrirVideo(b.dataset.u,b.dataset.t);return}
  if(a==='fermer'){fermer();return}
  if(!S)return;
  const E=elv(),n=S.seance;
  switch(a){
    case 'tab':S.tab=v;break;
    case 'video':ouvrirVideo(b.dataset.u,b.dataset.t);return;
    case 'fermer':fermer();return;
    case 'tpartir':await montrerTransfert(+v);return;
    case 'tretirer':{const E=S.eleves[+v];S.eleves.splice(+v,1);S.cur=0;fermer();toast((E?E.nom:'L’élève')+' est retiré du groupe.');break}
    case 'qrclasse':TTQR.scanner(async t=>recevoirClasse(await TTQR.decoder(t)),{titre:'QR de la classe',aide:'Scanne le QR affiché par le professeur.'});return;
    case 'tarrive':TTQR.scanner(async t=>accueillir(await TTQR.decoder(t)),{titre:'Élève qui arrive',aide:'Scanne le QR affiché sur le téléphone de son ancien groupe.'});return;
    case 'groupe':S.tab='groupe';break;
    case 'seance':S.seance=+v;S.tour=1;QRS=null;S.jours=S.jours||{};S.jours[today()]=S.seance;break;
    case 'qui':S.cur=+v;break;
    case 'gvalider':{
      const cl=S.cfg?S.cfg.classe:$('#g-classe').value.trim(),L=[];
      for(let i=0;i<3;i++){const inp=$('#g-e'+i),nom=inp.value.trim().replace(/\s+/g,' ');if(nom)L.push({id:inp.dataset.id||uid(),nom})}
      if(L.length<1){toast('Écris au moins un élève.');return}
      // un élève renommé garde ses données (même id) ; on renomme aussi dans les poules
      const ancien={};S.eleves.forEach(e=>ancien[e.id]=e.nom);
      L.forEach(e=>{const o=ancien[e.id];if(o&&o!==e.nom)Object.values(S.poules).forEach(P=>{const i=P.joueurs.indexOf(o);if(i>=0)P.joueurs[i]=e.nom})});
      S.classe=cl;S.eleves=L;S.cur=0;S.tab='seance';toast('Groupe enregistré.');break}
    case 'sauvegarde':telecharger('Carnet_TT_'+(TTL.slug(S.classe)||'groupe')+'_'+today()+'.json',JSON.stringify(Object.assign({carnetTT:1},S)));return;
    case 'toutEffacer':if(!confirm('Supprimer ce groupe et toutes ses séances de la tablette ? Envoie d’abord tes fichiers.'))return;delete ROOT.groupes[ACTIF];S=null;ACTIF=null;CLEF=null;ecrireRoot();rendre();return;
    case 'niv':{const r=rec(E.id,n),x=r.exos[+b.dataset.i];x.niv=x.niv===+v?0:+v;x.obs=null;touche(r);break}
    case 'verif':{const r=rec(E.id,n),x=r.exos[+b.dataset.i];x.obs=x.obs===v?null:v;touche(r);break}
    case 'addex':{const r=rec(E.id,n);r.exos.push({slot:+b.dataset.slot,ex:null,niv:0,rq:''});break}
    case 'delex':{const r=rec(E.id,n);r.exos.splice(+b.dataset.i,1);break}
    case 'et':{const r=rec(E.id,n);r.etoile=r.etoile||{};r.etoile[b.dataset.k]=r.etoile[b.dataset.k]===+v?undefined:+v;if(r.etoile[b.dataset.k]==null)delete r.etoile[b.dataset.k];touche(r);break}
    case 'cpt':{const r=rec(E.id,n);r.grille=r.grille||{c0:0,c1:0,c2:0,c3:0,cx:0,projet:''};r.grille[b.dataset.k]=Math.max(0,(r.grille[b.dataset.k]||0)+(+v));touche(r);break}
    case 'prendreAxes':{const r=rec(E.id,n),[k1,k2]=plusFaibles(r.etoile||{});
      if(r.axes[0]||r.axes[1]){if(r.axes[0]===k1&&r.axes[1]===k2){S.tab='seance';break}toast('Tu as déjà des axes : change-les dans l’onglet Séance.');return}
      r.axes=[k1,k2];r.exos=[];touche(r);S.tab='seance';toast('Axes choisis : '+COURT[k1]+(k2?' et '+COURT[k2]:''));break}
    case 'motif':case 'garder':{
      if(!PENDING)return;const r=rec(E.id,n),p=PENDING;
      if(a==='motif')changerAxe(r,p.sl,p.vers,MOTIFS[+v]);
      PENDING=null;fermer();break}
    case 'pplus':{const z=$('#p-joueurs');if(z.querySelectorAll('input').length>=6){toast('6 joueurs au maximum.');return}
      z.insertAdjacentHTML('beforeend',S.cfg?`<select class="pj" style="margin-bottom:6px"><option value="">—</option>${S.cfg.eleves.map(n=>`<option>${esc(n)}</option>`).join('')}</select>`:'<input type="text" class="pj" placeholder="Prénom Nom" style="margin-bottom:6px" autocomplete="off">');return}
    case 'pcreer':{
      const J=[...document.querySelectorAll('.pj')].map(i=>i.value.trim().replace(/\s+/g,' ')).filter(Boolean);
      if(J.length<2){toast('Au moins 2 joueurs.');return}
      if(new Set(J.map(j=>j.toLowerCase())).size!==J.length){toast('Deux joueurs ont le même nom.');return}
      const arbDisp=$('#p-arb').value||'';
      if(arbDisp&&J.includes(arbDisp)){toast(arbDisp+' est dispensé(e) : il arbitre, il ne joue pas.');return}
      const dj=S.eleves.filter(e=>{const r=(S.d[e.id]||{})[n];return r&&r.disp&&J.includes(e.nom)});
      if(dj.length){toast(dj[0].nom+' est dispensé(e) aujourd’hui : retire-le des joueurs.');return}
      const old=S.poules[pk()],num=+$('#p-num').value,fmt=$('#p-fmt').value,mouv=$('#p-mouv').checked;
      const memes=old&&old.matchs&&old.joueurs.join('|')===J.join('|');
      if(old&&old.matchs&&!memes&&old.matchs.some(m=>(m.m||[]).length||m.f)&&!confirm('Les scores déjà saisis seront effacés. Continuer ?'))return;
      modif();S.poules[pk()]={num,fmt,mouv,joueurs:J,arbDisp,matchs:memes?old.matchs:TTL.creerMatchs(J.length)};QRS=null;break}
    case 'pedit':S.poules[pk()].edit=true;break;
    case 'pannuler':{const k=pk();delete S.poules[k].edit;if(!S.poules[k].matchs)delete S.poules[k];break}
    case 'tour':S.tour=+v;QRS=null;break;
    case 'projets':fenProjets(+b.dataset.m);return;
    case 'pjok':{modif();const P=S.poules[pk()],m=P.matchs[+b.dataset.m],j=+b.dataset.j;m.pjok=m.pjok||[null,null];m.pjok[j]=m.pjok[j]===(v==='1')?null:(v==='1');sauver();QRS=null;if(MQ){peindreMarque();return}fenProjets(+b.dataset.m);return}
    case 'fermerRendre':fermer();if(MQ){peindreMarque();return}break;
    case 'marque':ouvrirMarque(+b.dataset.m);return;
    case 'mqfermer':MQ=null;peindreMarque();break;
    case 'mqservice':{const m=S.poules[pk()].matchs[MQ.i];m.live={a:0,b:0,p:v};sauver();peindreMarque();return}
    case 'mqpoint':pointMarque(v,1);return;
    case 'mqmoins':pointMarque(v,-1);return;
    case 'mqinv':MQ.inv=!MQ.inv;peindreMarque();return;
    case 'qr':QRS=null;await montrerQR(0);return;
    case 'qrnav':await montrerQR(+v);return;
    case 'qrfin':S.envoi[n]=Object.assign(S.envoi[n]||{},{qr:Date.now()});fermer();break;
    case 'enligne':{
      if(!lienEnvoi()){fen(`<h3>Envoi en ligne</h3><p>L’envoi en ligne n’est pas encore activé par le professeur.</p><p><b>Montre ton QR code</b> au professeur à la place.</p><div class="rangee" style="justify-content:space-between"><button class="bt" type="button" data-act="fermer">Fermer</button><button class="bt noir" type="button" data-act="qr">Montrer le QR code</button></div>`);return}
      const ok=await enregistrerFichiers();if(!ok)return;
      fen(`<h3>Dernière étape</h3><p>Les fichiers de la séance sont prêts. Touche « Déposer », puis choisis-les dans Téléchargements (ou Fichiers).</p><div class="rangee" style="justify-content:space-between"><button class="bt" type="button" data-act="fermer">Fermer</button><a class="bt orange" href="${esc(lienEnvoi())}" target="_blank" rel="noopener" data-act="fermer">Déposer</a></div>`);return}
    default:return;
  }
  sauver();rendre();
});
document.addEventListener('change',async ev=>{
  const t=ev.target;
  if(window.EPLUS&&EPLUS.change&&await EPLUS.change(t,ev))return;
  if(t.id==='reprise'&&t.files[0]){
    try{const o=JSON.parse(await t.files[0].text());if(!o.carnetTT||!o.v)throw 0;
      delete o.carnetTT;if(o.cfg)ROOT.classes[o.cfg.classe]=o.cfg;
      await verrouiller();const id=uid();ROOT.groupes[id]={classe:o.classe||'',noms:(o.eleves||[]).map(e=>e.nom.split(/\s+/)[0]),clair:o};ecrireRoot();rendre();toast('Carnet repris : choisissez-le et donnez-lui un code.')}
    catch(e){toast('Ce fichier n’est pas un carnet de groupe.')}
    return;
  }
  const c=t.dataset.ch;if(!c||!S)return;
  const E=elv(),n=S.seance,r=rec(E.id,n);
  switch(c){
    case 'axe':{const sl=+t.dataset.slot,de=r.axes[sl],vers=t.value||null;
      if(vers&&vers===r.axes[1-sl]){toast('C’est déjà ton autre axe.');break}
      if(de&&de!==vers&&!valideQuand(E.id,de)){avertirAxe(sl,de,vers);rendre();return}
      changerAxe(r,sl,vers,null);break}
    case 'ex':{const x=r.exos[+t.dataset.i];x.ex=t.value||null;x.niv=0;touche(r);break}
    case 'disp':{r.disp=t.checked;touche(r);
      if(r.disp)[0,1].forEach(sl=>{if(r.axes[sl]&&!AXES_DISP.includes(r.axes[sl]))changerAxe(r,sl,null,null)});
      if(!r.disp)delete r.disp;break}
    case 'val':r.val[t.dataset.k]=t.checked;if(!t.checked)delete r.val[t.dataset.k];touche(r);break;
    case 'pj':{modif();const P=S.poules[pk()],m=P.matchs[+t.dataset.m],j=+t.dataset.j;m.pj=m.pj||[null,null];m.pj[j]=t.value===''?null:+t.value;if(m.pjok)m.pjok[j]=null;QRS=null;sauver();fenProjets(+t.dataset.m);return}
    case 'forf':{modif();const P=S.poules[pk()];P.matchs[+t.dataset.m].f=t.value||null;QRS=null;break}
    default:return;
  }
  sauver();rendre();
});
document.addEventListener('keydown',ev=>{if(ev.target&&ev.target.id==='code'&&ev.key==='Enter'){ev.preventDefault();validerCode()}});
document.addEventListener('input',ev=>{
  const t=ev.target,c=t.dataset.ch;if(!c||!S||!S.eleves.length)return;
  const E=elv(),n=S.seance;
  if(c==='set'){modif();const P=S.poules[pk()],m=P.matchs[+t.dataset.m];m.m=m.m||[];const s=+t.dataset.s;m.m[s]=m.m[s]||['',''];m.m[s][+t.dataset.c]=t.value.replace(/\D/g,'').slice(0,2);QRS=null;sauver();
    const bz=document.getElementById('mb-'+t.dataset.m);if(bz)bz.innerHTML=badge(P,m);const cz=document.getElementById('pcl');if(cz)cz.innerHTML=htmlClassement(P);const hz=document.getElementById('phist');if(hz)hz.outerHTML=historique();return}
  const r=rec(E.id,n);
  if(c==='exrq')r.exos[+t.dataset.i].rq=t.value;
  else if(c==='bilan')r.rq=t.value;
  else if(c==='projet'){r.grille=r.grille||{c0:0,c1:0,c2:0,c3:0,cx:0,projet:''};r.grille.projet=t.value}
  else return;
  touche(r);sauver();
});
rendre();
