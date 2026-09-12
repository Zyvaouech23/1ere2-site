"""Liste des fiches deposees, lue depuis data/fiches.json sur GitHub."""

import json

from flask import Blueprint, jsonify

from src.config import config
from src.services import github

bp = Blueprint("files", __name__)


@bp.get("/api/matieres")
def matieres():
    """Sert a remplir la liste deroulante du formulaire."""
    return jsonify([
        {"id": identifiant, "nom": nom}
        for identifiant, nom in config.MATIERES.items()
    ])


@bp.get("/api/fiches")
def fiches():
    """
    Utile pour verifier qu'un depot est bien arrive sans attendre le
    redeploiement de Render. La page Telechargements, elle, lit directement
    data/fiches.json sur le site : aucun appel a l'API, donc aucune latence.
    """
    try:
        contenu, _ = github.lire(config.INDEX_PATH)
    except github.ErreurGitHub:
        return jsonify({"ok": False, "erreur": "Index illisible."}), 502

    if contenu is None:
        return jsonify({"ok": True, "fiches": []})

    try:
        donnees = json.loads(contenu.decode("utf-8") or "[]")
    except ValueError:
        return jsonify({"ok": False, "erreur": "Index illisible."}), 502

    return jsonify({"ok": True, "fiches": donnees})
