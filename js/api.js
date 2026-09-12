/* ============================================================
   api.js — le seul endroit qui parle au serveur Render
   ------------------------------------------------------------
   ⚠️ UNE SEULE LIGNE À MODIFIER : API_BASE, juste en dessous.
   Mets l'adresse de ton service API sur Render (sans / à la fin).

   Ce fichier ne contient AUCUN mot de passe et AUCUNE clé : il part
   sur GitHub, où tout le monde peut le lire. Le token GitHub reste
   côté Render, dans les variables d'environnement, pour toujours.
   ============================================================ */
(function (global) {
  "use strict";

  var API_BASE = "https://1ere2-api.onrender.com";

  /* Le plan gratuit de Render endort le serveur après 15 minutes sans
     visite. Le premier appel peut alors prendre jusqu'à ~50 secondes,
     le temps qu'il se rallume. On le réveille dès l'ouverture de la page
     pour que l'envoi, lui, soit immédiat. */
  /* On distingue les trois cas, parce qu'ils n'ont ni la même cause ni la
     même solution :
       - "ok"       : le serveur répond, tout va bien ;
       - "absent"   : l'adresse existe mais ne connaît pas /api/health
                      (le service Render n'est pas créé, ou API_BASE est faux) ;
       - "injoignable" : rien ne répond (serveur endormi, coupure réseau). */
  function reveiller() {
    return fetch(API_BASE + "/api/health", { method: "GET", mode: "cors" })
      .then(function (r) {
        if (r.ok) {
          return r.json().then(function (info) {
            return { etat: "ok", info: info };
          });
        }
        return { etat: "absent", code: r.status };
      })
      .catch(function () { return { etat: "injoignable" }; });
  }

  /* Envoi de la fiche. On utilise XMLHttpRequest et non fetch : lui seul
     sait rapporter l'avancement de l'envoi, et donc afficher une barre de
     progression honnête plutôt qu'un sablier qui tourne dans le vide. */
  function envoyerFiche(donnees, surProgression) {
    return new Promise(function (resoudre, rejeter) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", API_BASE + "/api/upload", true);
      xhr.timeout = 120000;

      if (xhr.upload && typeof surProgression === "function") {
        xhr.upload.addEventListener("progress", function (e) {
          if (e.lengthComputable) surProgression(e.loaded / e.total);
        });
      }

      xhr.addEventListener("load", function () {
        var reponse = null;
        try { reponse = JSON.parse(xhr.responseText); } catch (e) { reponse = null; }

        if (xhr.status >= 200 && xhr.status < 300 && reponse && reponse.ok) {
          resoudre(reponse);
          return;
        }
        rejeter({
          message: (reponse && reponse.erreur) || "Le serveur a refusé l'envoi (erreur " + xhr.status + ").",
          champ: reponse && reponse.champ,
          statut: xhr.status
        });
      });

      xhr.addEventListener("error", function () {
        rejeter({ message: "Impossible de joindre le serveur. Vérifie ta connexion, puis réessaie." });
      });
      xhr.addEventListener("timeout", function () {
        rejeter({ message: "Le serveur met trop de temps à répondre. Réessaie dans une minute." });
      });

      xhr.send(donnees);
    });
  }

  global.API = { base: API_BASE, reveiller: reveiller, envoyerFiche: envoyerFiche };
})(window);
