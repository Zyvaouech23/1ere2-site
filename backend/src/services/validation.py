"""
Verification des fiches envoyees
================================
Regle du jeu : on ne fait JAMAIS confiance a ce qui arrive du navigateur.
Ni au nom du fichier, ni a son extension, ni au type declare, ni a la matiere.
Tout est verifie ici, cote serveur. Le JavaScript de la page ne sert qu'a
eviter a l'eleve un aller-retour inutile, il ne protege rien.
"""

import re
import unicodedata

from src.config import config


class ErreurValidation(Exception):
    """Erreur previsible, dont le message est affichable tel quel a l'eleve."""

    def __init__(self, message, champ=None):
        super(ErreurValidation, self).__init__(message)
        self.message = message
        self.champ = champ


# --- Extensions autorisees, et signature binaire attendue pour chacune -------
#
# L'extension seule ne prouve rien : n'importe qui peut renommer un fichier
# en .pdf. On lit donc les premiers octets pour verifier que le contenu
# correspond vraiment au format annonce.

SIGNATURES = {
    "pdf":  [b"%PDF-"],
    "docx": [b"PK\x03\x04"],
    "pptx": [b"PK\x03\x04"],
    "xlsx": [b"PK\x03\x04"],
    "odt":  [b"PK\x03\x04"],
    "odp":  [b"PK\x03\x04"],
    "doc":  [b"\xd0\xcf\x11\xe0"],
    "ppt":  [b"\xd0\xcf\x11\xe0"],
    "png":  [b"\x89PNG\r\n\x1a\n"],
    "jpg":  [b"\xff\xd8\xff"],
    "jpeg": [b"\xff\xd8\xff"],
    "webp": [b"RIFF"],
    "txt":  None,   # texte : verifie autrement (voir plus bas)
    "md":   None,
}

LIBELLES = {
    "pdf": "PDF", "docx": "Word", "doc": "Word", "odt": "OpenDocument",
    "pptx": "PowerPoint", "ppt": "PowerPoint", "odp": "OpenDocument",
    "xlsx": "Excel", "png": "Image", "jpg": "Image", "jpeg": "Image",
    "webp": "Image", "txt": "Texte", "md": "Texte",
}

EXTENSIONS_OK = sorted(SIGNATURES.keys())


def _sans_accents(texte):
    decompose = unicodedata.normalize("NFKD", texte)
    return "".join(c for c in decompose if not unicodedata.combining(c))


def slugifier(texte, defaut="fiche"):
    """
    Transforme un texte libre en nom de fichier sur, utilisable dans une URL.
    'Fiche n°4 : Dérivation (révisions).pdf' -> 'fiche-n4-derivation-revisions'

    C'est aussi la barriere anti-traversee de repertoire : tout ce qui n'est
    pas une lettre, un chiffre ou un tiret disparait, donc '../../secret'
    devient 'secret'. Impossible d'ecrire ailleurs que dans le dossier prevu.
    """
    texte = _sans_accents(str(texte or "")).lower()
    texte = re.sub(r"[^a-z0-9]+", "-", texte)
    texte = re.sub(r"-{2,}", "-", texte).strip("-")
    return texte[:70] or defaut


def valider_matiere(valeur):
    valeur = (valeur or "").strip()
    if not valeur:
        raise ErreurValidation("Choisis une matiere.", "matiere")
    if valeur not in config.MATIERES:
        raise ErreurValidation("Cette matiere n'existe pas.", "matiere")
    return valeur


def _valider_texte(valeur, champ, libelle, mini, maxi, obligatoire):
    valeur = re.sub(r"\s+", " ", (valeur or "").strip())
    if not valeur:
        if obligatoire:
            raise ErreurValidation("Le " + libelle + " est obligatoire.", champ)
        return ""
    if len(valeur) < mini:
        raise ErreurValidation(
            "Le " + libelle + " doit faire au moins " + str(mini) + " caracteres.", champ
        )
    if len(valeur) > maxi:
        raise ErreurValidation(
            "Le " + libelle + " ne doit pas depasser " + str(maxi) + " caracteres.", champ
        )
    # Caracteres de controle : aucune raison legitime d'en avoir dans un titre.
    if any(ord(c) < 32 for c in valeur):
        raise ErreurValidation("Le " + libelle + " contient des caracteres interdits.", champ)
    return valeur


def valider_titre(valeur):
    return _valider_texte(
        valeur, "titre", "titre", config.TITRE_MIN, config.TITRE_MAX, True
    )


def valider_chapitre(valeur):
    # Facultatif : une fiche sans chapitre s'affiche directement sous la matiere.
    return _valider_texte(valeur, "chapitre", "chapitre", 2, config.CHAPITRE_MAX, False)


def extension_de(nom_fichier):
    nom = (nom_fichier or "").strip().lower()
    if "." not in nom:
        raise ErreurValidation("Ce fichier n'a pas d'extension.", "fichier")
    ext = nom.rsplit(".", 1)[1]
    ext = re.sub(r"[^a-z0-9]", "", ext)
    if ext not in SIGNATURES:
        raise ErreurValidation(
            "Format non accepte. Formats possibles : " + ", ".join(EXTENSIONS_OK) + ".",
            "fichier",
        )
    return ext


def valider_contenu(donnees, extension):
    """Verifie la taille reelle et les premiers octets du fichier."""
    if not donnees:
        raise ErreurValidation("Le fichier est vide.", "fichier")

    if len(donnees) > config.MAX_FILE_BYTES:
        mo = config.MAX_FILE_BYTES // (1024 * 1024)
        raise ErreurValidation(
            "Fichier trop lourd (" + str(mo) + " Mo maximum).", "fichier"
        )

    signatures = SIGNATURES.get(extension)

    if signatures is None:
        # Fichier texte : il doit etre du vrai texte UTF-8, sans octet nul.
        if b"\x00" in donnees[:4096]:
            raise ErreurValidation("Ce fichier n'est pas un fichier texte.", "fichier")
        try:
            donnees[:4096].decode("utf-8")
        except UnicodeDecodeError:
            raise ErreurValidation("Ce fichier n'est pas un fichier texte.", "fichier")
        return

    if not any(donnees.startswith(sig) for sig in signatures):
        raise ErreurValidation(
            "Le contenu du fichier ne correspond pas a son extension ."
            + extension + " (fichier renomme ?).",
            "fichier",
        )

    # WebP : 'RIFF' sert aussi pour le son, on confirme avec le marqueur WEBP.
    if extension == "webp" and donnees[8:12] != b"WEBP":
        raise ErreurValidation("Ce fichier n'est pas une image WebP.", "fichier")


def poids_lisible(octets, extension):
    """Produit le champ 'poids' attendu par la page : 'PDF - 420 Ko'."""
    if octets < 1024:
        taille = str(octets) + " o"
    elif octets < 1024 * 1024:
        taille = str(int(round(octets / 1024.0))) + " Ko"
    else:
        taille = ("%.1f" % (octets / (1024.0 * 1024.0))).replace(".", ",") + " Mo"
    return LIBELLES.get(extension, extension.upper()) + " · " + taille
