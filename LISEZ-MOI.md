# Niveau 1ère - EREA Toulouse-Lautrec — mode d’emploi

Lycée EREA Toulouse-Lautrec, Vaucresson.
Né dans la 1ère 2, le site s'adresse désormais à tous les élèves de première
(19 élèves, 12 matières).

## Ouvrir le site

Double-clique sur **`index.html`**. Le site s'ouvre dans ton navigateur, sans rien installer.

## Les pages

| Fichier | Rôle |
|---|---|
| `index.html` | Accueil — photo du lycée qui s'efface vers le haut au défilement, présentation du site |
| `telechargements.html` | Les fiches de révision, classées par matière |
| `upload.html` | Le formulaire « Ajouter une fiche », ouvert aux élèves |
| `blog.html` | Le blog : la liste des articles |
| `article.html` | Un article du blog (adresse : `article.html?id=...`) |
| `a-propos.html` | À propos du site et du lycée |
| `eleves.html` | Les profils des élèves (page pas encore reliée au menu des autres pages) |

## Publier un article sur le blog (toi seul)

Le blog n'a **aucun formulaire** : personne ne peut publier depuis le site.
L'API de dépôt des fiches n'écrit que dans `fiches/` et `data/fiches.json`,
jamais dans le blog. La seule façon de publier est de modifier le dépôt GitHub.

> 🔒 Vérifie dans GitHub > ton dépôt > **Settings > Collaborators** que tu es
> bien le seul à avoir les droits d'écriture : c'est ce réglage, et lui seul,
> qui garantit que personne d'autre ne publie.

Depuis le site de GitHub, sans rien installer :

**1. Dépose les photos** dans le dossier `images/blog/`
(ouvre le dossier, puis *Add file > Upload files*, puis *Commit changes*).
Conseils : JPG, format paysage, environ 1600 px de large, noms sans espaces
ni accents (`sortie-orsay-1.jpg`).

**2. Ouvre `data/articles.js`**, clique sur le crayon (*Edit*), et copie le
modèle écrit en haut du fichier **tout en haut de la liste `ARTICLES`** :

```js
{
  id: "sortie-musee-orsay",
  titre: "Sortie au musée d'Orsay",
  evenement: "Sortie scolaire",
  date: "03/10/2026",
  resume: "Une ou deux phrases, affichées sur la page Blog.",
  couverture: { photo: "images/blog/orsay-facade.jpg",
                legende: "La façade du musée, vue depuis la Seine." },
  contenu: [
    "Premier paragraphe.",
    { intertitre: "Un sous-titre" },
    { photo: "images/blog/orsay-salle.jpg", legende: "Ce que montre la photo." },
    { galerie: [
        { photo: "images/blog/orsay-1.jpg", legende: "Première photo." },
        { photo: "images/blog/orsay-2.jpg", legende: "Deuxième photo." }
    ] },
    "Dernier paragraphe."
  ]
},
```

**3. Clique sur *Commit changes*.** Render remet le site en ligne tout seul :
l'article apparaît sur la page Blog une à deux minutes plus tard.

### Les champs d'un article

| Champ | Rôle |
|---|---|
| `id` | l'adresse de l'article — minuscules, chiffres et tirets, **unique** |
| `titre` | le titre, affiché en gros |
| `evenement` | la petite étiquette au-dessus du titre (« Sortie scolaire », « Bac blanc »…) |
| `date` | `JJ/MM/AAAA` — les articles sont triés du plus récent au plus ancien |
| `resume` | le texte de la carte sur la page Blog |
| `couverture` | facultative — la grande photo et sa légende |
| `contenu` | l'article, bloc par bloc (voir ci-dessous) |

| Bloc de `contenu` | Affichage |
|---|---|
| `"texte"` | un paragraphe |
| `{ intertitre: "..." }` | un sous-titre |
| `{ photo: "...", legende: "..." }` | une photo encadrée, avec sa légende en dessous |
| `{ galerie: [ ... ] }` | plusieurs photos côte à côte, chacune avec sa légende |

Pour retirer un article, supprime simplement son bloc `{ ... },` de la liste.

> ⚠️ Une apostrophe ne pose aucun problème entre guillemets droits `"..."`,
> mais un guillemet droit `"` au milieu de ton texte casse tout : écris « » à la place.
> Si la page Blog reste vide, c'est presque toujours une virgule ou un guillemet oublié.

## Ajouter une fiche de révision (2 étapes)

**1. Dépose ton fichier** dans le dossier de la matière :

```
fiches/maths/derivation.pdf
```

Les dossiers disponibles : `svt`, `physique-chimie`, `maths`, `ses`, `llce`,
`histoire-geo`, `francais`, `enseignement-scientifique`, `anglais`,
`espagnol`, `accompagnement`, `allemand`.

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

## Changer le favicon

`favicon.ico` est l'image de référence. Les versions PNG de `images/`
(`favicon-16.png`, `favicon-32.png`, `favicon-48.png`, `apple-touch-icon.png`)
en sont des copies redimensionnées : si tu changes `favicon.ico`, régénère-les
aussi, sinon les navigateurs continueront d'afficher l'ancienne icône.
Change ensuite le `?v=2` des balises `<link rel="icon">` en `?v=3` dans
chaque page, pour forcer les navigateurs à oublier l'icône en cache.

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
├── upload.html
├── blog.html
├── article.html
├── a-propos.html
├── eleves.html
├── css/style.css
├── js/main.js
├── js/telechargements.js
├── js/blog.js
├── data/fiches.js        ← la liste des fiches (à modifier)
├── data/articles.js      ← les articles du blog (toi seul, depuis GitHub)
├── images/
│   └── blog/             ← les photos des articles
└── fiches/<matière>/     ← les PDF à déposer
```
