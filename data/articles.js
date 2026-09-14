/* ============================================================
   BLOG — articles, publiés par Kasper uniquement
   ------------------------------------------------------------
   Il n'existe AUCUN formulaire pour publier un article : ce fichier
   ne se modifie que depuis GitHub. L'API de dépôt des fiches n'écrit
   que dans fiches/ et data/fiches.json, jamais ici.

   POUR PUBLIER UN ARTICLE, DEPUIS GITHUB :

   1) Dépose tes photos dans images/blog/
      (Add file > Upload files, depuis le dossier images/blog)

   2) Ouvre ce fichier (bouton crayon « Edit »), copie le modèle
      ci-dessous tout en haut de la liste ARTICLES, et remplis-le.

   3) « Commit changes » : le site se remet en ligne tout seul,
      l'article apparaît une à deux minutes plus tard.

   MODÈLE :

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
       "Deuxième paragraphe.",
       { intertitre: "Un sous-titre" },
       { photo: "images/blog/orsay-salle.jpg", legende: "Ce que montre la photo." },
       { galerie: [
           { photo: "images/blog/orsay-1.jpg", legende: "Première photo." },
           { photo: "images/blog/orsay-2.jpg", legende: "Deuxième photo." }
       ] },
       "Dernier paragraphe."
     ]
   },

      • id         : l'adresse de l'article (article.html?id=...).
                     Minuscules, chiffres et tirets, sans espace ni accent.
                     Deux articles ne doivent jamais avoir le même id.
      • titre      : le titre, affiché en gros
      • evenement  : la petite étiquette au-dessus du titre
      • date       : JJ/MM/AAAA — les articles sont triés du plus récent
                     au plus ancien d'après cette date
      • resume     : le texte de la carte sur la page Blog
      • couverture : facultative — la grande photo et sa légende
      • contenu    : l'article, bloc par bloc, dans l'ordre :
                       "texte"                  → un paragraphe
                       { intertitre: "..." }     → un sous-titre
                       { photo: "...", legende: "..." } → une photo
                       { galerie: [ photos ] }   → plusieurs photos côte à côte

   ⚠️ Une apostrophe ne pose aucun problème entre guillemets droits "...",
      mais un guillemet droit " dans ton texte casse tout : écris « » à la place.
   ⚠️ N'oublie pas la virgule entre deux articles et entre deux blocs.
      Si la page Blog reste vide, c'est presque toujours une virgule ou
      un guillemet oublié.
   ============================================================ */

const ARTICLES = [

  // ——— Ajoute tes articles ici, le plus récent en haut ———
  {
    id: "le-site-s-ouvre-a-toutes-les-premieres",
    titre: "Le site s'ouvre à toutes les premières",
    evenement: "Vie du site",
    date: "14/09/2026",
    resume: "Né dans la 1ère 2, le site accueille désormais les dix-neuf élèves de première du lycée. Et il s'enrichit d'un blog.",
    couverture: { photo: "images/lycee.jpg",
                  legende: "Le lycée EREA Toulouse-Lautrec, à Vaucresson." },
    contenu: [
      "Au départ, ce site était l'outil de travail d'une seule classe : la 1ère 2. Les fiches de révision y étaient rangées matière par matière, pour que personne ne révise seul dans son coin.",
      "À partir de cette rentrée, il s'adresse à tous les élèves de première du lycée : dix-neuf élèves qui suivent les mêmes douze matières et préparent les mêmes épreuves anticipées de français et de mathématiques.",
      { intertitre: "Ce qui change" },
      "Une fiche déposée par un élève profite désormais à toutes les premières. La page Téléchargements et le formulaire « Ajouter une fiche » fonctionnent exactement comme avant.",
      "Nouveauté : ce blog. Les temps forts de l'année y seront racontés en photos, au fil des événements."
    ]
  },

];
