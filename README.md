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
