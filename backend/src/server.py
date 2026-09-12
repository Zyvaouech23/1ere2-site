"""
API de depot de fiches — Classe de 1ere 2
=========================================
Serveur Flask heberge sur Render. Il fait une seule chose : recevoir une
fiche depuis le site, la verifier, et la deposer sur GitHub. Le site, lui,
reste entierement statique.

Demarrage local :
    cd backend
    pip install -r requirements.txt
    GITHUB_TOKEN=xxx GITHUB_OWNER=Zyvaouech23 GITHUB_REPOSITORY=1ere2-site \
      python -m src.server

Demarrage sur Render :
    gunicorn src.server:app
"""

import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from src.config import config
from src.routes.files import bp as bp_files
from src.routes.health import bp as bp_health
from src.routes.upload import bp as bp_upload


def creer_app():
    app = Flask(__name__)

    # Refus immediat des envois trop gros : Flask coupe avant de tout lire
    # en memoire, ce qui evite qu'un fichier de 2 Go fasse tomber le serveur.
    app.config["MAX_CONTENT_LENGTH"] = config.MAX_REQUEST_BYTES

    # Seul ton site a le droit d'appeler l'API depuis un navigateur.
    CORS(
        app,
        resources={r"/api/*": {"origins": config.ALLOWED_ORIGINS}},
        methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
        max_age=3600,
    )

    app.register_blueprint(bp_health)
    app.register_blueprint(bp_files)
    app.register_blueprint(bp_upload)

    @app.get("/")
    def racine():
        return jsonify({
            "service": "API de depot de fiches — Classe de 1ere 2",
            "version": config.VERSION,
            "documentation": "voir docs/api.md dans le depot",
        })

    @app.errorhandler(413)
    def trop_gros(_erreur):
        mo = config.MAX_FILE_BYTES // (1024 * 1024)
        return jsonify({
            "ok": False,
            "erreur": "Fichier trop lourd (" + str(mo) + " Mo maximum).",
            "champ": "fichier",
        }), 413

    @app.errorhandler(404)
    def introuvable(_erreur):
        return jsonify({"ok": False, "erreur": "Adresse inconnue."}), 404

    @app.errorhandler(405)
    def methode(_erreur):
        return jsonify({"ok": False, "erreur": "Methode non autorisee."}), 405

    @app.errorhandler(Exception)
    def imprevu(erreur):
        # Les erreurs HTTP normales gardent leur code.
        if isinstance(erreur, HTTPException):
            return jsonify({"ok": False, "erreur": erreur.description}), erreur.code
        # Tout le reste : journalise en clair, repond sans detail technique.
        # Une trace Python renvoyee au navigateur, c'est une carte du serveur
        # offerte a qui voudrait l'attaquer.
        app.logger.exception("Erreur imprevue sur %s", request.path)
        return jsonify({
            "ok": False,
            "erreur": "Erreur interne du serveur. Reessaie dans un instant.",
        }), 500

    return app


app = creer_app()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        debug=False,
    )
