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
        link?: string;
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
    doc.setFontSize(12);
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
    doc.setFont('helvetica', 'normal');
    const body = text.replace(/^\s*:\s*/, '');
    const lines = doc.splitTextToSize(body, width - 8) as string[];
    doc.text(lines, x + 4, y + 3.8);
    return y + 3.8 + Math.max(1, lines.length) * 3.6 + 1.8;
}

function formatInteger(value: number): string {
    return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatEuro(value: number): string {
    return `${formatInteger(value)} €`;
}

function addFinancialCard(
    doc: jsPDF,
    title: string,
    items: Array<{ label: string; amount: string; text: string }>,
    x: number,
    y: number,
    width: number,
    height: number
): void {
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(234, 234, 234);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, width, height, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BLUE);
    doc.text(title, x + 5, y + 7);

    let itemY = y + 14;
    items.forEach(item => {
        doc.setFillColor(...CYAN);
        doc.circle(x + 5, itemY - 1, 0.7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(55);
        doc.text(item.label, x + 8, itemY);
        doc.setTextColor(...CYAN);
        doc.text(item.amount, x + 8, itemY + 4);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(68);
        doc.setFontSize(7.6);
        const lines = doc.splitTextToSize(item.text, width - 13) as string[];
        doc.text(lines, x + 8, itemY + 8);
        itemY += 8 + lines.length * 3.2 + 2.4;
    });
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

    doc.setFontSize(9);
    doc.setTextColor(45);
    let y = addSectionTitle(doc, '1. LE RETRAIT DU CALCAIRE : MESURABLE ET GARANTI', 25);
    doc.setFont('helvetica', 'normal');
    y = addWrappedText(
        doc,
        'Contrairement aux dispositifs "anticalcaires" magnétiques ou galvaniques, qui maintiennent le calcaire en suspension sans l’éliminer ni garantir le résultat, l’adoucisseur à échange ionique retire physiquement les minéraux incrustants. Son efficacité se vérifie par une simple analyse de l’eau.',
        20,
        y,
        170,
        4.2
    );

    doc.setFillColor(244, 247, 251);
    doc.rect(20, y + 2, 170, 25, 'F');
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(1.4);
    doc.line(20, y + 2, 20, y + 27);
    doc.setFontSize(9.2);
    doc.setTextColor(...BLUE);
    doc.setFont('helvetica', 'bold');
    doc.text(`Bilan pour ${data.projectName} :`, 25, y + 8);
    doc.setTextColor(35);
    doc.setFont('helvetica', 'normal');
    const projectSummary = `Avec une eau mesurée à ${data.hardnessF.toFixed(1)} °f et une consommation estimée à ${data.dailyVolumeM3.toFixed(2)} m³/jour pour ${data.occupantCount} résidents, le système interceptera et évacuera environ ${formatInteger(limestoneKg)} kg de CaCO3 par an.`;
    addWrappedText(doc, projectSummary, 25, y + 14, 160, 4);
    y += 33;

    y = addSectionTitle(doc, '2. BILAN FINANCIER : PROTECTION ET ÉCONOMIES ESTIMÉES', y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(45);
    doc.setFontSize(9);
    y = addWrappedText(
        doc,
        `En protégeant ${data.apartmentCount} appartements, l’installation générera une économie globale estimée entre ${formatEuro(totalMin)} et ${formatEuro(totalMax)} par an pour l’ensemble du bâtiment, répartie entre charges communes et dépenses privatives.`,
        20,
        y,
        170,
        4.1
    ) + 2;

    addFinancialCard(doc, 'POUR LA COPROPRIÉTÉ', [
        {
            label: 'Plomberie & appareils',
            amount: `${formatEuro(savings.plumbing.min)} - ${formatEuro(savings.plumbing.max)}`,
            text: 'Arrêt de l’entartrage, baisse des interventions d’urgence et durée de vie accrue des équipements communs.'
        },
        {
            label: 'Énergie',
            amount: `${formatEuro(savings.energy.min)} - ${formatEuro(savings.energy.max)}`,
            text: 'Maintien du rendement des échangeurs thermiques, le tartre agissant comme un isolant.'
        }
    ], 20, y, 81, 58);
    addFinancialCard(doc, 'POUR LES RÉSIDENTS', [
        {
            label: 'Savon & lessive',
            amount: `${formatEuro(savings.detergents.min)} - ${formatEuro(savings.detergents.max)}`,
            text: 'Pouvoir moussant accru et réduction possible de moitié des dosages de détergents.'
        },
        {
            label: 'Entretien',
            amount: `${formatEuro(savings.maintenance.min)} - ${formatEuro(savings.maintenance.max)}`,
            text: 'Suppression de la corvée de détartrage et réduction des produits chimiques anticalcaires.'
        }
    ], 109, y, 81, 58);
    y += 66;

    doc.setFontSize(9);
    y = addSectionTitle(doc, `3. POURQUOI LE ${data.model.toUpperCase()} ?`, y);
    doc.setTextColor(45);
    doc.setFontSize(8.5);
    y = addWrappedText(doc, `Pour garantir une continuité de service irréprochable et maîtriser les charges communes de ${data.projectName}, ce modèle surpasse les standards du marché :`, 20, y, 170, 3.8) + 2;
    y = addBullet(doc, 'Conception Duplex (eau douce 24h/24)', ` : équipé de colonnes de résine (${data.resinDescription}), le système assure la relève pendant la régénération, sans interruption de service.`, 20, y, 170);
    y = addBullet(doc, 'Régénération à l’eau traitée', ' : l’appareil utilise de l’eau adoucie pour nettoyer ses résines et préserver leur efficacité.', 20, y, 170);
    y = addBullet(doc, 'Consommation ajustée au strict minimum', ` : le fonctionnement volumétrique s’adapte à la présence réelle des ${data.occupantCount} résidents et ne régénère qu’en fonction des besoins.`, 20, y, 170);
    y = addBullet(doc, 'Fiabilité 100 % autonome', ' : fonctionnement hydraulique sans électricité, sans carte électronique et sans reprogrammation après une coupure de courant. Certifications NSF et WQA selon le modèle.', 20, y, 170);

    doc.setFontSize(9);
    y = addSectionTitle(doc, '4. L’EXPERTISE AQUA PURIFY', y + 1);
    doc.setFontSize(8.5);
    doc.setTextColor(45);
    doc.setDrawColor(...CYAN);
    doc.setLineWidth(0.5);
    doc.roundedRect(20, y - 2, 28, 18, 2, 2, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...BLUE);
    doc.text('WQA', 34, y + 6, { align: 'center' });
    doc.setFontSize(6);
    doc.text('CERTIFIED', 34, y + 11, { align: 'center' });
    doc.setFontSize(8.2);
    doc.setTextColor(55);
    doc.setFont('helvetica', 'bold');
    doc.text('Certification internationale', 54, y + 1);
    doc.setFont('helvetica', 'normal');
    y = addWrappedText(doc, 'Spécialiste Certified Water Specialist par la WQA, pour un dimensionnement chimique et hydraulique validé par l’industrie.', 54, y + 5, 136, 3.7);
    doc.setFont('helvetica', 'bold');
    doc.text('Acteur local à Luxembourg', 54, y + 1);
    doc.setFont('helvetica', 'normal');
    addWrappedText(doc, 'Une présence de proximité assurant au syndic réactivité, entretien et suivi technique de l’installation.', 54, y + 5, 136, 3.7);

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

    doc.setFontSize(13);
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
    doc.rect(20, boxY, 170, 55, 'F');
    doc.setFillColor(...MAGENTA);
    doc.rect(20, boxY, 2, 55, 'F');

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

        if (currentResult.specs.link) {
            const linkLabel = 'Voir la fiche technique';
            const linkY = boxY + 49;
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...BLUE);
            doc.textWithLink(linkLabel, 105, linkY, {
                align: 'center',
                url: currentResult.specs.link
            });
            const linkWidth = doc.getTextWidth(linkLabel);
            doc.setDrawColor(...BLUE);
            doc.setLineWidth(0.2);
            doc.line(105 - linkWidth / 2, linkY + 1, 105 + linkWidth / 2, linkY + 1);
        }
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
