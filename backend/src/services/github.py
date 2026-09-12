"""
Dialogue avec l'API GitHub
==========================
Deux operations, et deux seulement :
  1. deposer le fichier de la fiche dans fiches/<matiere>/
  2. ajouter son entree dans data/fiches.json

Chaque ecriture est un commit sur la branche du site. Render surveille cette
branche : il redeploie tout seul, et la fiche apparait en ligne environ une
minute plus tard.

Le token n'est lu que depuis les variables d'environnement Render, et n'est
jamais renvoye dans une reponse, ni ecrit dans un journal.
"""

import base64
import json
import time

import requests

from src.config import config

TIMEOUT = 25


class ErreurGitHub(Exception):
    """Probleme cote GitHub : message technique pour le journal du serveur."""


class Conflit(ErreurGitHub):
    """Quelqu'un a modifie le fichier entre notre lecture et notre ecriture."""


def _entetes():
    return {
        "Authorization": "Bearer " + config.GITHUB_TOKEN,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "1ere2-site-upload",
    }


def _url(chemin):
    return (config.GITHUB_API + "/repos/" + config.GITHUB_OWNER + "/"
            + config.GITHUB_REPOSITORY + "/contents/" + chemin.lstrip("/"))


def lire(chemin):
    """Renvoie (contenu_octets, sha) ou (None, None) si le fichier n'existe pas."""
    reponse = requests.get(
        _url(chemin),
        headers=_entetes(),
        params={"ref": config.GITHUB_BRANCH},
        timeout=TIMEOUT,
    )
    if reponse.status_code == 404:
        return None, None
    if reponse.status_code != 200:
        raise ErreurGitHub(
            "Lecture de " + chemin + " impossible (HTTP "
            + str(reponse.status_code) + ")"
        )
    donnees = reponse.json()
    if donnees.get("encoding") != "base64" or "content" not in donnees:
        # Fichier de plus de 1 Mo : GitHub ne renvoie pas le contenu ici.
        raise ErreurGitHub("Le fichier " + chemin + " est trop gros pour etre relu.")
    return base64.b64decode(donnees["content"]), donnees.get("sha")


def existe(chemin):
    reponse = requests.get(
        _url(chemin),
        headers=_entetes(),
        params={"ref": config.GITHUB_BRANCH},
        timeout=TIMEOUT,
    )
    return reponse.status_code == 200


def ecrire(chemin, contenu, message, sha=None):
    """Cree ou remplace un fichier. Renvoie la reponse JSON de GitHub."""
    corps = {
        "message": message,
        "content": base64.b64encode(contenu).decode("ascii"),
        "branch": config.GITHUB_BRANCH,
    }
    if sha:
        corps["sha"] = sha

    reponse = requests.put(
        _url(chemin), headers=_entetes(), json=corps, timeout=TIMEOUT
    )
    if reponse.status_code in (200, 201):
        return reponse.json()

    if reponse.status_code in (401, 403):
        raise ErreurGitHub(
            "GitHub refuse le token (HTTP " + str(reponse.status_code)
            + "). Verifie GITHUB_TOKEN et ses droits Contents: read and write."
        )
    if reponse.status_code == 409:
        raise Conflit("Conflit de version sur " + chemin)
    if reponse.status_code == 422:
        raise Conflit("Version obsolete sur " + chemin)
    raise ErreurGitHub(
        "Ecriture de " + chemin + " refusee (HTTP " + str(reponse.status_code) + ")"
    )



def deposer_fichier(chemin, contenu, titre):
    return ecrire(chemin, contenu, "Ajout de la fiche : " + titre)


def ajouter_a_index(entree, essais=4):
    """
    Lecture -> modification -> ecriture de data/fiches.json.

    Entre notre lecture et notre ecriture, un autre eleve peut avoir depose
    sa fiche : GitHub rejette alors l'ecriture parce que le sha a change.
    On recommence depuis la relecture, sans jamais ecraser son travail.
    """
    dernier = None
    for tentative in range(essais):
        contenu, sha = lire(config.INDEX_PATH)

        if contenu is None:
            fiches = []
            sha = None
        else:
            try:
                fiches = json.loads(contenu.decode("utf-8") or "[]")
                if not isinstance(fiches, list):
                    fiches = []
            except ValueError:
                # Index illisible : on ne le detruit pas en silence.
                raise ErreurGitHub(
                    config.INDEX_PATH + " n'est pas un JSON valide, correction manuelle requise."
                )

        fiches.append(entree)
        nouveau = json.dumps(fiches, ensure_ascii=False, indent=2) + "\n"

        try:
            return ecrire(
                config.INDEX_PATH,
                nouveau.encode("utf-8"),
                "Index des fiches : " + entree["titre"],
                sha=sha,
            )
        except Conflit as erreur:
            dernier = erreur
            time.sleep(0.6 * (tentative + 1))

    raise ErreurGitHub(
        "Index non mis a jour apres plusieurs tentatives : " + str(dernier)
    )


_cache_etat = {"quand": 0.0, "valeur": None}


def etat():
    """
    Diagnostic pour /api/diagnostic, sans jamais exposer le token.

    Le resultat est garde 60 secondes : sans cela, quelqu'un qui appellerait
    cette adresse en boucle epuiserait le quota horaire de l'API GitHub, et
    plus aucune fiche ne pourrait etre deposee.
    """
    if _cache_etat["valeur"] and (time.time() - _cache_etat["quand"]) < 60:
        return _cache_etat["valeur"]
    try:
        reponse = requests.get(
            config.GITHUB_API + "/repos/" + config.GITHUB_OWNER + "/"
            + config.GITHUB_REPOSITORY,
            headers=_entetes(),
            timeout=10,
        )
        if reponse.status_code == 200:
            valeur = {"connecte": True, "depot": config.GITHUB_OWNER + "/"
                      + config.GITHUB_REPOSITORY}
        else:
            valeur = {"connecte": False, "code": reponse.status_code}
    except requests.RequestException:
        valeur = {"connecte": False, "code": "injoignable"}

    _cache_etat["quand"] = time.time()
    _cache_etat["valeur"] = valeur
    return valeur
