import { jsPDF } from 'jspdf';
import { CONFIG } from '../data/config';

interface PdfResult {
    type: string;
    model: string;
    flow: string;
    vol: string;
    apts: number;
    specs?: {
        resin?: string;
        hardness?: string;
        flow1b?: string;
        dims?: string;
        pressure?: string;
        temp?: string;
    } | null;
}

interface ReportPage2Data {
    projectName: string;
    hardnessF: number;
    dailyVolumeM3: number;
    apartmentCount: number;
    occupantCount: number;
    model: string;
    resinDescription: string;
}

const BLUE = [0, 53, 148] as const;
const CYAN = [41, 143, 194] as const;
const MAGENTA = [229, 0, 126] as const;

function addWrappedText(
    doc: jsPDF,
    text: string,
    x: number,
    y: number,
    width: number,
    lineHeight = 4.1
): number {
    const lines = doc.splitTextToSize(text, width) as string[];
    doc.text(lines, x, y);
    return y + lines.length * lineHeight;
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(...BLUE);
    doc.text(title, 20, y);
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.35);
    doc.line(20, y + 2, 190, y + 2);
    return y + 7;
}

function addBullet(
    doc: jsPDF,
    label: string,
    text: string,
    x: number,
    y: number,
    width: number
): number {
    doc.setFillColor(...CYAN);
    doc.circle(x + 1, y - 1, 0.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text(label, x + 4, y);
    const labelWidth = doc.getTextWidth(label) + 1.5;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, width - labelWidth - 4) as string[];
    doc.text(lines, x + 4 + labelWidth, y);
    return y + Math.max(1, lines.length) * 4.1 + 1.2;
}

function formatEuro(value: number): string {
    return `${Math.round(value).toLocaleString('fr-FR')} €`;
}

function addReportPage2(doc: jsPDF, data: ReportPage2Data): void {
    const annualVolumeM3 = data.dailyVolumeM3 * 365;
    // 1 °f correspond à 10 mg/L de CaCO3, soit 10 g/m3.
    const limestoneKg = Math.round((annualVolumeM3 * data.hardnessF * 10) / 1000);

    const savings = {
        energy: { min: 30 * data.occupantCount, max: 70 * data.occupantCount },
        plumbing: { min: 120 * data.occupantCount, max: 250 * data.occupantCount },
        maintenance: { min: 55 * data.occupantCount, max: 115 * data.occupantCount },
        detergents: { min: 75 * data.occupantCount, max: 155 * data.occupantCount }
    };
    const totalMin = Object.values(savings).reduce((sum, item) => sum + item.min, 0);
    const totalMax = Object.values(savings).reduce((sum, item) => sum + item.max, 0);

    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BLUE);
    doc.text('AQUA PURIFY  |  RAPPORT SYNDIC / COPROPRIÉTÉ', 20, 14);
    doc.setDrawColor(...MAGENTA);
    doc.setLineWidth(0.7);
    doc.line(20, 17, 190, 17);

    doc.setFontSize(8.5);
    doc.setTextColor(45);
    let y = addSectionTitle(doc, '1. Retrait du calcaire : mesurable et vérifiable', 25);
    doc.setFont('helvetica', 'normal');
    y = addWrappedText(
        doc,
        "L'adoucissement par échange ionique retire de l'eau les minéraux responsables de l'entartrage. Son résultat se contrôle simplement par une mesure de dureté en sortie de l'installation.",
        20,
        y,
        170
    );

    doc.setFillColor(244, 247, 251);
    doc.setDrawColor(...CYAN);
    doc.setLineWidth(1.2);
    doc.line(20, y + 2, 20, y + 19);
    doc.rect(20, y + 2, 170, 17, 'F');
    doc.setTextColor(35);
    doc.setFont('helvetica', 'bold');
    const projectSummary = `${data.projectName} : avec une eau à ${data.hardnessF.toFixed(1)} °f et une consommation estimée à ${data.dailyVolumeM3.toFixed(2)} m³/jour pour ${data.occupantCount} résidents, le système pourra intercepter environ ${limestoneKg.toLocaleString('fr-FR')} kg de CaCO3 par an.`;
    addWrappedText(doc, projectSummary, 25, y + 7, 160, 4);
    y += 25;

    y = addSectionTitle(doc, '2. Protection du bâtiment et économies potentielles', y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(45);
    y = addWrappedText(
        doc,
        `Pour ${data.apartmentCount} appartements, le scénario indicatif représente ${formatEuro(totalMin)} à ${formatEuro(totalMax)} par an, répartis entre charges communes et dépenses privatives. Ces montants ne constituent pas une garantie d'économie et doivent être ajustés aux contrats, équipements et habitudes réels.`,
        20,
        y,
        170
    ) + 2;

    const columnY = y;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...CYAN);
    doc.text('Copropriété', 20, columnY);
    doc.text('Résidents', 107, columnY);
    doc.setFontSize(8);
    doc.setTextColor(45);
    let leftY = columnY + 5;
    leftY = addBullet(doc, `Plomberie (${formatEuro(savings.plumbing.min)} - ${formatEuro(savings.plumbing.max)})`, ' : moins d’entartrage et durée de vie potentiellement accrue des équipements communs.', 20, leftY, 80);
    leftY = addBullet(doc, `Énergie (${formatEuro(savings.energy.min)} - ${formatEuro(savings.energy.max)})`, ' : rendement mieux préservé des échangeurs et équipements de production d’eau chaude.', 20, leftY, 80);
    let rightY = columnY + 5;
    rightY = addBullet(doc, `Savons (${formatEuro(savings.detergents.min)} - ${formatEuro(savings.detergents.max)})`, ' : réduction possible des dosages de savons, lessives et produits de soin.', 107, rightY, 83);
    rightY = addBullet(doc, `Entretien (${formatEuro(savings.maintenance.min)} - ${formatEuro(savings.maintenance.max)})`, ' : moins de détartrage et de produits anticalcaires.', 107, rightY, 83);
    y = Math.max(leftY, rightY) + 2;

    doc.setFontSize(8.5);
    y = addSectionTitle(doc, `3. Pourquoi le ${data.model} ?`, y);
    doc.setTextColor(45);
    doc.setFontSize(8);
    y = addBullet(doc, 'Service continu', ` : configuration duplex avec ${data.resinDescription}; une colonne prend le relais pendant la régénération.`, 20, y, 170);
    y = addBullet(doc, 'Régénération à l’eau traitée', ' : nettoyage des résines avec une eau adoucie pour préserver leurs performances.', 20, y, 170);
    y = addBullet(doc, 'Pilotage volumétrique', ` : régénération déclenchée selon la consommation réelle des ${data.occupantCount} résidents, y compris lors des périodes d’absence.`, 20, y, 170);
    y = addBullet(doc, 'Fonctionnement hydraulique', ' : sans alimentation électrique, sans programmation à rétablir après une coupure de courant.', 20, y, 170);

    doc.setFontSize(8.5);
    y = addSectionTitle(doc, '4. Expertise Aqua Purify', y + 1);
    doc.setFontSize(8);
    doc.setTextColor(45);
    y = addBullet(doc, 'Compétence reconnue', ' : dimensionnement chimique et hydraulique réalisé par un Certified Water Specialist (WQA).', 20, y, 170);
    addBullet(doc, 'Présence au Luxembourg', ' : accompagnement du syndic, mise en service, entretien et suivi technique de l’installation.', 20, y, 170);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(125);
    doc.text('Estimations établies à partir des données saisies dans le simulateur. Validation technique sur site requise avant toute offre définitive.', 20, 288);
}

export function generatePDF(projectRef: string, communeName: string, currentTH: number, currentResult: PdfResult): void {
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');
    const reportID = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 90 + 10)}`;
    const projName = projectRef || 'Non spécifié';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...BLUE);
    doc.text('AQUA PURIFY', 20, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(CONFIG.contact.address, 20, 35);
    doc.text(CONFIG.contact.phone, 20, 39);
    doc.text(`${CONFIG.contact.web} | ${CONFIG.contact.email}`, 20, 43);

    doc.setFontSize(10);
    doc.text(`Rapport N° : ${reportID}`, 140, 25);
    doc.text(`Date : ${dateStr}`, 140, 31);

    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.5);
    doc.line(20, 47, 190, 47);

    doc.setFontSize(14);
    doc.setTextColor(...BLUE);
    doc.text('1. Identification du Projet', 20, 60);
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Référence : ${projName}`, 25, 68);
    doc.text(`Localisation : ${communeName}`, 25, 75);
    doc.text(`Dureté (TH) : ${currentTH.toFixed(1)}°f   /   ${(currentTH * 0.56).toFixed(1)}°dH`, 25, 82);

    doc.setFontSize(14);
    doc.setTextColor(...BLUE);
    doc.text('2. Données Techniques de Dimensionnement', 20, 98);

    let currentY = 108;
    doc.setFontSize(10);
    doc.setTextColor(50);

    if (currentResult.type === 'collectif') {
        const rows = [
            'Type de bâtiment : Immeuble Collectif',
            `Nombre d'unités : ${currentResult.apts} appartements`,
            `Volume Journalier Estimé : ${currentResult.vol} m³`,
            `Débit de Pointe Calculé : ${currentResult.flow} m³/h`
        ];
        rows.forEach(row => {
            doc.text(row, 25, currentY);
            currentY += 7;
        });
    } else {
        doc.text(`Type de bâtiment : ${currentResult.type === 'maison' ? 'Maison Unifamiliale' : 'Appartement'}`, 25, currentY);
        currentY += 7;
    }

    doc.setFontSize(14);
    doc.setTextColor(...MAGENTA);
    doc.text('3. Préconisation / Application', 20, currentY + 10);

    const boxY = currentY + 15;
    doc.setFillColor(245, 245, 245);
    doc.rect(20, boxY, 170, 65, 'F');

    doc.setFontSize(16);
    doc.setTextColor(...BLUE);
    doc.setFont('helvetica', 'bold');
    doc.text(currentResult.model, 105, boxY + 12, { align: 'center' });

    if (currentResult.specs) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(50);
        let specY = boxY + 25;
        doc.text(`Résine : ${currentResult.specs.resin ?? '-'}`, 30, specY);
        doc.text(`Dureté Max : ${currentResult.specs.hardness ?? '-'}`, 110, specY);
        specY += 8;
        doc.text(`Débit pointe (1 bar) : ${currentResult.specs.flow1b ?? '-'}`, 30, specY);
        doc.text(`Dimensions : ${currentResult.specs.dims ?? '-'}`, 110, specY);
        specY += 8;
        doc.text(`Pression : ${currentResult.specs.pressure ?? '-'}`, 30, specY);
        doc.text(`Température : ${currentResult.specs.temp ?? '-'}`, 110, specY);
    }

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text('Ce document est une simulation technique indicative fournie par Aqua Purify.', 20, 275);
    doc.text('Authorized Independent Kinetico Dealer - www.aquapurify.lu', 20, 280);

    if (currentResult.type === 'collectif') {
        const apartmentCount = Math.max(1, Number(currentResult.apts) || 1);
        addReportPage2(doc, {
            projectName: projName,
            hardnessF: Math.max(0, currentTH),
            dailyVolumeM3: Math.max(0, Number(currentResult.vol) || 0),
            apartmentCount,
            occupantCount: Math.round(apartmentCount * CONFIG.constants.personsPerApt),
            model: currentResult.model || 'Kinetico',
            resinDescription: currentResult.specs?.resin || 'volume à confirmer'
        });
    }

    doc.save(`Dimensionnement_${reportID}.pdf`);
}
