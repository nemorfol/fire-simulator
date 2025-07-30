import { jsPDF } from "jspdf";
import "jspdf-autotable";

export function generateSimulationReport(ultimoRisultato, risultatiHeader, risultatiBody, datiFIRE, monteCarloSummaryResults, formatterValuta, mostraNotifica, formInputs) {
  ultimoRisultato = Array.isArray(ultimoRisultato) ? ultimoRisultato : []; // Assicurati che sia un array
  const doc = new jsPDF('p', 'pt', 'a4');
  let y = 20; // Posizione Y iniziale
  const margin = 40;
  const lineHeight = 12; // Aumentato per maggiore leggibilità

  // Funzione per aggiungere una nuova pagina se necessario
  const checkPageBreak = (heightNeeded = 0) => {
    if (y + heightNeeded > doc.internal.pageSize.height - margin) { // Controlla se lo spazio rimanente è sufficiente
      doc.addPage();
      y = margin; // Reset Y per la nuova pagina, rispettando il margine
    }
  };

  // Titolo del Report
  doc.setFontSize(22);
  doc.text("Report Simulazione F.I.R.E.", margin, y);
  y += 20; // Spazio dopo il titolo

  // Riepilogo Simulazione
  checkPageBreak(5 * lineHeight);
  doc.setFontSize(16);
  doc.text("1. Riepilogo Simulazione", margin, y);
  y += lineHeight;
  doc.setFontSize(12);
  doc.text(`Modalità Simulazione: ${formInputs.simMode === 'montecarlo' ? 'Monte Carlo' : formInputs.simMode === 'backtest' ? 'Backtest Storico' : 'Deterministica'}`, margin, y);
  y += lineHeight;
  if (datiFIRE) {
    doc.text(`Obiettivo FIRE Raggiunto a: ${datiFIRE.eta} anni (Capitale: ${formatterValuta.format(datiFIRE.capitaleFinale)})`, margin, y);
    y += lineHeight;
  } else if (formInputs.simMode !== 'montecarlo') {
    doc.text("Obiettivo FIRE: Non raggiunto in questa simulazione", margin, y);
    y += lineHeight;
  }
  if (formInputs.simMode === 'montecarlo' && monteCarloSummaryResults) {
    doc.text(`Probabilità di Successo (Monte Carlo): ${monteCarloSummaryResults.probabilitaSuccesso.toFixed(2)}%`, margin, y);
    y += lineHeight;
    doc.text(`Età Media Esaurimento (Monte Carlo): ${monteCarloSummaryResults.etaMediaEsaurimento.toFixed(0)} anni`, margin, y);
    y += lineHeight;
  }
  y += 15; // Spazio extra

  // Dettagli Impostazioni
  checkPageBreak(10 * lineHeight);
  doc.setFontSize(16);
  doc.text("2. Dettagli Impostazioni", margin, y);
  y += lineHeight;
  doc.setFontSize(12);
  doc.text(`Età Iniziale: ${formInputs.etaIniziale}`, margin, y);
  y += lineHeight;
  doc.text(`Capitale Iniziale: ${formatterValuta.format(formInputs.capitaleIniziale)}`, margin, y);
  y += lineHeight;
  doc.text(`Tasso Inflazione Annuo: ${formInputs.tassoInflazione}%`, margin, y);
  y += lineHeight;
  doc.text(`Regola FIRE (%): ${formInputs.regolaFIRE}%`, margin, y);
  y += lineHeight;
  doc.text(`Tassazione Rendite (%): ${formInputs.tassazioneRendite}%`, margin, y);
  y += lineHeight;
  if (formInputs.isRetirement) {
    doc.text(`Età di Ritiro: ${formInputs.etaRitiro}`, margin, y);
    y += lineHeight;
    doc.text(`Costi Sanitari Annuo in Pensione: ${formatterValuta.format(formInputs.costiSanitariPensione)}`, margin, y);
    y += lineHeight;
    doc.text(`Strategia di Prelievo: ${formInputs.strategiaPrelievo === 'regolaFIRE' ? 'Regola FIRE (Fisso)' : formInputs.strategiaPrelievo === 'percentualeCostante' ? 'Percentuale Costante' : 'Prelievo Fisso (Aggiustato per Inflazione)'}`, margin, y);
    y += lineHeight;
    if (formInputs.strategiaPrelievo === 'percentualeCostante') {
      doc.text(`Percentuale di Prelievo: ${formInputs.percentualePrelievo}%`, margin, y);
      y += lineHeight;
    }
  }
  if (formInputs.simMode === 'montecarlo') {
    doc.text(`Numero Simulazioni: ${formInputs.numeroSimulazioni}`, margin, y);
    y += lineHeight;
    doc.text(`Correlazione Asset: ${formInputs.correlazioneAsset}`, margin, y);
    y += lineHeight;
  }
  y += 15; // Spazio extra

  // Entrate Ricorrenti
  checkPageBreak(50); // Spazio stimato per la tabella
  doc.setFontSize(16);
  doc.text("3. Entrate Ricorrenti", margin, y);
  y += lineHeight;
  if (formInputs.entrateRicorrenti.length > 0) {
    const headers = ["Descrizione", "Valore Annuo (€)", "Inizio", "Fine", "Incr. (%)", "Regime Fiscale"];
    const data = formInputs.entrateRicorrenti.map(row => [
      row.desc,
      formatterValuta.format(row.valore),
      row.inizio,
      row.fine,
      `${row.incr}%`,
      row.taxRegime
    ]);
    doc.autoTable({
      head: [headers],
      body: data,
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 1, overflow: 'linebreak' },
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
      didDrawPage: (data) => {
        y = data.cursor.y + 10; // Aggiorna la posizione Y dopo la tabella
      }
    });
  } else {
    doc.setFontSize(10);
    doc.text("Nessuna entrata ricorrente inserita.", margin, y);
    y += lineHeight;
  }
  y += 15; // Spazio extra

  // Uscite Ricorrenti
  checkPageBreak(50);
  doc.setFontSize(16);
  doc.text("4. Uscite Ricorrenti", margin, y);
  y += lineHeight;
  if (formInputs.usciteRicorrenti.length > 0) {
    const headers = ["Descrizione", "Valore Annuo (€)", "Inizio", "Fine", "Incr. (%)", "Infl. Spec. (%)"];
    const data = formInputs.usciteRicorrenti.map(row => [
      row.desc,
      formatterValuta.format(row.valore),
      row.inizio,
      row.fine,
      `${row.incr}%`,
      `${row.inflazioneSpecifica}%`
    ]);
    doc.autoTable({
      head: [headers],
      body: data,
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 1, overflow: 'linebreak' },
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
      didDrawPage: (data) => {
        y = data.cursor.y + 10;
      }
    });
  } else {
    doc.setFontSize(10);
    doc.text("Nessuna uscita ricorrente inserita.", margin, y);
    y += lineHeight;
  }
  y += 15; // Spazio extra

  // Asset Allocation
  checkPageBreak(50);
  doc.setFontSize(16);
  doc.text("5. Asset Allocation", margin, y);
  y += lineHeight;
  if (formInputs.assetAllocation.length > 0) {
    const headers = ["Nome Asset", "Quota (%)", "Rendimento Atteso (%)", "Dev. Standard (%)", "Tipo Conto"];
    const data = formInputs.assetAllocation.map(row => [
      row.nome,
      `${row.quota}%`,
      `${row.rendimento}%`,
      `${row.devStd}%`,
      row.tipoConto
    ]);
    doc.autoTable({
      head: [headers],
      body: data,
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 1, overflow: 'linebreak' },
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
      didDrawPage: (data) => {
        y = data.cursor.y + 10;
      }
    });
  } else {
    doc.setFontSize(10);
    doc.text("Nessuna asset allocation inserita.", margin, y);
    y += lineHeight;
  }
  y += 15; // Spazio extra

  // Debiti
  checkPageBreak(50);
  doc.setFontSize(16);
  doc.text("6. Debiti", margin, y);
  y += lineHeight;
  if (formInputs.debiti.length > 0) {
    const headers = ["Descrizione", "Tipo Debito", "Importo Iniziale (€)", "Tasso Interesse (%)", "Durata (Anni)", "Anno Inizio"];
    const data = formInputs.debiti.map(row => [
      row.desc,
      row.tipoDebito,
      formatterValuta.format(row.importoIniziale),
      `${row.tassoInteresse}%`,
      row.durataAnni,
      row.annoInizio
    ]);
    doc.autoTable({
      head: [headers],
      body: data,
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 1, overflow: 'linebreak' },
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
      didDrawPage: (data) => {
        y = data.cursor.y + 10;
      }
    });
  } else {
    doc.setFontSize(10);
    doc.text("Nessun debito inserito.", margin, y);
    y += lineHeight;
  }
  y += 15; // Spazio extra

  // Risultati Annuali (solo se disponibili e non Monte Carlo)
  if (ultimoRisultato && ultimoRisultato.length > 0 && formInputs.simMode !== 'montecarlo') {
    checkPageBreak(50); // Spazio stimato per la tabella
    doc.setFontSize(16);
    doc.text("7. Risultati Annuali", margin, y);
    y += lineHeight;
    doc.setFontSize(8);

    

    const headers = ["Anno", "Età", "Capitale Iniziale", "Entrate", "Uscite", "Flusso Cassa Netto", "Rendimento Netto", "Capitale Finale"];
    const data = ultimoRisultato.map(row => [
      row.anno,
      row.eta,
      formatterValuta.format(row.capitaleIniziale),
      formatterValuta.format(row.totaleEntrate),
      formatterValuta.format(row.totaleUscite),
      formatterValuta.format(row.utilePerditaNetto),
      formatterValuta.format(row.rendimentoNetto),
      formatterValuta.format(row.capitaleFinale)
    ]);

    doc.autoTable({
      head: [headers],
      body: data,
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 7, cellPadding: 0.5, overflow: 'linebreak' },
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
      willDrawCell: (data) => {
        const row = ultimoRisultato[data.row.index];
        if (row && row.capitaleIniziale <= 0) {
          doc.setFillColor(255, 204, 203); // Light red
        }
      },
      didDrawPage: (data) => {
        y = data.cursor.y + 10; // Aggiorna la posizione Y dopo la tabella
      }
    });
  }

  doc.save("report_simulazione_fire.pdf");
}
