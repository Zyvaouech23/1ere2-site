"""
Configuration de l'API — Classe de 1ere 2
=========================================
Toutes les valeurs sensibles viennent des variables d'environnement Render.
AUCUN secret n'est ecrit dans ce fichier, et aucun ne doit jamais l'etre :
ce dossier part sur GitHub, ou tout le monde peut le lire.
"""

import os


def _env(nom, defaut=None, obligatoire=False):
    valeur = os.environ.get(nom, defaut)
    if obligatoire and not valeur:
        raise RuntimeError(
            "Variable d'environnement manquante : " + nom + ". "
            "Ajoute-la dans Render > ton service > Environment."
        )
    return valeur


def _env_int(nom, defaut):
    try:
        return int(os.environ.get(nom, "") or defaut)
    except ValueError:
        return defaut


def _env_liste(nom, defaut=""):
    brut = os.environ.get(nom, defaut) or ""
    return [x.strip().rstrip("/") for x in brut.split(",") if x.strip()]


class Config(object):
    """Configuration chargee une seule fois au demarrage du serveur."""

    # ---------- GitHub ----------
    GITHUB_TOKEN = _env("GITHUB_TOKEN", obligatoire=True)
    GITHUB_OWNER = _env("GITHUB_OWNER", "Zyvaouech23")
    GITHUB_REPOSITORY = _env("GITHUB_REPOSITORY", "1ere2-site")
    GITHUB_BRANCH = _env("GITHUB_BRANCH", "main")
    GITHUB_API = "https://api.github.com"

    # Dossier du site ou sont deposees les fiches, et index JSON des fiches.
    UPLOAD_DIRECTORY = (_env("UPLOAD_DIRECTORY", "fiches") or "fiches").strip("/")
    INDEX_PATH = (_env("INDEX_PATH", "data/fiches.json") or "data/fiches.json").strip("/")

    # ---------- Securite ----------
    # Origines autorisees a appeler l'API depuis un navigateur.
    ALLOWED_ORIGINS = _env_liste(
        "ALLOWED_ORIGINS",
        "https://oneere2-tl.onrender.com,http://localhost:5500,http://127.0.0.1:5500",
    )

    # Code d'acces facultatif. Vide = depot ouvert a tous (choix actuel).
    # Le jour ou tu es spamme : remplis UPLOAD_CODE dans Render, et le
    # formulaire demandera ce code. Aucun redeploiement de code necessaire.
    UPLOAD_CODE = (_env("UPLOAD_CODE", "") or "").strip()

    # Interrupteur d'urgence : mets UPLOAD_ENABLED=false pour tout couper.
    UPLOAD_ENABLED = (_env("UPLOAD_ENABLED", "true") or "true").lower() not in (
        "false", "0", "non", "no", "off"
    )

    # ---------- Limites ----------
    MAX_FILE_BYTES = _env_int("MAX_FILE_MO", 10) * 1024 * 1024
    MAX_REQUEST_BYTES = MAX_FILE_BYTES + 1 * 1024 * 1024  # marge pour le reste du formulaire

    RATE_PAR_IP = _env_int("RATE_PAR_IP", 5)            # fiches max...
    RATE_FENETRE_S = _env_int("RATE_FENETRE_S", 600)    # ...par IP et par 10 minutes
    RATE_GLOBAL_JOUR = _env_int("RATE_GLOBAL_JOUR", 40)  # fiches max par jour, tous visiteurs

    TITRE_MAX = 120
    TITRE_MIN = 3
    CHAPITRE_MAX = 120

    # ---------- Matieres ----------
    # Doit rester le miroir exact des identifiants de MATIERES dans data/fiches.js.
    MATIERES = {
        "svt": "Specialite SVT",
        "physique-chimie": "Specialite Physique-Chimie",
        "maths": "Specialite Maths",
        "ses": "Specialite SES",
        "llce": "Specialite LLCE",
        "histoire-geo": "Histoire-Geo-EMC",
        "francais": "Francais",
        "enseignement-scientifique": "Enseignement scientifique",
        "anglais": "Anglais LV1",
        "espagnol": "Espagnol LV2",
        "accompagnement": "Accompagnement personnalise",
        "allemand": "Allemand",
    }

    # ---------- Classes ----------
    # Doit rester le miroir exact de CLASSES dans data/fiches.js.
    CLASSES = {
        "1ere1": "1ere 1",
        "1ere2": "1ere 2",
    }

    # Matieres dedoublees : chaque classe a son propre compartiment sur la
    # page Telechargements, car elle ne suit pas le meme cours. Toutes les
    # autres matieres sont des specialites, dont le cours reunit les deux
    # classes : leur demander une classe n'aurait pas de reponse juste.
    # Doit rester le miroir des matieres marquees groupe "commun" dans
    # data/fiches.js.
    MATIERES_COMMUNES = {
        "histoire-geo",
        "francais",
        "enseignement-scientifique",
        "anglais",
        "espagnol",
        "accompagnement",
        "allemand",
    }

    VERSION = "1.0.0"


config = Config()
