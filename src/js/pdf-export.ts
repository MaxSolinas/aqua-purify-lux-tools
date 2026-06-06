import { jsPDF } from 'jspdf';
import { CONFIG } from '../data/config';

export function generatePDF(projectRef: string, communeName: string, currentTH: number, currentResult: any) {
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');
    const reportID = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 90 + 10)}`;
    const projName = projectRef || "Non spécifié";

    // Header basique (Remplacer par logo base64 si nécessaire dans l'addimage)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 53, 148);
    doc.text("AQUA PURIFY", 20, 25);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8); doc.setTextColor(100);
    doc.text(CONFIG.contact.address, 20, 35);
    doc.text(CONFIG.contact.phone, 20, 39);
    doc.text(`${CONFIG.contact.web} | ${CONFIG.contact.email}`, 20, 43);

    doc.setFontSize(10);
    doc.text(`Rapport N° : ${reportID}`, 140, 25);
    doc.text(`Date : ${dateStr}`, 140, 31);

    doc.setDrawColor(0, 53, 148); doc.setLineWidth(0.5);
    doc.line(20, 47, 190, 47);

    // Section 1
    doc.setFontSize(14); doc.setTextColor(0, 53, 148);
    doc.text("1. Identification du Projet", 20, 60);
    doc.setFontSize(11); doc.setTextColor(0);
    doc.text(`Référence : ${projName}`, 25, 68);
    doc.text(`Localisation : ${communeName}`, 25, 75);
    doc.text(`Dureté (TH) : ${currentTH.toFixed(1)}°f   /   ${(currentTH * 0.56).toFixed(1)}°dH`, 25, 82);

    // Section 2
    doc.setFontSize(14); doc.setTextColor(0, 53, 148);
    doc.text("2. Données Techniques de Dimensionnement", 20, 98);

    let currentY = 108;
    doc.setFontSize(10); doc.setTextColor(50);

    if (currentResult.type === 'collectif') {
        const rows = [
            `Type de bâtiment : Immeuble Collectif`,
            `Nombre d'unités : ${currentResult.apts} appartements`,
            `Volume Journalier Estimé : ${currentResult.vol} m³`,
            `Débit de Pointe Calculé : ${currentResult.flow} m³/h`
        ];
        rows.forEach(r => {
            doc.text(r, 25, currentY);
            currentY += 7;
        });
    } else {
        doc.text(`Type de bâtiment : ${currentResult.type === 'maison' ? 'Maison Unifamiliale' : 'Appartement'}`, 25, currentY);
        currentY += 7;
    }

    // Section 3
    doc.setFontSize(14); doc.setTextColor(229, 0, 126);
    doc.text("3. Préconisation / Application", 20, currentY + 10);

    const boxY = currentY + 15;
    doc.setFillColor(245, 245, 245);
    doc.rect(20, boxY, 170, 65, 'F');
    
    doc.setFontSize(16); doc.setTextColor(0, 53, 148);
    doc.setFont("helvetica", "bold");
    doc.text(currentResult.model, 105, boxY + 12, { align: "center" });

    if (currentResult.specs) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10); doc.setTextColor(50);
        let specY = boxY + 25;
        doc.text(`Résine : ${currentResult.specs.resin}`, 30, specY);
        doc.text(`Dureté Max : ${currentResult.specs.hardness}`, 110, specY);
        specY += 8;
        doc.text(`Débit pointe (1 bar) : ${currentResult.specs.flow1b}`, 30, specY);
        doc.text(`Dimensions : ${currentResult.specs.dims}`, 110, specY);
        specY += 8;
        doc.text(`Pression : ${currentResult.specs.pressure}`, 30, specY);
        doc.text(`Température : ${currentResult.specs.temp}`, 110, specY);
    }

    doc.setFontSize(9); doc.setTextColor(150);
    doc.text("Ce document est une simulation technique indicative fournie par Aqua Purify.", 20, 275);
    doc.text("Authorized Independent Kinetico Dealer - www.aquapurify.lu", 20, 280);

    doc.save(`Dimensionnement_${reportID}.pdf`);
}
