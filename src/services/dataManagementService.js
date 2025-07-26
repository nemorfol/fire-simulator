import ExcelJS from 'exceljs';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export function importaCSV(event, formInputs, mostraNotifica) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = new ExcelJS.Workbook();
    workbook.xlsx.load(data).then(() => {
      const worksheet = workbook.getWorksheet(1);
      const json = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          // headers
          json.push(row.values.filter(Boolean));
        } else {
          json.push(row.values.filter(Boolean));
        }
      });

      if (json.length > 1) {
        const headers = json[0];
        const values = json[1];
        const loadedData = {};
        headers.forEach((header, i) => {
          loadedData[header] = values[i];
        });
        Object.assign(formInputs, loadedData);
        mostraNotifica("Successo", "Dati importati correttamente.");
      } else {
        mostraNotifica("Errore", "Il file è vuoto o malformato.", true);
      }
    });
  };
  reader.onerror = () => {
    mostraNotifica("Errore", "Impossibile leggere il file.", true);
  };
  reader.readAsArrayBuffer(file);
}

export function esportaCSV(formInputs) {
  const dataToExport = JSON.parse(JSON.stringify(formInputs));
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Configurazione Simulatore");

  const headers = Object.keys(dataToExport);
  const values = Object.values(dataToExport);

  worksheet.addRow(headers);
  worksheet.addRow(values);

  workbook.xlsx.writeBuffer().then(data => {
    const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "configurazione_simulatore.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  });
}

export async function esportaExcel(ultimoRisultato, risultatiHeader, risultatiBody, mostraNotifica) {
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

  worksheet.addRow(risultatiHeader.value);
  risultatiBody.value.forEach(row => {
    worksheet.addRow(risultatiHeader.value.map(header => row[header]));
  });

  const years = ultimoRisultato.map(r => r.anno);
  const excludedHeaders = ['anno', 'eta'];
  const metricsToPlot = risultatiHeader.value.filter(header => 
    !excludedHeaders.includes(header.toLowerCase()) && 
    typeof ultimoRisultato[0][header] === 'number'
  );

  for (const metric of metricsToPlot) {
    const sanitizedTitle = metric.replace(/[*?:/\[\]]/g, ''); // Rimuovi caratteri non validi
    const chartWorksheet = workbook.addWorksheet(`Grafico ${sanitizedTitle}`);

    const data = ultimoRisultato.map(r => ({ x: r.anno, y: r[metric] }));

    chartWorksheet.addRow(['Anno', metric]);
    data.forEach(d => chartWorksheet.addRow([d.x, d.y]));

    const configuration = {
      type: 'line',
      data: {
        labels: years,
        datasets: [
          {
            label: metric,
            data: data.map(d => d.y),
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            fill: true,
            tension: 0.2,
          },
        ],
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: `Andamento ${metric}`,
          },
        },
        scales: {
          x: { title: { display: true, text: 'Anno' } },
          y: { title: { display: true, text: 'Importo' } },
        },
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
      await new Promise(resolve => {
        chartInstance.update();
        setTimeout(() => {
          resolve();
        }, 100);
      });

      const imageDataUrl = chartInstance.toBase64Image();
      chartInstance.destroy();
      document.body.removeChild(offscreenCanvas);
      const base64Data = imageDataUrl.replace(/^data:image\/png;base64,/, '');
      const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
      chartWorksheet.addImage(imageId, {
        tl: { col: 4, row: 1 },
        br: { col: 13, row: 20 },
      });
    }
  }

  // Grafico principale: Capitale Iniziale vs. Finale
  const capitaleInizialeData = ultimoRisultato.map(r => r.capitaleIniziale);
  const capitaleFinaleData = ultimoRisultato.map(r => r.capitaleFinale);

  const mainChartConfig = {
    type: 'bar',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Capitale Iniziale',
          data: capitaleInizialeData,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
        {
          label: 'Capitale Finale',
          data: capitaleFinaleData,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
        }
      ]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Confronto Capitale Iniziale vs. Finale'
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
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
    await new Promise(resolve => {
      mainChartInstance.update();
      setTimeout(() => { resolve(); }, 100);
    });

    const mainImageDataUrl = mainChartInstance.toBase64Image();
    mainChartInstance.destroy();
    document.body.removeChild(mainCanvas);

    const mainBase64Data = mainImageDataUrl.replace(/^data:image\/png;base64,/, '');
    const mainImageId = workbook.addImage({
      base64: mainBase64Data,
      extension: 'png',
    });

    const startCol = risultatiHeader.value.length + 2;
    worksheet.addImage(mainImageId, {
      tl: { col: startCol, row: 1 },
      br: { col: startCol + 12, row: 25 }
    });
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