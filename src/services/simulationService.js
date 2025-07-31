import { ref, reactive, computed } from "vue";
import { leggiInput, calculateVpwWithdrawal } from "./financialCalculator.js";

// Dati storici per backtest
const historicalData = {
  // ... (dati storici esistenti)
};

const crisisScenarios = {
  dotCom: {
    startYear: 2000,
    endYear: 2002,
    returns: [-0.091, -0.1189, -0.221],
  },
  greatRecession: {
    startYear: 2008,
    endYear: 2009,
    returns: [-0.37, 0.2646],
  },
};

const inflationScenarios = {
  none: { type: "fixed" },
  highInflation: {
    type: "sequence",
    rates: { 0: 0.05, 1: 0.04, 2: 0.03, 3: 0.025 },
  },
  lowInflation: { type: "sequence", rates: { 0: 0.01, 1: 0.015, 2: 0.02 } },
  volatileInflation: {
    type: "sequence",
    rates: { 0: 0.06, 1: 0.01, 2: 0.04, 3: 0.015, 4: 0.03 },
  },
};

function getInflationRateForYear(
  scenarioType,
  yearIndex,
  initialInflationRate
) {
  if (scenarioType === "custom_high") return initialInflationRate / 100;
  if (scenarioType === "none") return initialInflationRate / 100;
  const scenario = inflationScenarios[scenarioType];
  if (!scenario || scenario.type !== "sequence")
    return initialInflationRate / 100;
  const rates = scenario.rates;
  const years = Object.keys(rates)
    .map(Number)
    .sort((a, b) => a - b);
  let rate = initialInflationRate / 100;
  for (let i = 0; i < years.length; i++) {
    if (yearIndex >= years[i]) rate = rates[years[i]];
    else break;
  }
  return rate;
}

export function calcolaTasseProgressive(reddito, scaglioni) {
  let tasse = 0,
    redditoRimanente = reddito,
    limitePrecedente = 0;
  for (const scaglione of scaglioni) {
    if (redditoRimanente <= 0) break;
    const redditoNelloScaglione = Math.min(
      redditoRimanente,
      scaglione.finoA - limitePrecedente
    );
    tasse += redditoNelloScaglione * (scaglione.aliquota / 100);
    redditoRimanente -= redditoNelloScaglione;
    limitePrecedente = scaglione.finoA;
  }
  return tasse;
}

export function getNormalRandom(mean, stdDev) {
  let u1 = 0,
    u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

export function calcolaProiezione(
  baseInputs,
  annoInizio,
  annoFine,
  isMonteCarloRun = false,
  historicalReturns = null,
  simulazioneStartYear,
  initialCrisisOptions = { enabled: false }
) {
  const inputs = JSON.parse(JSON.stringify(baseInputs));
  const initialInflationRate = inputs.impostazioni.tassoInflazione;
  const risultatiFinali = [];
  let capitalePerConto = {};
  inputs.assetAllocation.forEach((asset) => {
    capitalePerConto[asset.nome] =
      inputs.impostazioni.capitaleIniziale * (asset.quota / 100);
  });
  let etaCorrente = inputs.impostazioni.etaIniziale;
  let debitiAttivi = inputs.debiti.map((d) => ({
    ...d,
    capitaleResiduo: d.importoIniziale,
    rataAnnua: calculatePMT(d.importoIniziale, d.tassoInteresse, d.durataAnni),
    anniRimanenti: d.durataAnni,
  }));
  let simulazioneFallita = false,
    etaEsaurimento = null;

  for (let anno = annoInizio; anno <= annoFine; anno++) {
    const inFaseDiRitiro = etaCorrente >= inputs.impostazioni.etaRitiro;
    const risultatoAnno = {
      anno,
      eta: etaCorrente,
      capitaleIniziale: Object.values(capitalePerConto).reduce(
        (s, v) => s + v,
        0
      ),
    };
    const currentInflationRate = getInflationRateForYear(
      inputs.impostazioni.inflationScenario,
      anno - simulazioneStartYear,
      initialInflationRate
    );
    risultatoAnno.capitaleInizialeReale =
      risultatoAnno.capitaleIniziale /
      Math.pow(1 + currentInflationRate, anno - simulazioneStartYear);
    let totEntrateLordeOrd = 0,
      totEntrateLordeSost = 0,
      totEntrateLordeEsenti = 0,
      imposteSostitutive = 0;
    inputs.entrate.ricorrenti.forEach((e) => {
      if (
        anno >= e.inizio &&
        anno <= e.fine &&
        (!inFaseDiRitiro || e.inPensione)
      ) {
        const y = anno - e.inizio;
        let v = e.valore * Math.pow(1 + e.incr / 100, y);
        if (e.taxRegime === "ordinaria") totEntrateLordeOrd += v;
        else if (e.taxRegime === "sostitutiva") {
          imposteSostitutive += v * (e.aliquotaSost / 100);
          totEntrateLordeSost += v;
        } else totEntrateLordeEsenti += v;
      }
    });
    const entrateLumpSum = inputs.entrate.lumpSum
      .filter((e) => e.anno === anno)
      .reduce((s, e) => s + e.importo, 0);
    const totalIncome =
      totEntrateLordeOrd +
      totEntrateLordeSost +
      totEntrateLordeEsenti +
      entrateLumpSum;
    let totRataDebiti = 0;
    debitiAttivi.forEach((d) => {
      if (anno >= d.annoInizio && d.capitaleResiduo > 0) {
        const i = d.capitaleResiduo * (d.tassoInteresse / 100);
        const r = Math.min(d.rataAnnua, d.capitaleResiduo + i);
        totRataDebiti += r;
        d.capitaleResiduo -= r - i;
        if (d.capitaleResiduo < 0.01) d.capitaleResiduo = 0;
      }
    });
    let totUsciteRicorrenti = 0;
    inputs.uscite.ricorrenti.forEach((u) => {
      if (anno >= u.inizio && anno <= u.fine) {
        const y = anno - u.inizio;
        const i = getInflationRateForYear(
          inputs.impostazioni.inflationScenario,
          y,
          initialInflationRate
        );
        let v = u.valore * Math.pow(1 + u.incr / 100, y);
        if (u.isTodayValue) v *= Math.pow(1 + i, y);
        totUsciteRicorrenti += v;
      }
    });
    const usciteLumpSum = inputs.uscite.lumpSum
      .filter((u) => u.anno === anno)
      .reduce((s, u) => s + u.importo, 0);
    const totalExpenses = totUsciteRicorrenti + usciteLumpSum + totRataDebiti;
    let prelievoAnnuo = 0;
    if (inFaseDiRitiro) {
      const capitaleDisponibile = Object.values(capitalePerConto).reduce(
        (s, v) => s + v,
        0
      );
      switch (inputs.impostazioni.strategiaPrelievo) {
        case "regolaFIRE":
          if (etaCorrente === inputs.impostazioni.etaRitiro) {
            // Primo anno di ritiro
            prelievoAnnuo =
              capitaleDisponibile * (inputs.impostazioni.regolaFIRE / 100);
          } else {
            // Anni successivi
            const prelievoAnnoPrecedente =
              risultatiFinali.length > 0
                ? risultatiFinali[risultatiFinali.length - 1].prelievo
                : 0;
            prelievoAnnuo = prelievoAnnoPrecedente * (1 + currentInflationRate);
          }
          break;
        case "percentualeCostante":
          prelievoAnnuo =
            capitaleDisponibile *
            (inputs.impostazioni.percentualePrelievo / 100);
          break;
        case "prelievoFissoInflazione":
          if (etaCorrente === inputs.impostazioni.etaRitiro) {
            // Primo anno di ritiro
            prelievoAnnuo = inputs.impostazioni.prelievoFissoIniziale || 0;
          } else {
            const prelievoAnnoPrecedente =
              risultatiFinali.length > 0
                ? risultatiFinali[risultatiFinali.length - 1].prelievo
                : 0;
            prelievoAnnuo = prelievoAnnoPrecedente * (1 + currentInflationRate);
          }
          break;
        case "vpw":
          prelievoAnnuo = calculateVpwWithdrawal(
            capitaleDisponibile,
            etaCorrente,
            inputs.impostazioni.etaMassimaSimulazione
          );
          break;
        case "guardrails":
          // Logica Guardrails (semplificata)
          const prelievoBase =
            capitaleDisponibile *
            (inputs.impostazioni.percentualePrelievo / 100);
          const sogliaSuperiore =
            prelievoBase * (1 + inputs.impostazioni.guardrailUpper / 100);
          const sogliaInferiore =
            prelievoBase * (1 - inputs.impostazioni.guardrailLower / 100);
          if (risultatiFinali.length > 0) {
            const prelievoPrecedente =
              risultatiFinali[risultatiFinali.length - 1].prelievo;
            if (prelievoPrecedente > sogliaSuperiore) {
              prelievoAnnuo = prelievoPrecedente * 0.9; // Riduci del 10%
            } else if (prelievoPrecedente < sogliaInferiore) {
              prelievoAnnuo = prelievoPrecedente * 1.1; // Aumenta del 10%
            } else {
              prelievoAnnuo = prelievoPrecedente * (1 + currentInflationRate);
            }
          } else {
            prelievoAnnuo = prelievoBase;
          }
          break;
      }
    }
    const imposteOrdinarie = calcolaTasseProgressive(
      totEntrateLordeOrd,
      inputs.taxBrackets
    );
    const imposteSuReddito = imposteOrdinarie + imposteSostitutive;

    const cashFlowNetto = totalIncome - totalExpenses - imposteSuReddito;
    let capitaleDaInvestire =
      risultatoAnno.capitaleIniziale + cashFlowNetto - prelievoAnnuo;
    if (capitaleDaInvestire < 0) capitaleDaInvestire = 0;

    inputs.assetAllocation.forEach((a) => {
      capitalePerConto[a.nome] = capitaleDaInvestire * (a.quota / 100);
    });

    let totRendimentoLordo = 0;
    let annualReturnRate = 0;
    const yearsIntoSimulation = anno - simulazioneStartYear;

    // La logica per la Sequenza dei Rendimenti ha la priorità
    if (
      initialCrisisOptions.enabled &&
      yearsIntoSimulation < initialCrisisOptions.durationYears
    ) {
      annualReturnRate = initialCrisisOptions.crashPercentage / 100; // Es. -25 / 100 = -0.25
    } else if (isMonteCarloRun) {
      // Logica Monte Carlo
      const rendimentoMedio = inputs.assetAllocation.reduce(
        (sum, asset) => sum + (asset.quota / 100) * (asset.rendimento / 100),
        0
      );
      const deviazioneStandardMedia = inputs.assetAllocation.reduce(
        (sum, asset) => sum + (asset.quota / 100) * (asset.devStd / 100),
        0
      );
      annualReturnRate = getNormalRandom(
        rendimentoMedio,
        deviazioneStandardMedia
      );
    } else {
      // Logica Deterministica / Crisi / Backtest
      const crisisKey = inputs.impostazioni.scenarioCrisi;
      const crisis = crisisScenarios[crisisKey];
      if (crisis && anno >= crisis.startYear && anno <= crisis.endYear) {
        annualReturnRate = crisis.returns[anno - crisis.startYear];
      } else if (historicalReturns && historicalReturns[anno]) {
        annualReturnRate = historicalReturns[anno];
      } else {
        annualReturnRate = inputs.assetAllocation.reduce(
          (sum, asset) => sum + (asset.quota / 100) * (asset.rendimento / 100),
          0
        );
      }
    }

    // Applica il rendimento calcolato al portafoglio
    inputs.assetAllocation.forEach((asset) => {
      const rendimentoAsset = capitalePerConto[asset.nome] * annualReturnRate;
      capitalePerConto[asset.nome] += rendimentoAsset;
      totRendimentoLordo += rendimentoAsset;
    });

    const imposteRendite =
      totRendimentoLordo > 0
        ? totRendimentoLordo * (inputs.impostazioni.tassazioneRendite / 100)
        : 0;
    let capitaleFinale =
      Object.values(capitalePerConto).reduce((s, v) => s + v, 0) -
      imposteRendite;
    if (
      baseInputs.riskAdjustments &&
      baseInputs.riskAdjustments.behavioralErrors
    ) {
      capitaleFinale -= capitaleFinale * 0.005;
    }
    capitaleFinale = Math.max(0, capitaleFinale);

    inputs.assetAllocation.forEach((a) => {
      capitalePerConto[a.nome] = capitaleFinale * (a.quota / 100);
    });

    risultatoAnno.totaleEntrate = totalIncome;
    risultatoAnno.totaleUscite = totalExpenses;
    risultatoAnno.prelievo = prelievoAnnuo;
    risultatoAnno.utilePerditaLordo = totalIncome - totalExpenses;
    risultatoAnno.impostaReddito = imposteSuReddito;
    risultatoAnno.impostaRendite = imposteRendite;
    risultatoAnno.utilePerditaNetto =
      totalIncome - totalExpenses - imposteSuReddito - imposteRendite;
    risultatoAnno.capitalePreRendimento = capitaleDaInvestire;
    risultatoAnno.rendimentoLordo = totRendimentoLordo;
    risultatoAnno.rendimentoNetto = totRendimentoLordo - imposteRendite;
    risultatoAnno.capitaleFinale = capitaleFinale;
    risultatoAnno.capitaleFinaleReale =
      risultatoAnno.capitaleFinale /
      Math.pow(1 + currentInflationRate, anno - simulazioneStartYear + 1);
    risultatoAnno.withdrawalRate =
      risultatoAnno.capitaleIniziale > 0
        ? (risultatoAnno.prelievo / risultatoAnno.capitaleIniziale) * 100
        : 0;
    risultatoAnno.tassoRisparmio =
      totalIncome > 0 ? (cashFlowNetto / totalIncome) * 100 : 0;
    risultatoAnno.variazionePercentualeCapitale =
      risultatoAnno.capitaleIniziale > 0
        ? ((risultatoAnno.capitaleFinale - risultatoAnno.capitaleIniziale) /
            risultatoAnno.capitaleIniziale) *
          100
        : 0;
    risultatoAnno.patrimonioNetto =
      risultatoAnno.capitaleFinale -
      debitiAttivi.reduce((sum, d) => sum + d.capitaleResiduo, 0);

    inputs.entrate.ricorrenti.forEach((e) => {
      if (
        anno >= e.inizio &&
        anno <= e.fine &&
        (!inFaseDiRitiro || e.inPensione)
      ) {
        const y = anno - e.inizio;
        let v = e.valore * Math.pow(1 + e.incr / 100, y);
        risultatoAnno[e.desc] = v;
      }
    });

    inputs.uscite.ricorrenti.forEach((u) => {
      if (anno >= u.inizio && anno <= u.fine) {
        const y = anno - u.inizio;
        const i = getInflationRateForYear(
          inputs.impostazioni.inflationScenario,
          y,
          initialInflationRate
        );
        let v = u.valore * Math.pow(1 + u.incr / 100, y);
        if (u.isTodayValue) v *= Math.pow(1 + i, y);
        risultatoAnno[u.desc] = v;
      }
    });

    if (risultatoAnno.capitaleFinale <= 0 && !simulazioneFallita) {
      simulazioneFallita = true;
      etaEsaurimento = etaCorrente;
    }
    risultatiFinali.push(risultatoAnno);
    etaCorrente++;
  }
  return { simulations: risultatiFinali, simulazioneFallita, etaEsaurimento };
}

export function mostraRisultatiDeterministici(
  risultati,
  inputs,
  isBacktest,
  currentStressTestResult,
  ultimoRisultatoRef,
  stressTestResultRef,
  risultatiBodyRef,
  risultatiHeaderRef,
  scenarioARef,
  datasetsCapitaleRef
) {
  ultimoRisultatoRef.value = risultati;
  stressTestResultRef.value = currentStressTestResult;
  risultatiBodyRef.value = risultati.map((r) => ({
    anno: r.anno,
    eta: r.eta,
    capitaleIniziale: r.capitaleIniziale,
    totaleEntrate: r.totaleEntrate,
    totaleUscite: r.totaleUscite,
    prelievo: r.prelievo,
    utilePerditaLordo: r.utilePerditaLordo,
    impostaReddito: r.impostaReddito,
    impostaRendite: r.impostaRendite,
    utilePerditaNetto: r.utilePerditaNetto,
    capitalePreRendimento: r.capitalePreRendimento,
    rendimentoLordo: r.rendimentoLordo,
    rendimentoNetto: r.rendimentoNetto,
    capitaleFinale: r.capitaleFinale,
    capitaleInizialeReale: r.capitaleInizialeReale,
    capitaleFinaleReale: r.capitaleFinaleReale,
    withdrawalRate: r.withdrawalRate,
    tassoRisparmio: r.tassoRisparmio,
    variazionePercentualeCapitale: r.variazionePercentualeCapitale,
  }));
  risultatiHeaderRef.value = [
    "anno",
    "eta",
    "capitaleIniziale",
    "totaleEntrate",
    "totaleUscite",
    "prelievo",
    "utilePerditaLordo",
    "impostaReddito",
    "impostaRendite",
    "utilePerditaNetto",
    "capitalePreRendimento",
    "rendimentoLordo",
    "rendimentoNetto",
    "capitaleFinale",
    "capitaleInizialeReale",
    "capitaleFinaleReale",
    "withdrawalRate",
    "tassoRisparmio",
    "variazionePercentualeCapitale",
  ];
  datasetsCapitaleRef.value = [
    {
      label: "Scenario Corrente",
      data: risultati.map((r) => r.capitaleFinale),
      borderColor: "#10b981",
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      fill: true,
      tension: 0.2,
    },
  ];
  if (scenarioARef.value && !scenarioARef.value.isMonteCarlo)
    datasetsCapitaleRef.value.push({
      label: "Scenario A",
      data: scenarioARef.value.risultati.map((r) => r.capitaleFinale),
      borderColor: "#f43f5e",
      backgroundColor: "rgba(244, 63, 94, 0.1)",
      fill: true,
      tension: 0.2,
    });
}

export function mostraRisultatiMonteCarlo(
  rawMonteCarloResults,
  inputs,
  ultimoRisultatoRef,
  stressTestResultRef,
  monteCarloSummaryResultsRef,
  scenarioARef,
  datasetsCapitaleRef,
  monteCarloResultsRef
) {
  monteCarloResultsRef.value = rawMonteCarloResults;
  ultimoRisultatoRef.value = rawMonteCarloResults.simulations;
  const probabilitaSuccesso =
    rawMonteCarloResults.numeroSimulazioni > 0
      ? Math.round(
          ((rawMonteCarloResults.numeroSimulazioni -
            rawMonteCarloResults.numeroSimulazioniFallite) /
            rawMonteCarloResults.numeroSimulazioni) *
            10000
        ) / 100
      : 0;
  monteCarloSummaryResultsRef.value = {
    probabilitaSuccesso,
    etaMediaEsaurimento: rawMonteCarloResults.etaMediaEsaurimento,
    worstCase: rawMonteCarloResults.worstCase,
  };
  const capitalResults = rawMonteCarloResults.simulations.map((sim) =>
    sim ? sim.map((r) => r.capitaleFinale) : []
  );
  const maxLength = Math.max(...capitalResults.map((sim) => sim.length));
  const normalizedCapitalResults = capitalResults.map((sim) => {
    const padding = new Array(maxLength - sim.length).fill(0);
    return sim.concat(padding);
  });

  const years = (rawMonteCarloResults.simulations[0] || []).map((r) => r.anno);
  const p25 = [],
    p50 = [],
    p75 = [];
  for (let i = 0; i < maxLength; i++) {
    const values = normalizedCapitalResults
      .map((sim) => sim[i])
      .sort((a, b) => a - b);
    p25.push(values[Math.floor(values.length * 0.25)]);
    p50.push(values[Math.floor(values.length * 0.5)]);
    p75.push(values[Math.floor(values.length * 0.75)]);
  }
  datasetsCapitaleRef.value = [
    {
      label: "25° percentile",
      data: p25,
      fill: false,
      borderColor: "rgba(255, 99, 132, 0.2)",
      tension: 0.1,
    },
    {
      label: "Mediana (50° percentile)",
      data: p50,
      fill: "start",
      borderColor: "rgb(75, 192, 192)",
      backgroundColor: "rgba(75, 192, 192, 0.2)",
      tension: 0.1,
    },
    {
      label: "75° percentile",
      data: p75,
      fill: "-1",
      borderColor: "rgba(255, 99, 132, 0.2)",
      backgroundColor: "rgba(75, 192, 192, 0.2)",
      tension: 0.1,
    },
  ];
}

export function calcolaSimulazioneMonteCarlo(inputs, annoInizio, annoFine) {
  const allSimulations = [];
  const numeroSimulazioni = inputs.impostazioni.numeroSimulazioni;
  let simulazioniFallite = 0,
    sommaEtaEsaurimento = 0,
    worstCase = null;
  for (let i = 0; i < numeroSimulazioni; i++) {
    const inputsCopia = JSON.parse(JSON.stringify(inputs));
    const { simulations, simulazioneFallita, etaEsaurimento } =
      calcolaProiezione(
        inputsCopia,
        annoInizio,
        annoFine,
        true,
        null,
        annoInizio,
        inputsCopia.impostazioni.initialCrisisOptions
      );
    allSimulations.push(simulations);
    if (simulazioneFallita) {
      simulazioniFallite++;
      sommaEtaEsaurimento += etaEsaurimento;
    }
    const capitaleFinale = simulations[simulations.length - 1].capitaleFinale;
    if (worstCase === null || capitaleFinale < worstCase.capitaleFinale) {
      worstCase = {
        capitaleFinale,
        etaEsaurimento: simulazioneFallita ? etaEsaurimento : null,
        datiSimulazione: simulations,
      };
    }
  }
  const etaMediaEsaurimento =
    simulazioniFallite > 0 ? sommaEtaEsaurimento / simulazioniFallite : null;
  return {
    simulations: allSimulations,
    numeroSimulazioni,
    numeroSimulazioniFallite: simulazioniFallite,
    etaMediaEsaurimento,
    worstCase,
  };
}

export async function calcolaBacktest(inputs, annoInizio, annoFine) {
  return calcolaProiezione(
    inputs,
    annoInizio,
    annoFine,
    false,
    historicalData,
    annoInizio,
    inputs.impostazioni.initialCrisisOptions
  );
}

export async function avviaSimulazione(
  formInputs,
  ultimoRisultatoRef,
  stressTestResultRef,
  monteCarloSummaryResultsRef,
  risultatiBodyRef,
  risultatiHeaderRef,
  scenarioARef,
  datasetsCapitaleRef,
  loaderHiddenRef,
  showResultsRef,
  saveScenarioBtnDisabledRef,
  mostraNotifica,
  monteCarloResultsRef,
  initialCrisisOptions,
  riskAdjustments = null,
  isSilent = false
) {
  loaderHiddenRef.value = false;
  await new Promise((resolve) => setTimeout(resolve, 50));
  const inputs = leggiInput(formInputs);
  if (!inputs) {
    loaderHiddenRef.value = true;
    return;
  }

  const anniCoinvolti = [];
  const raccogliAnni = (items) => {
    items.forEach((item) => {
      if (item.inizio) anniCoinvolti.push(item.inizio);
      if (item.fine) anniCoinvolti.push(item.fine);
      if (item.anno) anniCoinvolti.push(item.anno);
    });
  };
  raccogliAnni(inputs.entrate.ricorrenti);
  raccogliAnni(inputs.uscite.ricorrenti);
  raccogliAnni(inputs.entrate.lumpSum);
  raccogliAnni(inputs.uscite.lumpSum);
  if (anniCoinvolti.length === 0) {
    mostraNotifica(
      "Attenzione",
      "Inserisci almeno un'entrata o un'uscita per avviare la simulazione.",
      true
    );
    loaderHiddenRef.value = true;
    return;
  }

  showResultsRef.value = false;
  saveScenarioBtnDisabledRef.value = false;
  const annoInizioSimulazione = Math.min(...anniCoinvolti);

  if (riskAdjustments) {
    if (riskAdjustments.inflationIncrease)
      inputs.impostazioni.tassoInflazione += riskAdjustments.inflationIncrease;
    if (riskAdjustments.applySequenceRisk)
      inputs.impostazioni.initialCrisisOptions = {
        enabled: true,
        crashPercentage: -25,
        durationYears: 2,
      };
    if (riskAdjustments.addHealthExpense)
      inputs.uscite.lumpSum.push({
        desc: "Spesa Sanitaria Imprevista (Rischio)",
        importo: 50000,
        isTodayValue: true,
        anno: annoInizioSimulazione + (80 - inputs.impostazioni.etaIniziale),
      });
    if (riskAdjustments.longevityIncrease)
      inputs.impostazioni.etaMassimaSimulazione +=
        riskAdjustments.longevityIncrease;
    if (riskAdjustments.applyLifestyleCreep)
      inputs.uscite.ricorrenti.forEach((u) => {
        u.incr = (u.incr || 0) + 1;
      });
    if (riskAdjustments.marketCrash)
      inputs.assetAllocation.forEach((a) => {
        a.rendimento -= 1.5;
      });
    if (riskAdjustments.cognitiveDecline)
      inputs.uscite.ricorrenti.push({
        desc: "Costi Declino Cognitivo (Rischio)",
        valore: 10000,
        isTodayValue: true,
        inizio:
          new Date().getFullYear() + (85 - inputs.impostazioni.etaIniziale),
        fine: 9999,
        incr: 0,
      });
    if (riskAdjustments.taxChanges) inputs.impostazioni.tassazioneRendite += 5;
    if (riskAdjustments.familyNeeds)
      inputs.uscite.lumpSum.push({
        desc: "Esigenze Familiari (Rischio)",
        importo: 30000,
        isTodayValue: true,
        anno: new Date().getFullYear() + (60 - inputs.impostazioni.etaIniziale),
      });
  }

  // CORREZIONE: Calcolo di annoFineSimulazione SPOSTATO QUI, dopo gli aggiustamenti di rischio.
  let annoFineSimulazione;
  if (inputs.impostazioni.etaMassimaSimulazione > 0) {
    annoFineSimulazione =
      new Date().getFullYear() -
      inputs.impostazioni.etaIniziale +
      inputs.impostazioni.etaMassimaSimulazione;
  } else {
    annoFineSimulazione =
      anniCoinvolti.length > 0
        ? Math.max(...anniCoinvolti)
        : new Date().getFullYear() - inputs.impostazioni.etaIniziale + 95;
  }

  let results;
  switch (inputs.impostazioni.simMode) {
    case "montecarlo":
      const monteCarloResults = calcolaSimulazioneMonteCarlo(
        inputs,
        annoInizioSimulazione,
        annoFineSimulazione
      );
      mostraRisultatiMonteCarlo(
        monteCarloResults,
        inputs,
        ultimoRisultatoRef,
        stressTestResultRef,
        monteCarloSummaryResultsRef,
        scenarioARef,
        datasetsCapitaleRef,
        monteCarloResultsRef
      );
      results = monteCarloResults.simulations;
      break;
    case "backtest":
      const backtestResults = await calcolaBacktest(
        inputs,
        annoInizioSimulazione,
        annoFineSimulazione
      );
      mostraRisultatiDeterministici(
        backtestResults.simulations,
        inputs,
        true,
        null,
        ultimoRisultatoRef,
        stressTestResultRef,
        risultatiBodyRef,
        risultatiHeaderRef,
        scenarioARef,
        datasetsCapitaleRef
      );
      results = backtestResults.simulations;
      break;
    default:
      const deterministicResults = calcolaProiezione(
        inputs,
        annoInizioSimulazione,
        annoFineSimulazione,
        false,
        null,
        annoInizioSimulazione,
        inputs.impostazioni.initialCrisisOptions
      );
      mostraRisultatiDeterministici(
        deterministicResults.simulations,
        inputs,
        false,
        null,
        ultimoRisultatoRef,
        stressTestResultRef,
        risultatiBodyRef,
        risultatiHeaderRef,
        scenarioARef,
        datasetsCapitaleRef
      );
      results = deterministicResults.simulations;
      break;
  }

  if (!isSilent) {
    showResultsRef.value = true;
    loaderHiddenRef.value = true;
  }
  return { ultimoRisultato: results };
}
