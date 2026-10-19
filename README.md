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

## Outil prof : `prof.html`
Adresse : `https://yannickdartois-hue.github.io/tennis-de-table-eleves/prof.html` (aucun lien depuis l'appli élève).
- **Importer** : scanner les QR des élèves à la suite (caméra), ou choisir les fichiers .json / le .zip du dossier Nuage. Pas de doublon si on réimporte.
- **Tournoi** : pour chaque séance, chaque poule avec ses joueurs, le classement (points, V, D, manches et points gagnés-perdus, montée ↑ / descente ↓) et tous les matchs manche par manche.
- **Élèves** : tableau de la classe (poule et rang à chaque séance, totaux) ; fiche de chaque élève (matchs, séances de travail, critères atteints, changements d'axe, étoile début / fin) ; fusion de deux noms mal tapés.
- **Exporter** : 3 fichiers CSV pour Excel (bilan par élève, tournoi séance par séance, séances de travail).
- Données gardées sur l'appareil du prof ; sauvegarde / restauration pour passer de l'iPad au PC.
Bibliothèques : jsQR (Apache 2.0), JSZip (MIT).

## Organisation par année (19/10/2026)
Rien à modifier dans le code d'une année sur l'autre.
1. **Rentrée** : outil prof → onglet **Classes** → importer l'export Pronote de chaque classe (xlsx, xls ou csv ; ou coller la liste). Coller le lien d'envoi en ligne de la classe (Nuage, « Demande de fichier »).
2. **1er cours** : bouton **QR de démarrage** de la classe ; chaque téléphone de groupe le scanne (Groupe → « Scanner le QR de la classe »). Les élèves choisissent leur nom dans la liste.
3. **Chaque séance** : les élèves envoient (QR ou en ligne) ; onglets **Appel** (présents, dispensés, rien reçu, corrections), **Tournoi** (poules + classement de la classe), **Élèves** (classement du cycle = moyenne des rangs dans la classe).
4. **Fin d'année** : Classes → « Archiver l'année et repartir à zéro ».
Dispensés : case « Aujourd'hui je suis dispensé(e) » ; axes analyse, coach ou arbitrage seulement ; arbitre de sa poule (« Arbitre dispensé »).
Bibliothèque ajoutée : SheetJS (Apache 2.0) pour lire les fichiers Pronote.

## Tablettes partagées entre classes (19/10/2026)
Une tablette garde un carnet par groupe, toutes classes confondues. À l'ouverture (dès qu'il y a 2 groupes ou plus) : écran « Qui utilise la tablette ? » ; chaque groupe touche son nom. « Changer » (en haut) revient à cet écran. Nouveau groupe : classe déjà connue de la tablette, ou scan du QR de la classe. « Supprimer ce groupe » n'efface que ce groupe. Les carnets de l'ancienne version sont repris automatiquement.
