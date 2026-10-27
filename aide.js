/* aide.js — mode d'emploi de l'appli élève tennis de table (lu par eps-aide.js) */
window.EPS_AIDE={appli:'Tennis de table · Élève',bouton:false,publics:[
{id:'eleve',titre:'Élève',chapitres:[
{t:'Commencer (premier cours)',html:`<ol>
<li><b>Mon groupe</b> → <span class="bouton">Scanner le QR de la classe</span> : vise le QR que le professeur affiche.</li>
<li>Choisissez vos noms dans la liste (2 ou 3 élèves par tablette).</li>
<li>Choisissez un <b>code secret à 4 chiffres</b> et retenez-le : il ouvre votre carnet à chaque cours. Un autre groupe ne peut pas le lire.</li>
</ol><p class="astuce">Aux cours suivants : touche le nom de ton groupe sur l’accueil, puis le code.</p>`},
{t:'Mon étoile',html:`<ul><li>Le <b>coach</b> observe un match et note chaque critère : 0, 1, 2, 3 ou x (pas vu).</li>
<li>L’étoile a 7 axes et 4 niveaux : <b>rouge</b>, <b>jaune</b>, <b>vert</b>, <b>vert foncé</b> (le niveau est aussi écrit en chiffre, de 1 à 4).</li>
<li>Les pistes de travail proposées viennent des axes les plus faibles.</li></ul>`},
{t:'Pendant la séance',html:`<ul><li>La séance du jour s’ouvre toute seule (n° 1 à 9 en haut pour en changer).</li>
<li>Choisis <b>2 axes de travail</b>, puis un exercice du catalogue (filtré par axe). Touche l’image pour voir la vidéo (internet nécessaire).</li>
<li>Coche le <b>niveau atteint</b> : il compte quand un camarade ou le professeur le <b>vérifie</b> (observateur).</li>
<li>Sous chaque niveau : le <b>prochain pas</b> (critère suivant, exercice suivant ou match à thème).</li>
<li>Dispensé aujourd’hui : coche la case ; tu travailles l’analyse, le coaching ou l’arbitrage.</li></ul>`},
{t:'La poule et le tableau de marque',html:`<ul><li>Onglet <b>Poule</b> : 2 à 6 joueurs, tous contre tous, un arbitre. Le professeur peut donner un QR de poule : <span class="bouton">Scanner le QR de la poule</span> remplit tout.</li>
<li>Bouton 🏓 d’un match : <b>tableau de marque</b> plein écran, on touche le côté du joueur qui marque. Le service est indiqué, la manche s’enregistre seule.</li>
<li>Avant le match, chaque joueur annonce son <b>projet de jeu</b> ; après, l’arbitre dit s’il est réalisé.</li>
<li>Jour d’évaluation : 4 tours (Tour 1 à 4), le premier sert de calage.</li></ul>`},
{t:'Envoyer en fin de séance',html:`<ol><li>Onglet <b>Envoyer</b> : <span class="bouton">Envoyer ma séance du jour en ligne</span>, ou montre les <b>QR codes</b> au professeur (un par élève, plus un pour la poule).</li>
<li>Un bandeau rouge « Séance non envoyée » reste tant que ce n’est pas fait.</li></ol>`},
{t:'Changer de groupe, code oublié',html:`<ul><li><b>Un élève change de groupe</b> : Groupe → « … part » affiche son QR ; le nouveau groupe le scanne. Son historique le suit.</li>
<li><b>Code oublié</b> : le carnet ne s’ouvre plus. Le professeur te donne un <b>QR de reprise</b> qui te rend ton étoile, tes axes et tes poules.</li>
<li>Le carnet se verrouille après 10 min sans activité.</li>
<li><b>Lecture facilitée</b> (case en haut de ce mode d’emploi) : la même police partout, lettres et lignes plus espacées. Utile en cas de dyslexie ; vaut pour toutes les applis EPS de la tablette.</li></ul>`}]},
{id:'prof',titre:'Professeur',chapitres:[
{t:'Mettre en place',html:`<ol><li>Outil prof → <b>Classes</b> : import Pronote, lien de dépôt du Nuage (« Demande de fichier »).</li>
<li>Premier cours : <b>QR de démarrage</b> affiché, chaque tablette le scanne (Mon groupe).</li>
<li>Une tablette garde un carnet chiffré par groupe, toutes classes confondues.</li></ol>`},
{t:'Récupérer les séances',html:`<ul><li>QR scannés à la suite dans l’outil prof (Importer), ou fichiers du Nuage (.zip).</li>
<li>Poules du jour : Pilotage → « Poules du jour » → un QR par table.</li></ul>`},
{t:'Démo',html:`<p>Lien <b>…/tennis-de-table-eleves/?demo</b> pour montrer l’appli à un collègue (rien n’est enregistré).</p>`}]}
]};
