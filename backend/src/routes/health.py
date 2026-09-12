"""Verification que le serveur est vivant (et reveil du plan gratuit Render)."""

from flask import Blueprint, jsonify

from src.config import config
from src.services import github

bp = Blueprint("health", __name__)


@bp.get("/api/health")
def health():
    return jsonify({
        "ok": True,
        "version": config.VERSION,
        "depots_ouverts": config.UPLOAD_ENABLED,
        "code_requis": bool(config.UPLOAD_CODE),
        "taille_max_mo": config.MAX_FILE_BYTES // (1024 * 1024),
    })


@bp.get("/api/diagnostic")
def diagnostic():
    """Verifie en plus que le token GitHub fonctionne. Plus lent : a la demande."""
    return jsonify({"ok": True, "github": github.etat()})
