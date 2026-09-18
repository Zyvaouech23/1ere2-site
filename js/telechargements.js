/* ============================================================
   Page Téléchargements — affichage des fiches
   ------------------------------------------------------------
   DEUX SOURCES, fusionnées ici :

   1. data/fiches.js   → la liste FICHES, écrite à la main (la tienne).
   2. data/fiches.json → les fiches déposées via upload.html, ajoutées
                         automatiquement par l'API sur Render.

   La page s'affiche d'abord avec la source 1 (instantané, aucun appel
   réseau), puis se complète avec la source 2 dès qu'elle est chargée.
   Si data/fiches.json est absent ou illisible, la page continue de
   fonctionner exactement comme avant : ton fichier manuel fait foi.

   TROIS GRANDES SECTIONS :

   1. Spécialités — hors classes, puisque les cours de spécialité
      réunissent la 1ère 1 et la 1ère 2 : une seule liste pour tous.
   2. 1ère 1     ┐ les matières communes, dédoublées : chaque classe a
   3. 1ère 2     ┘ son propre compartiment, avec ses propres fiches.

   Les chapitres s'ouvrent au clic et sont TOUS REPLIÉS au chargement :
   une matière suivie toute l'année finirait sinon par occuper dix écrans.
   ============================================================ */
(function () {
  "use strict";

  var root = document.getElementById("subjects");
  if (!root || typeof MATIERES === "undefined") return;

  var searchInput = document.getElementById("search");
  var filtersBox = document.getElementById("filters");
  var totalEl = document.getElementById("total-fiches");
  var avertEl = document.getElementById("index-warning");
  var fiches = (typeof FICHES !== "undefined" && Array.isArray(FICHES)) ? FICHES : [];

  var classes = (typeof CLASSES !== "undefined" && Array.isArray(CLASSES)) ? CLASSES : [];
  var classeParDefaut = (typeof CLASSE_PAR_DEFAUT !== "undefined") ? CLASSE_PAR_DEFAUT : "1ere2";

  var SPECIALITES = MATIERES.filter(function (m) { return m.groupe !== "commun"; });
  var COMMUNES = MATIERES.filter(function (m) { return m.groupe === "commun"; });

  // state.ouverts retient les chapitres dépliés d'un rendu à l'autre :
  // sans lui, taper une lettre dans la recherche refermerait tout.
  var state = { matiere: "all", q: "", ouverts: {} };

  var ICON_DOC = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h4"/></svg>';
  var ICON_DL = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>';
  var ICON_CHEVRON = '<svg class="chapter-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Un identifiant HTML sûr, construit à partir de textes libres
  // (un titre de chapitre peut contenir n'importe quoi).
  var compteurId = 0;
  function idPropre(prefixe) {
    compteurId++;
    return prefixe + "-" + compteurId;
  }

  function classeDe(f) {
    var c = String(f.classe || "").trim();
    return c || classeParDefaut;
  }

  /* fichesDe(matiere, classe) :
     classe vaut null pour une spécialité — on prend alors toutes ses
     fiches, quelle que soit la classe de celui qui les a déposées. */
  function fichesDe(id, classeId) {
    var q = state.q.trim().toLowerCase();
    return fiches.filter(function (f) {
      if (f.matiere !== id) return false;
      if (classeId && classeDe(f) !== classeId) return false;
      if (!q) return true;
      return ((f.titre || "") + " " + (f.chapter_title || "") + " " + (f.chapitre || "")).toLowerCase().indexOf(q) !== -1;
    });
  }

  // Regroupe les fiches d'une matière par chapter_title,
  // dans l'ordre où les chapitres apparaissent dans data/fiches.js.
  function grouperParChapitre(list) {
    var ordre = [], paquets = {};
    list.forEach(function (f) {
      var k = String(f.chapter_title || f.chapitre || "").trim();
      if (!paquets.hasOwnProperty(k)) { paquets[k] = []; ordre.push(k); }
      paquets[k].push(f);
    });
    return ordre.map(function (k) { return { titre: k, fiches: paquets[k] }; });
  }

  function ligneFiche(f) {
    var sub = [f.poids, f.date ? "ajoutée le " + f.date : ""].filter(Boolean).join(" · ");
    var h = '<li class="sheet">';
    h += '  <span class="sheet-icon" aria-hidden="true">' + ICON_DOC + "</span>";
    h += '  <span class="sheet-body"><span class="sheet-title">' + esc(f.titre) + "</span>";
    h += sub ? '<span class="sheet-sub">' + esc(sub) + "</span>" : "";
    h += "  </span>";
    h += '  <a class="btn btn--accent" href="' + esc(f.fichier) + '" download>' + ICON_DL + 'Télécharger<span class="sr-only"> : ' + esc(f.titre) + "</span></a>";
    h += "</li>";
    return h;
  }

  function buildFilters() {
    if (!filtersBox) return;
    var html = '<button type="button" class="chip" data-filter="all" aria-pressed="true">Toutes les matières</button>';
    MATIERES.forEach(function (m) {
      html += '<button type="button" class="chip" data-filter="' + esc(m.id) + '" aria-pressed="false">' + esc(m.nom) + "</button>";
    });
    filtersBox.innerHTML = html;
    filtersBox.addEventListener("click", function (e) {
      var btn = e.target.closest(".chip");
      if (!btn) return;
      state.matiere = btn.getAttribute("data-filter");
      filtersBox.querySelectorAll(".chip").forEach(function (c) {
        c.setAttribute("aria-pressed", c === btn ? "true" : "false");
      });
      render();
    });
  }

  /* ---------- Un bloc « matière » ---------- */

  function blocMatiere(m, classeId) {
    var list = fichesDe(m.id, classeId);
    if (state.q && list.length === 0) return { html: "", nb: 0 };

    var vide = list.length === 0;
    var solo = state.matiere === m.id;
    var cle = (classeId || "specialites") + "|" + m.id;
    var titreId = "t-" + (classeId || "spe") + "-" + m.id;

    var html = '<section class="subject' + (vide ? " subject--empty" : "") + '" aria-labelledby="' + esc(titreId) + '">';
    html += '  <div class="subject-head">';
    html += '    <span class="subject-dot" style="background:' + esc(m.couleur) + '" aria-hidden="true">' + esc(m.court) + "</span>";
    html += '    <div><h3 id="' + esc(titreId) + '">' + esc(m.nom) + "</h3>";
    html += '    <span class="subject-meta">' + (list.length ? list.length + (list.length > 1 ? " fiches disponibles" : " fiche disponible") : "Aucune fiche pour l’instant") + "</span></div>";
    html += '    <span class="subject-count">' + list.length + "</span>";
    html += "  </div>";

    if (vide) {
      if (solo) {
        html += '<div class="empty-state"><strong>Rien à télécharger pour le moment</strong>Les fiches de cette matière seront mises en ligne avant la prochaine évaluation.</div>';
      }
    } else {
      grouperParChapitre(list).forEach(function (g) {
        if (!g.titre) {
          // Fiches sans chapitre : rien à replier, elles restent visibles.
          html += '<ul class="sheet-list">';
          g.fiches.forEach(function (f) { html += ligneFiche(f); });
          html += "</ul>";
          return;
        }

        // Pendant une recherche, on déplie : cacher les résultats
        // trouvés donnerait une page vide sans explication.
        var ouvert = state.q ? true : !!state.ouverts[cle + "|" + g.titre];
        var listeId = idPropre("ch");

        html += '<div class="chapter' + (ouvert ? " chapter--open" : "") + '">';
        html += '  <h4 class="chapter-title-wrap"><button type="button" class="chapter-head"'
             +  ' aria-expanded="' + (ouvert ? "true" : "false") + '"'
             +  ' aria-controls="' + esc(listeId) + '"'
             +  ' data-chapitre="' + esc(cle + "|" + g.titre) + '">';
        html += ICON_CHEVRON;
        html += '    <span class="chapter-title">' + esc(g.titre) + "</span>";
        html += '    <span class="chapter-count">' + g.fiches.length + (g.fiches.length > 1 ? " fiches" : " fiche") + "</span>";
        html += "  </button></h4>";
        html += '  <ul class="sheet-list" id="' + esc(listeId) + '"' + (ouvert ? "" : " hidden") + ">";
        g.fiches.forEach(function (f) { html += ligneFiche(f); });
        html += "  </ul>";
        html += "</div>";
      });
    }
    html += "</section>";
    return { html: html, nb: list.length };
  }

  /* ---------- Une grande section : Spécialités, 1ère 1, 1ère 2 ---------- */

  function blocGroupe(id, titre, soustitre, matieres, classeId) {
    var corps = "", nb = 0, affiches = 0;

    matieres.forEach(function (m) {
      if (state.matiere !== "all" && state.matiere !== m.id) return;
      var bloc = blocMatiere(m, classeId);
      if (!bloc.html) return;
      corps += bloc.html;
      nb += bloc.nb;
      affiches++;
    });

    if (!affiches) return { html: "", nb: 0 };

    var titreId = "g-" + id;
    var html = '<section class="group" aria-labelledby="' + esc(titreId) + '">';
    html += '  <div class="group-head">';
    html += '    <div><h2 id="' + esc(titreId) + '">' + esc(titre) + "</h2>";
    html += '    <p class="group-sub">' + esc(soustitre) + "</p></div>";
    html += '    <span class="group-count">' + nb + (nb > 1 ? " fiches" : " fiche") + "</span>";
    html += "  </div>";
    html += '  <div class="group-body">' + corps + "</div>";
    html += "</section>";
    return { html: html, nb: nb };
  }

  function render() {
    compteurId = 0;
    var html = "";

    html += blocGroupe(
      "specialites",
      "Spécialités",
      "Cours communs aux deux classes : les fiches sont les mêmes pour la 1ère 1 et la 1ère 2.",
      SPECIALITES,
      null
    ).html;

    classes.forEach(function (c) {
      html += blocGroupe(
        c.id,
        c.nom,
        "Les matières du tronc commun, propres à la " + c.nom + ".",
        COMMUNES,
        c.id
      ).html;
    });

    if (!html) {
      html = '<div class="card"><div class="empty-state"><strong>Aucun résultat</strong>Aucune fiche ne correspond à ta recherche.</div></div>';
    }

    root.innerHTML = html;
    if (totalEl) {
      totalEl.textContent = fiches.length === 0
        ? "Aucune fiche en ligne pour le moment"
        : fiches.length + (fiches.length > 1 ? " fiches en ligne" : " fiche en ligne");
    }
  }

  /* ---------- Ouverture / fermeture des chapitres ---------- */

  root.addEventListener("click", function (e) {
    var bouton = e.target.closest(".chapter-head");
    if (!bouton || !root.contains(bouton)) return;

    var cle = bouton.getAttribute("data-chapitre");
    var liste = document.getElementById(bouton.getAttribute("aria-controls"));
    var ouvert = bouton.getAttribute("aria-expanded") === "true";

    bouton.setAttribute("aria-expanded", ouvert ? "false" : "true");
    if (liste) liste.hidden = ouvert;
    var bloc = bouton.closest(".chapter");
    if (bloc) bloc.classList.toggle("chapter--open", !ouvert);

    // On ne mémorise pas l'état pendant une recherche : les chapitres y
    // sont dépliés d'office, un clic n'y exprime pas une préférence durable.
    if (!state.q && cle) {
      if (ouvert) delete state.ouverts[cle];
      else state.ouverts[cle] = true;
    }
  });

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      state.q = searchInput.value;
      render();
    });
  }

  /* ---------- Fiches déposées via le formulaire d'upload ---------- */

  function estFiche(f) {
    return f && typeof f === "object"
      && typeof f.matiere === "string"
      && typeof f.titre === "string"
      && typeof f.fichier === "string";
  }

  function avertir(texte) {
    if (!avertEl) return;
    avertEl.textContent = texte;
    avertEl.hidden = false;
  }

  function chargerFichesDeposees() {
    if (typeof fetch !== "function") return;

    // Le « ?t= » force le navigateur à redemander le fichier : sans lui,
    // une fiche tout juste déposée pourrait rester invisible pendant des
    // heures à cause du cache.
    fetch("data/fiches.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("index introuvable (" + r.status + ")");
        return r.json();
      })
      .then(function (liste) {
        if (!Array.isArray(liste)) throw new Error("index illisible");

        var dejaLa = {};
        fiches.forEach(function (f) { dejaLa[f.fichier] = true; });

        var ajoutees = 0;
        liste.forEach(function (f) {
          if (!estFiche(f) || dejaLa[f.fichier]) return;
          dejaLa[f.fichier] = true;
          fiches.push(f);
          ajoutees++;
        });

        if (ajoutees) render();
      })
      .catch(function () {
        // Se taire ici serait un mensonge : la page afficherait « Aucune
        // fiche pour l'instant » sur des matieres qui en ont. On dit donc
        // ce qui manque, et surtout pourquoi.
        avertir(location.protocol === "file:"
          ? "Les fiches déposées via le formulaire ne s'affichent pas : cette page a été "
            + "ouverte directement depuis le disque (file://), et le navigateur interdit "
            + "alors la lecture de data/fiches.json. Ouvre le site par une adresse http:// "
            + "pour voir toutes les fiches — sur le site en ligne, ou avec un petit serveur "
            + "local (voir le LISEZ-MOI)."
          : "data/fiches.json n'a pas pu être lu : les fiches déposées via le formulaire "
            + "manquent peut-être à l'appel. Les fiches de data/fiches.js, elles, sont bien là.");
      });
  }

  buildFilters();
  render();
  chargerFichesDeposees();
})();
