/* =====================================================================
   demo.js — mode démo : visiter l'appli sans QR de classe ni code.
   Un groupe fictif pré-rempli (3 séances), rien n'est enregistré ni envoyé.
   Ouverture : bouton « Essayer l'appli (démo) » à l'accueil, ou adresse …/?demo
   ===================================================================== */
'use strict';
let DEMO=false;
const DEMO_CLASSE='DÉMO',DEMO_NOMS=['Léa MARTIN','Hugo BERNARD','Inès PETIT'],DEMO_AUTRES=['Tom DURAND','Zoé LEROY','Max GIRARD','Nina ROUX','Sacha FAURE'];
function boutonDemo(){
  return `<section class="carte demo-carte"><h3>👀 Découvrir l’appli</h3><p class="small muted">Un groupe fictif déjà rempli, pour voir tous les écrans. Rien n’est enregistré ni envoyé.</p>
    <button type="button" class="bt" data-act="demo">Essayer l’appli (démo)</button></section>`;
}
function exosAxe(k){const a=axe(k);return a?a.th.flatMap(n=>theme(n).ex.map(e=>e.n)):[]}
function dateIl(j){const d=new Date(Date.now()-j*864e5);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function ouvrirDemo(){
  const s=vide();
  s.classe=DEMO_CLASSE;s.cfg={classe:DEMO_CLASSE,eleves:DEMO_NOMS.concat(DEMO_AUTRES),lien:''};
  s.eleves=DEMO_NOMS.map(nom=>({id:uid(),nom}));
  // étoiles de départ (séance 1) et axes choisis
  const etoiles=[{strat:2,cont:1,diff:2,eng:3,ana:2,coach:3,arb:2},{strat:3,cont:2,diff:1,eng:2,ana:1,coach:2,arb:3},{strat:1,cont:2,diff:2,eng:2,ana:3,coach:2,arb:2}];
  const axes=[['cont','strat'],['diff','ana'],['strat','arb']];
  const niv=[[2,3],[3,4],[1,2]];
  s.eleves.forEach((E,i)=>{
    s.d[E.id]={};
    [1,2].forEach(n=>{
      const ex=axes[i].map((k,sl)=>{const L=exosAxe(k);return {slot:sl,ex:L[0]||null,niv:n===1?Math.max(1,niv[i][sl]-1):niv[i][sl],rq:n===2&&sl===0?'7 sur 10, mieux en coup droit':'',obs:n===2&&sl===0?DEMO_NOMS[(i+1)%3]:null}});
      s.d[E.id][n]={date:dateIl(n===1?14:7),axes:axes[i].slice(),chg:[],exos:ex,val:n===2&&i===1?{[axes[i][0]]:true}:{},rq:n===2?'Bonne séance, service à travailler.':'',etoile:n===1?etoiles[i]:null,grille:n===2?{c0:3,c1:4,c2:1,c3:2,cx:3,projet:'Servir court puis attaquer'}:null};
    });
  });
  // poule de la séance 2, déjà jouée, avec les codes du coach
  const J=DEMO_NOMS.concat(['Tom DURAND']),M=TTL.creerMatchs(J.length);
  const scores=[[[11,7],[11,9]],[[8,11],[11,6],[11,9]],[[11,4],[11,8]],[[9,11],[7,11]],[[11,9],[12,10]],[[11,5],[9,11],[11,7]]];
  M.forEach((m,i)=>{m.m=scores[i%scores.length];m.coach=true;m.codes={a:[2,4,1,1,2],b:[3,2,0,0,4]}});
  M[0].pj=[0,2];M[0].pjok=[true,false];
  s.poules['2']={num:3,fmt:'2',mouv:true,joueurs:J,arbDisp:'',matchs:M};
  // poule du jour (séance 3) en cours : 2 matchs joués, les autres à jouer
  const J3=DEMO_NOMS.concat(['Zoé LEROY']),M3=TTL.creerMatchs(J3.length);
  M3[0].m=[[11,6],[8,11],[11,9]];M3[1].m=[[11,7],[11,5]];
  s.poules['3']={num:2,fmt:'2',mouv:true,joueurs:J3,arbDisp:'',matchs:M3};
  s.envoi={1:{qr:Date.now()-14*864e5},2:{fichier:Date.now()-7*864e5}};
  s.seance=3;s.jours={[today()]:3};s.tab='seance';s.cur=0;s.tour=1;
  // séance du jour commencée pour Léa
  const L0=s.eleves[0];s.d[L0.id][3]={date:today(),axes:['cont','strat'],chg:[],exos:[{slot:0,ex:exosAxe('cont')[1]||exosAxe('cont')[0],niv:0,rq:''},{slot:1,ex:exosAxe('strat')[0],niv:4,rq:'',obs:'Hugo BERNARD'}],val:{},rq:'',etoile:null,grille:null};
  S=s;ACTIF=null;CLEF=null;DEMO=true;
  fermer();rendre();window.scrollTo(0,0);
  toast('Mode démo : explore librement, rien n’est enregistré.');
}
function quitterDemo(){DEMO=false;S=null;ACTIF=null;CLEF=null;MQ=null;peindreMarque();fermer();rendre();window.scrollTo(0,0);
  try{if(/[?&]demo\b/.test(location.search))history.replaceState(null,'',location.pathname)}catch(e){}}
// Bandeau « démo » au-dessus de chaque écran
const rendreSansDemo=rendre;
rendre=function(){
  if(!S)DEMO=false;
  rendreSansDemo();
  if(DEMO&&S){$('#main').insertAdjacentHTML('afterbegin',`<div class="demo-bandeau"><span>👀 <b>Mode démo</b> · groupe fictif, rien n’est enregistré ni envoyé</span><button type="button" class="bt mini" data-act="demoQuitter">Quitter la démo</button></div>`);
    const ne=document.querySelector('.nonenvoye');if(ne)ne.remove()}
};
// Actions propres à la démo (avant celles des autres extensions)
const clicAvantDemo=window.EPLUS&&EPLUS.clic;
window.EPLUS=window.EPLUS||{};
EPLUS.clic=async function(a,v,b,ev){
  if(a==='demo'){ouvrirDemo();return true}
  if(a==='demoQuitter'||(DEMO&&a==='changer')){quitterDemo();return true}
  if(DEMO&&a==='enligne'){fen(`<h3>Mode démo</h3><p>En vrai, ce bouton prépare les fichiers de la séance et ouvre l’espace de dépôt du professeur. En démo, rien n’est envoyé.</p><p class="small muted">Le bouton « Montrer le QR code » fonctionne pour voir à quoi il ressemble.</p><div class="rangee"><button class="bt" type="button" data-act="fermer">Fermer</button></div>`);return true}
  if(DEMO&&['nouveauqr','qrclasse','tpartir','tarrive','tretirer','sauvegarde','toutEffacer','suppridoublie'].includes(a)){toast('Pas disponible en démo.');return true}
  return clicAvantDemo?clicAvantDemo(a,v,b,ev):false;
};
if(/[?&]demo\b/.test(location.search)&&!S)ouvrirDemo();else rendre();
