<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import SimulationSettings from "./components/SimulationSettings.vue";
import TaxBrackets from "./components/TaxBrackets.vue";
import AssetAllocation from "./components/AssetAllocation.vue";
import GoalSeek from "./components/GoalSeek.vue";
import DataManagement from "./components/DataManagement.vue";
import IncomeSection from "./components/IncomeSection.vue";
import ExpenseSection from "./components/ExpenseSection.vue";
import NotificationModal from "./components/NotificationModal.vue";
import AppLoader from "./components/AppLoader.vue";
import FireDashboard from "./components/FireDashboard.vue";
import MonteCarloDashboard from "./components/MonteCarloDashboard.vue";
import WorstCaseChart from './components/WorstCaseChart.vue';
import StressTestDashboard from "./components/StressTestDashboard.vue";
import SuggestionsCard from "./components/SuggestionsCard.vue";
import CapitalChart from "./components/CapitalChart.vue";
import CashFlowChart from "./components/CashFlowChart.vue";
import AnnualDetailTable from "./components/AnnualDetailTable.vue";
import DebtSection from "./components/DebtSection.vue";
import SummaryDashboard from "./components/SummaryDashboard.vue";
import JsonDataManagement from "./components/JsonDataManagement.vue";

// Import services
import { leggiInput } from "./services/financialCalculator";
import { importaJSON, esportaJSON, esportaExcel as exportExcelService, esportaCapitaleExcel as exportCapitalExcelService, esportaFlussiExcel as exportCashFlowExcelService, salvaConfronto as saveComparisonService, resetConfronto as resetComparisonService } from "./services/dataManagementService.js";
import { popolaDatiIniziali as initializeDataService } from "./services/initializationService.js";
import { eseguiGoalSeek as executeGoalSeekService } from "./services/goalSeekService.js";
import { avviaSimulazione as runSimulationService } from "./services/simulationService.js";
import { generateSimulationReport } from "./services/pdfGeneratorService.js";

// Funzioni di utilità
const formatterValuta = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

// Dati reattivi
const datiEsempio = {
  entrateRicorrenti: [
    {
      desc: "Stipendio",
      valore: 45000,
      isTodayValue: true,
      inizio: 2025,
      fine: 2035,
      incr: 1.5,
      inPensione: false,
      taxRegime: "ordinaria",
      aliquotaSost: 0,
    },
    {
      desc: "Pensione INPS",
      valore: 28000,
      isTodayValue: true,
      inizio: 2036,
      fine: 2070,
      incr: 1.0,
      inPensione: true,
      taxRegime: "ordinaria",
      aliquotaSost: 0,
    },
    {
      desc: "Pensione Integrativa",
      valore: 12000,
      isTodayValue: true,
      inizio: 2036,
      fine: 2070,
      incr: 1.2,
      inPensione: true,
      taxRegime: "sostitutiva",
      aliquotaSost: 9,
    },
    {
      desc: "Affitto Immobile 1",
      valore: 7200,
      isTodayValue: true,
      inizio: 2025,
      fine: 2070,
      incr: 2.0,
      inPensione: true,
      taxRegime: "sostitutiva",
      aliquotaSost: 21,
    },
    {
      desc: "Cedole Titoli",
      valore: 5000,
      isTodayValue: true,
      inizio: 2025,
      fine: 2070,
      incr: 0.0,
      inPensione: true,
      taxRegime: "esente",
      aliquotaSost: 0,
    },
  ],
  entrateLumpSum: [
    {
      desc: "Liquidazione (TFR)",
      importo: 80000,
      isTodayValue: true,
      anno: 2035,
    },
    { desc: "Eredit", importo: 100000, isTodayValue: true, anno: 2040 },
    {
      desc: "Vendita Immobile",
      importo: 200000,
      isTodayValue: true,
      anno: 2050,
    },
  ],
  usciteRicorrenti: [
    {
      desc: "Spese Casa",
      valore: 12000,
      isTodayValue: true,
      inizio: 2025,
      fine: 2070,
      incr: 0,
      inflazioneSpecifica: 0,
    },
    {
      desc: "Spese Alimentari",
      valore: 6000,
      isTodayValue: true,
      inizio: 2025,
      fine: 2070,
      incr: 0,
      inflazioneSpecifica: 0,
    },
    {
      desc: "Trasporti",
      valore: 2000,
      isTodayValue: true,
      inizio: 2025,
      fine: 2070,
      incr: 0,
      inflazioneSpecifica: 0,
    },
  ],
  usciteLumpSum: [
    {
      desc: "Acquisto Auto",
      importo: 25000,
      isTodayValue: true,
      anno: 2030,
    },
    {
      desc: "Viaggio Lungo",
      importo: 10000,
      isTodayValue: true,
      anno: 2045,
    },
  ],

  assetAllocation: [
    { nome: "Azioni Globali", quota: 60, rendimento: 8.5, devStd: 15 },
    { nome: "Obbligazioni Globali", quota: 30, rendimento: 3.5, devStd: 5 },
    { nome: "Liquidit", quota: 10, rendimento: 1.5, devStd: 0.5 },
  ],
  taxBrackets: [
    { finoA: 28000, aliquota: 23 },
    { finoA: 50000, aliquota: 35 },
    { finoA: Infinity, aliquota: 43 },
  ],
};

// Dati del form (user input)
const formInputs = reactive({
  etaIniziale: 25,
  capitaleIniziale: 300000,
  tassoInflazione: 2.5,
  regolaFIRE: 4,
  tassazioneRendite: 26,
  etaRitiro: 65,
  numeroSimulazioni: 1000,
  simMode: "deterministic",
  
  strategiaPrelievo: "regolaFIRE",
  costiSanitariPensione: 0, // Nuovo campo per i costi sanitari in pensione
  scenarioCrisi: 'none', // Nuovo campo per la selezione dello scenario di crisi
  taxBrackets: reactive([
    { finoA: 28000, aliquota: 23 },
    { finoA: 50000, aliquota: 35 },
    { finoA: Infinity, aliquota: 43 },
  ]),
  assetAllocation: reactive([
    { nome: "Azioni Globali", quota: 60, rendimento: 8.5, devStd: 15 },
    { nome: "Obbligazioni Globali", quota: 30, rendimento: 3.5, devStd: 5 },
    { nome: "Liquidit", quota: 10, rendimento: 1.5, devStd: 0.5 },
  ]),
  entrateRicorrenti: reactive([]),
  entrateLumpSum: reactive([]),
  usciteRicorrenti: reactive([]),
  usciteLumpSum: reactive([]),
  correlazioneAsset: "",
  debiti: reactive([]), // Nuovo campo per la gestione dei debiti
});

// Variabili per la UI
const showResults = ref(false);
const notificationModalHidden = ref(true);
const notificationTitle = ref("");
const notificationBody = ref("");
const notificationIsError = ref(false);
const loaderHidden = ref(true);
const risultatiHeader = ref([]);
const risultatiBody = ref([]);
const goalSeekVariableOptions = ref([]);
const saveScenarioBtnDisabled = ref(false);
const resetScenarioBtnHidden = ref(true);
const datasetsCapitale = ref([]);
const stressTestResult = ref(null);
const scenarioA = ref(null);
const ultimoRisultato = ref(null);
const monteCarloSummaryResults = ref(null);
const chartLabels = ref([]);
const showDetailedResults = ref(false); // Nuova variabile reattiva

// Computed properties
const numeroFIRE = computed(() => {
  const inputs = leggiInput(formInputs);
  if (!inputs) return 0;
  const totaleSpeseAnnuali = inputs.uscite.ricorrenti.reduce(
    (sum, u) => sum + u.valore,
    0
  );
  const regolaFIRE =
    inputs.impostazioni.regolaFIRE > 0 ? inputs.impostazioni.regolaFIRE : 4;
  const moltiplicatoreFIRE = 100 / regolaFIRE;
  return totaleSpeseAnnuali > 0 ? totaleSpeseAnnuali * moltiplicatoreFIRE : 0;
});

const datiFIRE = computed(() => {
  if (!ultimoRisultato.value || !Array.isArray(ultimoRisultato.value))
    return null;
  const inputs = leggiInput(formInputs);
  if (!inputs) return null;
  const fireNumber = numeroFIRE.value;
  return ultimoRisultato.value.find((r) => r.capitaleFinale >= fireNumber);
});

const suggestions = computed(() => {
  const inputs = leggiInput(formInputs);
  if (!inputs) return [];
  let currentSuggestions = [];

  if (inputs.impostazioni.simMode === "montecarlo") {
    currentSuggestions.push(
      "Analisi Monte Carlo completata. Controlla la probabilità di successo nella dashboard."
    );
  } else {
    if (datiFIRE.value) {
      currentSuggestions.push(
        `<strong>Obiettivo Raggiungibile:</strong> Secondo questa proiezione, raggiungerai l'indipendenza finanziaria a <strong>${datiFIRE.value.eta} anni</strong>. Per anticipare, valuta se puoi aumentare le entrate o ridurre le uscite.`
      );
    } else {
      currentSuggestions.push(
        "<strong>Obiettivo non Raggiunto:</strong> Con i parametri attuali, non raggiungi il tuo Numero FIRE. Le leve principali sono: aumentare le entrate (specialmente quelle da investimento), ridurre le uscite ricorrenti o posticipare l'età di fine di alcune spese importanti (es. mutuo)."
      );
    }
  }
  return currentSuggestions;
});

// Funzioni di utilità (direttamente in App.vue o delegate a servizi/componenti)
function mostraNotifica(titolo, messaggio, isError = false) {
  notificationTitle.value = titolo;
  notificationBody.value = messaggio;
  notificationIsError.value = isError;
  notificationModalHidden.value = false;
}

function chiudiNotifica() {
  notificationModalHidden.value = true;
}

// Funzioni di Aggiunta/Rimozione Righe (delegate ai componenti figli o servizi)
// Queste funzioni sono qui come placeholder per la compatibilità con initializeDataService
// e per la gestione degli eventi dai componenti figli.
function aggiungiRiga(tipoTabella, dati = {}) {
  if (tipoTabella === "entrateRicorrenti") {
    formInputs.entrateRicorrenti.push(dati);
  } else if (tipoTabella === "entrateLumpSum") {
    formInputs.entrateLumpSum.push(dati);
  }
  updateGoalSeekOptions();
}

function rimuoviRiga(tipoTabella, index) {
  if (tipoTabella === "entrateRicorrenti") {
    formInputs.entrateRicorrenti.splice(index, 1);
  } else if (tipoTabella === "entrateLumpSum") {
    formInputs.entrateLumpSum.splice(index, 1);
  }
  updateGoalSeekOptions();
}

function toggleAliquotaSost(event) {
  const selectElement = event.target;
  const aliquotaInput = selectElement
    .closest("tr")
    .querySelector(".aliquotaSost");
  if (aliquotaInput) {
    aliquotaInput.disabled = selectElement.value !== "sostitutiva";
  }
}

function aggiungiAsset(dati = {}) {
  formInputs.assetAllocation.push(dati);
  updateAllocationStatus();
}

function aggiungiScaglione(dati = {}) {
  formInputs.taxBrackets.push(dati);
  formInputs.taxBrackets.sort((a, b) => a.finoA - b.finoA); // Keep sorted
}

function updateAllocationStatus() {
  const quote = formInputs.assetAllocation.map(
    (asset) => parseFloat(asset.quota) || 0
  );
  const total = quote.reduce((sum, q) => sum + q, 0);
  // totalAllocationStatus.value = `Totale Allocato: ${total}%`; // totalAllocationStatus non è definito
}

function updateGoalSeekOptions() {
  const options = [];
  formInputs.entrateRicorrenti.forEach((entry, i) => {
    options.push({
      text: `Aumenta entrata: ${entry.desc || `Entrata ${i + 1}`}`,
      value: `entrata-${i}`,
    });
  });
  formInputs.usciteRicorrenti.forEach((exit, i) => {
    options.push({
      text: `Riduci uscita: ${exit.desc || `Uscita ${i + 1}`}`,
      value: `uscita-${i}`,
    });
  });
  goalSeekVariableOptions.value = options;
}

// Funzioni di Goal Seek (delegate al servizio goalSeekService)
async function handleExecuteGoalSeek() {
  await executeGoalSeekService(formInputs, loaderHidden, mostraNotifica);
}

// Funzione di avvio simulazione (delegate al servizio simulationService)
async function handleAvviaSimulazione() {
  const res = await runSimulationService(
    formInputs,
    ultimoRisultato,
    stressTestResult,
    monteCarloSummaryResults,
    risultatiBody,
    risultatiHeader,
    scenarioA,
    datasetsCapitale,
    loaderHidden,
    showResults,
    saveScenarioBtnDisabled,
    mostraNotifica
  );

  if (formInputs.simMode !== 'montecarlo') {
    datasetsCapitale.value = [
      {
        label: 'Scenario Corrente',
        data: res.map((r) => r.capitaleFinale),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ];
  }
}

function handleShowSankey(data) {
  const plotlyNodes = [];
  const plotlyLinksSource = [];
  const plotlyLinksTarget = [];
  const plotlyLinksValue = [];
  const plotlyLinksLabel = [];

  const nodeNameToIndex = {};
  let currentIndex = 0;

  function getOrAddNodeIndex(name) {
    if (nodeNameToIndex[name] === undefined) {
      nodeNameToIndex[name] = currentIndex++;
      plotlyNodes.push(name);
    }
    return nodeNameToIndex[name];
  }

  const currentYear = data.anno;
  const inflationRate = formInputs.tassoInflazione / 100;

  // --- Calcolo dei valori dettagliati per l'anno corrente --- 
  const detailedIncomes = {};
  formInputs.entrateRicorrenti.forEach(item => {
    if (currentYear >= item.inizio && currentYear <= item.fine) {
      const yearsPassed = currentYear - item.inizio;
      let value = item.valore * Math.pow(1 + item.incr / 100, yearsPassed);
      if (item.isTodayValue) {
        value *= Math.pow(1 + inflationRate, yearsPassed);
      }
      detailedIncomes[item.desc] = value;
    }
  });
  formInputs.entrateLumpSum.forEach(item => {
    if (currentYear === item.anno) {
      detailedIncomes[item.desc] = item.importo;
    }
  });

  const detailedExpenses = {};
  formInputs.usciteRicorrenti.forEach(item => {
    if (currentYear >= item.inizio && currentYear <= item.fine) {
      const yearsPassed = currentYear - item.inizio;
      const specificInflation = item.inflazioneSpecifica > 0 ? item.inflazioneSpecifica / 100 : inflationRate;
      let value = item.valore * Math.pow(1 + item.incr / 100, yearsPassed);
      if (item.isTodayValue) {
        value *= Math.pow(1 + specificInflation, yearsPassed);
      }
      detailedExpenses[item.desc] = value;
    }
  });
  formInputs.usciteLumpSum.forEach(item => {
    if (currentYear === item.anno) {
      detailedExpenses[item.desc] = item.importo;
    }
  });

  // --- Costruzione del grafico Sankey --- 

  // Livello 0: Entrate Dettagliate
  const entrateAggregateNode = getOrAddNodeIndex('Entrate Totali');
  for (const [desc, value] of Object.entries(detailedIncomes)) {
    if (value > 0) {
      const sourceNode = getOrAddNodeIndex(desc);
      plotlyLinksSource.push(sourceNode);
      plotlyLinksTarget.push(entrateAggregateNode);
      plotlyLinksValue.push(value);
      plotlyLinksLabel.push(`${desc}: ${value.toFixed(2)}`);
    }
  }

  // Livello 1: Uscite, Tasse, Risparmio
  const usciteNode = getOrAddNodeIndex('Uscite');
  const tasseNode = getOrAddNodeIndex('Tasse');
  const risparmioNode = getOrAddNodeIndex('Risparmio');

  if (data.totaleUscite > 0) {
    plotlyLinksSource.push(entrateAggregateNode);
    plotlyLinksTarget.push(usciteNode);
    plotlyLinksValue.push(data.totaleUscite);
    plotlyLinksLabel.push(`Entrate -> Uscite: ${data.totaleUscite.toFixed(2)}`);
  }
  if (data.impostaReddito + data.impostaRendite > 0) {
    plotlyLinksSource.push(entrateAggregateNode);
    plotlyLinksTarget.push(tasseNode);
    plotlyLinksValue.push(data.impostaReddito + data.impostaRendite);
    plotlyLinksLabel.push(`Entrate -> Tasse: ${(data.impostaReddito + data.impostaRendite).toFixed(2)}`);
  }
  if (data.utilePerditaNetto > 0) {
    plotlyLinksSource.push(entrateAggregateNode);
    plotlyLinksTarget.push(risparmioNode);
    plotlyLinksValue.push(data.utilePerditaNetto);
    plotlyLinksLabel.push(`Entrate -> Risparmio: ${data.utilePerditaNetto.toFixed(2)}`);
  }

  // Livello 2: Uscite Dettagliate
  for (const [desc, value] of Object.entries(detailedExpenses)) {
    if (value > 0) {
      const targetNode = getOrAddNodeIndex(desc);
      plotlyLinksSource.push(usciteNode);
      plotlyLinksTarget.push(targetNode);
      plotlyLinksValue.push(value);
      plotlyLinksLabel.push(`${desc}: ${value.toFixed(2)}`);
    }
  }

  // Livello 2: Tasse Dettagliate
  if (data.impostaReddito > 0) {
    const impostaRedditoNode = getOrAddNodeIndex('Imposta Reddito');
    plotlyLinksSource.push(tasseNode);
    plotlyLinksTarget.push(impostaRedditoNode);
    plotlyLinksValue.push(data.impostaReddito);
    plotlyLinksLabel.push(`Imposta Reddito: ${data.impostaReddito.toFixed(2)}`);
  }
  if (data.impostaRendite > 0) {
    const impostaRenditeNode = getOrAddNodeIndex('Imposta Rendite');
    plotlyLinksSource.push(tasseNode);
    plotlyLinksTarget.push(impostaRenditeNode);
    plotlyLinksValue.push(data.impostaRendite);
    plotlyLinksLabel.push(`Imposta Rendite: ${data.impostaRendite.toFixed(2)}`);
  }

  // Livello 2: Risparmio Dettagliato
  if (data.utilePerditaNetto - data.rendimentoNetto > 0) {
    const risparmioDaRedditoNode = getOrAddNodeIndex('Risparmio da Reddito');
    plotlyLinksSource.push(risparmioNode);
    plotlyLinksTarget.push(risparmioDaRedditoNode);
    plotlyLinksValue.push(data.utilePerditaNetto - data.rendimentoNetto);
    plotlyLinksLabel.push(`Risparmio da Reddito: ${(data.utilePerditaNetto - data.rendimentoNetto).toFixed(2)}`);
  }
  if (data.rendimentoNetto > 0) {
    const risparmioDaRendimentoNode = getOrAddNodeIndex('Risparmio da Rendimento');
    plotlyLinksSource.push(risparmioNode);
    plotlyLinksTarget.push(risparmioDaRendimentoNode);
    plotlyLinksValue.push(data.rendimentoNetto);
    plotlyLinksLabel.push(`Risparmio da Rendimento: ${data.rendimentoNetto.toFixed(2)}`);
  }

  const plotlyFigure = {
    data: [{
      type: 'sankey',
      node: {
        pad: 15,
        thickness: 20,
        line: {
          color: "black",
          width: 0.5
        },
        label: plotlyNodes,
        // Puoi personalizzare i colori qui, ad esempio in base alla categoria del nodo
        // color: plotlyNodes.map(name => { /* logica per assegnare colori */ })
      },
      link: {
        source: plotlyLinksSource,
        target: plotlyLinksTarget,
        value: plotlyLinksValue,
        label: plotlyLinksLabel,
        // Puoi personalizzare i colori dei link qui
      }
    }],
    layout: {
      title: `Flusso Finanziario Dettagliato per l'Anno ${currentYear}`,
      font: {
        size: 10
      }
    }
  };

  localStorage.setItem('sankeyData', JSON.stringify(plotlyFigure));
  window.open('/chart.html', '_blank', 'width=1000,height=700,resizable=yes,scrollbars=yes');
}

function handleViewDetails() {
  showDetailedResults.value = true;
}

const handleImportJson = (event) => {
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
};

const handleExportJson = () => {
  esportaJSON(formInputs, mostraNotifica);
};

function handleSaveScenario() {
  saveComparisonService(scenarioA, ultimoRisultato, formInputs, saveScenarioBtnDisabled, resetScenarioBtnHidden, mostraNotifica);
}

function handleResetScenario() {
  resetComparisonService(scenarioA, saveScenarioBtnDisabled, resetScenarioBtnHidden, mostraNotifica);
}

function openGuide() {
  
  window.open('/guide.html', '_blank', 'width=800,height=600,resizable=yes,scrollbars=yes');
}

function handleExportPdf() {
  generateSimulationReport(
    ultimoRisultato.value,
    risultatiHeader.value,
    risultatiBody.value,
    datiFIRE.value,
    monteCarloSummaryResults.value, // Aggiunto monteCarloSummaryResults
    formatterValuta,
    mostraNotifica,
    formInputs
  );
}

function handleExportExcel() {
  exportExcelService(ultimoRisultato.value, formInputs, mostraNotifica);
}

function handleExportCapitalExcel() {
  exportCapitalExcelService(ultimoRisultato.value, formInputs, monteCarloSummaryResults.value, scenarioA.value, mostraNotifica);
}

function handleExportCashFlowExcel() {
  exportCashFlowExcelService(ultimoRisultato.value, formInputs, mostraNotifica);
}

// Lifecycle hook
onMounted(() => {
  initializeDataService(
    formInputs,
    datiEsempio,
    aggiungiRiga, // Passa la funzione aggiungiRiga
    aggiungiAsset, // Passa la funzione aggiungiAsset
    aggiungiScaglione, // Passa la funzione aggiungiScaglione
    updateGoalSeekOptions // Passa la funzione updateGoalSeekOptions
  );
});
</script>

<template>
  <div class="container mx-auto p-4 md:p-8">
    <header class="text-center mb-10">
      <h1 class="text-4xl font-extrabold text-gray-900">
        Simulatore Strategico F.I.R.E.
      </h1>
      <p class="mt-2 text-lg text-gray-600">
        Analizza, confronta e pianifica il tuo percorso verso l'indipendenza
        financiaria.
      </p>
      <button @click="openGuide" class="btn btn-sm btn-info mt-4">Guida Dettagliata</button>
    </header>

    

    <!-- Sezione Parametri -->
    <div id="parameters">
      <h2 class="section-title">Parametri di Simulazione</h2>
      <JsonDataManagement @import-json="handleImportJson" @export-json="handleExportJson" />
      
      <SimulationSettings v-model="formInputs" />
      <TaxBrackets v-model:taxBrackets="formInputs.taxBrackets" />
      <AssetAllocation v-model="formInputs.assetAllocation" />
      <DebtSection v-model="formInputs.debiti" />
      <GoalSeek
        v-model="formInputs"
        :goal-seek-options="goalSeekVariableOptions"
        @execute-goal-seek="handleExecuteGoalSeek"
      />
      <DataManagement
        :save-scenario-btn-disabled="saveScenarioBtnDisabled"
        :reset-scenario-btn-hidden="resetScenarioBtnHidden"
        @save-scenario="handleSaveScenario"
        @reset-scenario="handleResetScenario"
      />
      <IncomeSection
        v-model:entrateRicorrenti="formInputs.entrateRicorrenti"
        v-model:entrateLumpSum="formInputs.entrateLumpSum"
        @add-riga="aggiungiRiga"
        @remove-riga="rimuoviRiga"
        @update-goal-seek-options="updateGoalSeekOptions"
        @toggle-aliquota-sost="toggleAliquotaSost"
      />
      <ExpenseSection
        v-model:usciteRicorrenti="formInputs.usciteRicorrenti"
        v-model:usciteLumpSum="formInputs.usciteLumpSum"
        @expenses-updated="updateGoalSeekOptions"
      />
    </div>

    <div class="text-center my-8">
      <button
        @click="handleAvviaSimulazione()"
        class="btn btn-primary text-lg px-8 py-3"
      >
        Avvia Simulazione
      </button>
    </div>

    <div id="results" v-show="showResults">
      <SummaryDashboard
        v-if="formInputs.simMode === 'montecarlo' && monteCarloSummaryResults"
        :simMode="formInputs.simMode"
        :numeroFIRE="numeroFIRE"
        :datiFIRE="datiFIRE"
        :monteCarloSummaryResults="monteCarloSummaryResults"
        :ultimoRisultato="ultimoRisultato"
        :formatterValuta="formatterValuta"
        @view-details="handleViewDetails"
      />
      <h2 class="section-title">Risultati della Simulazione</h2>
      <div
        id="scenario-dashboard"
        class="hidden card bg-pink-50 border-2 border-pink-200"
      ></div>
      <FireDashboard
        :simMode="formInputs.simMode"
        :numeroFIRE="numeroFIRE"
        :datiFIRE="datiFIRE"
        :formatterValuta="formatterValuta"
        @view-details="handleViewDetails"
      />
      <MonteCarloDashboard
        :simMode="formInputs.simMode"
        :monteCarloSummaryResults="monteCarloSummaryResults"
      />
      <div class="card mt-8" v-if="formInputs.simMode === 'montecarlo'">
        <WorstCaseChart :worst-case-scenario="monteCarloSummaryResults?.worstCase?.datiSimulazione" />
      </div>
      <StressTestDashboard
        :stressTestResult="stressTestResult"
        :formatterValuta="formatterValuta"
      />
      <SuggestionsCard :suggestions="suggestions" />
      <div v-show="showDetailedResults"> <!-- Contenitore per i risultati dettagliati -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="card">
            <div class="flex justify-between items-center mb-4">
              <h3 class="card-title mb-0">Andamento del Capitale nel Tempo</h3>
              <button
                @click="handleExportCapitalExcel()"
                class="btn btn-secondary btn-sm"
              >
                Esporta in Excel
              </button>
            </div>
            <div class="relative h-96 md:h-[450px]">
              <CapitalChart
                :labels="
                  formInputs.simMode === 'montecarlo'
                    ? (ultimoRisultato && ultimoRisultato.length > 0 && Array.isArray(ultimoRisultato[0]) ? ultimoRisultato[0].map((r) => r.anno) : [])
                    : (ultimoRisultato ? ultimoRisultato.map((r) => r.anno) : [])
                "
                :datasets="datasetsCapitale"
              />
            </div>
          </div>
          <div id="details-charts-card" class="card" v-if="formInputs.simMode !== 'montecarlo'">
            <div class="flex justify-between items-center mb-4">
              <h3 class="card-title mb-0">
                Andamento Flussi di Cassa (Scenario Corrente)
              </h3>
              <button
                @click="handleExportCashFlowExcel()"
                class="btn btn-secondary btn-sm"
              >
                Esporta in Excel
              </button>
            </div>
            <div class="relative h-96 md:h-[450px]">
              <CashFlowChart :risultati="ultimoRisultato" />
            </div>
          </div>
        </div>
        <div id="dettaglio-annuale-card" class="card mt-8" v-if="formInputs.simMode !== 'montecarlo'">
          <h3 class="card-title">Dettaglio Annuale (Scenario Corrente)</h3>
          <button @click="handleExportExcel()" class="btn btn-secondary mb-4">
            Esporta in Excel
          </button>
          <button @click="handleExportPdf()" class="btn btn-secondary mb-4 ml-2">
            Esporta in PDF
          </button>
          <AnnualDetailTable
              :risultatiHeader="risultatiHeader"
              :risultatiBody="risultatiBody"
              :datiFIRE="datiFIRE"
              :formatterValuta="formatterValuta"
              @show-sankey="handleShowSankey"
            />
          </div>
        </div>
    </div>

  <NotificationModal
    :hidden="notificationModalHidden"
    :title="notificationTitle"
    :body="notificationBody"
    :isError="notificationIsError"
    @close="chiudiNotifica()"
  />

  <AppLoader :hidden="loaderHidden" />
</div>
</template>

<style></style>