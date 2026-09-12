# Site de la classe de 1ère 2 — mode d'emploi

Lycée EREA Toulouse-Lautrec, Vaucresson.

## Ouvrir le site

Double-clique sur **`index.html`**. Le site s'ouvre dans ton navigateur, sans rien installer.

## Les 3 pages

| Fichier | Rôle |
|---|---|
| `index.html` | Accueil — photo du lycée qui s'efface vers le haut au défilement, présentation du site |
| `telechargements.html` | Les fiches de révision, classées par matière |
| `eleves.html` | Les profils des 9 élèves |

## Ajouter une fiche de révision (2 étapes)

**1. Dépose ton fichier** dans le dossier de la matière :

```
fiches/maths/derivation.pdf
```

Les dossiers disponibles : `svt`, `physique-chimie`, `maths`, `ses`, `llce`,
`histoire-geo`, `francais`, `enseignement-scientifique`, `anglais`,
`espagnol`, `accompagnement`.

**2. Ouvre `data/fiches.js`** dans un éditeur de texte et ajoute une ligne dans la liste `FICHES` :

```js
{ matiere: "maths", chapter_title: "Chapitre 4 — Dérivation",
  titre: "Nombre dérivé et tangente", fichier: "fiches/maths/derivation.pdf",
  date: "12/09/2026", poids: "PDF · 420 Ko" },
```

Enregistre, recharge la page : la fiche apparaît toute seule, avec son bouton de téléchargement.

### Les champs

| Champ | Rôle |
|---|---|
| `matiere` | l'identifiant de la matière (voir la liste `MATIERES` en haut du fichier) |
| `chapter_title` | **le titre du chapitre, affiché en gros au-dessus des fiches** |
| `titre` | le nom de la fiche |
| `fichier` | le chemin du PDF depuis la racine du site |
| `date` | facultatif — date d'ajout |
| `poids` | facultatif — type et taille du fichier |

### Comment fonctionne `chapter_title`

Toutes les fiches d'une même matière qui ont **exactement le même `chapter_title`**
sont regroupées sous ce titre, dans l'ordre où tu les écris dans le fichier.

```js
{ matiere: "francais", chapter_title: "Méthode du commentaire", titre: "Les figures de style", ... },
{ matiere: "francais", chapter_title: "Méthode du commentaire", titre: "Construire un axe de lecture", ... },
{ matiere: "francais", chapter_title: "Le théâtre du XVIIe siècle", titre: "Molière — Le Malade imaginaire", ... },
```

donne, sur la page Français :

```
Méthode du commentaire                    2 fiches
  · Les figures de style
  · Construire un axe de lecture
Le théâtre du XVIIe siècle                 1 fiche
  · Molière — Le Malade imaginaire
```

Attention : « Chapitre 4 » et « chapitre 4 » sont considérés comme **deux chapitres différents**.
Copie-colle le titre d'une fiche à l'autre pour éviter les doublons.

Si une fiche n'appartient à aucun chapitre, mets `chapter_title: ""` (ou n'écris pas le champ) :
elle s'affiche directement sous le nom de la matière, sans titre.

> ⚠️ Ne supprime pas la virgule à la fin de la ligne, et garde bien les guillemets.
> Si une fiche n'apparaît pas, c'est presque toujours une virgule ou un guillemet oublié.

## Changer une photo de profil

1. Dépose l'image dans `images/` (par exemple `images/jeanne.jpg`).
2. Dans `eleves.html`, remplace `images/avatar.svg` par `images/jeanne.jpg` sur la ligne de l'élève.

## Changer la photo du lycée

Remplace simplement le fichier `images/lycee.jpg` par une autre image du même nom.
Format conseillé : paysage, au moins 1600 px de large.

## Arborescence

```
.
├── index.html
├── telechargements.html
├── eleves.html
├── css/style.css
├── js/main.js
├── js/telechargements.js
├── data/fiches.js        ← la liste des fiches (à modifier)
├── images/
└── fiches/<matière>/     ← les PDF à déposer
```
