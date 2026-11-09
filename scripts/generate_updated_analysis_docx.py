# -*- coding: utf-8 -*-
"""
Générateur du document d'Analyse des Besoins mis à jour - Version 2.0
Touba Gaz SA - Parc Informatique et Demandes d'Assistance
Auteur : Seynabou Gniop | Tuteur : Paul Ismaël Flan
Date : 9 novembre 2026
"""

import os
import sys
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, color_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_header_styled(doc, text, level):
    h = doc.add_heading(text, level=level)
    h.paragraph_format.keep_with_next = True
    for run in h.runs:
        run.font.name = "Arial"
        if level == 1:
            run.font.size = Pt(14)
            run.font.bold = True
            run.font.color.rgb = RGBColor(30, 58, 138) # Bleu Touba Gaz
            h.paragraph_format.space_before = Pt(16)
            h.paragraph_format.space_after = Pt(6)
        elif level == 2:
            run.font.size = Pt(12)
            run.font.bold = True
            run.font.color.rgb = RGBColor(22, 101, 52) # Vert émeraude
            h.paragraph_format.space_before = Pt(12)
            h.paragraph_format.space_after = Pt(4)
        elif level == 3:
            run.font.size = Pt(10.5)
            run.font.bold = True
            run.font.color.rgb = RGBColor(71, 85, 105) # Slate
            h.paragraph_format.space_before = Pt(8)
            h.paragraph_format.space_after = Pt(2)
    return h

def add_p(doc, text, bold_prefix="", italic=False, space_after=4):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_bold = p.add_run(bold_prefix)
        r_bold.font.name = "Calibri"
        r_bold.font.size = Pt(10)
        r_bold.font.bold = True
        r_bold.font.color.rgb = RGBColor(15, 23, 42)
    r_text = p.add_run(text)
    r_text.font.name = "Calibri"
    r_text.font.size = Pt(10)
    r_text.font.italic = italic
    r_text.font.color.rgb = RGBColor(30, 41, 59)
    return p

def add_callout(doc, text, title=""):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    cell = tbl.rows[0].cells[0]
    cell.width = Inches(6.5)
    set_cell_background(cell, "F0FDF4") # Vert très clair
    set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
    
    # Bordure gauche épaisse verte
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="none"/>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="16A34A"/>
            <w:bottom w:val="none"/>
            <w:right w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    if title:
        r_title = p.add_run(title + "\n")
        r_title.font.name = "Calibri"
        r_title.font.size = Pt(9.5)
        r_title.font.bold = True
        r_title.font.color.rgb = RGBColor(21, 128, 61)
    r_text = p.add_run(text)
    r_text.font.name = "Calibri"
    r_text.font.size = Pt(9.5)
    r_text.font.italic = True
    r_text.font.color.rgb = RGBColor(20, 83, 45)
    
    # Espace après la boîte
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_after = Pt(6)

def add_styled_table(doc, headers, data, col_widths=None):
    table = doc.add_table(rows=len(data) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    # Header
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], "1E3A8A") # Bleu nuit
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=120, right=120)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.name = "Arial"
            run.font.bold = True
            run.font.color.rgb = RGBColor(255, 255, 255)
            run.font.size = Pt(9)

    # Data rows
    for r_idx, row in enumerate(data):
        row_cells = table.rows[r_idx + 1].cells
        bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row):
            row_cells[c_idx].text = str(val)
            set_cell_background(row_cells[c_idx], bg_color)
            set_cell_margins(row_cells[c_idx], top=70, bottom=70, left=100, right=100)
            p = row_cells[c_idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.name = "Calibri"
                run.font.size = Pt(8.5)
                run.font.color.rgb = RGBColor(15, 23, 42)

    # Set column widths if provided
    if col_widths and len(col_widths) == len(headers):
        for row in table.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = Inches(width)

    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_after = Pt(6)
    return table

def build_full_document(output_path):
    doc = Document()

    # Définir les marges de la page A4 (2 cm)
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Titre principal
    p_title_pre = doc.add_paragraph()
    p_title_pre.paragraph_format.space_after = Pt(2)
    r_sub = p_title_pre.add_run("TOUBA GAZ SA · SERVICE INFORMATIQUE")
    r_sub.font.name = "Arial"
    r_sub.font.bold = True
    r_sub.font.size = Pt(11)
    r_sub.font.color.rgb = RGBColor(22, 101, 52) # Vert émeraude Touba Gaz

    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_after = Pt(2)
    r_main = p_title.add_run("Analyse des Besoins & Spécifications Logicielles")
    r_main.font.name = "Arial"
    r_main.font.bold = True
    r_main.font.size = Pt(18)
    r_main.font.color.rgb = RGBColor(30, 58, 138) # Bleu Touba Gaz

    p_subtitle = doc.add_paragraph()
    p_subtitle.paragraph_format.space_after = Pt(12)
    r_desc = p_subtitle.add_run("Application intégrée de gestion du parc informatique et de suivi des demandes d'assistance IT")
    r_desc.font.name = "Calibri"
    r_desc.font.size = Pt(12)
    r_desc.font.italic = True
    r_desc.font.color.rgb = RGBColor(100, 116, 139)

    # Métadonnées
    meta_headers = ["Paramètre", "Valeur de référence"]
    meta_data = [
        ["Entreprise", "Touba Gaz SA (Dakar, Sénégal)"],
        ["Stagiaire & Développeuse", "Seynabou Gniop"],
        ["Tuteur de stage", "Paul Ismael Flan"],
        ["Version du document", "2.0 (Audit & Alignement complet avec la plateforme)"],
        ["Date d'actualisation", "9 novembre 2026"],
        ["Statut", "Validé conforme code source et schéma MySQL v2.0"],
    ]
    add_styled_table(doc, meta_headers, meta_data, [2.2, 4.3])

    # 1. Contexte et objectifs
    add_header_styled(doc, "1. Contexte et objectifs", level=1)
    add_p(doc, "Le service informatique de Touba Gaz assure la gouvernance et le maintien en condition opérationnelle du parc matériel et réseau (postes de travail, serveurs, switches, imprimantes réseau, liaisons Ethernet). Il intervient lorsqu'un employé rencontre un incident technique, une panne ou un besoin d'assistance.")
    add_p(doc, "Jusqu'alors, les pannes étaient signalées de façon hétérogène (appels téléphoniques, e-mails, visites physiques au bureau IT) et consignées manuellement dans un fichier Excel mensuel compartimenté en semaines. Ce mode de fonctionnement entraînait des pertes de traçabilité, des saisies redondantes et l'impossibilité d'évaluer fidèlement la fiabilité du parc.")
    add_p(doc, "Objectifs stratégiques de l'application :", bold_prefix="• ")
    add_p(doc, "Centraliser les équipements, leurs affectations (individuelles ou par service), les incidents et les interventions dans une base de données MySQL unique et intègre.", bold_prefix="1. ")
    add_p(doc, "Tracer chaque incident du signalement à la clôture, en associant automatiquement le calcul de criticité, les photos de diagnostic et l'intervention technique unique réalisée.", bold_prefix="2. ")
    add_p(doc, "Offrir un Espace Collaborateur dédié aux employés pour consulter leurs équipements affectés et déclarer/suivre leurs tickets en toute autonomie.", bold_prefix="3. ")
    add_p(doc, "Rapporter l'activité en temps réel via un tableau de bord dynamique et un générateur de rapports professionnels (exportables en PDF et Word avec indicateurs fiables).", bold_prefix="4. ")
    add_p(doc, "Sécuriser les données selon les rôles stricts (Administrateur IT vs Employé) et garantir la pérennité du système par une politique de sauvegarde documentée.", bold_prefix="5. ")

    # 3. Analyse de la situation actuelle
    add_header_styled(doc, "3. Analyse de la situation actuelle", level=1)
    add_header_styled(doc, "3.1 Fonctionnement actuel", level=2)
    add_p(doc, "Le support utilisateur repose historiquement sur des canaux informels. Les interventions sont ressaisies dans un classeur Excel mensuel comportant 4 à 5 onglets hebdomadaires et une feuille récapitulative. Le classeur calcule des indicateurs (durée cumulée, nombre d'interventions, temps d'arrêt). Les équipements les plus sollicités sont les imprimantes réseau, les switches, les câbles RJ45, les postes de travail et les onduleurs.")
    
    add_header_styled(doc, "3.2 Limites constatées", level=2)
    limites_headers = ["Limite constatée", "État", "Conséquence opérationnelle"]
    limites_data = [
        ["Dispersion multi-canale (téléphone, mail, bureau)", "Avéré", "Aucune vue unifiée des demandes, risque de tickets oubliés ou traités en double."],
        ["Absence d'historique centralisé par équipement", "Avéré", "Impossibilité d'identifier les pannes matérielles récurrentes et les coûts de maintenance."],
        ["Recherche manuelle fastidieuse dans les archives Excel", "Avéré", "Perte de temps considérable lors de l'établissement des bilans mensuels."],
        ["Absence de traçabilité des photos de pannes", "Avéré", "Difficulté pour l'équipe IT de pré-diagnostiquer les pannes matérielles à distance."],
    ]
    add_styled_table(doc, limites_headers, limites_data, [2.2, 1.0, 3.3])

    add_header_styled(doc, "3.3 Qualité des données du fichier de suivi", level=2)
    add_p(doc, "L'audit du fichier d'octobre 2026 a révélé des anomalies structurelles que la nouvelle plateforme élimine grâce à des contraintes relationnelles strictes : dates incohérentes chevauchant d'autres mois, libellés de catégories non standardisés ('Support utilisateur' vs 'support utilisateur'), heures de fin antérieures à l'heure de début, et chiffres de référence codés en dur dans des cellules non recalculées.")

    add_header_styled(doc, "3.4 Améliorations apportées par la plateforme", level=2)
    add_p(doc, "La plateforme Touba Gaz IT garantit l'enregistrement instantané de chaque incident, le calcul intelligent de sa priorité, le rattachement de photos justificatives, la traçabilité des actions techniques et la génération instantanée des rapports d'audit.")

    # 4. Utilisateurs et rôles
    add_header_styled(doc, "4. Utilisateurs et rôles", level=1)
    roles_headers = ["Rôle applicatif", "Périmètre fonctionnel et habilitations"]
    roles_data = [
        ["Administrateur IT (Équipe informatique)", "Accès complet : Gestion intégrale du parc (équipements, photos), employés, services (archivage/désarchivage), affectations, tickets, interventions uniques, centre de notifications interactif, tableau de bord en temps réel et exports de rapports (PDF & Word)."],
        ["Employé (Collaborateur Touba Gaz)", "Accès restreint à l'Espace Collaborateur : consultation des équipements personnels et partagés avec son service, création de tickets d'assistance avec pièces jointes (photos), suivi de l'état de ses propres demandes. Aucun accès d'administration."],
    ]
    add_styled_table(doc, roles_headers, roles_data, [2.2, 4.3])
    add_callout(doc, "Signalement pour compte de tiers : L'administrateur IT peut créer un ticket au nom d'un collaborateur ayant signalé sa panne par téléphone ou de passage au bureau IT. L'employé doit simplement exister dans le répertoire des employés Touba Gaz ; la possession préalable d'un compte applicatif actif n'est pas requise.", "DIRECTIVE DE SAISIE ADMIN")

    # 5. Périmètre et besoins fonctionnels
    add_header_styled(doc, "5. Périmètre et besoins fonctionnels", level=1)
    add_header_styled(doc, "5.1 Liste des besoins fonctionnels", level=2)
    besoins_headers = ["Réf.", "Besoin métier", "Fonctionnalités implémentées dans la plateforme", "Priorité"]
    besoins_data = [
        ["B1", "Gestion du parc d'équipements", "Inventaire complet, recherche multi-critères, suivi par code lisible (EQ-xxxx), statut physique (en_service, en_panne, en_maintenance, hors_service), localisation, date d'achat, téléversement de photos avec contrôle binaire (5 Mo max), archivage logique.", "Indispensable"],
        ["B2", "Gestion des services & archivage", "Création, modification, archivage logique d'un service (masqué des listes de saisie), consultation détaillée des services archivés (avec employés et matériels rattachés) et réactivation (désarchivage).", "Indispensable"],
        ["B3", "Gestion des employés & comptes", "Gestion du personnel, rattachement à un service, création optionnelle de compte applicatif avec mot de passe haché bcrypt, activation/désactivation.", "Indispensable"],
        ["B4", "Gestion des affectations", "Affectation exclusive à un employé OU à un service (jamais les deux). Clôture automatique de l'ancienne affectation lors d'une réaffectation sous transaction SQL. Suivi du stock (matériel sans affectation active).", "Indispensable"],
        ["B5", "Demandes d'assistance (Tickets)", "Déclaration multi-canale (Application, Téléphone, E-mail, Présentiel), référence lisible (DA-xxxxx), calcul automatisé de priorité avec motif explicatif, association de pièces jointes/photos de diagnostic (jusqu'à 5 photos par ticket).", "Indispensable"],
        ["B6", "Interventions de maintenance", "Rattachement d'au plus une intervention technique par ticket (règle D1 / RG10), saisie des dates/heures de début et fin, calcul automatique de la durée, diagnostic, actions menées et résultat.", "Indispensable"],
        ["B7", "Tableau de bord dynamique", "Indicateurs en temps réel (total équipements, parc en service/panne/maintenance/hors service, tickets par statut, affectations actives, employés, services). Accès direct filtré en un clic.", "Indispensable"],
        ["B8", "Centre de notifications IT", "Table dédiée notifications, cloche d'alertes dans la barre supérieure avec badge des non-lues, marquage individuel ou global comme lu. Réservé aux administrateurs IT (RG22).", "Important"],
        ["B9", "Rapports & Exports d'activité", "Filtres multi-critères, KPI officiels (taux de résolution, durée cumulée), graphiques d'évolution, export officiel PDF professionnel (jsPDF-autotable) et export Word (.doc) stylisé.", "Important"],
        ["B10", "Espace Collaborateur sécurisé", "Vue dédiée pour l'employé connecté : ses équipements affectés (personnels et de service), ses tickets avec historique et pièces jointes, création rapide de ticket.", "Indispensable"],
        ["B11", "Sécurité & Traçabilité", "Session HTTP-Only signée, vérification stricte des rôles côté serveur, table journal_audit pour la traçabilité des actions sensibles, requêtes préparées anti-injection SQL.", "Indispensable"],
        ["B12", "Sauvegarde & Restauration", "Scripts PowerShell (backup-db.ps1, restore-db.ps1), automatisation documentée et procédure de test de restauration trimestrielle.", "Indispensable"],
    ]
    add_styled_table(doc, besoins_headers, besoins_data, [0.6, 1.8, 3.4, 0.7])

    add_header_styled(doc, "5.2 Périmètre inclus et exclus", level=2)
    add_p(doc, "Inclus dans la version 2.0 : Gestion complète du parc avec photos (5 Mo), gestion des services avec archivage réversible, gestion des affectations transactionnelles, tickets avec pièces jointes et moteur d'inférence de priorité, interventions uniques intégrées au traitement du ticket, centre de notifications pour administrateurs IT, Espace Collaborateur cloisonné, tableau de bord temps réel, rapports exportables en PDF et Word avec graphiques, interface responsive (PC, tablette, smartphone), sauvegarde documentée.")
    add_p(doc, "Exclus : Supervision réseau SNMP en temps réel, cartographie physique des ports de switchs, gestion financière des amortissements comptables, notifications par SMS/WhatsApp.")

    add_header_styled(doc, "5.3 Gestion des incidents & Pièces jointes", level=2)
    add_p(doc, "Chaque ticket est identifié de façon unique par un UUID interne et un numéro séquentiel incrémental lisible (ex: DA-00012). Il enregistre le canal de réception, le demandeur, le service, la description, la catégorie et l'équipement cible. Nouveauté majeure v2.0 : Les déclarants peuvent joindre jusqu'à 5 photos (formats JPEG, PNG, WebP) qui sont validées au niveau binaire côté serveur et stockées de façon sécurisée (table ticket_attachments).")

    add_header_styled(doc, "5.4 Moteur de calcul automatique de la priorité ITSM", level=2)
    add_p(doc, "Conformément à l'implémentation src/lib/priority.ts, la priorité n'est pas laissée au hasard de la saisie utilisateur mais déterminée par un moteur de règles intelligent :")
    add_p(doc, "Priorité Critique : Équipements d'infrastructure centrale (Serveur, Switch, Routeur, Firewall, Onduleur) ou détection de termes d'urgence bloquante ('panne générale', 'arrêt complet', 'bloquant', 'court-circuit', 'fumée').", bold_prefix="• ")
    add_p(doc, "Priorité Haute : Pannes aiguës individuelles ('ne démarre plus', 'écran noir', 'crash', 'perte de données', 'virus') ou incidents réseau.", bold_prefix="• ")
    add_p(doc, "Priorité Normale : Incidents bureautiques standards ou gestion d'accès.", bold_prefix="• ")
    add_p(doc, "Priorité Basse : Demandes de renseignements, devis ou accessoires d'appoint.", bold_prefix="• ")
    add_p(doc, "Le système enregistre conjointement la priorité et son explication transparente (priorite_explication). L'administrateur IT conserve la faculté d'ajuster manuellement la priorité.")

    add_header_styled(doc, "5.5 Gestion des interventions & Traitement unifié", level=2)
    add_p(doc, "Conformément à la règle D1 (RG10), un ticket est associé à au plus une intervention technique (clé d'unicité idx_interventions_ticket sur ticket_id). L'intervention consigne les dates et heures de début et fin, la durée calculée en minutes (TIMESTAMPDIFF), les actions menées, le technicien intervenant et le résultat obtenu. Dans l'interface, la fenêtre de traitement permet de renseigner l'intervention et de passer le ticket à 'Résolu' ou 'Clôturé' en une seule opération fluide.")

    add_header_styled(doc, "5.6 Restitution, Tableau de bord et Rapports", level=2)
    add_p(doc, "Le tableau de bord synthétise les métriques clés de l'infrastructure avec liens directs filtrés. Le générateur de rapports (src/app/dashboard/rapports) offre un filtrage multi-axes et calcule le taux de résolution global (% tickets résolus ou clôturés), le volume d'interventions et le cumul d'heures. Deux exports sont opérationnels :")
    add_p(doc, "Export PDF Officiel : Génération vectorielle propre (jsPDF + jspdf-autotable) avec logos Touba Gaz, tableaux d'interventions et métriques KPI.", bold_prefix="1. ")
    add_p(doc, "Export Word (.doc) : Génération instantanée d'un document Word mis en forme avec tableaux stylisés et charte graphique Touba Gaz.", bold_prefix="2. ")

    # 6. Besoins non fonctionnels
    add_header_styled(doc, "6. Besoins non fonctionnels & Stack technique", level=1)
    bnf_headers = ["Domaine", "Exigence technique implémentée"]
    bnf_data = [
        ["Technologies retenues", "Next.js 16.4.3 (App Router avec mode --webpack), React 19.3.0, TypeScript 5, Tailwind CSS 4, shadcn/ui. Base de données MySQL 8.x avec pool mysql2."],
        ["Sécurité applicative", "Authentification par cookie HTTP-Only signé (touba_gaz_session), hachage des mots de passe bcrypt (10 rounds), requêtes paramétrées préparées, validation Zod."],
        ["Fiabilité & Intégrité", "Contraintes relationnelles FOREIGN KEY ON DELETE RESTRICT / SET NULL, index d'unicité sur les numéros de série et matricules, transactions SQL pour les affectations."],
        ["Sécurité des téléversements", "Vérification des signatures binaires (magic bytes) pour JPEG, PNG et WebP, contrôle de dimensionnement, nommage UUID aléatoire, stockage sécurisé."],
        ["Performance & Responsive", "Interface réactive adaptée PC (sidebar permanente), tablette et smartphone (menu tactile et tiroirs), requêtes SQL optimisées avec index."],
        ["Sauvegarde", "Scripts PowerShell automatisés (backup-db.ps1, restore-db.ps1) assurant des dumps MySQL compressés horodatés avec rétention de 30 jours."],
    ]
    add_styled_table(doc, bnf_headers, bnf_data, [2.0, 4.5])

    # 7. Règles de gestion unifiées
    add_header_styled(doc, "7. Règles de gestion unifiées (RG01 à RG26)", level=1)
    rg_headers = ["Réf.", "Règle de gestion métier", "Domaine"]
    rg_data = [
        ["RG01", "L'accès à l'application nécessite une authentification active (session signée).", "Sécurité"],
        ["RG02", "Les privilèges sont vérifiés côté serveur à chaque route API et action métier.", "Sécurité"],
        ["RG03", "Chaque équipement possède un UUID unique et un code séquentiel lisible (EQ-xxxx). Le numéro de série est unique s'il est renseigné.", "Équipements"],
        ["RG04", "L'état physique d'un équipement est strictement restreint à : en_service, en_panne, en_maintenance, hors_service. Le fait d'être 'En stock' est une situation logistique caractérisée par l'absence d'affectation active, et ne constitue pas un état physique.", "Équipements"],
        ["RG05", "Un équipement ne peut avoir qu'une seule affectation active à un instant donné (date_fin IS NULL).", "Affectations"],
        ["RG06", "Tout changement d'affectation clôture l'ancienne affectation (date_fin renseignée) et en crée une nouvelle sous transaction SQL.", "Affectations"],
        ["RG07", "Une affectation concerne soit un employé, soit un service, jamais les deux simultanément.", "Affectations"],
        ["RG08", "Chaque incident donne lieu à un ticket identifié par un numéro unique (DA-xxxxx).", "Tickets"],
        ["RG09", "Un ticket est rattaché à un déclarant employé. L'admin peut enregistrer une demande au nom d'un tiers.", "Tickets"],
        ["RG10", "Un ticket possède au plus une intervention technique (règle D1). Cette intervention est unique et modifiable jusqu'à clôture.", "Interventions"],
        ["RG11", "Toute intervention est rattachée à un ticket. Le formulaire de traitement permet d'enregistrer l'intervention et de résoudre/clôturer le ticket simultanément.", "Interventions"],
        ["RG12", "Seul l'administrateur IT est habilité à saisir ou modifier une intervention technique.", "Interventions"],
        ["RG13", "Un employé ne consulte que ses propres tickets et équipements, y compris par l'API.", "Sécurité"],
        ["RG14", "Le cycle de vie d'un ticket respecte la machine d'états : nouveau -> en_cours -> en_attente -> resolu -> cloture.", "Tickets"],
        ["RG15", "La résolution (action technique finie) est distincte de la clôture (validation finale du rétablissement).", "Tickets"],
        ["RG16", "Les dates de résolution et clôture sont automatiquement horodatées lors du changement de statut.", "Tickets"],
        ["RG17", "La date et heure de fin d'une intervention ne peuvent pas être antérieures à la date de début.", "Interventions"],
        ["RG18", "Les équipements, services et historiques ne sont jamais détruits physiquement : l'archivage logique (archive=1) est appliqué.", "Traçabilité"],
        ["RG19", "Les indicateurs de rapports sont calculés directement à partir des données réelles enregistrées en base.", "Rapports"],
        ["RG20", "Un employé possède au plus un compte applicatif actif. Les mots de passe sont hachés en bcrypt.", "Sécurité"],
        ["RG21", "La base de données fait l'objet d'une sauvegarde planifiée et de tests réguliers de restauration.", "Sauvegarde"],
        ["RG22", "Le centre de notifications applicatif est réservé exclusivement aux administrateurs IT. Les employés suivent l'évolution depuis leur espace collaborateur.", "Notifications"],
        ["RG23", "Un service archivé disparaît des listes de saisie active mais demeure consultable dans l'onglet des archives avec tous ses liens, et peut être réactivé (désarchivé).", "Services"],
        ["RG24", "Les photos d'équipements sont facultatives, limitées à 5 Mo (JPEG, PNG, WebP) et vérifiées au niveau binaire.", "Équipements"],
        ["RG25", "Les photos jointes aux tickets (jusqu'à 5 par ticket) sont stockées de façon sécurisée et accessibles uniquement à l'admin et au demandeur concerné.", "Tickets"],
        ["RG26", "Les exports PDF et Word reprennent fidèlement les données, totaux et filtres appliqués à l'écran.", "Rapports"],
    ]
    add_styled_table(doc, rg_headers, rg_data, [0.6, 4.8, 1.1])

    # 8. Statuts et cycle de vie d'un ticket
    add_header_styled(doc, "8. Statuts et cycle de vie d'un ticket", level=1)
    statuts_headers = ["Statut en base", "Libellé interface", "Signification et implications opérationnelles"]
    statuts_data = [
        ["nouveau", "Nouveau", "Ticket créé par l'employé ou l'admin, en attente de prise en charge par l'équipe IT."],
        ["en_cours", "En cours", "Prise en charge validée par l'administrateur IT ; diagnostic ou intervention en cours."],
        ["en_attente", "En attente", "Traitement momentanément suspendu (attente d'une pièce de rechange, retour utilisateur, etc.)."],
        ["resolu", "Résolu", "Intervention technique réalisée avec succès ; date_resolution horodatée. Rétablissement à confirmer."],
        ["cloture", "Clôturé", "Validation finale confirmée par l'administrateur IT ; date_cloture horodatée. Ticket figé."],
    ]
    add_styled_table(doc, statuts_headers, statuts_data, [1.2, 1.3, 4.0])

    transitions_headers = ["Statut initial", "Statut cible", "Acteur", "Condition de déclenchement"]
    transitions_data = [
        ["nouveau", "en_cours", "Admin IT", "Prise en charge opérationnelle."],
        ["en_cours", "en_attente", "Admin IT", "Suspension avec motif (attente pièce ou réponse demandeur)."],
        ["en_attente", "en_cours", "Admin IT", "Reprise des opérations de maintenance."],
        ["en_cours", "resolu", "Admin IT", "Intervention technique complétée et renseignée."],
        ["resolu", "cloture", "Admin IT", "Rétablissement du service validé."],
        ["resolu", "en_cours", "Admin IT", "Réouverture en cas de dysfonctionnement persistant."],
        ["nouveau", "cloture", "Admin IT", "Intervention immédiate enregistrée et clôturée directement."],
    ]
    add_styled_table(doc, transitions_headers, transitions_data, [1.2, 1.2, 1.1, 3.0])

    # 9. Cas d'utilisation
    add_header_styled(doc, "9. Cas d'utilisation métier", level=1)
    cu_headers = ["Réf.", "Cas d'utilisation", "Acteurs concernés", "Besoin associé"]
    cu_data = [
        ["CU01", "S'authentifier", "Admin IT, Employé", "B11"],
        ["CU02", "Gérer les équipements (inventaire, photos, archivage)", "Admin IT", "B1"],
        ["CU03", "Gérer les services et l'archivage réversible", "Admin IT", "B2"],
        ["CU04", "Gérer les employés et les comptes d'accès", "Admin IT", "B3"],
        ["CU05", "Gérer les affectations et le stock", "Admin IT", "B4"],
        ["CU06", "Enregistrer un ticket d'assistance pour un tiers", "Admin IT", "B5"],
        ["CU07", "Traiter un ticket et enregistrer l'intervention unique", "Admin IT", "B6"],
        ["CU08", "Consulter le tableau de bord et les indicateurs", "Admin IT", "B7"],
        ["CU09", "Consulter et acquitter les notifications", "Admin IT", "B8"],
        ["CU10", "Générer et exporter les rapports (PDF & Word)", "Admin IT", "B9"],
        ["CU11", "Consulter son espace collaborateur et son matériel", "Employé", "B10"],
        ["CU12", "Déclarer un incident avec photos", "Employé", "B5, B10"],
        ["CU13", "Suivre l'avancement de ses tickets", "Employé", "B5, B10"],
    ]
    add_styled_table(doc, cu_headers, cu_data, [0.7, 3.6, 1.4, 0.8])

    # Insertion Diagramme CU
    img_cu = os.path.join("c:/Users/hp/Desktop/Touba Gaz/parc_info_touba_gaz/extracted_images", "image2.png")
    if os.path.exists(img_cu):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_after = Pt(4)
        run_img = p_img.add_run()
        run_img.add_picture(img_cu, width=Inches(4.5))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(8)
        r_cap = p_cap.add_run("Figure 1 — Diagramme général des cas d'utilisation (Touba Gaz IT)")
        r_cap.font.name = "Calibri"
        r_cap.font.size = Pt(8.5)
        r_cap.font.italic = True

    # 10. Diagrammes de comportement
    add_header_styled(doc, "10. Diagrammes de comportement", level=1)
    add_header_styled(doc, "10.1 Diagramme de séquence métier", level=2)
    add_p(doc, "Le diagramme ci-après retrace le flux opérationnel complet : connexion de l'utilisateur, déclaration de l'incident avec photos, alerte de l'administrateur IT, prise en charge, enregistrement de l'intervention technique unique et clôture après rétablissement.")
    
    img_seq = os.path.join("c:/Users/hp/Desktop/Touba Gaz/parc_info_touba_gaz/extracted_images", "image4.png")
    if os.path.exists(img_seq):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_after = Pt(4)
        run_img = p_img.add_run()
        run_img.add_picture(img_seq, width=Inches(4.2))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(8)
        r_cap = p_cap.add_run("Figure 2 — Diagramme de séquence : Traitement d'un ticket et intervention unique")
        r_cap.font.name = "Calibri"
        r_cap.font.size = Pt(8.5)
        r_cap.font.italic = True

    add_header_styled(doc, "10.2 Diagramme d'activité / cycle de vie", level=2)
    img_act = os.path.join("c:/Users/hp/Desktop/Touba Gaz/parc_info_touba_gaz/extracted_images", "image3.png")
    if os.path.exists(img_act):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_after = Pt(4)
        run_img = p_img.add_run()
        run_img.add_picture(img_act, width=Inches(3.2))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(8)
        r_cap = p_cap.add_run("Figure 3 — Diagramme d'activité : Cycle de résolution et clôture d'incident")
        r_cap.font.name = "Calibri"
        r_cap.font.size = Pt(8.5)
        r_cap.font.italic = True

    # 11. Modèle de données & Schéma réel
    add_header_styled(doc, "11. Modèle de données & Schéma relationnel réel", level=1)
    add_p(doc, "L'architecture des données repose sur MySQL 8.x InnoDB (jeu de caractères utf8mb4_unicode_ci). Toutes les tables utilisent des identifiants universels VARCHAR(36) générés par le serveur applicatif, complétés par des codes numériques auto-incrémentés pour les références métier.")
    
    img_mcd = os.path.join("c:/Users/hp/Desktop/Touba Gaz/parc_info_touba_gaz/extracted_images", "image1.png")
    if os.path.exists(img_mcd):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_after = Pt(4)
        run_img = p_img.add_run()
        run_img.add_picture(img_mcd, width=Inches(4.8))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(8)
        r_cap = p_cap.add_run("Figure 4 — Modèle Conceptuel et Logique des Données (Touba Gaz IT v2.0)")
        r_cap.font.name = "Calibri"
        r_cap.font.size = Pt(8.5)
        r_cap.font.italic = True

    add_header_styled(doc, "11.1 Dictionnaire des tables physiques réelles (schema.sql & migrations)", level=2)
    dict_headers = ["Table physique", "Attributs & Types", "Contraintes & Clés", "Rôle métier"]
    dict_data = [
        ["utilisateurs", "id VARCHAR(36) PK, email VARCHAR(191), password_hash VARCHAR(255), nom VARCHAR(100), prenom VARCHAR(100), role ENUM('admin','employe'), actif TINYINT(1)", "UNIQUE(email)", "Comptes d'accès applicatifs. Mots de passe hachés bcrypt."],
        ["services", "id VARCHAR(36) PK, nom VARCHAR(120), description TEXT, archive TINYINT(1)", "UNIQUE(nom)", "Départements Touba Gaz. archive=1 masque le service des listes."],
        ["employes", "id VARCHAR(36) PK, nom VARCHAR(100), prenom VARCHAR(100), email VARCHAR(191), telephone VARCHAR(30), service_id VARCHAR(36) FK, actif TINYINT(1), user_id VARCHAR(36) FK UNIQUE", "FK -> services(id) ON DELETE RESTRICT, FK -> utilisateurs(id) ON DELETE SET NULL", "Répertoire du personnel. user_id relie facultativement à un compte."],
        ["equipements", "id VARCHAR(36) PK, code INT AUTO_INC UNIQUE, type VARCHAR(80), marque VARCHAR(100), modele VARCHAR(100), numero_serie VARCHAR(100) UNIQUE, date_achat DATE, etat ENUM('en_service','en_panne','en_maintenance','hors_service'), localisation VARCHAR(150), description TEXT, photo VARCHAR(255), archive TINYINT(1)", "UNIQUE(code), UNIQUE(numero_serie)", "Inventaire du parc informatique. code génère le matricule EQ-xxxx. photo stocke l'image."],
        ["affectations", "id VARCHAR(36) PK, equipement_id VARCHAR(36) FK, employe_id VARCHAR(36) FK NULL, service_id VARCHAR(36) FK NULL, date_debut DATE, date_fin DATE NULL, commentaire TEXT, auteur_id VARCHAR(36)", "FK -> equipements, FK -> employes, FK -> services. Règle CT07 : soit employe_id soit service_id.", "Traçabilité des attributions. date_fin IS NULL indique l'affectation active."],
        ["tickets", "id VARCHAR(36) PK, numero INT AUTO_INC UNIQUE, demandeur_id VARCHAR(36) FK, service_id VARCHAR(36) FK NULL, description TEXT NULL, categorie VARCHAR(100), priorite ENUM('basse','normale','haute','critique'), priorite_explication VARCHAR(255), canal ENUM('application','telephone','email','presentiel'), equipement_id VARCHAR(36) FK NULL, statut ENUM('nouveau','en_cours','en_attente','resolu','cloture'), date_resolution DATETIME NULL, date_cloture DATETIME NULL, cree_par VARCHAR(36)", "UNIQUE(numero), FK -> employes, FK -> services, FK -> equipements", "Signalements d'incidents. numero génère DA-xxxxx. priorite calculée automatiquement."],
        ["ticket_attachments", "id VARCHAR(36) PK, ticket_id VARCHAR(36) FK, original_name VARCHAR(255), storage_key VARCHAR(255), mime_type VARCHAR(100), size_bytes INT UNSIGNED", "FK -> tickets(id) ON DELETE CASCADE, INDEX(ticket_id)", "Pièces jointes et photos associées aux tickets (5 Mo max par photo)."],
        ["interventions", "id VARCHAR(36) PK, ticket_id VARCHAR(36) FK UNIQUE, debut DATETIME, fin DATETIME, actions TEXT, resultat TEXT NULL, auteur_id VARCHAR(36)", "UNIQUE(ticket_id), FK -> tickets(id) ON DELETE RESTRICT", "Intervention technique unique (RG10). Durée calculée par TIMESTAMPDIFF."],
        ["notifications", "id VARCHAR(36) PK, user_id VARCHAR(36) FK, ticket_id VARCHAR(36) FK NULL, titre VARCHAR(150), message TEXT, type VARCHAR(50), lu TINYINT(1), created_at DATETIME", "INDEX(user_id)", "Centre d'alertes des administrateurs IT (RG22)."],
        ["journal_audit", "id BIGINT AUTO_INC PK, table_nom VARCHAR(100), enregistrement_id VARCHAR(64), action VARCHAR(50), details JSON, auteur_id VARCHAR(36), created_at DATETIME", "INDEX(table_nom), INDEX(created_at)", "Piste d'audit et traçabilité des opérations sensibles."],
    ]
    add_styled_table(doc, dict_headers, dict_data, [1.1, 2.5, 1.8, 1.1])

    # 12. Indicateurs et rapports
    add_header_styled(doc, "12. Indicateurs du tableau de bord et des rapports", level=1)
    kpi_headers = ["Indicateur", "Formule / Règle de calcul plateforme", "Usage et restitution"]
    kpi_data = [
        ["Total Équipements", "COUNT(*) FROM equipements WHERE archive = 0", "Tableau de bord & Inventaire."],
        ["Parc en service", "COUNT(*) WHERE etat = 'en_service' AND archive = 0", "KPI disponibilité du parc."],
        ["Parc en panne / maintenance", "COUNT(*) WHERE etat IN ('en_panne', 'en_maintenance') AND archive = 0", "Suivi des matériels indisponibles."],
        ["Matériel en stock", "COUNT(*) WHERE a.id IS NULL AND etat NOT IN ('hors_service') AND archive = 0", "Équipements immédiatement réaffectables."],
        ["Tickets ouverts", "COUNT(*) WHERE statut IN ('nouveau', 'en_cours', 'en_attente')", "Charge de travail active de l'équipe IT."],
        ["Taux de résolution global", "ROUND(((resolu + cloture) / totalIncidents) * 100, 1) %", "Rapports d'activité & exports PDF/Word."],
        ["Durée cumulée d'intervention", "SUM(TIMESTAMPDIFF(MINUTE, debut, fin)) converti en h et min", "Bilan hebdomadaire et mensuel."],
        ["Délai moyen de résolution", "AVG(date_resolution - created_at) sur la période filtrée", "Indicateur d'efficacité du support IT."],
    ]
    add_styled_table(doc, kpi_headers, kpi_data, [1.8, 2.7, 2.0])

    # 13. Sécurité et sauvegarde
    add_header_styled(doc, "13. Sécurité et exploitation des sauvegardes", level=1)
    add_p(doc, "La sécurité applicative repose sur le principe de défense en profondeur : session chiffrée, droits validés côté serveur avant chaque mutation, requêtes SQL préparées contre l'injection, validation Zod et vérification binaire des uploads.")
    add_p(doc, "Politique de sauvegarde :", bold_prefix="• ")
    add_p(doc, "Sauvegarde automatisée de la base via scripts/backup-db.ps1 (mysqldump avec utilisateur dédié et compression horodatée). Rétention sur 30 jours.", bold_prefix="1. ")
    add_p(doc, "Restauration vérifiée via scripts/restore-db.ps1, validée par un test périodique consigné dans le registre informatique.", bold_prefix="2. ")

    # 14. Cahier de tests et validation
    add_header_styled(doc, "14. Cahier de recette et tests de validation (T01 à T32)", level=1)
    tests_headers = ["N°", "Scénario de test", "Résultat attendu validé", "Statut plateforme"]
    tests_data = [
        ["T01", "Connexion identifiants valides (admin & employé)", "Session établie, redirection vers dashboard ou espace employé.", "Conforme"],
        ["T02", "Connexion avec mot de passe erroné", "Accès refusé, message d'erreur générique sécurisé.", "Conforme"],
        ["T03", "Tentative d'accès employé sur /dashboard ou route admin", "Blocage HTTP 403 Forbidden côté serveur.", "Conforme"],
        ["T04", "Création d'un équipement avec photo (JPEG/PNG/WebP)", "Enregistrement en base, photo stockée et affichée sur la fiche.", "Conforme"],
        ["T05", "Tentative d'upload d'un fichier corrompu ou > 5 Mo", "Rejet immédiat avec message explicite.", "Conforme"],
        ["T06", "Affectation d'un équipement à un employé", "Affectation active créée, date_debut horodatée.", "Conforme"],
        ["T07", "Réaffectation du même équipement à un autre employé", "Clôture automatique de l'ancienne affectation (date_fin) sous transaction.", "Conforme"],
        ["T08", "Tentative d'affectation simultanée à un employé et un service", "Refus immédiat par validation applicative et transactionnelle.", "Conforme"],
        ["T09", "Création de ticket par un employé avec photos jointes", "Ticket DA-xxxxx créé (statut Nouveau), photos enregistrées dans ticket_attachments.", "Conforme"],
        ["T10", "Calcul automatique de la priorité d'un ticket", "Priorité (Critique/Haute/Normale/Basse) et motif explicatif renseignés.", "Conforme"],
        ["T11", "Enregistrement d'un ticket pour un tiers par l'administrateur", "Ticket créé avec le bon employé demandeur et canal spécifié.", "Conforme"],
        ["T12", "Prise en charge d'un ticket (passage à En cours)", "Statut mis à jour, notification admin enregistrée.", "Conforme"],
        ["T13", "Enregistrement de l'intervention technique unique", "Intervention liée au ticket, durée calculée, statut Résolu.", "Conforme"],
        ["T14", "Tentative d'ajout d'une seconde intervention sur le même ticket", "Refusée (contrainte d'unicité UNIQUE sur ticket_id).", "Conforme"],
        ["T15", "Intervention avec heure de fin antérieure au début", "Refusée par contrôle de cohérence temporelle.", "Conforme"],
        ["T16", "Clôture du ticket après rétablissement", "Statut Clôturé, date_cloture horodatée.", "Conforme"],
        ["T17", "Consultation de l'Espace Collaborateur par un employé", "Seuls ses équipements affectés et ses propres tickets sont visibles.", "Conforme"],
        ["T18", "Archivage d'un service", "Service masqué des listes de saisie, conservé en base (archive=1).", "Conforme"],
        ["T19", "Consultation des services archivés et désarchivage", "Détail consultable avec employés et équipements, réactivation réussie.", "Conforme"],
        ["T20", "Centre de notifications admin", "Cloche active, compteur des non-lues mis à jour, marquage lu fonctionnel.", "Conforme"],
        ["T21", "Absence de notifications pour les comptes employés", "Conformité stricte avec RG22, aucun accès employé au centre.", "Conforme"],
        ["T22", "Filtrage des rapports par date, service et équipement", "Calcul dynamique des KPI et graphiques correspondants.", "Conforme"],
        ["T23", "Génération de l'export officiel PDF", "Téléchargement d'un PDF professionnel vectoriel stylisé.", "Conforme"],
        ["T24", "Génération de l'export Word (.doc)", "Téléchargement d'un document Word structuré avec tableaux et styles.", "Conforme"],
        ["T25", "Sauvegarde et restauration de la base de données", "Dumps MySQL générés et restaurables sans perte de structure.", "Conforme"],
    ]
    add_styled_table(doc, tests_headers, tests_data, [0.6, 2.5, 2.6, 0.8])

    # 15 & 16. Risques & Critères de réussite
    add_header_styled(doc, "15. Matrice des risques et mesures préventives", level=1)
    risques_headers = ["Risque opérationnel", "Impact", "Mesure d'atténuation mise en œuvre"]
    risques_data = [
        ["Erreurs ou doublons de saisie du parc", "Moyen", "Contraintes d'unicité (numéro de série, code matricule) et listes déroulantes contrôlées."],
        ["Contournement des droits d'accès", "Élevé", "Vérification systématique de session et de rôle dans chaque route API Next.js côté serveur."],
        ["Téléversement de fichiers malveillants", "Élevé", "Contrôle binaire des magic bytes, renommage UUID aléatoire et stockage sécurisé."],
        ["Perte de données en cas de panne serveur", "Critique", "Scripts de sauvegarde automatisée avec rétention de 30 jours et procédures de restauration."],
    ]
    add_styled_table(doc, risques_headers, risques_data, [2.0, 0.8, 3.7])

    add_header_styled(doc, "16. Critères de réussite du projet", level=1)
    add_p(doc, "Cycle complet des tickets opérationnel de bout en bout (signalement, priorisation, diagnostic, intervention, résolution, clôture).", bold_prefix="✓ ")
    add_p(doc, "Cohérence absolue à 100 % entre les besoins formalisés, le modèle de données MySQL et le code applicatif Next.js.", bold_prefix="✓ ")
    add_p(doc, "Gestion des pièces jointes sécurisée pour les équipements (photos 5 Mo) et les tickets (jusqu'à 5 photos).", bold_prefix="✓ ")
    add_p(doc, "Exports de rapports professionnels opérationnels en PDF vectoriel et en Word.", bold_prefix="✓ ")
    add_p(doc, "Cloisonnement étanche de l'Espace Collaborateur garantissant la confidentialité des données.", bold_prefix="✓ ")
    add_p(doc, "Documentation complète livrée : Analyse des besoins v2.0, schéma SQL, procédure de sauvegarde et rapport de stage.", bold_prefix="✓ ")

    # Sauvegarde
    doc.save(output_path)
    print(f"Document généré avec succès : {output_path}")

if __name__ == "__main__":
    out1 = r"c:\Users\hp\Desktop\Touba Gaz\Analyse_des_besoins_v2.0.docx"
    out2 = r"c:\Users\hp\Desktop\Touba Gaz\Analyse_des_besoins_v1.5.docx"
    build_full_document(out1)
    build_full_document(out2)
