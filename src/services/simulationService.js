import { ref, reactive, computed } from "vue";
import { leggiInput } from "./financialCalculator";

// Dati storici per backtest
const historicalData = {
  // ... (dati storici esistenti)
};

const crisisScenarios = {
  dotCom: [
    -0.091, // 2000
    -0.1189, // 2001
    -0.221, // 2002
    0.2868, // 2003 (recupero)
  ],
  greatRecession: [
    -0.37, // 2008
    0.2646, // 2009 (recupero)
  ],
};

// Funzioni di Calcolo Principali
export function calcolaTasseProgressive(reddito, scaglioni) {
  let tasse = 0;
  let redditoRimanente = reddito;
  let limitePrecedente = 0;
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

export function adjustValuesForInflation(inputs) {
  const startYear = new Date().getFullYear();
  const inflationRate = inputs.impostazioni.tassoInflazione / 100;

  const adjustItem = (item) => {
    if (item.isTodayValue) {
      const years = (item.inizio || item.anno) - startYear;
      if (years > 0) {
        const factor = Math.pow(1 + inflationRate, years);
        if (item.valore) item.valore *= factor;
        if (item.importo) item.importo *= factor;
      }
    }
    return item;
  };

  inputs.entrate.ricorrenti.forEach(adjustItem);
  inputs.entrate.lumpSum.forEach(adjustItem);
  inputs.uscite.ricorrenti.forEach(adjustItem);
  inputs.uscite.lumpSum.forEach(adjustItem);
  return inputs;
}

export function calculatePMT(principal, annualInterestRate, numberOfPayments) {
  if (annualInterestRate === 0) {
    return principal / numberOfPayments;
  }
  const monthlyInterestRate = annualInterestRate / 12 / 100;
  const numMonthlyPayments = numberOfPayments * 12;
  const pmt = principal * monthlyInterestRate / (1 - Math.pow(1 + monthlyInterestRate, -numMonthlyPayments));
  return pmt * 12; // Rata annuale
}

export function calcolaProiezione(
  baseInputs,
  annoInizio,
  annoFine,
  isMonteCarloRun = false,
  historicalReturns = null
) {
  const inputs = JSON.parse(JSON.stringify(baseInputs));
  adjustValuesForInflation(inputs);

  const risultatiFinali = [];
  let capitalePerConto = {};
  inputs.assetAllocation.forEach(asset => {
    capitalePerConto[asset.nome] = inputs.impostazioni.capitaleIniziale * (asset.quota / 100);
  });
  let etaCorrente = inputs.impostazioni.etaIniziale;
  const valoriRicorrenti = {};
  [...inputs.entrate.ricorrenti, ...inputs.uscite.ricorrenti].forEach(
    (item) => {
      if (item.desc) valoriRicorrenti[item.desc] = item.valore;
    }
  );

  let debitiAttivi = inputs.debiti.map(debito => ({
    ...debito,
    capitaleResiduo: debito.importoIniziale,
    rataAnnua: calculatePMT(debito.importoIniziale, debito.tassoInteresse, debito.durataAnni),
    anniRimanenti: debito.durataAnni,
  }));

  let simulazioneFallita = false; // Nuovo flag per tracciare il fallimento complessivo
  let etaEsaurimento = null; // Età in cui il capitale si esaurisce per la prima volta

  for (let anno = annoInizio; anno <= annoFine; anno++) {
    const inFaseDiRitiro =
      inputs.impostazioni.isRetirement &&
      etaCorrente >= inputs.impostazioni.etaRitiro;
    const risultatoAnno = {
      anno,
      eta: etaCorrente,
      capitaleIniziale: Object.values(capitalePerConto).reduce((sum, val) => sum + val, 0),
    };

    let totaleEntrateLordeOrdinarie = 0;
    let totaleEntrateLordeSostitutive = 0;
    let imposteSostitutive = 0;

    inputs.entrate.ricorrenti.forEach((e) => {
      if (
        anno >= e.inizio &&
        anno <= e.fine &&
        (!inFaseDiRitiro || e.inPensione)
      ) {
        if (anno > e.inizio) {
          const inflationRate = inputs.impostazioni.tassoInflazione / 100;
          valoriRicorrenti[e.desc] *= (1 + e.incr / 100) * (1 + inflationRate);
        }
        const valoreCorrente = valoriRicorrenti[e.desc];
        risultatoAnno[e.desc] = valoreCorrente;
        if (e.taxRegime === "ordinaria") {
          totaleEntrateLordeOrdinarie += valoreCorrente;
        } else if (e.taxRegime === "sostitutiva") {
          imposteSostitutive += valoreCorrente * (e.aliquotaSost / 100);
          totaleEntrateLordeSostitutive += valoreCorrente;
        }
      } else {
        risultatoAnno[e.desc] = 0;
      }
    });

    risultatoAnno.entrateLumpSum = inputs.entrate.lumpSum
      .filter((e) => e.anno === anno)
      .reduce((s, e) => s + e.importo, 0);

    let totalIncomeForYear =
      totaleEntrateLordeOrdinarie +
      totaleEntrateLordeSostitutive +
      risultatoAnno.entrateLumpSum;
    
    let totaleRataDebiti = 0;
    debitiAttivi.forEach(debito => {
      if (anno >= debito.annoInizio && debito.capitaleResiduo > 0) {
        const rataCorrente = calculatePMT(debito.importoIniziale, debito.tassoInteresse, debito.durataAnni);
        totaleRataDebiti += rataCorrente;
        risultatoAnno[`Rata ${debito.desc}`] = rataCorrente;
        debito.capitaleResiduo = Math.max(0, debito.capitaleResiduo - (rataCorrente - (debito.capitaleResiduo * debito.tassoInteresse / 100)));
        risultatoAnno[`Capitale Residuo ${debito.desc}`] = debito.capitaleResiduo;
        debito.anniRimanenti--;
      } else {
        risultatoAnno[`Rata ${debito.desc}`] = 0;
        risultatoAnno[`Capitale Residuo ${debito.desc}`] = 0;
      }
    });
    risultatoAnno.totaleRataDebiti = totaleRataDebiti;

    let totalExpensesForYear = 0;
    risultatoAnno.prelievo = 0; // Inizializza prelievo a 0

    if (inFaseDiRitiro && inputs.impostazioni.strategiaPrelievo.trim() === 'percentualeCostante') {
        const withdrawalRate = inputs.impostazioni.percentualePrelievo / 100;
        const withdrawalAmount = risultatoAnno.capitaleIniziale * withdrawalRate;
        totalExpensesForYear = (totaleRataDebiti || 0) + withdrawalAmount;
        risultatoAnno.prelievo = withdrawalAmount;
    } else if (inFaseDiRitiro && inputs.impostazioni.strategiaPrelievo.trim() === 'prelievoFissoInflazione') {
        // Calcola il prelievo fisso iniziale (es. 4% del capitale iniziale) e lo aggiusta per l'inflazione
        const initialWithdrawal = inputs.impostazioni.capitaleIniziale * (inputs.impostazioni.regolaFIRE / 100); // Usiamo regolaFIRE come base per il prelievo iniziale
        const adjustedWithdrawal = initialWithdrawal * Math.pow(1 + inputs.impostazioni.tassoInflazione / 100, anno - annoInizio);
        totalExpensesForYear = (totaleRataDebiti || 0) + adjustedWithdrawal;
        risultatoAnno.prelievo = adjustedWithdrawal;
    } else {
        let totaleUsciteRicorrenti = 0;
        inputs.uscite.ricorrenti.forEach((u) => {
          if (anno >= u.inizio && anno <= u.fine) {
            const inflazioneApplicata =
              u.inflazioneSpecifica > 0
                ? u.inflazioneSpecifica
                : inputs.impostazioni.tassoInflazione;
            if (anno > u.inizio)
              valoriRicorrenti[u.desc] *=
                (1 + u.incr / 100) * (1 + inflazioneApplicata / 100);
            risultatoAnno[u.desc] = valoriRicorrenti[u.desc];
            totaleUsciteRicorrenti += valoriRicorrenti[u.desc];
          } else {
            risultatoAnno[u.desc] = 0;
          }
        });

        const usciteLumpSum = inputs.uscite.lumpSum
          .filter((u) => u.anno === anno)
          .reduce((s, u) => s + u.importo, 0);
        risultatoAnno.usciteLumpSum = usciteLumpSum;
        
        totalExpensesForYear = totaleUsciteRicorrenti + usciteLumpSum + totaleRataDebiti;
    }

    let taxableOrdinaryIncome = totaleEntrateLordeOrdinarie;
    const impostaRedditoOrdinario =
      taxableOrdinaryIncome > 0
        ? calcolaTasseProgressive(taxableOrdinaryIncome, inputs.taxBrackets)
        : 0;

    const imposteTotali = impostaRedditoOrdinario + imposteSostitutive;
    const netCashFlow = totalIncomeForYear - totalExpensesForYear - imposteTotali;

    risultatoAnno.totaleEntrate = totalIncomeForYear;
    risultatoAnno.totaleUscite = totalExpensesForYear;
    risultatoAnno.utilePerditaLordo = totalIncomeForYear - totalExpensesForYear;
    risultatoAnno.impostaReddito = imposteTotali;
    risultatoAnno.utilePerditaNetto = netCashFlow;

    let capitalePrimaRendimento = Object.values(capitalePerConto).reduce((sum, val) => sum + val, 0) + netCashFlow;

    // Correzione cruciale: Impedisce al capitale di diventare negativo prima del calcolo dei rendimenti.
    if (capitalePrimaRendimento < 0) {
      capitalePrimaRendimento = 0;
    }

    const totaleCapitalePerRibilanciamento = capitalePrimaRendimento;
    inputs.assetAllocation.forEach(asset => {
        capitalePerConto[asset.nome] = totaleCapitalePerRibilanciamento * (asset.quota / 100);
    });

    let totaleCapitalePreRendimento = Object.values(capitalePerConto).reduce((sum, val) => sum + val, 0);
    risultatoAnno.capitalePreRendimento = totaleCapitalePreRendimento;

    let totaleRendimentoLordo = 0;
    let totaleImpostaRendite = 0;

    if (isMonteCarloRun) {
      inputs.assetAllocation.forEach(asset => {
        const rendimentoCasuale = getNormalRandom(asset.rendimento / 100, asset.devStd / 100);
        const rendimentoAsset = capitalePerConto[asset.nome] * rendimentoCasuale;
        capitalePerConto[asset.nome] += rendimentoAsset;
        totaleRendimentoLordo += rendimentoAsset;
      });
      totaleImpostaRendite = totaleRendimentoLordo * (inputs.impostazioni.tassazioneRendite / 100);
    } else if (historicalReturns) {
      // Logica per backtest con dati storici
      const annoCorrente = anno;
      const rendimentoAnno = historicalReturns[annoCorrente] || 0; // Assumi 0 se non ci sono dati
      inputs.assetAllocation.forEach(asset => {
        const rendimentoAsset = capitalePerConto[asset.nome] * rendimentoAnno;
        capitalePerConto[asset.nome] += rendimentoAsset;
        totaleRendimentoLordo += rendimentoAsset;
      });
      totaleImpostaRendite = totaleRendimentoLordo * (inputs.impostazioni.tassazioneRendite / 100);
    } else {
      // Logica per simulazione deterministica
      inputs.assetAllocation.forEach(asset => {
        const rendimentoAsset = capitalePerConto[asset.nome] * (asset.rendimento / 100);
        capitalePerConto[asset.nome] += rendimentoAsset;
        totaleRendimentoLordo += rendimentoAsset;
      });
      totaleImpostaRendite = totaleRendimentoLordo * (inputs.impostazioni.tassazioneRendite / 100);
    }

    

    risultatoAnno.rendimentoLordo = totaleRendimentoLordo;
    risultatoAnno.impostaRendite = totaleImpostaRendite;
    risultatoAnno.rendimentoNetto = totaleRendimentoLordo - totaleImpostaRendite;

    const capitaleFinale = Math.max(0, Object.values(capitalePerConto).reduce((sum, val) => sum + val, 0));
    risultatoAnno.capitaleFinale = capitaleFinale;
    risultatoAnno.capitalePerConto = { ...capitalePerConto };
    risultatiFinali.push(risultatoAnno);

    // Se il capitale scende a zero o meno, marca la simulazione come fallita
    if (capitaleFinale <= 0) {
      // Log ogni volta che il capitale è <= 0
      

      // Marca la simulazione come fallita solo se non è già stata marcata
      if (!simulazioneFallita) {
        simulazioneFallita = true;
        etaEsaurimento = etaCorrente;
      }
    }

    etaCorrente++;
  }
  return { simulations: risultatiFinali, simulazioneFallita, etaEsaurimento };
}

export function mostraRisultatiDeterministici(
  risultati,
  inputs,
  isBacktest = false,
  currentStressTestResult = null,
  ultimoRisultatoRef,
  stressTestResultRef,
  risultatiBodyRef,
  risultatiHeaderRef,
  scenarioARef,
  datasetsCapitaleRef
) {
  ultimoRisultatoRef.value = risultati;
  stressTestResultRef.value = currentStressTestResult;

  risultatiBodyRef.value = risultati.map((r) => {
    const row = {
      anno: r.anno,
      eta: r.eta,
      capitaleIniziale: r.capitaleIniziale,
      totaleEntrate: r.totaleEntrate,
      totaleUscite: r.totaleUscite,
      prelievo: r.prelievo,
      utilePerditaLordo: r.utilePerditaLordo,
      impostaReddito: r.impostaReddito,
      utilePerditaNetto: r.utilePerditaNetto,
      capitalePreRendimento: r.capitalePreRendimento,
      rendimentoLordo: r.rendimentoLordo,
      impostaRendite: r.impostaRendite,
      rendimentoNetto: r.rendimentoNetto,
      capitaleFinale: r.capitaleFinale,
    };
    return row;
  });

  if (risultatiBodyRef.value.length > 0) {
    risultatiHeaderRef.value = Object.keys(risultatiBodyRef.value[0]);
  } else {
    risultatiHeaderRef.value = [];
  }

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
  if (scenarioARef.value && !scenarioARef.value.isMonteCarlo) {
    datasetsCapitaleRef.value.push({
      label: "Scenario A",
      data: scenarioARef.value.risultati.map((r) => r.capitaleFinale),
      borderColor: "#f43f5e",
      backgroundColor: "rgba(244, 63, 94, 0.1)",
      fill: true,
      tension: 0.2,
    });
  }
}

export function mostraRisultatiMonteCarlo(
  monteCarloResults,
  inputs,
  ultimoRisultatoRef,
  stressTestResultRef, // Non usato direttamente qui, ma mantenuto per coerenza con la firma
  monteCarloSummaryResultsRef,
  scenarioARef, // Non usato direttamente qui, ma mantenuto per coerenza con la firma
  datasetsCapitaleRef
) {
  ultimoRisultatoRef.value = monteCarloResults.simulations; // Tutte le simulazioni

  const probabilitaSuccesso = monteCarloResults.numeroSimulazioni > 0 ? (
    Math.round(((monteCarloResults.numeroSimulazioni - monteCarloResults.numeroSimulazioniFallite) /
    monteCarloResults.numeroSimulazioni) * 10000) / 100
  ) : 0;

  monteCarloSummaryResultsRef.value = {
    probabilitaSuccesso: probabilitaSuccesso,
    etaMediaEsaurimento: monteCarloResults.etaMediaEsaurimento,
    worstCase: monteCarloResults.worstCase, // Passa i dati dello scenario peggiore
  };

  // Calcolo dei percentili per il grafico del capitale (come già fatto in handleAvviaSimulazione)
  const capitalResults = monteCarloResults.simulations.map(sim => sim.map(r => r.capitaleFinale));
  const years = monteCarloResults.simulations[0].map(r => r.anno);
  const p25 = [];
  const p50 = [];
  const p75 = [];

  for (let i = 0; i < years.length; i++) {
    const values = capitalResults.map(sim => sim[i]).sort((a, b) => a - b);
    p25.push(values[Math.floor(values.length * 0.25)]);
    p50.push(values[Math.floor(values.length * 0.5)]);
    p75.push(values[Math.floor(values.length * 0.75)]);
  }

  datasetsCapitaleRef.value = [
    {
      label: '25° percentile',
      data: p25,
      fill: false,
      borderColor: 'rgba(255, 99, 132, 0.2)',
      tension: 0.1,
    },
    {
      label: 'Mediana (50° percentile)',
      data: p50,
      fill: 'start',
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1,
    },
    {
      label: '75° percentile',
      data: p75,
      fill: '-1',
      borderColor: 'rgba(255, 99, 132, 0.2)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1,
    },
  ];
}

export function calcolaSimulazioneMonteCarlo(inputs, annoInizio, annoFine) {
  const allSimulations = [];
  const numeroSimulazioni = inputs.impostazioni.numeroSimulazioni;
  let simulazioniFallite = 0;
  let sommaEtaEsaurimento = 0;

  let worstCase = null;

  for (let i = 0; i < numeroSimulazioni; i++) {
    const inputsCopia = JSON.parse(JSON.stringify(inputs));
    const { simulations, simulazioneFallita, etaEsaurimento } = calcolaProiezione(inputsCopia, annoInizio, annoFine, true);
    allSimulations.push(simulations);

    if (simulazioneFallita) {
      simulazioniFallite++;
      sommaEtaEsaurimento += etaEsaurimento;
    }

    // Trova lo scenario peggiore (capitale finale più basso alla fine della simulazione)
    const capitaleFinale = simulations[simulations.length - 1].capitaleFinale;
    if (worstCase === null || capitaleFinale < worstCase.capitaleFinale) {
      worstCase = {
        capitaleFinale: capitaleFinale,
        etaEsaurimento: simulazioneFallita ? etaEsaurimento : null,
        datiSimulazione: simulations, // Salva l'intera serie di dati per il grafico
      };
    }
  }

  const etaMediaEsaurimento =
    simulazioniFallite > 0 ? sommaEtaEsaurimento / simulazioniFallite : null;

  return {
    simulations: allSimulations,
    numeroSimulazioni: numeroSimulazioni,
    numeroSimulazioniFallite: simulazioniFallite,
    etaMediaEsaurimento: etaMediaEsaurimento,
    worstCase: worstCase, // Aggiungi lo scenario peggiore ai risultati
  };
}

export async function calcolaBacktest(inputs, annoInizio, annoFine) {
  return calcolaProiezione(inputs, annoInizio, annoFine, false, historicalData);
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
  mostraNotifica
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
  const annoFineSimulazione = Math.max(...anniCoinvolti);

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
        datasetsCapitaleRef
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
        backtestResults.simulations, // Passa l'array delle simulazioni
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
      results = backtestResults.simulations; // Assegna l'array dei risultati
      break;
    default: // deterministic
      const deterministicResults = calcolaProiezione(
        inputs,
        annoInizioSimulazione,
        annoFineSimulazione
      );
      mostraRisultatiDeterministici(
        deterministicResults.simulations, // Passa l'array delle simulazioni
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
      results = deterministicResults.simulations; // Assegna l'array dei risultati
      break;
  }

  showResultsRef.value = true;
  loaderHiddenRef.value = true;
  return results;
}