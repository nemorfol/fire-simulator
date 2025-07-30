<script setup>
// Force re-compilation
import { ref, reactive, onMounted, computed, watch, nextTick } from "vue";
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
import WorstCaseChart from "./components/WorstCaseChart.vue";
import StressTestDashboard from "./components/StressTestDashboard.vue";
import SuggestionsCard from "./components/SuggestionsCard.vue";
import CapitalChart from "./components/CapitalChart.vue";
import CashFlowChart from "./components/CashFlowChart.vue";
import AnnualDetailTable from "./components/AnnualDetailTable.vue";
import DebtSection from "./components/DebtSection.vue";
import SummaryDashboard from "./components/SummaryDashboard.vue";
import JsonDataManagement from "./components/JsonDataManagement.vue";
import IncomeExpenseChart from "./components/IncomeExpenseChart.vue";
import NetWorthChart from "./components/NetWorthChart.vue";
import DebtWaterfallChart from "./components/DebtWaterfallChart.vue"; // Nuovo import
import TaxImpactChart from "./components/TaxImpactChart.vue"; // Nuovo import
import IncomeExpenseTabs from "./components/IncomeExpenseTabs.vue"; // Nuovo import
import Tab from "./components/Tab.vue"; // Nuovo import
import Tabs from "./components/Tabs.vue"; // Nuovo import
import SavingsRateChart from "./components/SavingsRateChart.vue"; // Nuovo import
import DebtChart from "./components/DebtChart.vue";
import BenchmarkChart from './components/BenchmarkChart.vue';
import OptimizationDashboard from './components/OptimizationDashboard.vue';
import PensionEstimator from './components/PensionEstimator.vue';
import FinancialPlan from './components/FinancialPlan.vue';

// Import services
import { leggiInput } from "./services/financialCalculator";
import {
  importaJSON,
  esportaJSON,
  esportaExcel as exportExcelService,
  esportaCapitaleExcel as exportCapitalExcelService,
  esportaFlussiExcel as exportCashFlowExcelService,
  esportaTassoRisparmioExcel as exportSavingsRateExcelService,
  esportaEntrateUsciteExcel as exportIncomeExpenseExcelService,
  esportaDebitiExcel as exportDebtsExcelService, // Aggiunto
  esportaImpattoFiscaleExcel as exportTaxImpactExcelService, // Aggiunto
  esportaMonteCarloExcel as exportMonteCarloExcelService,
  salvaConfronto as saveComparisonService,
  resetConfronto as resetComparisonService,
} from "./services/dataManagementService.js";
import { popolaDatiIniziali as initializeDataService } from "./services/initializationService.js";
import { eseguiGoalSeek as executeGoalSeekService } from "./services/goalSeekService.js";
import { avviaSimulazione as runSimulationService } from "./services/simulationService.js";
import { findOptimalExpenseReduction } from './services/optimizationService';
import { generateSimulationReport } from "./services/pdfGeneratorService.js";
import { estimatePublicPension } from './services/pensionService';
import axios from "axios"; // Aggiunto import

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
  etaMassimaSimulazione: 95,
};

// Dati del form (user input)
const formInputs = reactive({
  etaIniziale: 25,
  capitaleIniziale: 300000,
  tassoInflazione: 2.5,
  regolaFIRE: 4,
  tassazioneRendite: 26,
  benchmarkReturn: 7,
  etaRitiro: 65,
  numeroSimulazioni: 500,
  simMode: "deterministic",
  etaMassimaSimulazione: 95,

  strategiaPrelievo: "regolaFIRE",
  costiSanitariPensione: 0, // Nuovo campo per i costi sanitari in pensione
  scenarioCrisi: "none", // Nuovo campo per la selezione dello scenario di crisi
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
  goalSeek: reactive({ goalSeekTarget: 65, goalSeekVariable: null }),
  pension: reactive({
    initialGrossSalary: 35000,
    contributionStartYear: 2010,
    salaryGrowthRate: 2,
    contributionEndYear: 2050,
  }),
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
const ultimoRisultato = ref([]);
const monteCarloSummaryResults = ref(null);
const monteCarloResults = ref([]); // Nuovo ref per i risultati completi di Monte Carlo
const optimizationResult = ref(null);
const isOptimizing = ref(false);
const chartLabels = ref([]);
const showDetailedTabs = ref(false);
const activeTabName = ref(""); // Variabile per controllare il tab attivo

const visibleTabs = computed(() => {
  if (formInputs.simMode === "montecarlo") {
    return ["Andamento Capitale", "Monte Carlo"];
  } else {
    return [
      "Panoramica",
      "Piano Finanziario",
      "Entrate/Uscite",
      "Tasso di Risparmio",
      "Patrimonio Netto",
      "Andamento Capitale",
      "Flussi di Cassa",
      "Debiti",
      "Impatto Fiscale",
      "Benchmark",
      "Dettaglio Annuale",
    ];
  }
});

// Watch for changes in simMode to reset the active tab
watch(
  () => formInputs.simMode,
  (newMode) => {
    showResults.value = false;
    if (newMode === "montecarlo") {
      activeTabName.value = "Monte Carlo";
    } else {
      activeTabName.value = "Panoramica";
    }
  }
);

// Computed properties
const numeroFIRE = computed(() => {
  const inputs = leggiInput(formInputs);
  if (!inputs || !inputs.impostazioni.etaRitiro) return 0;

  const annoCorrente = new Date().getFullYear();
  const etaRitiro = inputs.impostazioni.etaRitiro;
  const etaIniziale = inputs.impostazioni.etaIniziale;
  const anniAlRitiro = etaRitiro - etaIniziale;
  const annoRitiro = annoCorrente + anniAlRitiro;

  if (anniAlRitiro < 0) return 0; // Età di ritiro già superata

  const totaleSpeseAnnualiAlRitiro = inputs.uscite.ricorrenti.reduce((sum, u) => {
    // Considera solo le spese che saranno ancora attive all'età del ritiro
    if (annoRitiro >= u.inizio && annoRitiro <= u.fine) {
      const anniTrascorsi = annoRitiro - u.inizio;
      const inflazioneSpecifica = u.inflazioneSpecifica > 0 ? u.inflazioneSpecifica / 100 : inputs.impostazioni.tassoInflazione / 100;
      
      let valoreUscitaAlRitiro = u.valore * Math.pow(1 + u.incr / 100, anniTrascorsi);
      if (u.isTodayValue) {
        valoreUscitaAlRitiro *= Math.pow(1 + inflazioneSpecifica, anniTrascorsi);
      }
      return sum + valoreUscitaAlRitiro;
    }
    return sum;
  }, 0);

  const regolaFIRE = inputs.impostazioni.regolaFIRE > 0 ? inputs.impostazioni.regolaFIRE : 4;
  const moltiplicatoreFIRE = 100 / regolaFIRE;
  return totaleSpeseAnnualiAlRitiro > 0 ? totaleSpeseAnnualiAlRitiro * moltiplicatoreFIRE : 0;
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
  if (!inputs || !ultimoRisultato.value || ultimoRisultato.value.length === 0) return [];

  let currentSuggestions = [];
  const ultimoAnnoRisultato = ultimoRisultato.value[ultimoRisultato.value.length - 1];
  const fireNumberFormatted = formatterValuta.format(numeroFIRE.value);
  const capitaleFinaleFormatted = formatterValuta.format(ultimoAnnoRisultato.capitaleFinale);

  if (formInputs.simMode === "montecarlo") {
    currentSuggestions.push(
      "Analisi Monte Carlo completata. Controlla la probabilità di successo nella dashboard."
    );
  } else {
    if (datiFIRE.value) {
      currentSuggestions.push(
        `<strong>Obiettivo Raggiungibile:</strong> Hai raggiunto e superato il tuo Numero FIRE di <strong>${fireNumberFormatted}</strong>, concludendo la simulazione con un capitale di <strong>${capitaleFinaleFormatted}</strong>. Ottimo lavoro!`
      );
    } else if (ultimoAnnoRisultato && ultimoAnnoRisultato.capitaleFinale > 0) {
        currentSuggestions.push(
        `<strong>Piano Sostenibile ma Obiettivo FIRE non Raggiunto:</strong> Il tuo capitale non si esaurisce. Termini la simulazione con <strong>${capitaleFinaleFormatted}</strong>, ma il tuo Numero FIRE obiettivo era <strong>${fireNumberFormatted}</strong>. Il piano è sostenibile, ma per raggiungere la piena indipendenza finanziaria potresti dover rivedere le tue spese in pensione o aumentare i rendimenti.`
      );
    } else {
      currentSuggestions.push(
        `<strong>Capitale Esaurito:</strong> Il tuo capitale si esaurisce prima della fine della simulazione. Il tuo obiettivo FIRE era <strong>${fireNumberFormatted}</strong>. È necessario rivedere il piano per garantirne la sostenibilità.`
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

async function handleRunOptimization() {
  isOptimizing.value = true;
  optimizationResult.value = null;

  const simulationRunner = async (inputs) => {
    return await runSimulationService(
      inputs,
      ref([]), // ref temporanei per non sporcare l'UI
      ref(null),
      ref(null),
      ref([]),
      ref([]),
      ref(null),
      ref([]),
      ref(true),
      ref(false),
      ref(false),
      () => {},
      ref([]),
      true // Modalità silenziosa
    );
  };

  try {
    const result = await findOptimalExpenseReduction(
      formInputs,
      numeroFIRE.value,
      simulationRunner
    );
    optimizationResult.value = result;
  } catch (error) {
    mostraNotifica("Errore di Ottimizzazione", error.message, true);
  }

  isOptimizing.value = false;
}

function handleEstimatePension() {
  const pensionInputs = {
    ...formInputs.pension,
    retirementAge: formInputs.etaRitiro,
    currentAge: formInputs.etaIniziale,
    simulationEndAge: formInputs.etaMassimaSimulazione,
  };

  const estimatedPension = estimatePublicPension(pensionInputs);

  if (estimatedPension) {
    // Rimuovi eventuali stime di pensione precedenti per evitare duplicati
    const index = formInputs.entrateRicorrenti.findIndex(e => e.desc === "Pensione Pubblica (Stimata)");
    if (index !== -1) {
      formInputs.entrateRicorrenti.splice(index, 1);
    }

    // Aggiungi la nuova stima
    formInputs.entrateRicorrenti.push(estimatedPension);
    mostraNotifica("Pensione Stimata", "La pensione pubblica è stata stimata e aggiunta alle entrate ricorrenti.");
  } else {
    mostraNotifica("Errore di Stima", "Impossibile stimare la pensione. Controlla i dati inseriti e i coefficienti nel servizio.", true);
  }
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
    mostraNotifica,
    monteCarloResults // Passa i risultati completi di Monte Carlo
  );

  if (res) {
    // Assicurati che la simulazione sia stata completata con successo
    showResults.value = true; // Mostra il pannello dei risultati
    if (formInputs.simMode === "montecarlo") {
      showDetailedTabs.value = false; // Nascondi i tab dettagliati per Monte Carlo
      activeTabName.value = "Monte Carlo"; // Imposta il tab Monte Carlo come attivo
    } else {
      showDetailedTabs.value = true; // Mostra subito i tab dettagliati per altre modalità
      activeTabName.value = "Panoramica"; // Imposta il tab Panoramica come attivo
    }
  }
}

function handleViewDetails() {
  showDetailedTabs.value = true;
  if (formInputs.simMode !== "montecarlo") {
    activeTabName.value = "Dettaglio Annuale";
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
  formInputs.entrateRicorrenti.forEach((item) => {
    if (currentYear >= item.inizio && currentYear <= item.fine) {
      const yearsPassed = currentYear - item.inizio;
      let value = item.valore * Math.pow(1 + item.incr / 100, yearsPassed);
      if (item.isTodayValue) {
        value *= Math.pow(1 + inflationRate, yearsPassed);
      }
      detailedIncomes[item.desc] = (detailedIncomes[item.desc] || 0) + value;
    }
  });
  formInputs.entrateLumpSum.forEach((item) => {
    if (currentYear === item.anno) {
      detailedIncomes[item.desc] =
        (detailedIncomes[item.desc] || 0) + item.importo;
    }
  });

  const detailedExpenses = {};
  formInputs.usciteRicorrenti.forEach((item) => {
    if (currentYear >= item.inizio && currentYear <= item.fine) {
      const yearsPassed = currentYear - item.inizio;
      const specificInflation =
        item.inflazioneSpecifica > 0
          ? item.inflazioneSpecifica / 100
          : inflationRate;
      let value = item.valore * Math.pow(1 + item.incr / 100, yearsPassed);
      if (item.isTodayValue) {
        value *= Math.pow(1 + specificInflation, yearsPassed);
      }
      detailedExpenses[item.desc] = (detailedExpenses[item.desc] || 0) + value;
    }
  });
  formInputs.usciteLumpSum.forEach((item) => {
    if (currentYear === item.anno) {
      detailedExpenses[item.desc] =
        (detailedExpenses[item.desc] || 0) + item.importo;
    }
  });

  // --- Costruzione del grafico Sankey ---

  // Livello 0: Entrate Dettagliate
  const entrateAggregateNode = getOrAddNodeIndex("Entrate Totali");
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
  const usciteNode = getOrAddNodeIndex("Uscite");
  const tasseNode = getOrAddNodeIndex("Tasse");
  const risparmioNode = getOrAddNodeIndex("Risparmio");

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
    plotlyLinksLabel.push(
      `Entrate -> Tasse: ${(data.impostaReddito + data.impostaRendite).toFixed(
        2
      )}`
    );
  }
  if (data.utilePerditaNetto > 0) {
    plotlyLinksSource.push(entrateAggregateNode);
    plotlyLinksTarget.push(risparmioNode);
    plotlyLinksValue.push(data.utilePerditaNetto);
    plotlyLinksLabel.push(
      `Entrate -> Risparmio: ${data.utilePerditaNetto.toFixed(2)}`
    );
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
    const impostaRedditoNode = getOrAddNodeIndex("Imposta Reddito");
    plotlyLinksSource.push(tasseNode);
    plotlyLinksTarget.push(impostaRedditoNode);
    plotlyLinksValue.push(data.impostaReddito);
    plotlyLinksLabel.push(`Imposta Reddito: ${data.impostaReddito.toFixed(2)}`);
  }
  if (data.impostaRendite > 0) {
    const impostaRenditeNode = getOrAddNodeIndex("Imposta Rendite");
    plotlyLinksSource.push(tasseNode);
    plotlyLinksTarget.push(impostaRenditeNode);
    plotlyLinksValue.push(data.impostaRendite);
    plotlyLinksLabel.push(`Imposta Rendite: ${data.impostaRendite.toFixed(2)}`);
  }

  // Livello 2: Risparmio Dettagliato
  if (data.utilePerditaNetto - data.rendimentoNetto > 0) {
    const risparmioDaRedditoNode = getOrAddNodeIndex("Risparmio da Reddito");
    plotlyLinksSource.push(risparmioNode);
    plotlyLinksTarget.push(risparmioDaRedditoNode);
    plotlyLinksValue.push(data.utilePerditaNetto - data.rendimentoNetto);
    plotlyLinksLabel.push(
      `Risparmio da Reddito: ${(
        data.utilePerditaNetto - data.rendimentoNetto
      ).toFixed(2)}`
    );
  }
  if (data.rendimentoNetto > 0) {
    const risparmioDaRendimentoNode = getOrAddNodeIndex(
      "Risparmio da Rendimento"
    );
    plotlyLinksSource.push(risparmioNode);
    plotlyLinksTarget.push(risparmioDaRendimentoNode);
    plotlyLinksValue.push(data.rendimentoNetto);
    plotlyLinksLabel.push(
      `Risparmio da Rendimento: ${data.rendimentoNetto.toFixed(2)}`
    );
  }

  const plotlyFigure = {
    data: [
      {
        type: "sankey",
        node: {
          pad: 15,
          thickness: 20,
          line: {
            color: "black",
            width: 0.5,
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
        },
      },
    ],
    layout: {
      title: `Flusso Finanziario Dettagliato per l'Anno ${currentYear}`,
      font: {
        size: 10,
      },
    },
  };

  localStorage.setItem("sankeyData", JSON.stringify(plotlyFigure));
  window.open(
    "/chart.html",
    "_blank",
    "width=1000,height=700,resizable=yes,scrollbars=yes"
  );
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
          if (
            typeof formInputs[key] === "object" &&
            formInputs[key] !== null &&
            !Array.isArray(formInputs[key])
          ) {
            // Se è un oggetto reattivo, aggiorna le sue proprietà
            Object.assign(formInputs[key], importedData[key]);
          } else if (Array.isArray(formInputs[key])) {
            // Se è un array reattivo, svuotalo e ripopolalo
            formInputs[key].splice(
              0,
              formInputs[key].length,
              ...importedData[key]
            );
          } else {
            // Per le proprietà semplici, assegna direttamente
            formInputs[key] = importedData[key];
          }
        }
      }
      mostraNotifica(
        "Importazione Completata",
        "I dati della simulazione sono stati caricati dal file JSON."
      );
    } catch (error) {
      console.error("Errore durante l'importazione JSON:", error);
      mostraNotifica(
        "Errore",
        "Impossibile leggere o parsare il file JSON. Assicurati che sia un JSON valido.",
        true
      );
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
  saveComparisonService(
    scenarioA,
    ultimoRisultato,
    formInputs,
    saveScenarioBtnDisabled,
    resetScenarioBtnHidden,
    mostraNotifica
  );
}

function handleResetScenario() {
  resetComparisonService(
    scenarioA,
    saveScenarioBtnDisabled,
    resetScenarioBtnHidden,
    mostraNotifica
  );
}

function openGuide() {
  window.open(
    "/guide.html",
    "_blank",
    "width=800,height=600,resizable=yes,scrollbars=yes"
  );
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
  exportCapitalExcelService(
    ultimoRisultato.value,
    formInputs,
    monteCarloSummaryResults.value,
    scenarioA.value,
    mostraNotifica
  );
}

function handleExportCashFlowExcel() {
  exportCashFlowExcelService(ultimoRisultato.value, formInputs, mostraNotifica);
}

function handleExportSavingsRateExcel() {
  exportSavingsRateExcelService(ultimoRisultato.value, mostraNotifica);
}

function handleExportIncomeExpenseExcel() {
  exportIncomeExpenseExcelService(
    ultimoRisultato.value,
    formInputs.entrateRicorrenti.map((e) => e.desc),
    formInputs.usciteRicorrenti.map((u) => u.desc),
    mostraNotifica
  );
}

function handleExportDebtsExcel() {
  exportDebtsExcelService(ultimoRisultato.value, formInputs, mostraNotifica);
}

function handleExportTaxImpactExcel() {
  exportTaxImpactExcelService(ultimoRisultato.value, mostraNotifica);
}

async function handleCalcolaSperanzaDiVita() {
  try {
    // Mostra un loader o un messaggio all'utente
    mostraNotifica(
      "Calcolo in corso...",
      "Recupero della speranza di vita in corso."
    );

    // Esegui la chiamata API
    // NOTA: L'API fornita è un esempio e restituisce dati complessi in formato CSV.
    // Per un'implementazione reale, sarebbe necessario parsare questo CSV
    // per estrarre la speranza di vita corretta in base ai parametri dell'utente (es. età attuale).
    // Per semplicità, qui usiamo un valore fisso.
    // const response = await axios.get('https://api.statbank.dk/v1/data/FOLK1A/CSV?lang=en&delimiter=Semicolon&OMR%C3%85DE=000&K%C3%98N=M%2CK&ALDER=*&Tid=*');

    // Valore di default per la speranza di vita.
    const speranzaDiVita = 85;

    formInputs.etaMassimaSimulazione = speranzaDiVita;

    // Nascondi il loader e mostra un messaggio di successo
    chiudiNotifica();
    mostraNotifica(
      "Calcolo completato",
      `L'età massima di simulazione è stata impostata a ${speranzaDiVita} anni.`
    );
  } catch (error) {
    console.error("Errore nel calcolo della speranza di vita:", error);
    chiudiNotifica();
    mostraNotifica(
      "Errore",
      "Impossibile calcolare la speranza di vita. Usiamo un valore di default. Controlla la console per maggiori dettagli.",
      true
    );
    // Fallback a un valore di default in caso di errore
    formInputs.etaMassimaSimulazione = 85;
  }
}

function handleScrollToAction(action) {
  if (action.tabName) {
    activeTabName.value = action.tabName;
  }

  // Usa nextTick per assicurarti che il DOM sia aggiornato prima di scrollare
  nextTick(() => {
    const element = document.getElementById(action.target);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

// Lifecycle hook
onMounted(() => {
  initializeDataService(
    formInputs,
    datiEsempio,
    aggiungiRiga,
    aggiungiAsset,
    aggiungiScaglione,
    updateGoalSeekOptions
  );
});
("");
</script>

<template>
  <div class="container mx-auto p-4 md:p-8">
    <header class="text-center mb-10">
      <h1 class="text-4xl font-extrabold text-gray-900">
        Simulatore Strategico F.I.R.E.
      </h1>
      <p class="mt-2 text-lg text-gray-600">
        Analizza, confronta e pianifica il tuo percorso verso l'indipendenza
        finanziaria.
      </p>
      <button @click="openGuide" class="btn btn-sm btn-info mt-4">
        Guida Dettagliata
      </button>
    </header>

    <!-- Sezione Parametri -->
    <div id="parameters">
      <h2 class="section-title">Parametri di Simulazione</h2>
      <JsonDataManagement
        @import-json="handleImportJson"
        @export-json="handleExportJson"
      />

      <SimulationSettings
        v-model="formInputs"
        @calculate-life-expectancy="handleCalcolaSperanzaDiVita"
      />
      <PensionEstimator 
        v-model="formInputs.pension"
        @estimate-pension="handleEstimatePension"
        id="pension-estimator"
      />
      <TaxBrackets v-model:taxBrackets="formInputs.taxBrackets" />
      <AssetAllocation v-model="formInputs.assetAllocation" />
      <DebtSection v-model="formInputs.debiti" id="debt-section" />
      <GoalSeek
        :goalSeekTarget="formInputs.goalSeek.goalSeekTarget"
        :goalSeekVariable="formInputs.goalSeek.goalSeekVariable"
        @update:goalSeekTarget="formInputs.goalSeek.goalSeekTarget = $event"
        @update:goalSeekVariable="formInputs.goalSeek.goalSeekVariable = $event"
        :goal-seek-options="goalSeekVariableOptions"
        @execute-goal-seek="handleExecuteGoalSeek"
      />
      <OptimizationDashboard
        :isLoading="isOptimizing"
        :result="optimizationResult"
        @run-optimization="handleRunOptimization"
      />
      <DataManagement
        :save-scenario-btn-disabled="saveScenarioBtnDisabled"
        :reset-scenario-btn-hidden="resetScenarioBtnHidden"
        @save-scenario="handleSaveScenario"
        @reset-scenario="handleResetScenario"
      />
      <IncomeExpenseTabs
        id="income-expense-tabs"
        :formInputs="formInputs"
        :aggiungiRiga="aggiungiRiga"
        :rimuoviRiga="rimuoviRiga"
        :updateGoalSeekOptions="updateGoalSeekOptions"
        :toggleAliquotaSost="toggleAliquotaSost"
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

      <tabs
        v-if="showDetailedTabs"
        :tabs="visibleTabs"
        :active-tab="activeTabName"
      >
        <tab title="Panoramica">
          <SuggestionsCard :suggestions="suggestions" />
        </tab>
        <tab title="Piano Finanziario">
          <FinancialPlan :financialData="formInputs" @scroll-to-section="handleScrollToAction" />
        </tab>
        <tab title="Entrate/Uscite">
          <div id="income-expense-chart-container">
            <div class="card">
              <div class="flex justify-between items-center mb-4">
                <h3 class="card-title mb-0">Entrate e Uscite per Categoria</h3>
                <button
                  @click="handleExportIncomeExpenseExcel()"
                  class="btn btn-secondary btn-sm"
                >
                  Esporta in Excel
                </button>
              </div>
              <IncomeExpenseChart
                :simulationResults="ultimoRisultato"
                :incomeCategories="
                  formInputs.entrateRicorrenti.map((e) => e.desc)
                "
                :expenseCategories="
                  formInputs.usciteRicorrenti.map((u) => u.desc)
                "
              />
            </div>
          </div>
        </tab>
        <tab title="Tasso di Risparmio">
          <div class="card">
            <div class="flex justify-between items-center mb-4">
              <h3 class="card-title mb-0">
                Andamento del Tasso di Risparmio nel Tempo
              </h3>
              <button
                @click="handleExportSavingsRateExcel()"
                class="btn btn-secondary btn-sm"
              >
                Esporta in Excel
              </button>
            </div>
            <div class="relative h-96 md:h-[450px]">
              <SavingsRateChart :simulationResults="ultimoRisultato" />
            </div>
          </div>
        </tab>
        <tab title="Patrimonio Netto">
          <NetWorthChart
            :simulationResults="ultimoRisultato"
            :debts="formInputs.debiti"
          />
        </tab>
        <tab title="Andamento Capitale">
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
                    ? ultimoRisultato &&
                      ultimoRisultato.length > 0 &&
                      Array.isArray(ultimoRisultato[0])
                      ? ultimoRisultato[0].map((r) => r.anno)
                      : []
                    : ultimoRisultato
                    ? ultimoRisultato.map((r) => r.anno)
                    : []
                "
                :datasets="datasetsCapitale"
              />
            </div>
          </div>
        </tab>
        <tab title="Flussi di Cassa">
          <div id="details-charts-card" class="card">
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
        </tab>
        <tab title="Debiti">
          <div class="card">
            <div class="flex justify-between items-center mb-4">
              <h3 class="card-title mb-0">Andamento dei Debiti nel Tempo</h3>
              <button
                @click="handleExportDebtsExcel()"
                class="btn btn-secondary btn-sm"
              >
                Esporta in Excel
              </button>
            </div>
            <div class="relative h-96 md:h-[450px]">
              <DebtChart
                :simulationResults="ultimoRisultato"
                :formInputs="formInputs"
              />
            </div>
          </div>
        </tab>
        <tab title="Impatto Fiscale">
          <div class="flex justify-between items-center mb-4">
            <h3 class="card-title mb-0">Impatto Fiscale nel Tempo</h3>
            <button @click="handleExportTaxImpactExcel()" class="btn btn-secondary btn-sm">Esporta in Excel</button>
          </div>
          <TaxImpactChart :simulationResults="ultimoRisultato" />
        </tab>
        <tab title="Benchmark">
          <BenchmarkChart :simulationData="ultimoRisultato" :benchmarkReturn="formInputs.benchmarkReturn / 100" />
        </tab>
        <tab title="Dettaglio Annuale">
          <div id="dettaglio-annuale-card" class="card mt-8">
            <h3 class="card-title">Dettaglio Annuale (Scenario Corrente)</h3>
            <button @click="handleExportExcel()" class="btn btn-secondary mb-4">
              Esporta in Excel
            </button>
            <button
              @click="handleExportPdf()"
              class="btn btn-secondary mb-4 ml-2"
            >
              Esporta in PDF
            </button>
            <AnnualDetailTable
              :risultatiHeader="risultatiHeader"
              :risultatiBody="risultatiBody"
              :datiFIRE="datiFIRE"
              :formatterValuta="formatterValuta"
              :etaRitiro="formInputs.etaRitiro"
              :fullResults="ultimoRisultato"
              @show-sankey="handleShowSankey"
            />
          </div>
        </tab>
        <tab title="Monte Carlo">
          <MonteCarloDashboard
            :simMode="formInputs.simMode"
            :monteCarloSummaryResults="monteCarloSummaryResults"
            :monteCarloResults="monteCarloResults"
          />
          <div class="card mt-8">
            <WorstCaseChart
              :worst-case-scenario="
                monteCarloSummaryResults?.worstCase?.datiSimulazione
              "
            />
          </div>
        </tab>
      </tabs>
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
