# Tennis de table · Élève (GAREEPS) — Première

Appli élève hors ligne du lycée Georges Pompidou. Un téléphone pour 2 ou 3 élèves, 36 élèves et 12 tables.

- **Étoile** : grille du coach (codes 0, 1, 2, 3, x), étoile à 7 axes et 4 niveaux (rouge, jaune, vert, vert foncé), pistes de travail.
- **Séance** (n° 1 à 9, au choix) : 2 axes de travail, n° d'exercice du catalogue filtré par axe, niveau atteint (4 pastilles), match à thème validé. Changer d'axe non validé : avertissement + motif enregistré.
- **Poule** : 2 à 6 joueurs, tous contre tous, arbitre désigné, 1, 2 ou 3 manches gagnantes, classement FFTT (V 2, D 1, forfait 0 ; égalité : matchs entre ex aequo, manches, points). Un seul téléphone par poule.
- **Envoyer** : QR code par élève (+ un pour la poule), ou fichiers JSON à déposer dans le Nuage (lien « Demande de fichier – Téléversement seulement »).

## Réglages
- Lien de dépôt : constante `DEPOT_DEFAUT` en haut de `app.js` (jamais affiché aux élèves). Vide = le bouton « Envoyer ma séance du jour en ligne » renvoie vers le QR code.
- Après une modification des fichiers : augmenter `VERSION` dans `sw.js`.

## Format des fichiers
`1G3_MartinL_S4.json` : `eleve`, `seance`, `date`, `exportedAt`, puis `axes`, `changementsAxe`, `exercices`, `bilan`, `etoile`, `grilleCoach`, `poule`.
Joueurs de la poule hors du groupe : `…_S4_poule.json` avec `"type": "poule"`.
QR : `TTE1:` + JSON compact compressé (deflate-raw, base64url) ; `TTE0:` sans compression.

Données GAREEPS reprises de `tennis-de-table` (sans modification). QR : qrcode-generator (Kazuhiko Arase, licence MIT). Polices : licence SIL OFL (voir `polices/LICENCES.txt`).

## Vidéos (19/10/2026)
- `videos.js` : correspondance exercice → vidéo de la chaîne PeerTube `tennis_de_table_montpellier` (apps.education.fr). Une nouvelle vidéo = une ligne à ajouter.
- `img/` : illustrations des exercices et des matchs à thème, découpées dans le document « cycle complet TT GAREEPS ». Toucher l'image ouvre la vidéo (lecteur intégré, internet nécessaire).
- Onglet **Règles** : règles du service, du double, gestes de l'arbitre, effet coupé, top spin, et les 8 matchs à thème.

## Changement de groupe (19/10/2026)
Groupe → « … part » affiche un QR avec l'historique de l'élève (étoile, axes, matchs à thème validés, poules). Sur le téléphone du nouveau groupe : Groupe → « Scanner le QR de l'élève qui arrive ». Les séances reçues ne sont pas renvoyées une seconde fois.

## Outil prof
Dans son propre dépôt : **tennis-de-table-prof** (https://yannickdartois-hue.github.io/tennis-de-table-prof/). `donnees.js`, `logique.js`, `scan.js`, `qrcode.js`, `jsqr.js` y sont copiés : garder la même version dans les deux dépôts.

## Organisation par année (19/10/2026)
Rien à modifier dans le code d'une année sur l'autre.
1. **Rentrée** : outil prof (dépôt tennis-de-table-prof) → onglet **Classes** → importer l'export Pronote de chaque classe (xlsx, xls ou csv ; ou coller la liste). Coller le lien d'envoi en ligne de la classe (Nuage, « Demande de fichier »).
2. **1er cours** : bouton **QR de démarrage** de la classe ; chaque téléphone de groupe le scanne (Groupe → « Scanner le QR de la classe »). Les élèves choisissent leur nom dans la liste.
3. **Chaque séance** : les élèves envoient (QR ou en ligne) ; onglets **Appel** (présents, dispensés, rien reçu, corrections), **Tournoi** (poules + classement de la classe), **Élèves** (classement du cycle = moyenne des rangs dans la classe).
4. **Fin d'année** : Classes → « Archiver l'année et repartir à zéro ».
Dispensés : case « Aujourd'hui je suis dispensé(e) » ; axes analyse, coach ou arbitrage seulement ; arbitre de sa poule (« Arbitre dispensé »).
Bibliothèque ajoutée : SheetJS (Apache 2.0) pour lire les fichiers Pronote.

## Tablettes partagées entre classes (19/10/2026)
Une tablette garde un carnet par groupe, toutes classes confondues. Chaque carnet est protégé par un **code secret de 4 chiffres** choisi par le groupe et **chiffré** avec ce code (AES-GCM, clé dérivée PBKDF2) : un autre groupe ne peut ni l'ouvrir ni le lire, même en fouillant la tablette. Seuls la classe et les prénoms apparaissent sur l'écran « Qui utilise la tablette ? ».
- « Changer » (en haut), 10 min sans activité ou la réouverture de l'appli verrouillent le carnet.
- Code oublié : le carnet ne peut pas être ouvert (pas de passe-partout) ; on le supprime, on crée un nouveau groupe, et l'outil prof donne à chaque élève un **QR de reprise** (fiche de l'élève) qui lui rend étoile, axes, matchs à thème validés et poules.
- Les carnets des versions précédentes sont repris : le groupe choisit un code à la première ouverture.

## Tours de poule (19/10/2026)
Onglet Poule : boutons « Tour 1 à 4 ». D'habitude un seul tour ; le jour de l'évaluation, 4 tours (le 1er sert de calage). Chaque tour part dans les fichiers (`tours`) et a son propre QR « Poule ». Côté prof, séance 8 tour 2 = « 8.2 ».
