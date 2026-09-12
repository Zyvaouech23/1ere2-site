"""
Limitation de debit
===================
Le depot est ouvert a tous : sans garde-fou, un seul script suffirait a
remplir le depot GitHub de milliers de fichiers. On compte donc les envois.

Le comptage vit en memoire du serveur : il repart de zero a chaque
redemarrage (et le plan gratuit Render s'endort souvent). C'est volontaire —
une base de donnees serait disproportionnee ici. Ce filet arrete un
maladroit et un robot bavard ; il n'arrete pas une attaque determinee.
Contre celle-la, l'arme est UPLOAD_CODE, ou UPLOAD_ENABLED=false.
"""

import threading
import time

from src.config import config

_verrou = threading.Lock()
_par_ip = {}          # ip -> [horodatages]
_jour = {"debut": time.time(), "total": 0}


def _ip(requete):
    # Render place l'IP du visiteur en tete de X-Forwarded-For.
    #
    # Attention : cet en-tete est envoye par le client, donc falsifiable.
    # Quelqu'un de determine peut changer d'IP declaree a chaque envoi et
    # contourner la limite par IP. C'est pourquoi il existe AUSSI un plafond
    # global quotidien, lui infalsifiable, et l'option UPLOAD_CODE.
    entete = requete.headers.get("X-Forwarded-For", "")
    if entete:
        return entete.split(",")[0].strip()
    return requete.remote_addr or "inconnue"


def _nettoyer(maintenant):
    limite = maintenant - config.RATE_FENETRE_S
    for ip in list(_par_ip.keys()):
        recents = [t for t in _par_ip[ip] if t > limite]
        if recents:
            _par_ip[ip] = recents
        else:
            del _par_ip[ip]

    if maintenant - _jour["debut"] > 86400:
        _jour["debut"] = maintenant
        _jour["total"] = 0


def verifier_limites(requete):
    """Renvoie None si le depot est autorise, sinon le message a afficher."""
    maintenant = time.time()
    with _verrou:
        _nettoyer(maintenant)

        if _jour["total"] >= config.RATE_GLOBAL_JOUR:
            return ("Le nombre maximum de fiches deposees aujourd'hui est atteint. "
                    "Reessaie demain.")

        if len(_par_ip.get(_ip(requete), [])) >= config.RATE_PAR_IP:
            minutes = max(1, config.RATE_FENETRE_S // 60)
            return ("Tu as deja envoye plusieurs fiches. Attends "
                    + str(minutes) + " minutes avant d'en deposer une autre.")
    return None


def enregistrer_depot(requete):
    """Appele seulement apres un depot reussi : un echec ne consomme pas le quota."""
    maintenant = time.time()
    with _verrou:
        _par_ip.setdefault(_ip(requete), []).append(maintenant)
        _jour["total"] += 1
