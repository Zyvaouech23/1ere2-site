/* ============================================================
   FICHES DE RÉVISION — fichier à mettre à jour par Kasper
   ------------------------------------------------------------
   POUR AJOUTER UNE FICHE, EN 2 ÉTAPES :

   1) Dépose ton PDF dans le dossier de la matière, par exemple :
      fiches/maths/derivation.pdf

   2) Ajoute une ligne dans la liste FICHES ci-dessous :
      { matiere: "maths", chapter_title: "Chapitre 4 — Dérivation",
        titre: "Nombre dérivé et tangente", fichier: "fiches/maths/derivation.pdf",
        date: "12/09/2026", poids: "PDF · 420 Ko" },

      • matiere       : l'identifiant exact de la matière (colonne "id" dans MATIERES)
      • chapter_title : le TITRE DU CHAPITRE, affiché en gros au-dessus des fiches.
                        Toutes les fiches qui ont EXACTEMENT le même chapter_title
                        sont regroupées sous ce titre, dans l'ordre où tu les écris.
                        Laisse "" si la fiche n'appartient à aucun chapitre.
      • titre         : le nom affiché de la fiche
      • fichier       : le chemin vers le fichier, depuis la racine du site
      • date          : facultatif — date d'ajout
      • poids         : facultatif — type et taille du fichier

   ⚠️ N'oublie pas la virgule à la fin de chaque ligne.
   Enregistre, recharge la page : la fiche apparaît toute seule.
   ============================================================ */

const MATIERES = [
  { id: "svt",                       nom: "Spécialité SVT",                  court: "SVT",   couleur: "#2F6A4F" },
  { id: "physique-chimie",           nom: "Spécialité Physique-Chimie",      court: "PC",    couleur: "#1E5F7B" },
  { id: "maths",                     nom: "Spécialité Maths",                court: "MATH",  couleur: "#1E3A5F" },
  { id: "ses",                       nom: "Spécialité SES",                  court: "SES",   couleur: "#7A4E8C" },
  { id: "llce",                      nom: "Spécialité LLCE",                 court: "LLCE",  couleur: "#8C3F5D" },
  { id: "histoire-geo",              nom: "Histoire-Géo-EMC",                court: "HGE",   couleur: "#8A5A2B" },
  { id: "francais",                  nom: "Français",                        court: "FR",    couleur: "#8C2F2F" },
  { id: "enseignement-scientifique", nom: "Enseignement scientifique",       court: "ES",    couleur: "#2A6A6A" },
  { id: "anglais",                   nom: "Anglais LV1",                     court: "ANG",   couleur: "#33508F" },
  { id: "espagnol",                  nom: "Espagnol LV2",                    court: "ESP",   couleur: "#A16207" },
  { id: "accompagnement",            nom: "Accompagnement personnalisé",     court: "AP",    couleur: "#55606E" },
  { id: "allemand",                  nom: "Allemand",                        court: "DE",    couleur: "#55606E" }
];

const FICHES = [

  // ——— Ajoute tes fiches ici, une ligne par fiche ———
  { matiere: "physique-chimie", chapter_title: "Lentilles minces convergentes", titre: "Fiches - Lentilles minces", fichier: "fiches/physique-chimie/Fiche_Lentilles_convergentes.docx", date: "12/09/2026", poids: "Word · 28 ko" },

];
