/* ============================================================
   FICHES DE RÉVISION — fichier à mettre à jour par Kasper
   ------------------------------------------------------------
   POUR AJOUTER UNE FICHE, EN 2 ÉTAPES :

   1) Dépose ton PDF dans le dossier de la matière, par exemple :
      fiches/maths/derivation.pdf

   2) Ajoute une ligne dans la liste FICHES ci-dessous :
      { matiere: "histoire-geo", classe: "1ere2",
        chapter_title: "Chapitre 4 — La Révolution",
        titre: "Les grandes dates", fichier: "fiches/histoire-geo/dates.pdf",
        date: "12/09/2026", poids: "PDF · 420 Ko" },

      • matiere       : l'identifiant exact de la matière (colonne "id" dans MATIERES)
      • classe        : "1ere1" ou "1ere2".
                        À ne remplir QUE pour les matières communes (groupe "commun"),
                        qui ont une section séparée pour chaque classe.
                        Les spécialités sont hors classes : leur cours est commun
                        aux deux, donc ce champ y est ignoré.
                        Si tu l'oublies sur une matière commune, la fiche part
                        en 1ère 2 (CLASSE_PAR_DEFAUT, tout en bas).
      • chapter_title : le TITRE DU CHAPITRE, affiché en gros au-dessus des fiches.
                        Toutes les fiches qui ont EXACTEMENT le même chapter_title
                        (dans la même matière et la même classe) sont regroupées
                        sous ce titre, dans l'ordre où tu les écris.
                        Laisse "" si la fiche n'appartient à aucun chapitre.
      • titre         : le nom affiché de la fiche
      • fichier       : le chemin vers le fichier, depuis la racine du site
      • date          : facultatif — date d'ajout
      • poids         : facultatif — type et taille du fichier

   ⚠️ N'oublie pas la virgule à la fin de chaque ligne.
   Enregistre, recharge la page : la fiche apparaît toute seule.
   ============================================================ */

/* Les deux classes. L'ordre est celui des sections sur la page. */
const CLASSES = [
  { id: "1ere1", nom: "1ère 1", court: "1re1" },
  { id: "1ere2", nom: "1ère 2", court: "1re2" }
];

/* Fiche d'une matière commune sans classe précisée : elle atterrit ici.
   C'est ce qui range automatiquement toutes les fiches d'avant la
   séparation en deux classes dans la section 1ère 2. */
const CLASSE_PAR_DEFAUT = "1ere2";

/* groupe :
     "specialite" → affichée UNE fois, hors des sections de classe
                    (les cours de spécialité réunissent les deux classes) ;
     "commun"     → affichée DEUX fois, une par classe, chacune avec ses
                    propres fiches. */
const MATIERES = [
  { id: "svt",                       nom: "Spécialité SVT",                  court: "SVT",   couleur: "#2F6A4F", groupe: "specialite" },
  { id: "physique-chimie",           nom: "Spécialité Physique-Chimie",      court: "PC",    couleur: "#1E5F7B", groupe: "specialite" },
  { id: "maths",                     nom: "Spécialité Maths",                court: "MATH",  couleur: "#1E3A5F", groupe: "specialite" },
  { id: "ses",                       nom: "Spécialité SES",                  court: "SES",   couleur: "#7A4E8C", groupe: "specialite" },
  { id: "llce",                      nom: "Spécialité LLCE",                 court: "LLCE",  couleur: "#8C3F5D", groupe: "specialite" },
  { id: "histoire-geo",              nom: "Histoire-Géo-EMC",                court: "HGE",   couleur: "#8A5A2B", groupe: "commun" },
  { id: "francais",                  nom: "Français",                        court: "FR",    couleur: "#8C2F2F", groupe: "commun" },
  { id: "enseignement-scientifique", nom: "Enseignement scientifique",       court: "ES",    couleur: "#2A6A6A", groupe: "commun" },
  { id: "anglais",                   nom: "Anglais LV1",                     court: "ANG",   couleur: "#33508F", groupe: "commun" },
  { id: "espagnol",                  nom: "Espagnol LV2",                    court: "ESP",   couleur: "#A16207", groupe: "commun" },
  { id: "accompagnement",            nom: "Accompagnement personnalisé",     court: "AP",    couleur: "#55606E", groupe: "commun" },
  { id: "allemand",                  nom: "Allemand",                        court: "DE",    couleur: "#55606E", groupe: "commun" }
];

const FICHES = [

  // ——— Ajoute tes fiches ici, une ligne par fiche ———
  { matiere: "physique-chimie", chapter_title: "Lentilles minces convergentes", titre: "Fiches - Lentilles minces", fichier: "fiches/physique-chimie/Fiche_Lentilles_convergentes.docx", date: "12/09/2026", poids: "Word · 28 ko" },

];
