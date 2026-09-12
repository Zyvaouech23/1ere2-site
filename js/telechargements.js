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
   ============================================================ */
(function () {
  "use strict";

  var root = document.getElementById("subjects");
  if (!root || typeof MATIERES === "undefined") return;

  var searchInput = document.getElementById("search");
  var filtersBox = document.getElementById("filters");
  var totalEl = document.getElementById("total-fiches");
  var fiches = (typeof FICHES !== "undefined" && Array.isArray(FICHES)) ? FICHES : [];

  var state = { matiere: "all", q: "" };

  var ICON_DOC = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h4"/></svg>';
  var ICON_DL = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>';

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fichesDe(id) {
    var q = state.q.trim().toLowerCase();
    return fiches.filter(function (f) {
      if (f.matiere !== id) return false;
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

  function render() {
    var visibles = MATIERES.filter(function (m) {
      return state.matiere === "all" || state.matiere === m.id;
    });

    var html = "";
    var affichees = 0;

    visibles.forEach(function (m) {
      var list = fichesDe(m.id);
      affichees += list.length;
      if (state.q && list.length === 0) return;

      var vide = list.length === 0;
      var solo = state.matiere === m.id;
      html += '<section class="subject' + (vide ? " subject--empty" : "") + '" aria-labelledby="t-' + esc(m.id) + '">';
      html += '  <div class="subject-head">';
      html += '    <span class="subject-dot" style="background:' + esc(m.couleur) + '" aria-hidden="true">' + esc(m.court) + "</span>";
      html += '    <div><h3 id="t-' + esc(m.id) + '">' + esc(m.nom) + "</h3>";
      html += '    <span class="subject-meta">' + (list.length ? list.length + (list.length > 1 ? " fiches disponibles" : " fiche disponible") : "Aucune fiche pour l’instant") + "</span></div>";
      html += '    <span class="subject-count">' + list.length + "</span>";
      html += "  </div>";

      if (vide) {
        if (solo) {
          html += '<div class="empty-state"><strong>Rien à télécharger pour le moment</strong>Les fiches de cette matière seront mises en ligne avant la prochaine évaluation.</div>';
        }
      } else {
        grouperParChapitre(list).forEach(function (g) {
          if (g.titre) {
            html += '<div class="chapter-head"><h4>' + esc(g.titre) + "</h4>";
            html += '<span class="chapter-count">' + g.fiches.length + (g.fiches.length > 1 ? " fiches" : " fiche") + "</span></div>";
          }
          html += '<ul class="sheet-list">';
          g.fiches.forEach(function (f) { html += ligneFiche(f); });
          html += "</ul>";
        });
      }
      html += "</section>";
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

  function chargerFichesDeposees() {
    if (typeof fetch !== "function") return;

    // Le « ?t= » force le navigateur à redemander le fichier : sans lui,
    // une fiche tout juste déposée pourrait rester invisible pendant des
    // heures à cause du cache.
    fetch("data/fiches.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (liste) {
        if (!Array.isArray(liste)) return;

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
      .catch(function () { /* pas d'index : la page reste valable telle quelle */ });
  }

  buildFilters();
  render();
  chargerFichesDeposees();
})();
