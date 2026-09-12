"""
Depot d'une fiche
=================
POST /api/upload  (multipart/form-data)

  matiere   obligatoire   identifiant de la matiere (liste blanche)
  titre     obligatoire   nom affiche de la fiche
  chapitre  facultatif    titre du chapitre de regroupement
  fichier   obligatoire   le document lui-meme
  code      selon config  code d'acces, si UPLOAD_CODE est rempli sur Render
  site      piege         doit rester vide (champ invisible anti-robot)

Ordre des verifications : du moins couteux au plus couteux. On refuse un
robot ou une matiere inconnue avant d'avoir lu 10 Mo de fichier, et on ne
parle a GitHub qu'une fois tout le reste valide.
"""

import hmac

from flask import Blueprint, current_app, jsonify, request

from src.config import config
from src.services import github, storage, validation
from src.services.validation import ErreurValidation
from src.utils.limites import enregistrer_depot, verifier_limites

bp = Blueprint("upload", __name__)


@bp.post("/api/upload")
def upload():
    # 1. Le depot est-il ouvert ?
    if not config.UPLOAD_ENABLED:
        return jsonify({
            "ok": False,
            "erreur": "Le depot de fiches est momentanement ferme.",
        }), 503

    # 2. Piege a robots : un humain ne voit meme pas ce champ.
    if (request.form.get("site") or "").strip():
        return jsonify({"ok": False, "erreur": "Envoi refuse."}), 400

    # 3. Code d'acces, uniquement si UPLOAD_CODE est configure.
    if config.UPLOAD_CODE:
        fourni = (request.form.get("code") or "").strip()
        if not hmac.compare_digest(fourni, config.UPLOAD_CODE):
            return jsonify({
                "ok": False,
                "erreur": "Code d'acces incorrect.",
                "champ": "code",
            }), 401

    # 4. Limitation de debit (par IP, puis plafond global du jour).
    probleme = verifier_limites(request)
    if probleme:
        return jsonify({"ok": False, "erreur": probleme}), 429

    # 5. Champs texte.
    try:
        matiere = validation.valider_matiere(request.form.get("matiere"))
        titre = validation.valider_titre(request.form.get("titre"))
        chapitre = validation.valider_chapitre(request.form.get("chapitre"))
    except ErreurValidation as erreur:
        return jsonify({
            "ok": False, "erreur": erreur.message, "champ": erreur.champ
        }), 400

    # 6. Fichier.
    envoi = request.files.get("fichier")
    if envoi is None or not envoi.filename:
        return jsonify({
            "ok": False, "erreur": "Choisis un fichier a envoyer.", "champ": "fichier"
        }), 400

    try:
        extension = validation.extension_de(envoi.filename)
        contenu = envoi.read()
        validation.valider_contenu(contenu, extension)
    except ErreurValidation as erreur:
        return jsonify({
            "ok": False, "erreur": erreur.message, "champ": erreur.champ
        }), 400

    # 7. Ecriture sur GitHub : le fichier d'abord, l'index ensuite.
    try:
        chemin = storage.chemin_fiche(matiere, titre, extension, github.existe)
        github.deposer_fichier(chemin, contenu, titre)

        entree = storage.construire_entree(
            matiere, titre, chapitre, chemin, len(contenu), extension
        )
        github.ajouter_a_index(entree)
    except github.ErreurGitHub as erreur:
        # Le detail technique va dans le journal Render, pas chez l'eleve.
        current_app.logger.error("Echec GitHub : %s", erreur)
        return jsonify({
            "ok": False,
            "erreur": "Le serveur n'a pas reussi a enregistrer la fiche. "
                      "Reessaie dans une minute.",
        }), 502

    enregistrer_depot(request)

    return jsonify({
        "ok": True,
        "message": "Fiche envoyee. Elle apparaitra sur la page Telechargements "
                   "dans une minute ou deux, le temps que le site se mette a jour.",
        "fiche": entree,
    }), 201
