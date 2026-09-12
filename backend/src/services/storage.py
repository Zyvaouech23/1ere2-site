"""
Fabrication de l'entree de fiche
================================
Traduit un formulaire valide en un objet exactement au format attendu par
js/telechargements.js :

    { matiere, chapter_title, titre, fichier, date, poids }

Le champ 'fichier' est un chemin relatif a la racine du site, puisque c'est
ainsi que la page construit ses liens de telechargement.
"""

import datetime
import uuid

from src.config import config
from src.services import validation


def _maintenant_paris():
    """Date du jour a Paris, sans dependance externe (UTC+1, +2 en ete)."""
    utc = datetime.datetime.now(datetime.timezone.utc)
    annee = utc.year
    # Heure d'ete europeenne : dernier dimanche de mars -> dernier dimanche d'octobre.
    def dernier_dimanche(mois):
        jour = 31
        while True:
            d = datetime.date(annee, mois, jour)
            if d.weekday() == 6:
                return d
            jour -= 1
    debut = datetime.datetime(
        annee, 3, dernier_dimanche(3).day, 1, tzinfo=datetime.timezone.utc)
    fin = datetime.datetime(
        annee, 10, dernier_dimanche(10).day, 1, tzinfo=datetime.timezone.utc)
    decalage = 2 if debut <= utc < fin else 1
    return utc + datetime.timedelta(hours=decalage)


def date_du_jour():
    return _maintenant_paris().strftime("%d/%m/%Y")


def chemin_fiche(matiere, titre, extension, chemins_pris):
    """
    Construit 'fiches/<matiere>/<slug>.<ext>' a partir du titre.
    Si le chemin est deja occupe, ajoute -2, -3, ... plutot que d'ecraser
    la fiche d'un camarade.

    'chemins_pris' est une fonction qui repond True si un chemin existe deja.
    """
    base = validation.slugifier(titre)
    dossier = config.UPLOAD_DIRECTORY + "/" + matiere

    candidat = dossier + "/" + base + "." + extension
    suffixe = 2
    while chemins_pris(candidat):
        candidat = dossier + "/" + base + "-" + str(suffixe) + "." + extension
        suffixe += 1
        if suffixe > 50:
            # Garde-fou : on ne boucle pas indefiniment sur un repo hostile.
            candidat = (dossier + "/" + base + "-" + uuid.uuid4().hex[:6]
                        + "." + extension)
            break
    return candidat


def construire_entree(matiere, titre, chapitre, chemin, octets, extension):
    return {
        "matiere": matiere,
        "chapter_title": chapitre,
        "titre": titre,
        "fichier": chemin,
        "date": date_du_jour(),
        "poids": validation.poids_lisible(octets, extension),
    }
