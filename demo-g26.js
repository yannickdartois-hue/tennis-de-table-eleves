/* =====================================================================
   demo-g26.js — démo du parcours GAREEPS 2026 dans l'appli élève
   Groupe fictif (Léa, Hugo) en séance 5 : table de SCE n°2 terminée
   (polygones SCE 1 + SCE 2), SRP et STOM de la séance 4, tournoi ATP avec
   avatars ; Léa vient de passer Argent (écran de déblocage à l'ouverture).
   Rien n'est enregistré ni envoyé (mêmes règles que demo.js).
   Ouverture : bouton à l'accueil, ou adresse …/?demo=g26
   ===================================================================== */
(function(){
'use strict';
const NOMS=['Léa MARTIN','Hugo BERNARD'],AUTRES=['Tom DURAND','Zoé LEROY','Inès PETIT','Max GIRARD','Nina ROUX','Sacha FAURE','Jade NOEL','Adam MOREL'];
const B=s=>s.split(' ').map(x=>[x[0],x[1]||'-']); // « aR b- aK… » → balles
function ouvrir(){
  const s=vide(),L=NOMS.concat(AUTRES);
  s.classe='DÉMO';s.eleves=NOMS.map(nom=>({id:uid(),nom}));
  s.cfg={classe:'DÉMO',eleves:L,lien:'',pa:'g26',pal:[2,4,6],atpPal:[10,20,30],
    atp:{s:5,p:{'Max GIRARD':24,'Tom DURAND':19.5,'Léa MARTIN':12,'Zoé LEROY':11,'Hugo BERNARD':9.5,'Inès PETIT':8,'Jade NOEL':6.5,'Nina ROUX':5,'Sacha FAURE':3.5,'Adam MOREL':2},ab:['Sacha FAURE']},
    h:{'Léa MARTIN':{s:{1:[1,2,0,1]},ch:['K','T']},'Hugo BERNARD':{s:{1:[2,0,1,0]},ch:['A','R']}}};
  // SCE n°2 (séance 5) : table 3 terminée
  const J=['Léa MARTIN','Hugo BERNARD','Zoé LEROY','Inès PETIT'];
  const M=[
    'aR b- aK aK bT a- aA b- aT b- aK aA','bA b- aR bK a- bA a- bR b- a- bK aA',
    'aK aA b- aT aK bR a- aK b- aA aT b-','bR a- bA aK b- bT a- bK bA a- b- aA'];
  s.g26t={5:{sce:2,tab:'3',J,m:M.map((x,i)=>({b:B(x),etape:3,srv:'a',av:i===2?{a:{f:{tech:['Revers'],tac:['N’attaque jamais']},pj:'Je sers coupé sur son revers puis je PAN sur la balle haute.'}}:{}})),
    obs:{'0>2':{tech:['Revers'],tac:['N’attaque jamais']},'1>3':{mob:['Lent sur les côtés']}},bil:{0:['T','K','R'],1:['A','R']},cur:3}};
  // séance 4 : SRP et STOM
  const [Le,Hu]=s.eleves;
  s.d[Le.id]={4:{date:new Date(Date.now()-7*864e5).toISOString().slice(0,10),axes:[],chg:[],exos:[],val:{},rq:'',etoile:null,grille:null,
    g26:{srp:[{k:'K',adv:'Zoé LEROY',obs:'Hugo BERNARD',srv:'a',b:'xpoxopxpoxxp'},{k:'K',adv:'Inès PETIT',obs:'Hugo BERNARD',srv:'b',b:'xxpxoxpxxoxp'}],
      stom:[{k:'K',at:1,nv:2,e:[11,13,10],ok:2},{k:'K',at:3,nv:1,e:[6,8],ok:1}]}}};
  s.d[Hu.id]={4:{date:new Date(Date.now()-7*864e5).toISOString().slice(0,10),axes:[],chg:[],exos:[],val:{},rq:'',etoile:null,grille:null,
    g26:{srp:[{k:'A',adv:'Tom DURAND',obs:'Léa MARTIN',srv:'a',b:'pxoopxoxpoop'}],stom:[{k:'A',at:1,nv:1,e:[7,10],ok:1}]}}};
  // tournoi ATP du jour
  s.atp={5:[{id:'demo1',a:'Léa MARTIN',b:'Tom DURAND',av1:'renard',av2:'',arb:'Hugo BERNARD',sa:11,sb:8,srv:'a',d:today(),ts:Math.round(Date.now()/1000)-600,fini:true},
            {id:'demo2',a:'Hugo BERNARD',b:'Nina ROUX',av1:'robo',av2:'',arb:'',sa:9,sb:11,srv:'b',d:today(),ts:Math.round(Date.now()/1000)-300,fini:true}]};
  s.av={'Léa MARTIN':'renard','Hugo BERNARD':'robo'};s.avPal={'Léa MARTIN':0,'Hugo BERNARD':0}; // Léa passe Argent : écran de déblocage
  s.seance=5;s.jours={[today()]:5};s.tab='sce';s.cur=0;s.tour=1;
  S=s;ACTIF=null;CLEF=null;DEMO=true;fermer();rendre();window.scrollTo(0,0);
}
// Bouton à l'accueil, à côté de la démo existante
const bd=boutonDemo;boutonDemo=function(){return bd().replace('</section>',`<button type="button" class="bt orange" data-act="demog26" style="margin-top:8px">Essayer le parcours GAREEPS 2026</button></section>`)};
const prec=EPLUS.clic;
EPLUS.clic=async function(a,v,b,ev){
  if(a==='demog26'){ouvrir();return true}
  if(DEMO&&a==='atpenvoi'){toast('Pas d’envoi en démo.');return true}
  return prec(a,v,b,ev);
};
if(/[?&]demo=g26\b/.test(location.search))setTimeout(ouvrir,0);else if(!S)rendre(); // l'accueil affiche le nouveau bouton
})();
