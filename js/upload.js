/* ============================================================
   upload.js — formulaire de dépôt d'une fiche
   ------------------------------------------------------------
   Ce script sert le CONFORT de l'élève : il remplit la liste des
   matières, propose les chapitres déjà existants, gère le
   glisser-déposer et affiche la progression.

   Il ne PROTÈGE rien. Toutes les vérifications qui comptent sont
   refaites sur le serveur, dans backend/src/services/validation.py :
   n'importe qui peut désactiver ce fichier depuis son navigateur.
   ============================================================ */
(function () {
  "use strict";

  var form = document.getElementById("upload-form");
  if (!form) return;

  var EXT_OK = ["pdf", "docx", "doc", "odt", "pptx", "ppt", "odp", "xlsx",
                "png", "jpg", "jpeg", "webp", "md", "txt"];
  var TAILLE_MAX = 10 * 1024 * 1024;

  var el = {
    matiere: document.getElementById("matiere"),
    titre: document.getElementById("titre"),
    chapitre: document.getElementById("chapitre"),
    chapitres: document.getElementById("chapitres-existants"),
    fichier: document.getElementById("fichier"),
    dropzone: document.getElementById("dropzone"),
    choisi: document.getElementById("file-chosen"),
    nom: document.getElementById("file-name"),
    taille: document.getElementById("file-size"),
    retirer: document.getElementById("file-remove"),
    code: document.getElementById("code"),
    champCode: document.getElementById("field-code"),
    bouton: document.getElementById("submit"),
    progress: document.getElementById("progress"),
    progressFill: document.getElementById("progress-fill"),
    progressText: document.getElementById("progress-text"),
    message: document.getElementById("message"),
    etat: document.getElementById("server-state"),
    etatTexte: document.getElementById("server-state-text")
  };

  var fichierChoisi = null;
  var envoiEnCours = false;
  var chapitresConnus = [];   // chapitres déjà utilisés, toutes fiches confondues

  /* ---------- Petits utilitaires ---------- */

  function poidsLisible(octets) {
    if (octets < 1024) return octets + " o";
    if (octets < 1024 * 1024) return Math.round(octets / 1024) + " Ko";
    return (octets / (1024 * 1024)).toFixed(1).replace(".", ",") + " Mo";
  }

  function extensionDe(nom) {
    var morceaux = String(nom || "").toLowerCase().split(".");
    return morceaux.length > 1 ? morceaux.pop() : "";
  }

  function erreurChamp(champ, texte) {
    var p = document.getElementById("err-" + champ);
    var conteneur = document.getElementById(champ);
    conteneur = conteneur ? conteneur.closest(".field") : null;
    if (p) {
      p.textContent = texte || "";
      p.hidden = !texte;
    }
    if (conteneur) conteneur.classList.toggle("field--erreur", !!texte);
  }

  function viderErreurs() {
    ["matiere", "titre", "chapitre", "fichier", "code"].forEach(function (c) {
      erreurChamp(c, "");
    });
    el.message.hidden = true;
    el.message.removeAttribute("data-type");
  }

  /* Les seuls fragments de HTML affichés ici sont écrits dans ce fichier.
     Tout ce qui vient de l'utilisateur ou du serveur passe par echapper(),
     sans quoi un titre de fiche contenant du HTML serait interprété. */
  function echapper(valeur) {
    return String(valeur == null ? "" : valeur).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function afficherMessage(type, texte) {
    el.message.hidden = false;
    el.message.setAttribute("data-type", type);
    el.message.innerHTML = texte;
  }

  function etatServeur(etat, texte) {
    el.etat.setAttribute("data-etat", etat);
    el.etatTexte.textContent = texte;
  }

  /* ---------- Liste des matières, depuis data/fiches.js ---------- */

  function remplirMatieres() {
    if (typeof MATIERES === "undefined") return;
    MATIERES.forEach(function (m) {
      var option = document.createElement("option");
      option.value = m.id;
      option.textContent = m.nom;
      el.matiere.appendChild(option);
    });
  }

  /* ---------- Chapitres déjà existants ----------
     Le regroupement par chapitre se fait sur une comparaison exacte :
     « Chapitre 4 » et « chapitre 4 » créent deux chapitres différents.
     Proposer les titres existants est donc la meilleure protection
     contre les doublons involontaires. */

  function collecterChapitres(liste) {
    (liste || []).forEach(function (f) {
      if (!f || !f.matiere) return;
      var titre = String(f.chapter_title || f.chapitre || "").trim();
      if (!titre) return;
      chapitresConnus.push({ matiere: f.matiere, titre: titre });
    });
  }

  function majChapitres() {
    var matiere = el.matiere.value;
    var vus = {};
    // On construit les <option> par le DOM plutôt qu'en assemblant du HTML :
    // un titre de chapitre contenant un guillemet ou un chevron reste alors
    // du texte, et ne peut en aucun cas devenir du code.
    el.chapitres.innerHTML = "";
    chapitresConnus.forEach(function (c) {
      if (matiere && c.matiere !== matiere) return;
      if (vus[c.titre]) return;
      vus[c.titre] = true;
      var option = document.createElement("option");
      option.value = c.titre;
      el.chapitres.appendChild(option);
    });
  }

  function chargerChapitres() {
    if (typeof FICHES !== "undefined" && Array.isArray(FICHES)) collecterChapitres(FICHES);
    majChapitres();

    // Les fiches déposées via ce formulaire vivent dans data/fiches.json.
    fetch("data/fiches.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (liste) {
        collecterChapitres(Array.isArray(liste) ? liste : []);
        majChapitres();
      })
      .catch(function () { /* index absent : ce n'est pas une erreur */ });
  }

  /* ---------- Choix du fichier ---------- */

  function definirFichier(fichier) {
    erreurChamp("fichier", "");

    if (!fichier) {
      fichierChoisi = null;
      el.choisi.hidden = true;
      return;
    }

    var ext = extensionDe(fichier.name);
    if (EXT_OK.indexOf(ext) === -1) {
      fichierChoisi = null;
      el.choisi.hidden = true;
      erreurChamp("fichier", "Format non accepté. Formats possibles : " + EXT_OK.join(", ") + ".");
      return;
    }
    if (fichier.size > TAILLE_MAX) {
      fichierChoisi = null;
      el.choisi.hidden = true;
      erreurChamp("fichier", "Fichier trop lourd (" + poidsLisible(fichier.size) + "). Maximum : 10 Mo.");
      return;
    }
    if (fichier.size === 0) {
      fichierChoisi = null;
      el.choisi.hidden = true;
      erreurChamp("fichier", "Ce fichier est vide.");
      return;
    }

    fichierChoisi = fichier;
    el.nom.textContent = fichier.name;
    el.taille.textContent = poidsLisible(fichier.size);
    el.choisi.hidden = false;

    // Si le titre est encore vide, on propose le nom du fichier : l'élève
    // n'a plus qu'à le corriger au lieu de tout taper.
    if (!el.titre.value.trim()) {
      var propose = fichier.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
      if (propose) el.titre.value = propose.charAt(0).toUpperCase() + propose.slice(1);
    }
  }

  function brancherDropzone() {
    el.dropzone.addEventListener("click", function () { el.fichier.click(); });
    el.dropzone.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        el.fichier.click();
      }
    });

    el.fichier.addEventListener("change", function () {
      definirFichier(el.fichier.files && el.fichier.files[0]);
    });

    ["dragenter", "dragover"].forEach(function (type) {
      el.dropzone.addEventListener(type, function (e) {
        e.preventDefault();
        el.dropzone.setAttribute("data-survol", "true");
      });
    });
    ["dragleave", "drop"].forEach(function (type) {
      el.dropzone.addEventListener(type, function (e) {
        e.preventDefault();
        el.dropzone.setAttribute("data-survol", "false");
      });
    });
    el.dropzone.addEventListener("drop", function (e) {
      var fichiers = e.dataTransfer && e.dataTransfer.files;
      if (fichiers && fichiers.length) {
        el.fichier.value = "";
        definirFichier(fichiers[0]);
      }
    });

    // Sans cela, un fichier lâché à côté de la zone remplace la page.
    ["dragover", "drop"].forEach(function (type) {
      window.addEventListener(type, function (e) {
        if (!el.dropzone.contains(e.target)) e.preventDefault();
      });
    });

    el.retirer.addEventListener("click", function () {
      el.fichier.value = "";
      definirFichier(null);
      el.dropzone.focus();
    });
  }

  /* ---------- Réveil du serveur ---------- */

  function verifierServeur() {
    etatServeur("attente", "Connexion au serveur… (il peut mettre jusqu'à une minute à se réveiller)");
    API.reveiller().then(function (resultat) {
      if (resultat.etat === "absent") {
        // L'adresse répond, mais pas l'API : neuf fois sur dix, le service
        // Render n'a pas encore été créé, ou API_BASE dans js/api.js ne
        // correspond pas au nom que Render a donné au service.
        etatServeur("panne", "Le serveur de dépôt n'est pas en service (erreur "
          + resultat.code + " à l'adresse " + API.base + "). Ce n'est pas ta connexion : "
          + "il faut créer le service sur Render, ou corriger l'adresse dans js/api.js.");
        el.bouton.disabled = true;
        return;
      }
      if (resultat.etat === "injoignable") {
        etatServeur("panne", "Aucune réponse de " + API.base + ". Le serveur est peut-être "
          + "en train de se réveiller : attends une minute et recharge la page.");
        return;
      }

      var info = resultat.info || {};
      if (info.depots_ouverts === false) {
        etatServeur("panne", "Le dépôt de fiches est fermé pour le moment.");
        el.bouton.disabled = true;
        return;
      }
      if (info.code_requis) {
        el.champCode.hidden = false;
        el.code.required = true;
      }
      etatServeur("pret", "Serveur prêt. Tu peux envoyer ta fiche.");
    });
  }

  /* ---------- Envoi ---------- */

  function validerAvantEnvoi() {
    var ok = true;
    if (!el.matiere.value) { erreurChamp("matiere", "Choisis une matière."); ok = false; }

    var titre = el.titre.value.trim();
    if (titre.length < 3) { erreurChamp("titre", "Donne un titre d'au moins 3 caractères."); ok = false; }

    if (!fichierChoisi) { erreurChamp("fichier", "Choisis un fichier à envoyer."); ok = false; }

    if (el.code.required && !el.code.value.trim()) {
      erreurChamp("code", "Saisis le code d'accès."); ok = false;
    }
    return ok;
  }

  function progression(part) {
    var pourcent = Math.round(part * 100);
    el.progressFill.style.width = pourcent + "%";
    el.progressText.textContent = pourcent < 100
      ? "Envoi en cours… " + pourcent + " %"
      : "Enregistrement sur le site…";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (envoiEnCours) return;

    viderErreurs();
    if (!validerAvantEnvoi()) {
      var premier = form.querySelector(".field--erreur input, .field--erreur select");
      if (premier) premier.focus();
      return;
    }

    var donnees = new FormData();
    donnees.append("matiere", el.matiere.value);
    donnees.append("titre", el.titre.value.trim());
    donnees.append("chapitre", el.chapitre.value.trim());
    donnees.append("fichier", fichierChoisi, fichierChoisi.name);
    donnees.append("site", document.getElementById("site").value);
    if (el.code.required) donnees.append("code", el.code.value);

    envoiEnCours = true;
    el.bouton.disabled = true;
    el.progress.hidden = false;
    progression(0);

    API.envoyerFiche(donnees, progression)
      .then(function (reponse) {
        el.progress.hidden = true;
        envoiEnCours = false;
        el.bouton.disabled = false;

        var fiche = reponse.fiche || {};
        afficherMessage("succes",
          "<strong>Fiche envoyée !</strong><br>« " + echapper(fiche.titre || "") + " » a été déposée en "
          + echapper(el.matiere.options[el.matiere.selectedIndex].textContent) + ". "
          + "Elle apparaîtra sur la <a href=\"telechargements.html\">page Téléchargements</a> "
          + "dans une à deux minutes, le temps que le site se mette à jour.");

        // On remet le formulaire à zéro, mais on garde la matière :
        // on dépose souvent plusieurs fiches de la même matière d'affilée.
        el.titre.value = "";
        el.chapitre.value = "";
        el.fichier.value = "";
        definirFichier(null);
        el.message.scrollIntoView({ behavior: "smooth", block: "nearest" });
      })
      .catch(function (erreur) {
        el.progress.hidden = true;
        envoiEnCours = false;
        el.bouton.disabled = false;

        if (erreur && erreur.champ) erreurChamp(erreur.champ, erreur.message);
        afficherMessage("erreur",
          "<strong>L'envoi a échoué.</strong><br>"
          + echapper((erreur && erreur.message) || "Erreur inconnue.")
          + (erreur && erreur.statut === 0
              ? " Si le problème persiste, le serveur est peut-être encore en train de se réveiller : attends une minute et réessaie."
              : ""));
      });
  });

  /* ---------- Démarrage ---------- */

  remplirMatieres();
  chargerChapitres();
  brancherDropzone();
  verifierServeur();
  el.matiere.addEventListener("change", majChapitres);
})();
