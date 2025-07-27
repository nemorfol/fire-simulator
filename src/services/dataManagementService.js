import ExcelJS from 'exceljs';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export function esportaJSON(formInputs, mostraNotifica) {
  try {
    const dataToExport = JSON.stringify(formInputs, null, 2); // Pretty print JSON
    const blob = new Blob([dataToExport], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'configurazione_simulatore.json';
    a.click(); // Simula il click per avviare il download
    URL.revokeObjectURL(url); // Rilascia l'URL dell'oggetto
    mostraNotifica("Esportazione Completata", "I dati della simulazione sono stati salvati nel file JSON.");
  } catch (error) {
    console.error("Errore durante l'esportazione JSON:", error);
    mostraNotifica("Errore", "Impossibile esportare i dati in JSON.", true);
  }
}

export function importaJSON(event, formInputs, mostraNotifica) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      // Mantieni la reattività degli oggetti Vue
      for (const key in formInputs) {
        if (Object.hasOwnProperty.call(formInputs, key)) {
          if (typeof formInputs[key] === 'object' && formInputs[key] !== null && !Array.isArray(formInputs[key])) {
            // Se è un oggetto reattivo, aggiorna le sue proprietà
            Object.assign(formInputs[key], importedData[key]);
          } else if (Array.isArray(formInputs[key])) {
            // Se è un array reattivo, svuotalo e ripopolalo
            formInputs[key].splice(0, formInputs[key].length, ...importedData[key]);
          } else {
            // Per le proprietà semplici, assegna direttamente
            formInputs[key] = importedData[key];
          }
        }
      }
      mostraNotifica("Importazione Completata", "I dati della simulazione sono stati caricati dal file JSON.");
    } catch (error) {
      console.error("Errore durante l'importazione JSON:", error);
      mostraNotifica("Errore", "Impossibile leggere o parsare il file JSON. Assicurati che sia un JSON valido.", true);
    }
  };
  reader.onerror = () => {
    mostraNotifica("Errore", "Impossibile leggere il file.", true);
  };
  reader.readAsText(file);
}

export async function esportaExcel(ultimoRisultato, formInputs, mostraNotifica) {
  if (!ultimoRisultato || ultimoRisultato.length === 0) {
    mostraNotifica(
      "Nessun Dato",
      "Non ci sono dati da esportare. Esegui una simulazione prima.",
      false
    );
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Dettaglio Annuale");

  // ... (codice per aggiungere il foglio dei parametri di input - invariato)
  const inputWorksheet = workbook.addWorksheet("Parametri Input");
  const inputData = [];
  for (const key in formInputs) {
    if (Object.hasOwnProperty.call(formInputs, key)) {
      const value = formInputs[key];
      if (typeof value !== 'object' || value === null) {
        inputData.push([key, value]);
      } else {
        inputData.push([key, JSON.stringify(value)]);
      }
    }
  }
  inputWorksheet.addRows(inputData);


  const dynamicHeaders = new Set();
  dynamicHeaders.add('anno');
  dynamicHeaders.add('eta');
  dynamicHeaders.add('capitaleIniziale');
  formInputs.entrateRicorrenti.forEach(e => dynamicHeaders.add(e.desc));
  formInputs.entrateLumpSum.forEach(e => dynamicHeaders.add(e.desc));
  formInputs.usciteRicorrenti.forEach(u => dynamicHeaders.add(u.desc));
  formInputs.usciteLumpSum.forEach(u => dynamicHeaders.add(u.desc));
  formInputs.debiti.forEach(d => {
    dynamicHeaders.add(`Rata ${d.desc}`);
    dynamicHeaders.add(`Capitale Residuo ${d.desc}`);
  });
  dynamicHeaders.add('totaleEntrate');
  dynamicHeaders.add('totaleUscite');
  dynamicHeaders.add('prelievo');
  dynamicHeaders.add('utilePerditaLordo');
  dynamicHeaders.add('impostaReddito');
  dynamicHeaders.add('utilePerditaNetto');
  dynamicHeaders.add('capitalePreRendimento');
  dynamicHeaders.add('rendimentoLordo');
  dynamicHeaders.add('impostaRendite');
  dynamicHeaders.add('rendimentoNetto');
  dynamicHeaders.add('capitaleFinale');

  const finalHeaders = Array.from(dynamicHeaders);
  worksheet.addRow(finalHeaders);

  const headerMap = {};
  finalHeaders.forEach((header, index) => {
    headerMap[header] = index + 1;
  });

  const getColumnLetter = (colIndex) => {
    let letter = '';
    while (colIndex > 0) {
      letter = String.fromCharCode(65 + (colIndex - 1) % 26) + letter;
      colIndex = Math.floor((colIndex - 1) / 26);
    }
    return letter;
  };

  ultimoRisultato.forEach((row, rowIndex) => {
    const excelRow = worksheet.addRow({});
    const currentRowNumber = rowIndex + 2;
    const inflationRate = formInputs.tassoInflazione / 100;

    finalHeaders.forEach(header => {
      const colIndex = headerMap[header];
      const cell = excelRow.getCell(colIndex);
      // ... (tutta la logica per popolare le celle rimane qui)
      const entrataRicorrente = formInputs.entrateRicorrenti.find(e => e.desc === header);
      if (entrataRicorrente) {
        const yearsPassed = `(${getColumnLetter(headerMap['anno'])}${currentRowNumber} - ${entrataRicorrente.inizio})`;
        let formulaValue = `IF(AND(${getColumnLetter(headerMap['anno'])}${currentRowNumber}>=${entrataRicorrente.inizio}, ${getColumnLetter(headerMap['anno'])}${currentRowNumber}<=${entrataRicorrente.fine}), ${entrataRicorrente.valore}*POWER(1+${entrataRicorrente.incr}/100,${yearsPassed})*IF(${entrataRicorrente.isTodayValue},POWER(1+${inflationRate},${yearsPassed}),1),0)`;
        cell.value = { formula: formulaValue, result: row[header] };
        return;
      }
      const uscitaRicorrente = formInputs.usciteRicorrenti.find(u => u.desc === header);
      if (uscitaRicorrente) {
        const yearsPassed = `(${getColumnLetter(headerMap['anno'])}${currentRowNumber} - ${uscitaRicorrente.inizio})`;
        const specificInflation = uscitaRicorrente.inflazioneSpecifica > 0 ? uscitaRicorrente.inflazioneSpecifica / 100 : inflationRate;
        let formulaValue = `IF(AND(${getColumnLetter(headerMap['anno'])}${currentRowNumber}>=${uscitaRicorrente.inizio}, ${getColumnLetter(headerMap['anno'])}${currentRowNumber}<=${uscitaRicorrente.fine}), ${uscitaRicorrente.valore}*POWER(1+${uscitaRicorrente.incr}/100,${yearsPassed})*IF(${uscitaRicorrente.isTodayValue},POWER(1+${specificInflation},${yearsPassed}),1),0)`;
        cell.value = { formula: formulaValue, result: row[header] };
        return;
      }
      const entrataLumpSum = formInputs.entrateLumpSum.find(e => e.desc === header);
      if (entrataLumpSum) {
        let formulaValue = `IF(${getColumnLetter(headerMap['anno'])}${currentRowNumber}=${entrataLumpSum.anno}, ${entrataLumpSum.importo}, 0)`;
        cell.value = { formula: formulaValue, result: row[header] };
        return;
      }
      const uscitaLumpSum = formInputs.usciteLumpSum.find(u => u.desc === header);
      if (uscitaLumpSum) {
        let formulaValue = `IF(${getColumnLetter(headerMap['anno'])}${currentRowNumber}=${uscitaLumpSum.anno}, ${uscitaLumpSum.importo}, 0)`;
        cell.value = { formula: formulaValue, result: row[header] };
        return;
      }
      const rataDebito = formInputs.debiti.find(d => `Rata ${d.desc}` === header);
      if (rataDebito) {
        cell.value = row[header];
        return;
      }
      const capitaleResiduoDebito = formInputs.debiti.find(d => `Capitale Residuo ${d.desc}` === header);
      if (capitaleResiduoDebito) {
        cell.value = row[header];
        return;
      }
      switch (header) {
        case 'capitaleIniziale':
          if (rowIndex === 0) {
            cell.value = row[header];
          } else {
            const prevCapitaleFinaleCol = getColumnLetter(headerMap['capitaleFinale']);
            cell.value = { formula: `=${prevCapitaleFinaleCol}${currentRowNumber - 1}`, result: row[header] };
          }
          break;
        case 'totaleEntrate':
          const entrateCols = formInputs.entrateRicorrenti.map(e => getColumnLetter(headerMap[e.desc])).concat(formInputs.entrateLumpSum.map(e => getColumnLetter(headerMap[e.desc])));
          if (entrateCols.length > 0) {
            cell.value = { formula: `SUM(${entrateCols.map(col => `${col}${currentRowNumber}`).join(',')})`, result: row[header] };
          } else {
            cell.value = row[header];
          }
          break;
        case 'totaleUscite':
          const usciteCols = formInputs.usciteRicorrenti.map(u => getColumnLetter(headerMap[u.desc])).concat(formInputs.usciteLumpSum.map(u => getColumnLetter(headerMap[u.desc])));
          const debitiRataCols = formInputs.debiti.map(d => getColumnLetter(headerMap[`Rata ${d.desc}`]));
          let sumFormulaParts = [];
          if (usciteCols.length > 0) { sumFormulaParts.push(usciteCols.map(col => `${col}${currentRowNumber}`).join(',')); }
          if (debitiRataCols.length > 0) { sumFormulaParts.push(debitiRataCols.map(col => `${col}${currentRowNumber}`).join(',')); }
          if (sumFormulaParts.length > 0) {
            cell.value = { formula: `SUM(${sumFormulaParts.join(',')})`, result: row[header] };
          } else {
            cell.value = row[header];
          }
          break;
        case 'utilePerditaLordo':
          const totaleEntrateCol = getColumnLetter(headerMap['totaleEntrate']);
          const totaleUsciteCol = getColumnLetter(headerMap['totaleUscite']);
          cell.value = { formula: `=${totaleEntrateCol}${currentRowNumber} - ${totaleUsciteCol}${currentRowNumber}`, result: row[header] };
          break;
        case 'utilePerditaNetto':
          const utilePerditaLordoCol = getColumnLetter(headerMap['utilePerditaLordo']);
          const impostaRedditoCol = getColumnLetter(headerMap['impostaReddito']);
          cell.value = { formula: `=${utilePerditaLordoCol}${currentRowNumber} - ${impostaRedditoCol}${currentRowNumber}`, result: row[header] };
          break;
        case 'capitalePreRendimento':
          const capitaleInizialeCol = getColumnLetter(headerMap['capitaleIniziale']);
          const utilePerditaNettoCol = getColumnLetter(headerMap['utilePerditaNetto']);
          cell.value = { formula: `=${capitaleInizialeCol}${currentRowNumber} + ${utilePerditaNettoCol}${currentRowNumber}`, result: row[header] };
          break;
        case 'rendimentoNetto':
          const rendimentoLordoCol = getColumnLetter(headerMap['rendimentoLordo']);
          const impostaRenditeCol = getColumnLetter(headerMap['impostaRendite']);
          cell.value = { formula: `=${rendimentoLordoCol}${currentRowNumber} - ${impostaRenditeCol}${currentRowNumber}`, result: row[header] };
          break;
        case 'capitaleFinale':
          const capitalePreRendimentoCol = getColumnLetter(headerMap['capitalePreRendimento']);
          const rendimentoNettoColForCF = getColumnLetter(headerMap['rendimentoNetto']);
          cell.value = { formula: `=${capitalePreRendimentoCol}${currentRowNumber} + ${rendimentoNettoColForCF}${currentRowNumber}`, result: row[header] };
          break;
        default:
          cell.value = row[header];
          break;
      }
    });

    // *** INIZIO BLOCCO SPOSTATO E CORRETTO ***
    // Applica lo stile DOPO aver popolato la riga
    if (row.capitaleIniziale <= 0) {
      excelRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF9999' } // Un rosso più chiaro per leggibilità
        };
      });
    }
    // *** FINE BLOCCO SPOSTATO E CORRETTO ***
  });

  // ... (tutta la logica per creare i grafici rimane invariata)
  const years = ultimoRisultato.map(r => r.anno);
  for (const metric of finalHeaders) {
    const sanitizedTitle = metric.replace(/[*?:/\[\]]/g, '');
    const chartWorksheet = workbook.addWorksheet(`Grafico ${sanitizedTitle}`);
    const data = ultimoRisultato.map(r => ({ x: r.anno, y: r[metric] }));
    chartWorksheet.addRow(['Anno', metric]);
    data.forEach(d => chartWorksheet.addRow([d.x, d.y]));
    const configuration = {
      type: 'line',
      data: {
        labels: years,
        datasets: [{
          label: metric,
          data: data.map(d => d.y),
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          fill: true,
          tension: 0.2,
        }],
      },
      options: {
        plugins: { title: { display: true, text: `Andamento ${metric}` } },
        scales: { x: { title: { display: true, text: 'Anno' } }, y: { title: { display: true, text: 'Importo' } } },
      },
    };
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = 800;
    offscreenCanvas.height = 400;
    offscreenCanvas.style.display = 'none';
    document.body.appendChild(offscreenCanvas);
    const ctx = offscreenCanvas.getContext('2d');
    if (ctx) {
      const chartInstance = new Chart(ctx, configuration);
      await new Promise(resolve => { chartInstance.update(); setTimeout(() => { resolve(); }, 100); });
      const imageDataUrl = chartInstance.toBase64Image();
      chartInstance.destroy();
      document.body.removeChild(offscreenCanvas);
      const base64Data = imageDataUrl.replace(/^data:image\/png;base64,/, '');
      const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
      chartWorksheet.addImage(imageId, { tl: { col: 4, row: 1 }, br: { col: 13, row: 20 } });
    }
  }
  const capitaleInizialeData = ultimoRisultato.map(r => r.capitaleIniziale);
  const capitaleFinaleData = ultimoRisultato.map(r => r.capitaleFinale);
  const mainChartConfig = {
    type: 'bar',
    data: {
      labels: years,
      datasets: [{
        label: 'Capitale Iniziale',
        data: capitaleInizialeData,
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      }, {
        label: 'Capitale Finale',
        data: capitaleFinaleData,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      }]
    },
    options: {
      plugins: { title: { display: true, text: 'Confronto Capitale Iniziale vs. Finale' } },
      scales: { y: { beginAtZero: true } }
    }
  };
  const mainCanvas = document.createElement('canvas');
  mainCanvas.width = 1200;
  mainCanvas.height = 600;
  mainCanvas.style.display = 'none';
  document.body.appendChild(mainCanvas);
  const mainCtx = mainCanvas.getContext('2d');
  if (mainCtx) {
    const mainChartInstance = new Chart(mainCtx, mainChartConfig);
    await new Promise(resolve => { mainChartInstance.update(); setTimeout(() => { resolve(); }, 100); });
    const mainImageDataUrl = mainChartInstance.toBase64Image();
    mainChartInstance.destroy();
    document.body.removeChild(mainCanvas);
    const mainBase64Data = mainImageDataUrl.replace(/^data:image\/png;base64,/, '');
    const mainImageId = workbook.addImage({ base64: mainBase64Data, extension: 'png' });
    const startCol = finalHeaders.length + 2;
    worksheet.addImage(mainImageId, { tl: { col: startCol, row: 1 }, br: { col: startCol + 12, row: 25 } });
  }

  workbook.xlsx.writeBuffer().then(data => {
    const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dettaglio_annuale_simulazione.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  });
}

export async function esportaCapitaleExcel(ultimoRisultato, formInputs, monteCarloSummaryResults, scenarioA, mostraNotifica) {
  if (!ultimoRisultato || ultimoRisultato.length === 0) {
    mostraNotifica(
      "Nessun Dato",
      "Esegui una simulazione prima di esportare i dati del capitale.",
      false
    );
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const sheetName = "Andamento Capitale";
  const worksheet = workbook.addWorksheet(sheetName);

  let chart_datasets = [];
  let chart_labels = [];
  let data_headers = [];

  if (formInputs.simMode === "montecarlo") {
    data_headers = ["Anno", "25° percentile", "Mediana", "75° percentile"];
    worksheet.addRow(data_headers);
    
    const numYears = monteCarloSummaryResults.p50.length;
    const startYear = new Date().getFullYear();
    for (let i = 0; i < numYears; i++) {
        const year = startYear + i;
        chart_labels.push(year);
        worksheet.addRow([
            year,
            monteCarloSummaryResults.p25[i],
            monteCarloSummaryResults.p50[i],
            monteCarloSummaryResults.p75[i]
        ]);
    }

    chart_datasets = [
        { label: "Mediana (P50)", data: monteCarloSummaryResults.p50, borderColor: "#0d9488", tension: 0.2, borderWidth: 2.5, pointRadius: 0 },
        { label: "Range Interquartile (P25-P75)", data: monteCarloSummaryResults.p75, borderColor: "rgba(13, 148, 136, 0.2)", backgroundColor: "rgba(13, 148, 136, 0.2)", fill: '+1', pointRadius: 0 },
        { label: "25° percentile (P25)", data: monteCarloSummaryResults.p25, borderColor: "rgba(13, 148, 136, 0.2)", backgroundColor: "rgba(13, 148, 136, 0.2)", fill: false, pointRadius: 0 },
    ];

  } else { // Deterministic or Backtest
    data_headers = ["Anno", "Capitale Finale (Scenario Corrente)"];
    if (scenarioA && !scenarioA.isMonteCarlo) {
      data_headers.push("Capitale Finale (Scenario A)");
    }
    worksheet.addRow(data_headers);

    ultimoRisultato.forEach((r, index) => {
      const rowData = [r.anno, r.capitaleFinale];
      if (scenarioA && !scenarioA.isMonteCarlo) {
        rowData.push(scenarioA.risultati[index].capitaleFinale);
      }
      worksheet.addRow(rowData);
    });
    
    chart_labels = ultimoRisultato.map(r => r.anno);
    chart_datasets.push({
        label: "Scenario B (Corrente)", data: ultimoRisultato.map((r) => r.capitaleFinale), borderColor: "#0d9488", backgroundColor: "rgba(13, 148, 136, 0.1)", fill: true, tension: 0.2,
    });

    if (scenarioA && !scenarioA.isMonteCarlo) {
        chart_datasets.push({
            label: "Scenario A", data: scenarioA.risultati.map((r) => r.capitaleFinale), borderColor: "#be185d", borderDash: [5, 5], backgroundColor: "transparent", fill: false, tension: 0.2,
        });
    }
  }

  const configuration = {
    type: 'line',
    data: { labels: chart_labels, datasets: chart_datasets },
    options: { plugins: { title: { display: true, text: 'Andamento Capitale' } }, scales: { x: { title: { display: true, text: 'Anno' } }, y: { title: { display: true, text: 'Capitale' } } } }
  };

  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = 1200;
  offscreenCanvas.height = 600;
  offscreenCanvas.style.display = 'none';
  document.body.appendChild(offscreenCanvas);
  const ctx = offscreenCanvas.getContext('2d');

  if (ctx) {
    const chartInstance = new Chart(ctx, configuration);
    await new Promise(resolve => { chartInstance.update(); setTimeout(() => { resolve(); }, 200); });
    const imageDataUrl = chartInstance.toBase64Image();
    chartInstance.destroy();
    document.body.removeChild(offscreenCanvas);
    const base64Data = imageDataUrl.replace(/^data:image\/png;base64,/, '');
    const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
    const startCol = data_headers.length + 1;
    worksheet.addImage(imageId, {
        tl: { col: startCol, row: 1 },
        br: { col: startCol + 9, row: 20 }
    });
  }

  workbook.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "andamento_capitale.xlsx";
    link.click();
    URL.revokeObjectURL(link.href);
  });
}

export async function esportaFlussiExcel(ultimoRisultato, formInputs, mostraNotifica) {
  if (!ultimoRisultato || ultimoRisultato.length === 0 || formInputs.simMode === "montecarlo") {
    mostraNotifica(
      "Nessun Dato",
      "Esegui una simulazione deterministica o backtest per esportare i flussi di cassa.",
      false
    );
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Flussi di Cassa");
  const dataToExport = ultimoRisultato.map((r) => ({
    Anno: r.anno,
    "Entrate Totali": r.totaleEntrate,
    "Uscite Totali": r.totaleUscite,
  }));

  const headers = Object.keys(dataToExport[0]);
  worksheet.addRow(headers);
  dataToExport.forEach(row => {
    worksheet.addRow(Object.values(row));
  });

  const years = ultimoRisultato.map(r => r.anno);
  const entrateTotali = ultimoRisultato.map(r => r.totaleEntrate);
  const usciteTotali = ultimoRisultato.map(r => r.totaleUscite);

  const configuration = {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Entrate Totali',
          data: entrateTotali,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          fill: true,
          tension: 0.2,
        },
        {
          label: 'Uscite Totali',
          data: usciteTotali,
          borderColor: '#F44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          fill: true,
          tension: 0.2,
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Andamento Flussi di Cassa',
        },
      },
      scales: {
        x: { title: { display: true, text: 'Anno' } },
        y: { title: { display: true, text: 'Importo' } },
      },
    },
  };

  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = 1200;
  offscreenCanvas.height = 600;
  offscreenCanvas.style.display = 'none';
  document.body.appendChild(offscreenCanvas);
  const ctx = offscreenCanvas.getContext('2d');

  if (ctx) {
    const chartInstance = new Chart(ctx, configuration);
    await new Promise(resolve => { chartInstance.update(); setTimeout(() => { resolve(); }, 200); });
    const imageDataUrl = chartInstance.toBase64Image();
    chartInstance.destroy();
    document.body.removeChild(offscreenCanvas);
    const base64Data = imageDataUrl.replace(/^data:image\/png;base64,/, '');
    const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
    const startCol = headers.length + 1;
    worksheet.addImage(imageId, {
        tl: { col: startCol, row: 1 },
        br: { col: startCol + 9, row: 20 }
    });
  }

  workbook.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "flussi_di_cassa.xlsx";
    link.click();
    URL.revokeObjectURL(link.href);
  });
}

export function salvaConfronto(scenarioA, ultimoRisultato, formInputs, saveScenarioBtnDisabled, resetScenarioBtnHidden, mostraNotifica) {
  scenarioA.value = {
    risultati: ultimoRisultato.value,
    isMonteCarlo: formInputs.simMode === "montecarlo",
  };
  saveScenarioBtnDisabled.value = true;
  resetScenarioBtnHidden.value = false;
  mostraNotifica("Scenario Salvato", "Lo scenario corrente è stato salvato come Scenario A.");
}

export function resetConfronto(scenarioA, saveScenarioBtnDisabled, resetScenarioBtnHidden, mostraNotifica) {
  scenarioA.value = null;
  saveScenarioBtnDisabled.value = false;
  resetScenarioBtnHidden.value = true;
  mostraNotifica("Scenario Resettato", "Lo Scenario A è stato resettato.");
}