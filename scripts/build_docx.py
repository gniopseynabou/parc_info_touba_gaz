# -*- coding: utf-8 -*-
"""
Générateur du document Word (.docx) professionnel
Analyse des besoins condensée — Touba Gaz IT
Stagiaire : Seynabou GNIOP | Tuteur : Paul Ismaël FLAN
"""

import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, color_hex):
    """Applique une couleur d'arrière-plan à une cellule de tableau."""
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Définit les marges internes (padding) d'une cellule."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_styled_table(doc, headers, data, col_widths=None):
    """Crée un tableau élégant avec en-tête bleu Touba Gaz et lignes alternées."""
    table = doc.add_table(rows=len(data) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    # En-tête
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], "1E3A8A") # Bleu Touba Gaz
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.bold = True
            run.font.color.rgb = RGBColor(255, 255, 255)
            run.font.size = Pt(9.5)
            run.font.name = "Arial"

    # Lignes de données
    for r_idx, row_data in enumerate(data):
        row_cells = table.rows[r_idx + 1].cells
        bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, cell_value in enumerate(row_data):
            row_cells[c_idx].text = str(cell_value)
            set_cell_background(row_cells[c_idx], bg_color)
            set_cell_margins(row_cells[c_idx], top=80, bottom=80, left=120, right=120)
            p = row_cells[c_idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.size = Pt(9)
                run.font.name = "Arial"
                run.font.color.rgb = RGBColor(30, 41, 59)

    # Largeurs de colonnes si fournies
    if col_widths:
        for row in table.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = width

    # Bordures fines discrètes
    tblPr = table._tbl.tblPr
    tblBorders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        '<w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
        '<w:bottom w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>'
        '<w:left w:val="none"/>'
        '<w:right w:val="none"/>'
        '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
        '<w:insideV w:val="none"/>'
        '</w:tblBorders>'
    )
    tblPr.append(tblBorders)
    doc.add_paragraph() # Espacement après tableau
    return table

def add_heading_1(doc, text):
    h = doc.add_heading(text, level=1)
    p = h
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    for r in p.runs:
        r.font.name = "Arial"
        r.font.size = Pt(15)
        r.font.bold = True
        r.font.color.rgb = RGBColor(15, 42, 91)
    return h

def add_heading_2(doc, text):
    h = doc.add_heading(text, level=2)
    p = h
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    for r in p.runs:
        r.font.name = "Arial"
        r.font.size = Pt(12)
        r.font.bold = True
        r.font.color.rgb = RGBColor(37, 99, 235)
    return h

def add_body_p(doc, text, bold_prefix=None, space_after=4):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Arial"
        r_pre.font.size = Pt(10)
        r_pre.font.bold = True
        r_pre.font.color.rgb = RGBColor(30, 41, 59)
    r = p.add_run(text)
    r.font.name = "Arial"
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor(51, 65, 85)
    return p

def add_callout(doc, text, title="NOTE / ARBITRAGE"):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    cell = table.rows[0].cells[0]
    cell.width = Inches(6.5)
    set_cell_background(cell, "EFF6FF")
    set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
    
    # Bordure gauche bleue épaisse
    tblPr = table._tbl.tblPr
    tblBorders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        '<w:top w:val="none"/>'
        '<w:bottom w:val="none"/>'
        '<w:left w:val="single" w:sz="24" w:space="0" w:color="2563EB"/>'
        '<w:right w:val="none"/>'
        '</w:tblBorders>'
    )
    tblPr.append(tblBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    r_tit = p.add_run(f"📌 {title} : ")
    r_tit.font.name = "Arial"
    r_tit.font.size = Pt(9.5)
    r_tit.font.bold = True
    r_tit.font.color.rgb = RGBColor(29, 78, 216)
    
    r_txt = p.add_run(text)
    r_txt.font.name = "Arial"
    r_txt.font.size = Pt(9.5)
    r_txt.font.color.rgb = RGBColor(30, 41, 59)
    doc.add_paragraph()

def build_document():
    doc = Document()
    
    # Marges standard 2 cm
    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.9)
        s.right_margin = Inches(0.9)

    # ---------------- PAGE DE GARDE / EN-TÊTE ----------------
    p_pre = doc.add_paragraph()
    r_pre = p_pre.add_run("TOUBA GAZ SA · DIRECTION DES SYSTÈMES D'INFORMATION")
    r_pre.font.name = "Arial"
    r_pre.font.size = Pt(11)
    r_pre.font.bold = True
    r_pre.font.color.rgb = RGBColor(37, 99, 235)
    p_pre.paragraph_format.space_after = Pt(2)

    p_title = doc.add_paragraph()
    r_tit = p_title.add_run("Dossier d'Analyse des Besoins & Conception Technique")
    r_tit.font.name = "Arial"
    r_tit.font.size = Pt(20)
    r_tit.font.bold = True
    r_tit.font.color.rgb = RGBColor(15, 42, 91)
    p_title.paragraph_format.space_after = Pt(4)

    p_sub = doc.add_paragraph()
    r_sub = p_sub.add_run("Application Web Intégrée de Gestion du Parc Informatique et de Traçabilité des Demandes d'Assistance")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(12)
    r_sub.font.color.rgb = RGBColor(71, 85, 105)
    p_sub.paragraph_format.space_after = Pt(14)

    # Tableau Métadonnées du stage
    meta_headers = ["Paramètre du Projet", "Détail Opérationnel"]
    meta_data = [
        ["Entreprise d'Accueil", "Touba Gaz SA (Sénégal)"],
        ["Stagiaire", "Seynabou GNIOP (Stage Informatique)"],
        ["Tuteur de Stage", "Paul Ismaël FLAN (Responsable IT Touba Gaz)"],
        ["Durée Globale du Projet", "3 Semaines"],
        ["Version du Document", "Version 2.0 Condensée & Alignée Code"],
        ["Date de Validation", "Novembre 2026"]
    ]
    create_styled_table(doc, meta_headers, meta_data, [Inches(2.5), Inches(4.0)])

    # ---------------- 1. CONTEXTE ET OBJECTIFS ----------------
    add_heading_1(doc, "1. Contexte, Enjeux et Objectifs")
    add_body_p(doc, "Le service informatique de Touba Gaz SA assure la gestion opérationnelle et le dépannage de l'ensemble du parc informatique de l'entreprise. Jusqu'à présent, les pannes étaient déclarées de manière informelle (téléphone, e-mails, visites physiques) et consignées dans un classeur Excel mensuel à saisie manuelle.", bold_prefix="Constat initial : ")
    add_body_p(doc, "Cette gestion manuelle présentait des limites majeures : dispersion des demandes, difficultés à évaluer la charge réelle des techniciens et absence d'un historique matériel centralisé.")
    add_body_p(doc, "L'objectif principal du stage est de concevoir et déployer en 3 semaines une application web centralisée, intuitive et robuste permettant de :")
    
    obj_items = [
        ("Centralisation du parc : ", "Recenser l'intégralité des équipements (PC, portables, imprimantes réseau, serveurs, switches) et tracer leurs affectations successives."),
        ("Traçabilité des incidents : ", "Enregistrer chaque demande d'assistance du signalement à la clôture finale avec une intervention technique rattachée."),
        ("Aide à la décision : ", "Fournir un tableau de bord en temps réel et des rapports d'activité officiels exportables en PDF pour la direction.")
    ]
    for b_pre, b_txt in obj_items:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        r1 = p.add_run(b_pre)
        r1.font.bold = True
        r1.font.name = "Arial"
        r1.font.size = Pt(9.5)
        r2 = p.add_run(b_txt)
        r2.font.name = "Arial"
        r2.font.size = Pt(9.5)

    # ---------------- 2. PÉRIMÈTRE ET RÔLES ----------------
    add_heading_1(doc, "2. Périmètre Applicatif et Rôles Utilisateurs")
    add_body_p(doc, "Conformément aux exigences du cahier des charges de 3 semaines, l'application est articulée autour de deux rôles étanches :")
    
    roles_headers = ["Rôle", "Espace Dédié", "Droits & Fonctionnalités Accessibles"]
    roles_data = [
        [
            "Collaborateur\n(Employé)",
            "Espace Employé\n(/espace-employe)",
            "• Visualisation exclusive des matériels qui lui sont attribués personnellement ou partagés avec son service.\n• Déclaration autonome d'une demande d'assistance avec choix de l'équipement.\n• Suivi en temps réel de l'état d'avancement de ses propres tickets (aucun accès aux pannes d'autrui)."
        ],
        [
            "Administrateur IT\n(Technicien)",
            "Dashboard IT\n(/dashboard)",
            "• Gestion complète du parc (création, fiche détaillée, photos, états physiques, archivage).\n• Répertoire des employés et des directions/services avec gestion des comptes d'accès.\n• Module d'affectations dynamiques avec historique automatique de restitution.\n• Traitement des tickets, diagnostic, saisie d'intervention unique et clôture définitive.\n• Supervision des KPI en temps réel et génération des rapports avec export PDF officiel."
        ]
    ]
    create_styled_table(doc, roles_headers, roles_data, [Inches(1.5), Inches(1.8), Inches(3.2)])
    add_callout(doc, "Les fonctionnalités complexes non indispensables (supervision réseau SNMP, alertes SMS automatiques, exports Word lourds) sont formellement exclues de la V1 pour sécuriser le déploiement opérationnel dans le délai restant.", "PÉRIMÈTRE MAÎTRISÉ (3 SEMAINES)")

    # ---------------- 3. RÈGLES DE GESTION ----------------
    add_heading_1(doc, "3. Règles de Gestion Essentielles (RG)")
    add_body_p(doc, "Douze règles fondamentales assurent la cohérence et l'intégrité de la solution :")

    rg_headers = ["Réf.", "Domaine", "Énoncé de la Règle de Gestion"]
    rg_data = [
        ["RG01", "Sécurité", "Toute ressource applicative exige une authentification par cookie signé httpOnly (session HMAC-SHA256)."],
        ["RG02", "Sécurité", "Un collaborateur employé ne peut accéder qu'à ses propres tickets et ses dotations matérielles (contrôle côté serveur)."],
        ["RG03", "Parc", "Chaque équipement possède un identifiant unique (code séquentiel) et un numéro de série unique lorsqu'il est renseigné."],
        ["RG04", "Parc", "Un équipement actif ne possède qu'une seule affectation en cours. Tout matériel sans affectation active est considéré 'En stock'."],
        ["RG05", "Parc", "Tout changement d'affectation clôture l'affectation précédente avec date de fin, préservant l'historique complet."],
        ["RG06", "Tickets", "Un incident peut être ouvert par l'employé ou enregistré par l'admin IT au nom d'un employé (canal téléphone, e-mail, présentiel)."],
        ["RG07", "Interventions", "Un ticket donne lieu à au plus une intervention technique (0,1). L'intervention reste modifiable tant que le ticket n'est pas clôturé."],
        ["RG08", "Interventions", "Ticket Express : pour les dépannages rapides sans demande préalable, le ticket et l'intervention sont validés et clôturés en une seule action."],
        ["RG09", "Interventions", "La durée d'intervention est déduite automatiquement des dates/heures de début et de fin (la fin doit être postérieure au début)."],
        ["RG10", "Cycle de vie", "Le statut 'Résolu' (fin des travaux techniques) est distinct du statut 'Clôturé' (validation finale de remise en service)."],
        ["RG11", "Traçabilité", "Aucun équipement, service ou ticket ayant un historique n'est supprimé physiquement : suppression logique par archivage (archive = 1)."],
        ["RG12", "Fichiers", "Les photos d'équipements et pièces jointes sont vérifiées par type MIME côté serveur, renommées et limitées en taille."]
    ]
    create_styled_table(doc, rg_headers, rg_data, [Inches(0.8), Inches(1.3), Inches(4.4)])

    # ---------------- 4. CYCLE DE VIE ET SÉQUENCE ----------------
    add_heading_1(doc, "4. Cycle de Vie d'un Incident & Diagramme de Séquence")
    add_heading_2(doc, "4.1 États et transitions d'un ticket")
    add_body_p(doc, "Le cycle de traitement d'un incident traverse 5 états séquentiels rigoureux : Nouveau ➔ En cours ➔ En attente ➔ Résolu ➔ Clôturé.")
    
    # Image du diagramme d'activité / cycle
    img_act_path = os.path.join("extracted_images", "image3.png")
    if os.path.exists(img_act_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.add_picture(img_act_path, width=Inches(3.2))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_cap = p_cap.add_run("Figure 1 — Cycle de vie et transitions d'un incident technique")
        r_cap.font.italic = True
        r_cap.font.size = Pt(8.5)
        r_cap.font.color.rgb = RGBColor(100, 116, 139)

    add_heading_2(doc, "4.2 Diagramme de Séquence Métier")
    add_body_p(doc, "Ce diagramme formalise l'enchaînement chronologique complet des messages et interactions entre l'Employé, l'Interface applicative, la Base de données MySQL et l'Administrateur IT lors du traitement d'une panne :")

    # Image du diagramme de séquence
    img_seq_path = os.path.join("extracted_images", "image4.png")
    if os.path.exists(img_seq_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.add_picture(img_seq_path, width=Inches(4.5))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_cap = p_cap.add_run("Figure 2 — Diagramme de séquence : Traitement d'un ticket de bout en bout")
        r_cap.font.italic = True
        r_cap.font.size = Pt(8.5)
        r_cap.font.color.rgb = RGBColor(100, 116, 139)

    # ---------------- 5. CAS D'UTILISATION ----------------
    add_heading_1(doc, "5. Cas d'Utilisation Métier")
    add_heading_2(doc, "5.1 Diagramme Général des Cas d'Utilisation")
    add_body_p(doc, "Le diagramme ci-après synthétise les cas d'utilisation offerts aux deux profils d'utilisateurs de Touba Gaz :")

    # Image du diagramme des cas d'utilisation
    img_cu_path = os.path.join("extracted_images", "image2.png")
    if os.path.exists(img_cu_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.add_picture(img_cu_path, width=Inches(4.5))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_cap = p_cap.add_run("Figure 3 — Diagramme général des cas d'utilisation Touba Gaz IT")
        r_cap.font.italic = True
        r_cap.font.size = Pt(8.5)
        r_cap.font.color.rgb = RGBColor(100, 116, 139)

    add_heading_2(doc, "5.2 Matrice Synthétique des Cas d'Utilisation")
    cu_headers = ["Réf.", "Cas d'Utilisation", "Acteur Principal", "Description & Résultat Métier"]
    cu_data = [
        ["CU01", "S'authentifier", "Tous", "Vérification des accès et redirection vers le dashboard IT ou l'espace collaborateur."],
        ["CU02", "Gérer le parc matériel", "Admin IT", "Création, consultation, filtrage par état, ajout de photo et archivage logique du matériel."],
        ["CU03", "Gérer personnel & services", "Admin IT", "Gestion du répertoire des collaborateurs, rattachement aux directions et création des comptes."],
        ["CU04", "Gérer les affectations", "Admin IT", "Attribution d'un matériel (collaborateur ou direction) avec historisation automatique de la restitution."],
        ["CU05", "Signaler un incident", "Employé / Admin", "Création d'un ticket d'incident avec priorité, catégorie et sélection de l'équipement."],
        ["CU06", "Enregistrer incident externe", "Admin IT", "Saisie d'une panne reçue par téléphone, mail ou au guichet au nom d'un employé."],
        ["CU07", "Traiter un ticket", "Admin IT", "Prise en charge ('En cours'), mise en attente éventuelle, résolution et clôture."],
        ["CU08", "Enregistrer une intervention", "Admin IT", "Extension de CU07 : enregistrement du diagnostic, des heures et de la solution technique."],
        ["CU09", "Consulter le tableau de bord", "Admin IT", "Supervision en direct : taux de disponibilité, tickets ouverts, alertes pannes critiques."],
        ["CU10", "Générer les rapports", "Admin IT", "Bilan périodique filtré (semaine/mois) avec graphiques et export PDF officiel prêt à imprimer."],
        ["CU11", "Suivre ses demandes", "Employé", "Visualisation par le collaborateur de l'état de ses signalements et de la date de résolution."],
        ["CU12", "Consulter son matériel", "Employé", "Accès à la liste des équipements affectés personnellement ou partagés avec le service."]
    ]
    create_styled_table(doc, cu_headers, cu_data, [Inches(0.8), Inches(2.2), Inches(1.3), Inches(2.2)])

    # ---------------- 6. MODÈLE DE DONNÉES ----------------
    add_heading_1(doc, "6. Modèle de Données & Architecture SQL")
    add_heading_2(doc, "6.1 Modèle Conceptuel des Données (MCD)")
    add_body_p(doc, "Le schéma ci-dessous structure les relations entre Services, Employés, Équipements, Affectations, Tickets et Interventions :")

    # Image du MCD
    img_mcd_path = os.path.join("extracted_images", "image1.png")
    if os.path.exists(img_mcd_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.add_picture(img_mcd_path, width=Inches(5.0))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_cap = p_cap.add_run("Figure 4 — Modèle Conceptuel des Données (MCD)")
        r_cap.font.italic = True
        r_cap.font.size = Pt(8.5)
        r_cap.font.color.rgb = RGBColor(100, 116, 139)

    add_heading_2(doc, "6.2 Dictionnaire des Tables Réelles (MySQL schema.sql)")
    add_body_p(doc, "Le modèle logique est implémenté dans MySQL via 8 tables normalisées en 3FN :")

    db_headers = ["Table", "Attribut Clé", "Type SQL", "Contrainte", "Fonction Opérationnelle"]
    db_data = [
        ["utilisateurs", "email / password_hash", "VARCHAR / VARCHAR", "UNIQUE / NOT NULL", "Authentification avec hash bcrypt et gestion des rôles."],
        ["services", "nom / archive", "VARCHAR(120) / TINYINT", "UNIQUE / NOT NULL", "Directions de Touba Gaz (ex. Comptabilité, DG)."],
        ["employes", "nom, prenom, user_id", "VARCHAR, VARCHAR(36)", "FK -> utilisateurs", "Collaborateurs rattachés à un service et un compte."],
        ["equipements", "code, type, etat, photo", "INT, VARCHAR, ENUM", "AUTO_INC, ENUM", "Parc : en_service, en_panne, en_maintenance, hors_service."],
        ["affectations", "equipement_id, date_fin", "VARCHAR(36), DATE", "FK, NULL", "Traçabilité des dotations (date_fin NULL = affectation active)."],
        ["tickets", "numero, statut, priorite", "INT, ENUM, ENUM", "AUTO_INC, ENUM", "Suivi des incidents : nouveau, en_cours, resolu, cloture."],
        ["interventions", "ticket_id, debut, fin", "VARCHAR(36), DATETIME", "FK UNIQUE (RG07)", "Action technique unique liée au ticket et calcul de durée."],
        ["ticket_attachments", "ticket_id, storage_key", "VARCHAR(36), VARCHAR", "FK -> tickets", "Pièces jointes et captures d'écran des pannes."]
    ]
    create_styled_table(doc, db_headers, db_data, [Inches(1.5), Inches(1.8), Inches(1.4), Inches(1.2), Inches(2.2)])

    # ---------------- 7. TABLEAU DE BORD ET RAPPORTS ----------------
    add_heading_1(doc, "7. Tableau de Bord et Restitution des Données")
    add_body_p(doc, "L'application produit des indicateurs fiables, calculés directement depuis la base MySQL, sans aucune valeur statique :")
    
    kpi_items = [
        ("Disponibilité du parc : ", "Pourcentage d'équipements en état 'en_service' par rapport au total actif."),
        ("File d'attente d'assistance : ", "Comptage direct des tickets 'Nouveaux', 'En cours' et 'En attente'."),
        ("Suivi des pannes critiques : ", "Mise en avant immédiate des matériels immobilisants pour l'activité."),
        ("Rapports périodiques & Export PDF : ", "Bilan complet hebdomadaire et mensuel généré à la volée via la fonction professionnelle generateProfessionalPDF, incluant les graphiques de répartition, les durées totales d'arrêt et le détail des interventions.")
    ]
    for b_pre, b_txt in kpi_items:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        r1 = p.add_run(b_pre)
        r1.font.bold = True
        r1.font.name = "Arial"
        r1.font.size = Pt(9.5)
        r2 = p.add_run(b_txt)
        r2.font.name = "Arial"
        r2.font.size = Pt(9.5)

    # ---------------- 8. SÉCURITÉ ET SAUVEGARDE ----------------
    add_heading_1(doc, "8. Sécurité et Exploitation des Sauvegardes")
    add_body_p(doc, "Conformément aux exigences d'un environnement professionnel, la sécurité et la pérennité des données de Touba Gaz sont assurées par des mécanismes robustes :", bold_prefix="Dispositif opérationnel : ")
    
    sec_headers = ["Composant", "Technologie Déployée", "Garantie Apportée"]
    sec_data = [
        ["Sessions", "Cookie httpOnly signé HMAC-SHA256", "Protection contre les attaques XSS et le vol de session."],
        ["Mots de passe", "Hachage sécurisé bcrypt", "Stockage non réversible des identifiants."],
        ["Base de données", "Requêtes préparées mysql2", "Protection totale contre les injections SQL."],
        ["Sauvegarde quotidienne", "Script PowerShell backup-db.ps1", "Dump logique MySQL automatique chaque soir avec rétention de 30 jours."],
        ["Plan de Reprise (DRP)", "Script PowerShell restore-db.ps1", "Restauration d'urgence testée et validée en moins d'une minute."]
    ]
    create_styled_table(doc, sec_headers, sec_data, [Inches(1.5), Inches(2.2), Inches(2.8)])

    # ---------------- 9. TESTS DE RECETTE ----------------
    add_heading_1(doc, "9. Cahier de Recette de Validation (8 Scénarios Clés)")
    add_body_p(doc, "Ces 8 scénarios d'intégration démontrent le respect rigoureux des critères d'évaluation du stage :")

    test_headers = ["N°", "Scénario Validé", "Action Exécutée", "Résultat Obtenu & Vérification", "Statut"]
    test_data = [
        ["T1", "Authentification", "Connexion admin puis tentative avec mot de passe faux.", "Accès validé vers Dashboard ; refus générique sans fuite d'info.", "OK"],
        ["T2", "Contrôle des rôles", "Compte employé tentant d'accéder à /dashboard/services.", "Blocage serveur immédiat et redirection vers l'espace collaborateur.", "OK"],
        ["T3", "Création équipement", "Saisie d'un équipement avec un numéro de série doublon.", "Rejet immédiat par la contrainte d'unicité avec message explicite.", "OK"],
        ["T4", "Historique affectation", "Attribution d'un matériel puis réattribution à un employé.", "L'ancienne affectation reçoit sa date_fin ; l'historique est conservé.", "OK"],
        ["T5", "Cycle complet ticket", "Déclaration, prise en charge, saisie d'intervention, clôture.", "Enchaînement complet des statuts et horodatages ; ticket verrouillé.", "OK"],
        ["T6", "Unicité intervention", "Tentative d'ajouter une seconde intervention sur le même ticket.", "Refus applicatif (RG07) et invitation à modifier l'intervention existante.", "OK"],
        ["T7", "Mise à jour KPIs", "Clôture d'un incident et contrôle immédiat du dashboard.", "Décrémentation instantanée des tickets en attente sur l'interface.", "OK"],
        ["T8", "Sauvegarde & DRP", "Exécution de backup-db.ps1 puis restauration par restore-db.ps1.", "Restauration intégrale des données sans altération.", "OK"]
    ]
    create_styled_table(doc, test_headers, test_data, [Inches(0.5), Inches(1.5), Inches(2.1), Inches(2.0), Inches(0.6)])

    # ---------------- 10. FICHE D'ARBITRAGE TUTEUR ----------------
    add_heading_1(doc, "10. Fiche d'Arbitrage pour le Tuteur (Entretien 15 min)")
    add_body_p(doc, "Support de cadrage à soumettre à M. Paul Ismaël FLAN pour figer les orientations de la Semaine 3 :")

    arb_headers = ["Point d'Arbitrage", "Proposition Retenue (Recommandée)", "Validation Tuteur"]
    arb_data = [
        [
            "1. Format des Rapports",
            "Génération d'une vue d'impression web épurée et export PDF officiel avec graphiques. L'export Word (.docx) est abandonné pour sécuriser les délais.",
            "[   ] Validé\n[   ] À modifier"
        ],
        [
            "2. Règle d'Intervention",
            "Règle 1 ticket = 1 intervention technique majeure. En cas de second problème distinct, ouverture d'un nouveau ticket pour garantir la traçabilité.",
            "[   ] Validé\n[   ] À modifier"
        ],
        [
            "3. Gestion du Stock",
            "Un équipement actif non affecté est considéré 'En stock' dans l'inventaire, sans alourdir les énumérations physiques de panne.",
            "[   ] Validé\n[   ] À modifier"
        ],
        [
            "4. Services Pilotes (S3)",
            "Choix des 2 directions pour la saisie des matériels réels en semaine 3 (ex. Informatique & Comptabilité).",
            "Services choisis :\n.............................."
        ]
    ]
    create_styled_table(doc, arb_headers, arb_data, [Inches(1.8), Inches(3.2), Inches(1.5)])

    output_path = os.path.abspath("Analyse_des_besoins_v2_condensee.docx")
    doc.save(output_path)
    print(f"Document Word généré avec succès : {output_path}")

if __name__ == "__main__":
    build_document()
