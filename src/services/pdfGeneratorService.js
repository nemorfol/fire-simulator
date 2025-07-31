import jsPDF from "jspdf";
import "jspdf-autotable";
import { userRiskAssessments } from './riskService.js';

export function generateSimulationReport(
  simulationResults,
  headers,
  body,
  fireData,
  monteCarloSummary,
  formatter,
  mostraNotifica,
  formInputs
) {
  if (!simulationResults || simulationResults.length === 0) {
    mostraNotifica("Errore", "Nessun dato di simulazione da esportare.", true);
    return;
  }

  try {
    const doc = new jsPDF({ orientation: "landscape" });
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;

    // --- Definisci Stili e Colori ---
    const styles = {
      head: [44, 62, 80],      // Dark Slate Gray
      subhead: [52, 73, 94],   // Wet Asphalt
      primary: [52, 152, 219], // Peter River Blue
      text: [51, 51, 51],      // Dark Gray
    };

    const addHeader = (pageTitle) => {
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(styles.text[0], styles.text[1], styles.text[2]);
      doc.text("Report di Simulazione F.I.R.E.", pageWidth / 2, 15, { align: "center" });
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(127, 140, 141);
      doc.text(pageTitle, pageWidth / 2, 22, { align: "center" });
    };

    const addFooter = () => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(127, 140, 141);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Pagina ${i} di ${pageCount} | Generato il: ${new Date().toLocaleDateString('it-IT')}`, pageWidth / 2, pageHeight - 10, { align: "center" });
      }
    };

    const formatHeader = (header) => {
      if (header === 'anno' || header === 'eta') {
        return header.charAt(0).toUpperCase() + header.slice(1);
      }
      const title = header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/ /g, '\n');
      let unit = '(€)';
      if (header.toLowerCase().includes('rate') || header.toLowerCase().includes('tasso') || header.toLowerCase().includes('percentuale')) {
        unit = '(%)';
      }
      return `${title}\n${unit}`;
    };

    // --- PAGINA 1: RIEPILOGO --- 
    addHeader("Riepilogo Generale e Rischi");
    let yPosition = 35;

    // Sezione Parametri Principali
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Parametri Principali", 14, yPosition);
    yPosition += 7;
    doc.autoTable({
      startY: yPosition,
      head: [['Parametro', 'Valore']],
      body: [
        ['Capitale Iniziale', formatter.format(formInputs.capitaleIniziale)],
        ['Età Iniziale / Ritiro / Fine', `${formInputs.etaIniziale} / ${formInputs.etaRitiro} / ${formInputs.etaMassimaSimulazione} anni`],
        ['Tasso Inflazione Medio', `${formInputs.tassoInflazione}%`],
        ['Tassazione Rendite', `${formInputs.tassazioneRendite}%`],
      ],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: styles.head },
      columnStyles: { 0: { fontStyle: 'bold' } }
    });
    yPosition = doc.autoTable.previous.finalY + 12;

    // Sezione Risultati Simulazione
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Risultati Chiave", 14, yPosition);
    yPosition += 7;
    const resultsBody = formInputs.simMode === 'montecarlo' ? [
        ['Probabilità di Successo', `${monteCarloSummary?.probabilitaSuccesso}%`],
        ['Capitale Finale (Scenario Peggiore)', formatter.format(monteCarloSummary?.worstCase?.capitaleFinale)],
      ] : [
        ['Capitale Finale', formatter.format(simulationResults[simulationResults.length - 1].capitaleFinale)],
        ['Patrimonio Netto Finale', formatter.format(simulationResults[simulationResults.length - 1].patrimonioNetto)],
        ['Anno Raggiungimento FIRE', fireData ? fireData.anno : 'Non raggiunto'],
      ];
    doc.autoTable({
      startY: yPosition,
      head: [['Metrica', 'Valore']],
      body: resultsBody,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: styles.primary },
      columnStyles: { 0: { fontStyle: 'bold' } }
    });
    yPosition = doc.autoTable.previous.finalY + 12;

    // Sezione Valutazione Rischi
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Valutazione dei Rischi", 14, yPosition);
    yPosition += 7;
    doc.autoTable({
      startY: yPosition,
      head: [['Rischio', 'Probabilità', 'Impatto']],
      body: userRiskAssessments.map(r => [r.name, r.probability, r.impact]),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: styles.subhead },
      columnStyles: { 0: { fontStyle: 'bold' } }
    });

    // --- PAGINA 2: DETTAGLIO ANNUALE ---
    if (formInputs.simMode !== 'montecarlo') {
      doc.addPage();
      addHeader("Dettaglio Annuale della Simulazione");
      yPosition = 35;
      doc.autoTable({
        startY: yPosition,
        head: [headers.map(h => formatHeader(h))], // Usa la nuova funzione di formattazione
        body: body.map(row => {
          return headers.map(header => {
            const val = row[header];
            if (header === 'anno' || header === 'eta') {
              return val; // Non formattare anno e età
            }
            if (typeof val === 'number') {
              return val.toLocaleString('it-IT', { maximumFractionDigits: 0 });
            }
            return val;
          });
        }),
        theme: 'striped',
        styles: { fontSize: 6, cellPadding: 1.5, overflow: 'ellipsize', halign: 'center' },
        headStyles: { fillColor: styles.head, fontSize: 6.5, halign: 'center', valign: 'middle' },
        didParseCell: function (data) {
          // Colora di rosso la riga se il capitale finale è <= 0
          const rowData = body[data.row.index];
          if (rowData && rowData.capitaleFinale <= 0) {
            data.cell.styles.fillColor = [254, 202, 202]; // red-200
            data.cell.styles.textColor = [153, 27, 27]; // red-800
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });
    }

    addFooter();
    doc.save("report_simulazione_fire.pdf");
    mostraNotifica("Successo", "Il report PDF è stato generato con successo.");

  } catch (error) {
    console.error("Errore durante la generazione del PDF:", error);
    mostraNotifica("Errore PDF", "Si è verificato un errore durante la generazione del report PDF.", true);
  }
}
