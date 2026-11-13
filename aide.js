/* aide.js — mode d'emploi de l'appli élève tennis de table (lu par eps-aide.js) */
window.EPS_AIDE={appli:'Tennis de table · Élève',bouton:false,publics:[
{id:'eleve',titre:'Élève',chapitres:[
{t:'🔑 Code du cours',html:`<ul>
<li>Au début du cours, le professeur écrit un <b>code à 4 chiffres</b>. Touche <span class="bouton">🔑 Code du cours</span> et tape-le : la séance du jour s’ouvre pendant 2 heures.</li>
<li>Sans code, tu peux tout consulter, mais rien saisir : la saisie se fait en cours.</li>
<li>Code refusé ? Vérifie que la date du téléphone est juste. Après 5 erreurs, attends 1 minute.</li>
</ul>`},

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
<li>Dispensé aujourd’hui : coche la case ; tu travailles l’analyse, le coaching ou l’arbitrage.</li>
<li>Séances 8 et 9 : carte <b>Ma gestion des 15 minutes</b> (échauffement en duo, puis en duel), lue par le professeur.</li></ul>`},
{t:'La poule et le tableau de marque',html:`<ul><li>Onglet <b>Poule</b> : 2 à 6 joueurs, tous contre tous, un arbitre. Le professeur peut donner un QR de poule : <span class="bouton">Scanner le QR de la poule</span> remplit tout.</li>
<li>Bouton 🏓 d’un match : <b>tableau de marque</b> plein écran, on touche le côté du joueur qui marque. Le service est indiqué, la manche s’enregistre seule.</li>
<li>Avant le match, chaque joueur annonce son <b>projet de jeu</b> ; après, l’arbitre dit s’il est réalisé.</li>
<li>Jour d’évaluation : 4 tours (Tour 1 à 4), le premier sert de calage.</li></ul>`},
{t:'Envoyer en fin de séance',html:`<ol><li>Onglet <b>Envoyer</b> : <span class="bouton">Envoyer ma séance du jour en ligne</span>, ou montre les <b>QR codes</b> au professeur (un par élève, plus un pour la poule).</li>
<li>Un bandeau rouge « Séance non envoyée » reste tant que ce n’est pas fait.</li></ol>`},
{t:'Changer de groupe, code oublié',html:`<ul><li><b>Un élève change de groupe</b> : Groupe → « … part » affiche son QR ; le nouveau groupe le scanne. Son historique le suit.</li>
<li><b>Code oublié</b> : le carnet ne s’ouvre plus. Le professeur te donne un <b>QR de reprise</b> qui te rend ton étoile, tes axes et tes poules.</li>
<li>Le carnet se verrouille après 20 min sans activité sur une tablette partagée, après 2 h sur un téléphone avec un seul carnet.</li>
<li><b>Lecture facilitée</b> (case en haut de ce mode d’emploi) : la même police partout, lettres et lignes plus espacées. Utile en cas de dyslexie ; vaut pour toutes les applis EPS de la tablette.</li></ul>`}]},
{id:'g26',titre:'GAREEPS 2026',chapitres:[
{t:'Le principe : SCE → SRP → STOM',html:`<p>Si ta classe est sur le parcours <b>GAREEPS 2026</b>, les onglets sont : SCE, SRP, STOM, ATP, Poule, Règles, Envoyer.</p><ol>
<li><b>SCE</b> : un vrai match, rejoué 3 fois dans le cycle. Un camarade compte <b>comment</b> tu gagnes tes points. Ton <b>polygone</b> montre ce qui te manque.</li>
<li><b>SRP</b> : un match à thème pour travailler ce manque, avec un <b>score parlant</b>.</li>
<li><b>STOM</b> : un atelier technique si un geste te bloque. Après l’atelier, <b>retourne en SRP</b>.</li></ol>
<p class="astuce">C’est toi qui choisis ce que tu travailles, d’après ton polygone.</p>`},
{t:'La SCE à la table de 4',html:`<ol><li>Onglet <b>SCE</b> : numéro de la SCE, numéro de la table, les 4 joueurs. <b>Un seul téléphone</b> pour la table.</li>
<li>4 matchs de 12 balles, dans l’ordre affiché. Les deux autres observent. <b>Au match suivant, tu affrontes celui que tu viens d’observer.</b></li>
<li>Avant le match : 1er match, tes <b>points forts</b> ; 2e match, les <b>points faibles</b> de ton adversaire (déjà cochés d’après ton observation). Puis ton <b>projet de jeu</b>.</li>
<li>Pendant le match : on touche le côté du joueur qui marque, puis son bonus. L’observateur de ce joueur l’annonce à voix haute :
<ul><li>⚡ <b>Rapide</b> : gagné en 2 frappes ou moins après son service ;</li><li>📐 <b>Architecte</b> : gagné sans toucher la zone centrale ;</li><li>💥 <b>KO</b> : gagné après avoir crié « PAN ! » ;</li><li>🎯 <b>Tactique</b> : gagné avec son projet de jeu.</li></ul></li>
<li>Après les 4 matchs : chacun voit son polygone et choisit ses <b>3 priorités</b>.</li></ol>`},
{t:'La SRP (match à thème)',html:`<ul><li>Choisis ta SRP (celle de ton bilan est en tête), ton adversaire proche au classement et ton observateur.</li>
<li>12 balles : l’observateur touche « point + bonus », « point » ou « point de l’adversaire ». Le <b>score parlant</b> et le <b>degré</b> (1 à 4) se calculent seuls.</li>
<li>SRP 1 : bonus seulement sur tes services. SRP 3 : il faut crier « PAN ! ». SRP 4 : <b>temps mort à 6 balles</b> avec ton observateur, bonus à partir de la balle 7.</li>
<li>À la fin : les questions à se poser, puis « Rejouer » ou « Travailler en STOM ».</li></ul>`},
{t:'La STOM (ateliers)',html:`<ul><li>3 ateliers par STOM, chacun avec son image, sa vidéo, sa consigne et 2 niveaux.</li>
<li>Choisis le niveau visé, puis note jusqu’à 5 essais : le niveau se valide tout seul.</li>
<li>Après l’atelier, retourne jouer la SRP qui correspond.</li></ul>`},
{t:'Le tournoi ATP',html:`<ul><li>En fin de séance, matchs en 11 points (à 10-10, point décisif). <b>Tu peux défier qui tu veux</b>, mais pas plus de 2 fois le même adversaire dans la séance.</li>
<li>C’est l’<b>arbitre</b> qui saisit : les 2 joueurs, puis le score. Celui qui attend arbitre, puis choisit son adversaire en priorité.</li>
<li>Points : de 5,5 (battre un joueur 5 rangs au-dessus) à 1 (5 rangs en dessous) ; 0,5 pour une défaite ; −2 pour un match refusé. Ils se calculent avec le <b>classement du début de séance</b>, sans compter les absents du jour ; à points égaux, rang égal.</li>
<li>Sans internet, les points affichés sur ton téléphone sont <b>provisoires</b> : un refus noté par le professeur n’apparaît qu’avec internet ou au cours suivant. La borne fait foi.</li>
<li>Après le match : montre le <b>QR</b> à la <b>borne</b> (tablette sur trépied). Avec internet, le match part aussi tout seul.</li>
<li>Le classement en direct est sur la borne ; avec internet, il s’affiche aussi dans l’onglet ATP.</li></ul>`},
{t:'Les avatars',html:`<ul><li>Onglet ATP → <b>Nos avatars</b> → « Changer ». Les personnages se débloquent par palier : 🥉 Bronze, 🥈 Argent, 🥇 Or, 💎 Diamant, selon tes points au tournoi.</li>
<li>Ton avatar apparaît sur la borne quand tu joues. Pour l’y mettre tout de suite : « 📷 Avatar → borne », puis montre le QR à la borne.</li>
<li>Les paliers changent au cours suivant, quand le QR de la classe est rescanné.</li></ul>`},
{t:'Si je suis dispensé(e)',html:`<ul><li>Onglet <b>SRP</b> ou <b>STOM</b> : coche « Aujourd’hui je suis dispensé(e) ». Tu ne joues pas : tu tiens des <b>rôles</b> qui comptent pour l’AFL3.</li>
<li><b>Marquer une SCE</b> : en créant la table, tes camarades te choisissent comme « Marqueur dispensé(e) ». Tu tiens le téléphone.</li>
<li><b>Observer une SRP</b> : le joueur te choisit comme observateur.</li>
<li><b>Arbitrer au tournoi ATP</b> : l’appli refuse un dispensé comme joueur, pas comme arbitre.</li></ul>`},
{t:'Démo',html:`<p>Lien <b>…/tennis-de-table-eleves/?demo=g26</b> : un groupe fictif sur le parcours GAREEPS 2026 (rien n’est enregistré).</p>`}]},
{id:'prof',titre:'Professeur',chapitres:[
{t:'Mettre en place',html:`<ol><li>Outil prof → <b>Classes</b> : import Pronote, lien de dépôt du Nuage (« Demande de fichier »).</li>
<li>Premier cours : <b>QR de démarrage</b> affiché, chaque tablette le scanne (Mon groupe).</li>
<li>Une tablette garde un carnet chiffré par groupe, toutes classes confondues.</li></ol>`},
{t:'Récupérer les séances',html:`<ul><li>QR scannés à la suite dans l’outil prof (Importer), ou fichiers du Nuage (.zip).</li>
<li>Poules du jour : Pilotage → « Poules du jour » → un QR par table.</li></ul>`},
{t:'Démo',html:`<p>Lien <b>…/tennis-de-table-eleves/?demo</b> pour montrer l’appli à un collègue (rien n’est enregistré).</p>`}]}
]};
