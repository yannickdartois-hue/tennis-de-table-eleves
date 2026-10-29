/* Hors ligne : l'appli est gardée sur le téléphone après la 1re ouverture.
   Après une modification, augmenter VERSION (ex. tte-v12 → tte-v12). */
const VERSION='tennis-de-table-eleves-v26';
// Toutes les applis partagent le même stockage (même adresse github.io) : on n'efface QUE les anciennes versions de CETTE appli.
const MES_CACHES=/^(?:tennis\-de\-table\-eleves\-v|tte\-v)\d+$/;

// Wi-Fi faible au gymnase : si le réseau ne répond pas en 3 s, on ouvre la copie gardée sur l'appareil.
const sous3s=p=>{p.catch(()=>{});return Promise.race([p,new Promise((_,non)=>setTimeout(()=>non(new Error('réseau lent')),3000))])};
const FICHIERS=['./','index.html','aide.js','eps-aide.js','eps-charte-v1.css','app.js','eleve-plus.js','demo.js','logique.js','donnees.js','qrcode.js','jsqr.js','scan.js','videos.js','principes.js','manifest.webmanifest',
  'icon-32.png','icon-180.png','icon-192.png','icon-512.png',
  'polices/archivo.woff2','polices/atkinson-400.woff2','polices/atkinson-700.woff2',
  ...['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','A1','A2','A3','A4','R1','R2','R3','R4','R5','R6','R7','R8','R9','R10','R11'].map(n=>'img/ex'+n+'.jpg'),
  ...[1,2,3,4,5,6,7].map(n=>'img/mt'+n+'.jpg')];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FICHIERS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>MES_CACHES.test(k)&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
// Réseau d'abord (pour recevoir les mises à jour), cache si pas de connexion.
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
  const net=fetch(e.request).then(r=>{const c=r.clone();caches.open(VERSION).then(x=>x.put(e.request,c));return r});
  e.respondWith(sous3s(net).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(h=>h||net)));
});
