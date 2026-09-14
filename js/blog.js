/* ============================================================
   blog.js — page Blog (liste) et page d'un article
   ------------------------------------------------------------
   Lit la liste ARTICLES de data/articles.js. Aucun appel réseau,
   aucun formulaire : la seule façon de publier est de modifier
   data/articles.js sur GitHub.

   Tout le texte passe par textContent : un titre contenant des
   chevrons reste du texte, et ne peut jamais devenir du code.

   ⚠️ Ce script doit être chargé AVANT js/main.js : main.js anime
   les blocs .reveal présents au chargement, dont les cartes créées ici.
   ============================================================ */
(function () {
  "use strict";

  var MOIS = ["janvier", "février", "mars", "avril", "mai", "juin",
              "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

  var ICON_FLECHE = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>';

  /* ---------- Lecture et tri des articles ---------- */

  function estArticle(a) {
    return !!a && typeof a === "object"
      && typeof a.id === "string" && a.id.trim() !== ""
      && typeof a.titre === "string";
  }

  function lireDate(date) {
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(date || "").trim());
    if (!m || +m[2] < 1 || +m[2] > 12) return null;
    return { j: +m[1], m: +m[2], a: +m[3] };
  }

  function cleDate(date) {
    var d = lireDate(date);
    return d ? d.a * 10000 + d.m * 100 + d.j : 0;
  }

  function dateLongue(date) {
    var d = lireDate(date);
    if (!d) return String(date || "");
    return (d.j === 1 ? "1er" : d.j) + " " + MOIS[d.m - 1] + " " + d.a;
  }

  function dateIso(date) {
    var d = lireDate(date);
    if (!d) return "";
    return d.a + "-" + (d.m < 10 ? "0" : "") + d.m + "-" + (d.j < 10 ? "0" : "") + d.j;
  }

  // Du plus récent au plus ancien ; à date égale, l'ordre du fichier est gardé.
  var articles = (typeof ARTICLES !== "undefined" && Array.isArray(ARTICLES))
    ? ARTICLES.filter(estArticle)
        .map(function (a, i) { return { a: a, i: i }; })
        .sort(function (x, y) { return cleDate(y.a.date) - cleDate(x.a.date) || x.i - y.i; })
        .map(function (x) { return x.a; })
    : [];

  /* ---------- Petits constructeurs ---------- */

  function creer(tag, classe, texte) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texte != null && texte !== "") n.textContent = texte;
    return n;
  }

  function lienVers(a) {
    return "article.html?id=" + encodeURIComponent(a.id);
  }

  function elementDate(date, classe) {
    var t = creer("time", classe, dateLongue(date));
    var iso = dateIso(date);
    if (iso) t.setAttribute("datetime", iso);
    return t;
  }

  // { photo, legende } → <figure><img><figcaption></figure>
  function figure(item, classe, immediate) {
    if (!item || typeof item.photo !== "string" || !item.photo) return null;
    var fig = creer("figure", classe);
    var img = document.createElement("img");
    img.src = item.photo;
    img.alt = item.alt || item.legende || "";
    img.decoding = "async";
    if (!immediate) img.loading = "lazy";
    fig.appendChild(img);
    if (item.legende) fig.appendChild(creer("figcaption", "", item.legende));
    return fig;
  }

  function etatVide(titre, texte) {
    var boite = creer("div", "card blog-empty");
    var etat = creer("div", "empty-state");
    etat.appendChild(creer("strong", "", titre));
    etat.appendChild(document.createTextNode(texte));
    boite.appendChild(etat);
    return boite;
  }

  /* ---------- Page Blog : la liste ---------- */

  function carte(a) {
    var c = creer("article", "card card--hover post-card reveal");

    var couverture = figure(a.couverture, "post-card-media");
    if (couverture) c.appendChild(couverture);

    var corps = creer("div", "post-card-body");
    if (a.evenement) corps.appendChild(creer("span", "post-event", a.evenement));

    var h = creer("h2", "post-title");
    var lien = creer("a", "", a.titre);
    lien.href = lienVers(a);
    h.appendChild(lien);
    corps.appendChild(h);

    if (a.date) corps.appendChild(elementDate(a.date, "post-date"));
    if (a.resume) corps.appendChild(creer("p", "", a.resume));

    // Toute la carte est cliquable grâce au lien du titre : ce libellé
    // n'est qu'un repère visuel, masqué aux lecteurs d'écran.
    var suite = creer("span", "post-more");
    suite.setAttribute("aria-hidden", "true");
    suite.innerHTML = "Lire l'article " + ICON_FLECHE;
    corps.appendChild(suite);

    c.appendChild(corps);
    return c;
  }

  function afficherListe(liste) {
    var compteur = document.getElementById("blog-count");

    if (!articles.length) {
      liste.appendChild(etatVide("Aucun article pour l'instant",
        "Les premiers articles arrivent bientôt : reviens jeter un œil après le prochain événement."));
    }
    articles.forEach(function (a) { liste.appendChild(carte(a)); });

    if (compteur) {
      compteur.textContent = articles.length
        ? articles.length + (articles.length > 1 ? " articles publiés" : " article publié")
        : "";
    }
  }

  /* ---------- Page d'un article ---------- */

  function afficherArticle(zone) {
    var id = "";
    try { id = new URLSearchParams(window.location.search).get("id") || ""; } catch (e) { /* vieux navigateur */ }

    var a = null;
    articles.forEach(function (x) { if (!a && x.id === id) a = x; });

    var titre = document.getElementById("article-title");
    var evenement = document.getElementById("article-event");
    var date = document.getElementById("article-date");
    var resume = document.getElementById("article-resume");

    if (!a) {
      titre.textContent = "Article introuvable";
      resume.textContent = "Cet article n'existe pas, ou son adresse est incomplète. Tous les articles publiés sont sur la page Blog.";
      date.parentNode.removeChild(date);
      document.title = "Article introuvable — Niveau 1ère - EREA Toulouse-Lautrec";
      return;
    }

    document.title = a.titre + " — Blog · Niveau 1ère - EREA Toulouse-Lautrec";
    var meta = document.querySelector('meta[name="description"]');
    if (meta && a.resume) meta.setAttribute("content", a.resume);

    if (a.evenement) evenement.textContent = a.evenement;
    titre.textContent = a.titre;
    if (a.date) {
      date.textContent = "Publié le " + dateLongue(a.date);
      var iso = dateIso(a.date);
      if (iso) date.setAttribute("datetime", iso);
    } else {
      date.parentNode.removeChild(date);
    }
    resume.textContent = a.resume || "";

    var couverture = figure(a.couverture, "article-figure article-figure--cover", true);
    if (couverture) zone.appendChild(couverture);

    (Array.isArray(a.contenu) ? a.contenu : []).forEach(function (bloc) {
      if (typeof bloc === "string") {
        if (bloc.trim()) zone.appendChild(creer("p", "", bloc));
        return;
      }
      if (!bloc || typeof bloc !== "object") return;

      if (typeof bloc.intertitre === "string") {
        zone.appendChild(creer("h2", "", bloc.intertitre));
        return;
      }
      if (Array.isArray(bloc.galerie)) {
        var galerie = creer("div", "article-gallery");
        bloc.galerie.forEach(function (p) {
          var f = figure(p, "article-figure");
          if (f) galerie.appendChild(f);
        });
        if (galerie.children.length) zone.appendChild(galerie);
        return;
      }
      var f = figure(bloc, "article-figure");
      if (f) zone.appendChild(f);
    });
  }

  /* ---------- Démarrage ---------- */

  var liste = document.getElementById("blog-list");
  if (liste) afficherListe(liste);

  var zone = document.getElementById("article");
  if (zone) afficherArticle(zone);
})();
