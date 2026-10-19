/* =====================================================================
   eleve-plus.js — compléments de l'appli élève (chargé après app.js)
   Ma progression · prochain pas · codes du coach en match · temps mort
   guidé · chronos · mode « table » · mise à jour visible · copie de
   secours chiffrée pour le professeur.
   ===================================================================== */
'use strict';
const COUL=['#FF0000','#FFFF00','#70AD47','#385723'];
const pastille=c=>`<i class="dot p${c}" title="${esc(GA.deg[c-1]||'')}"></i>`;

/* ---------- Ma progression ---------- */
function niveauxAtteints(id){ // {ex: {max, s:[[séance,niv,obs]]}}
  const R={};
  seancesDe(id).forEach(s=>{const r=S.d[id][s];(r.exos||[]).forEach(x=>{if(!x.ex||!x.niv)return;
    const o=R[x.ex]||(R[x.ex]={max:0,s:[]});o.max=Math.max(o.max,x.niv);o.s.push([s,x.niv,x.obs||''])})});
  return R;
}
function radarFixe(e,ref){return radar(e,ref).replace(/ data-act="et"/g,'').replace(/cursor:pointer/g,'')}
function vProgres(){
  const E=elv(),id=E.id,L=seancesDe(id).filter(s=>{const r=S.d[id][s];return r.date||r.imp});
  const first=premiereEtoile(id),last=derniereEtoile(id,99);
  let h=`<h2>📈 Ma progression · ${esc(E.nom)}</h2>`;
  // Étoile
  h+=`<section class="carte"><h3>⭐ Mon étoile</h3>`;
  if(!first)h+=`<p class="muted">Pas encore d’étoile. Va dans l’onglet Étoile pour te situer.</p>`;
  else{
    const deux=last&&last.s!==first.s;
    h+=`<div class="radar">${radarFixe(deux?last.e:first.e,deux?first.e:null)}</div>
      <p class="small muted" style="text-align:center">${deux?`Pointillés : séance ${first.s} · Orange : séance ${last.s}`:`Étoile de la séance ${first.s}. Refais-la en fin de cycle pour voir tes progrès.`}</p>`;
    if(deux){const up=GA.axes.filter(a=>(last.e[a.k]||0)>(first.e[a.k]||0));
      h+=up.length?`<p class="ok">↗ Progrès sur : ${up.map(a=>esc(a.n)).join(', ')}</p>`:`<p class="muted small">Pas encore de progrès visible sur l’étoile.</p>`}
  }
  h+=`</section>`;
  // Axes et matchs à thème validés
  const val=GA.axes.map(a=>[a,valideQuand(id,a.k)]).filter(x=>x[1]);
  h+=`<section class="carte"><h3>🏅 Matchs à thème validés</h3>${val.length?`<ul>${val.map(([a,s])=>`<li><b>${esc(a.n)}</b> <span class="fam ${famCl(a)}">${ICOFAM[a.afl]||''}${a.afl}</span> · séance ${s}</li>`).join('')}</ul>`:'<p class="muted">Aucun pour l’instant.</p>'}</section>`;
  // Exercices
  const N=niveauxAtteints(id),K=Object.keys(N);
  h+=`<section class="carte"><h3>🏓 Mes exercices</h3>`;
  if(!K.length)h+=`<p class="muted">Aucun niveau coché pour l’instant.</p>`;
  else h+=`<table class="prog"><thead><tr><th>Exercice</th><th>Séances</th><th>Meilleur</th></tr></thead><tbody>${K.sort((a,b)=>a.localeCompare(b,'fr',{numeric:true})).map(k=>{const i=exInfo(k),o=N[k];
    return `<tr><td><b>${esc(k)}</b> <span class="small">${esc(i?i.e.t:'')}</span></td><td class="pts">${o.s.map(([s,v,ob])=>`<span title="séance ${s}${ob?' · vérifié par '+esc(ob):''}">${pastille(v)}<sub>${s}${ob?'✓':''}</sub></span>`).join(' ')}</td><td>${pastille(o.max)}</td></tr>`}).join('')}</tbody></table>
    <p class="small muted">Le petit chiffre est le numéro de séance ; ✓ = vérifié par l’observateur.</p>`;
  h+=`</section>`;
  // Poules
  const P=[];Object.keys(S.poules).sort((a,b)=>+a-+b).forEach(k=>{const Q=S.poules[k];if(!Q||!Q.matchs)return;const i=Q.joueurs.indexOf(E.nom);if(i<0)return;
    const r=TTL.resumePoule(Q,i);P.push([k,r])});
  h+=`<section class="carte"><h3>🏆 Mes poules</h3>${P.length?`<table class="prog"><thead><tr><th>Séance</th><th>Poule</th><th>Rang</th><th>Victoires</th></tr></thead><tbody>${P.map(([k,r])=>{const v=r.matchs.filter(m=>m.gagne===true).length;
      const fl=r.mouvement==='monte'?'<span class="ok">↑</span>':r.mouvement==='descend'?'<span style="color:var(--alerte)">↓</span>':'';
      return `<tr><td>${esc(labS(k))}</td><td>${r.numero}</td><td>${r.rang||'–'}/${r.nbJoueurs} ${fl}</td><td>${v}/${r.matchs.length}</td></tr>`}).join('')}</tbody></table>`:'<p class="muted">Pas encore de poule jouée.</p>'}</section>`;
  if(!L.length&&!P.length)h+=`<p class="muted small">Tes séances apparaîtront ici au fil du cycle.</p>`;
  return h;
}

/* ---------- Le prochain pas ---------- */
function prochainPas(E,k,sl,x,i){
  const info=exInfo(x.ex);if(!info)return '';
  if(x.niv<4){
    const crit=criteresEx(info.e).find(r=>r.c>x.niv);
    return crit?`<div class="pas">👉 <b>Prochain pas</b> : ${pastille(crit.c)} ${esc(crit.t.replace(/^Pas encore atteint : /,''))}</div>`:'';
  }
  const a=axe(k);if(!a)return '';
  const N=niveauxAtteints(E.id),r=rec(E.id,S.seance);
  const deja=new Set(r.exos.map(y=>y.ex));
  for(const t of a.th){const T=theme(t);for(const e of T.ex){
    if((N[e.n]&&N[e.n].max>=4)||deja.has(e.n))continue;
    return `<div class="pas">👉 <b>Bravo, niveau maximum !</b> Prochain pas : exercice <b>${esc(e.n)}</b> « ${esc(e.t)} ».
      <button type="button" class="bt mini orange" data-act="pasEx" data-slot="${sl}" data-v="${esc(e.n)}">Ajouter cet exercice</button></div>`}}
  return valideQuand(E.id,k)?`<div class="pas">🏅 Axe validé. Choisis un autre axe dans ton étoile.</div>`
    :`<div class="pas">👉 <b>Prochain pas</b> : le match à thème de cet axe. Fais-le valider !</div>`;
}

/* ---------- Codes du coach au tableau de marque ----------
   Codes GAREEPS : 0, 1, 2, 3 (comment le point est gagné) ; x (faute facile).
   Le point gagné par A est codé pour A (0-3) ; « x » est compté au perdant. */
const CODES=[['0','Faute non provoquée / rebond au centre'],['1','Rebond hors du plot'],['2','Smash'],['3','Projet réalisé']];
function codesVides(){return {a:[0,0,0,0,0],b:[0,0,0,0,0]}}
function codePoint(m,c,d){
  if(!m.coach)return;
  if(d>0){MQ.code={c};return}
  // − 1 : on retire le dernier code lié à un point de ce joueur
  MQ.code=null;const lg=m.clog||[];
  for(let j=lg.length-1;j>=0;j--)if(lg[j][0]===c){const [w,cd]=lg[j],o=cd==='x'?(w==='a'?'b':'a'):w,ix=cd==='x'?4:+cd;
    if(m.codes&&m.codes[o])m.codes[o][ix]=Math.max(0,m.codes[o][ix]-1);lg.splice(j,1);break}
}
function barreCodes(m,noms){
  if(!m.coach)return '';
  if(MQ.code){const c=MQ.code.c,o=c==='a'?'b':'a';
    return `<div class="mq-codes"><span>Point de <b>${esc(noms[c])}</b> : comment ?</span><div class="rangee">${CODES.map(([k,l])=>`<button type="button" class="bt" data-act="mqcode" data-v="${k}" title="${esc(l)}"><b>${k}</b> <small>${esc(l)}</small></button>`).join('')}
      <button type="button" class="bt" data-act="mqcode" data-v="x"><b>x</b> <small>Faute facile de ${esc(noms[o])}</small></button><button type="button" class="bt mini" data-act="mqcode" data-v="">Passer</button></div></div>`}
  const C=m.codes;if(!C)return `<div class="mq-codes small">🗣️ Après chaque point, le coach choisit un code.</div>`;
  const t=s=>`${esc(noms[s].split(/\s+/)[0])} : ${C[s].slice(0,4).map((v,i)=>i+'='+v).join(' ')} · x=${C[s][4]}`;
  return `<div class="mq-codes small">🗣️ ${t('a')} &nbsp;|&nbsp; ${t('b')}</div>`;
}
function noterCode(v){
  const P=S.poules[pk()],m=P.matchs[MQ.i];
  if(MQ.code&&v!==''){const c=MQ.code.c,o=c==='a'?'b':'a';m.codes=m.codes||codesVides();m.clog=m.clog||[];
    if(v==='x')m.codes[o][4]++;else m.codes[c][+v]++;m.clog.push([c,v])}
  MQ.code=null;modif();QRS=null;sauver();peindreMarque();
}
// Codes relevés au tableau de marque pour un élève, une séance (tous les tours)
function codesEleve(nom,n){
  const t=[0,0,0,0,0];let ok=false;
  toursDe(n).forEach(([,P])=>P.matchs.forEach(m=>{if(!m.codes)return;['a','b'].forEach(s=>{if(P.joueurs[m[s]]===nom){ok=true;m.codes[s].forEach((v,i)=>t[i]+=v)}})}));
  return ok?t:null;
}
function codesDuJour(E,n){
  const t=codesEleve(E.nom,n);if(!t)return '';
  return `<div class="pas">🗣️ Codes notés au tableau de marque aujourd’hui : <b>0</b>=${t[0]} · <b>1</b>=${t[1]} · <b>2</b>=${t[2]} · <b>3</b>=${t[3]} · <b>x</b>=${t[4]}
    <button type="button" class="bt mini" data-act="reprendreCodes">Les mettre dans ma grille</button></div>`;
}

/* ---------- Temps mort guidé (1 minute) ---------- */
let TM=null;
function conseils(C,pj){
  const L=[];if(!C)return ['Où l’adversaire perd-il ses points ?','Quel service t’a rapporté des points ?'];
  const [c0,c1,c2,c3,cx]=C,gag=c0+c1+c2+c3;
  if(cx>=2&&cx>=gag/3)L.push('Trop de fautes faciles ('+cx+') : sur les balles faciles, joue en sécurité, au milieu de la table.');
  if(c2===0)L.push('Pas encore de smash : sur une balle haute, avance et frappe vers le bas.');
  if(c1>c0)L.push('Tes balles hors du plot gagnent : continue à viser les coins et le long.');
  if(c0>c1+1)L.push('Tu gagnes surtout sur ses fautes : reste régulier, il finira par rater.');
  if(pj!=null&&c3===0)L.push('Ton projet « '+TTL.PROJETS[pj]+' » n’a pas encore marqué : essaie-le dès le service.');
  if(c3>0)L.push('Ton projet marche ('+c3+' point'+(c3>1?'s':'')+') : continue !');
  return L.length?L:['Garde ce qui marche, change une seule chose.'];
}
function tempsMort(){
  const P=S.poules[pk()],m=P.matchs[MQ.i],noms={a:P.joueurs[m.a],b:P.joueurs[m.b]},pj=m.pj||[null,null];
  let z=document.getElementById('tm');if(!z){z=document.createElement('div');z.id='tm';document.body.appendChild(z)}
  z.innerHTML=`<div class="tm-fen"><div class="tm-haut"><b>⏸ Temps mort</b><span class="tm-t" id="tm-t">1:00</span><button type="button" class="bt mini" data-act="tmfermer">Reprendre le match</button></div>
    <div class="tm-cols">${['a','b'].map((s,j)=>`<div class="carte"><h3>${esc(noms[s])}</h3>
      ${m.codes?`<p class="small">0=${m.codes[s][0]} · 1=${m.codes[s][1]} · 2=${m.codes[s][2]} · 3=${m.codes[s][3]} · x=${m.codes[s][4]}</p>`:''}
      <ul>${conseils(m.codes&&m.codes[s],pj[j]).map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div>`).join('')}</div>
    <p class="small muted">Coach : pose 1 question, donne 1 seul conseil simple. « Où perd-il ses points ? Qu’est-ce qui marche pour toi ? »</p></div>`;
  clearInterval(TM);const fin=Date.now()+60000;
  TM=setInterval(()=>{const r=Math.max(0,Math.ceil((fin-Date.now())/1000)),e=document.getElementById('tm-t');if(e)e.textContent=Math.floor(r/60)+':'+String(r%60).padStart(2,'0');
    if(!r){clearInterval(TM);sonner();}},250);
}
function fermerTM(){clearInterval(TM);TM=null;const z=document.getElementById('tm');if(z)z.remove()}

/* ---------- Chronos ---------- */
function durees(txt){ // « 2 min », « 30 s », « 1 min 30 », « 2 mi-temps de 2 min »
  const out=new Set,re=/(\d+(?:[,.]\d+)?)\s*(min(?:utes?)?|mn|s(?:ec(?:ondes?)?)?)\b(?:\s*(\d{1,2})\b(?!\s*(?:points?|balles?|fois)))?/gi;let m;
  while((m=re.exec(txt||''))){let v=parseFloat(m[1].replace(',','.'));v=/^m/i.test(m[2])?v*60+(m[3]?+m[3]:0):v;if(v>=10&&v<=1800)out.add(Math.round(v))}
  return [...out].sort((a,b)=>a-b);
}
function texteFiche(t,n){if(t==='mt'){const T=theme(+n);return T?T.match:''}const i=exInfo(n);return i?[i.e.c,i.e.j,i.e.p].join(' '):''}
function outilsFiche(t,n){
  const D=durees(texteFiche(t,n));
  return `<div class="rangee outils">${D.map(d=>`<button type="button" class="bt mini" data-act="chrono" data-v="${d}">⏱ ${dureeCh(d)}</button>`).join('')}
    ${D.length?'':`<button type="button" class="bt mini" data-act="chronoChoix">⏱ Chrono</button>`}
    <button type="button" class="bt mini" data-act="table" data-t="${t}" data-v="${esc(n)}">⛶ Grand écran</button></div>`;
}
const dureeCh=d=>d>=60&&d%60===0?d/60+' min':duree(d);
let CH=null; // {fin, reste, pause, total}
function chrono(sec){
  CH={total:sec,fin:Date.now()+sec*1000,reste:sec*1000,pause:false};peindreChrono();
  clearInterval(CH.t);CH.t=setInterval(peindreChrono,250);
}
function peindreChrono(){
  let z=document.getElementById('chrono');
  if(!CH){if(z)z.remove();return}
  if(!z){z=document.createElement('div');z.id='chrono';document.body.appendChild(z)}
  const r=CH.pause?CH.reste:Math.max(0,CH.fin-Date.now()),s=Math.ceil(r/1000);
  if(!CH.pause&&r<=0&&!CH.sonne){CH.sonne=true;sonner()}
  z.className=s===0?'fini':s<=10?'bientot':'';
  z.innerHTML=`<span class="ch-t">${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}</span>
    <button type="button" class="bt mini" data-act="chronoPause">${CH.pause?'▶':'❚❚'}</button><button type="button" class="bt mini" data-act="chronoRe" aria-label="Recommencer">↺</button><button type="button" class="bt mini" data-act="chronoFin" aria-label="Fermer le chrono">✕</button>`;
}
let AC=null;
function sonner(){
  try{navigator.vibrate&&navigator.vibrate([300,150,300,150,300])}catch(e){}
  try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const t0=AC.currentTime;
    [0,.35,.7].forEach(d=>{const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=880;o.connect(g);g.connect(AC.destination);
      g.gain.setValueAtTime(.0001,t0+d);g.gain.exponentialRampToValueAtTime(.5,t0+d+.02);g.gain.exponentialRampToValueAtTime(.0001,t0+d+.28);o.start(t0+d);o.stop(t0+d+.3)})}catch(e){}
}

/* ---------- Mode « table » (plein écran, posé sur la table) ---------- */
let VEILLE=null;
async function modeTable(t,n){
  let h='';
  if(t==='mt'){const T=theme(+n);if(!T)return;
    h=`<h2>Match à thème ${T.n} · ${esc(T.t)}</h2>${IMG_MT.has(T.n)?`<img src="img/mt${T.n}.jpg" alt="">`:''}<p class="tb-c">${esc(T.match)}</p>`}
  else{const i=exInfo(n);if(!i)return;const e=i.e;
    h=`<h2>Exercice ${esc(e.n)} · ${esc(e.t)}</h2>${IMG_EX.has(e.n)?`<img src="img/ex${e.n}.jpg" alt="">`:''}
      <p class="tb-c">${esc(e.c)}</p>${e.j?`<p><b>Joueur :</b> ${esc(e.j)}</p>`:''}${e.p?`<p><b>Partenaires :</b> ${esc(e.p)}</p>`:''}
      ${e.cr&&e.cr.length?`<p><b>💡</b> ${e.cr.map(esc).join(' · ')}</p>`:''}
      <ul class="tb-niv">${criteresEx(e).map(r=>`<li style="border-color:${COUL[r.c-1]}"><i class="dot p${r.c}"></i> ${esc(r.t)}</li>`).join('')}</ul>`}
  const D=durees(texteFiche(t,n));
  let z=document.getElementById('table-ecran');if(!z){z=document.createElement('div');z.id='table-ecran';document.body.appendChild(z)}
  z.innerHTML=`<div class="tb-haut">${D.map(d=>`<button type="button" class="bt" data-act="chrono" data-v="${d}">⏱ ${dureeCh(d)}</button>`).join('')}<button type="button" class="bt noir" data-act="tablefermer">✕ Fermer</button></div><div class="tb-corps">${h}</div>`;
  try{if(document.documentElement.requestFullscreen&&!document.fullscreenElement)await document.documentElement.requestFullscreen()}catch(e){}
  try{if(navigator.wakeLock)VEILLE=await navigator.wakeLock.request('screen')}catch(e){}
}
function fermerTable(){const z=document.getElementById('table-ecran');if(z)z.remove();try{if(document.fullscreenElement)document.exitFullscreen()}catch(e){}try{VEILLE&&VEILLE.release()}catch(e){}VEILLE=null}

/* ---------- Copie de secours chiffrée (lisible seulement par le prof) ----------
   Le QR de classe du prof contient sa clé publique (ECDH P-256). À chaque envoi en ligne,
   le carnet complet du groupe part aussi, chiffré pour cette clé : seul le prof peut l'ouvrir. */
async function fichierSecours(){
  try{
    const k=S.cfg&&S.cfg.k;if(!k||!crypto.subtle)return [];
    const pub=await crypto.subtle.importKey('raw',deb64(k.replace(/-/g,'+').replace(/_/g,'/')),{name:'ECDH',namedCurve:'P-256'},false,[]);
    const eph=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveKey']);
    const cle=await crypto.subtle.deriveKey({name:'ECDH',public:pub},eph.privateKey,{name:'AES-GCM',length:256},false,['encrypt']);
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},cle,new TextEncoder().encode(JSON.stringify(Object.assign({carnetTT:1},S))));
    const epk=await crypto.subtle.exportKey('raw',eph.publicKey);
    const noms=S.eleves.map(e=>e.nom);
    const o={app:'tt-secours',v:1,classe:S.classe,noms,seance:S.seance,date:today(),epk:b64(epk),iv:b64(iv),data:b64(ct)};
    const nom=('secours_'+S.classe+'_'+noms.map(x=>x.split(/\s+/)[0]).join('-')+'_S'+S.seance).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9_-]+/g,'_')+'.json';
    return [new File([JSON.stringify(o)],nom,{type:'application/json'})];
  }catch(e){return []}
}

/* ---------- Mise à jour visible ---------- */
if('serviceWorker' in navigator){
  const avait=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!avait||document.getElementById('maj'))return;
    const d=document.createElement('div');d.id='maj';
    d.innerHTML=`<span>✨ Nouvelle version de l’appli</span><button type="button" class="bt mini orange" data-act="majRecharger">Mettre à jour</button><button type="button" class="bt mini" data-act="majPlusTard">Plus tard</button>`;
    document.body.appendChild(d);
  });
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')navigator.serviceWorker.getRegistration().then(r=>r&&r.update()).catch(()=>{})});
}

/* ---------- QR de poule préparé par le prof ---------- */
function boutonQRPoule(prop){
  return prop?`<p class="pas">📷 Poule ${prop.num} remplie par le QR du professeur. Vérifie les présents (absent ? dispensé ?), corrige si besoin, puis « Créer les matchs ».</p>`
    :`<div class="rangee" style="margin-bottom:10px"><button type="button" class="bt orange" data-act="scanpoule">📷 Scanner le QR de la poule</button><span class="small muted">ou saisis la poule à la main ci-dessous</span></div>`;
}
async function lirePoule(txt){
  const o=await TTQR.decoder(txt);
  if(o.t!=='Q')throw new Error('Ce n’est pas un QR de poule.');
  if(S.classe&&o.c&&norm2(o.c)!==norm2(S.classe)&&!confirm('Ce QR est pour la classe '+o.c+'. Utiliser quand même ?'))throw new Error('QR d’une autre classe.');
  const [num,fmt,joueurs,arbDisp,mouv]=o.p;
  if(o.s&&o.s!==S.seance){S.seance=o.s;S.jours=S.jours||{};S.jours[today()]=o.s}
  S.tour=o.tr||1;
  const k=pk(),P=S.poules[k];
  if(P&&P.matchs&&P.matchs.some(m=>(m.m||[]).length||m.f)){
    if(!confirm('Une poule avec des scores est déjà saisie pour ce tour sur cette tablette. La remplacer ?'))throw new Error('Rien changé.');
    delete S.poules[k];
  }else if(P)delete S.poules[k];
  S.propP=S.propP||{};S.propP[k]={num,fmt:String(fmt||'2'),mouv:mouv!==0,joueurs:joueurs.slice(),arbDisp:arbDisp||''};
  S.tab='poule';sauver();rendre();window.scrollTo(0,0);
  return 'Poule '+num+' : '+joueurs.length+' joueurs';
}
const norm2=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');

/* ---------- Actions ---------- */
window.EPLUS={
  async clic(a,v,b){
    switch(a){
      case 'scanpoule':TTQR.scanner(lirePoule,{titre:'QR de la poule',aide:'Vise le QR de la poule montré ou imprimé par le professeur.'});return true;
      case 'pasEx':{const r=rec(elv().id,S.seance);r.exos.push({slot:+b.dataset.slot,ex:v,niv:0,rq:''});touche(r);sauver();rendre();toast('Exercice '+v+' ajouté.');return true}
      case 'mqcoach':{const P=S.poules[pk()],m=P.matchs[MQ.i];m.coach=!m.coach;MQ.code=null;sauver();peindreMarque();return true}
      case 'mqcode':noterCode(v);return true;
      case 'tempsmort':tempsMort();return true;
      case 'tmfermer':fermerTM();return true;
      case 'reprendreCodes':{const E=elv(),r=rec(E.id,S.seance),t=codesEleve(E.nom,S.seance);if(!t)return true;
        r.grille=Object.assign(r.grille||{projet:''},{c0:t[0],c1:t[1],c2:t[2],c3:t[3],cx:t[4]});touche(r);sauver();rendre();toast('Grille du coach remplie.');return true}
      case 'chrono':chrono(+v);return true;
      case 'chronoChoix':fen(`<h3>⏱ Chrono</h3><div class="rangee">${[30,60,90,120,180,300].map(d=>`<button type="button" class="bt" data-act="chronoGo" data-v="${d}">${duree(d)}</button>`).join('')}</div><div class="rangee" style="margin-top:12px"><button type="button" class="bt" data-act="fermer">Fermer</button></div>`);return true;
      case 'chronoGo':fermer();chrono(+v);return true;
      case 'chronoPause':if(CH){if(CH.pause){CH.fin=Date.now()+CH.reste;CH.pause=false}else{CH.reste=Math.max(0,CH.fin-Date.now());CH.pause=true}peindreChrono()}return true;
      case 'chronoRe':if(CH)chrono(CH.total);return true;
      case 'chronoFin':if(CH)clearInterval(CH.t);CH=null;peindreChrono();return true;
      case 'table':modeTable(b.dataset.t,v);return true;
      case 'tablefermer':fermerTable();return true;
      case 'majRecharger':try{await enregistrer()}catch(e){}location.reload();return true;
      case 'majPlusTard':{const d=document.getElementById('maj');if(d)d.remove();return true}
    }
    return false;
  }
};
rendre();
