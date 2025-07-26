import { ref, reactive, computed } from "vue";
import { leggiInput } from "./financialCalculator";

// Dati storici per backtest
const historicalData = {
  1970: 0.0401,
  1971: 0.1431,
  1972: 0.1898,
  1973: -0.1466,
  1974: -0.2647,
  1975: 0.372,
  1976: 0.2384,
  1977: -0.0718,
  1978: 0.0656,
  1979: 0.1844,
  1980: 0.325,
  1981: -0.0491,
  1982: 0.2155,
  1983: 0.2256,
  1984: 0.0627,
  1985: 0.3173,
  1986: 0.1867,
  1987: 0.0525,
  1988: 0.1661,
  1989: 0.3169,
  1990: -0.031,
  1991: 0.3047,
  1992: 0.0762,
  1993: 0.1008,
  1994: 0.0132,
  1995: 0.3758,
  1996: 0.2296,
  1997: 0.3336,
  1998: 0.2858,
  1999: 0.2104,
  2000: -0.091,
  2001: -0.1189,
  2002: -0.221,
  2003: 0.2868,
  2004: 0.1088,
  2005: 0.0491,
  2006: 0.1579,
  2007: 0.0549,
  2008: -0.37,
  2009: 0.2646,
  2010: 0.1506,
  2011: 0.0211,
  2012: 0.16,
  2013: 0.3239,
  2014: 0.1369,
  2015: 0.0138,
  2016: 0.1196,
  2017: 0.2183,
  2018: -0.0438,
  2019: 0.3149,
  2020: 0.184,
  2021: 0.2871,
  2022: -0.1811,
  2023: 0.2629,
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

  let capitaleEsauritoInPrecedenza = false;
  let etaEsaurimentoPrecedente = null;

  for (let anno = annoInizio; anno <= annoFine; anno++) {
    if (capitaleEsauritoInPrecedenza) {
      const risultatoAnnoVuoto = {
        anno,
        eta: etaCorrente,
        capitaleIniziale: 0,
        totaleEntrate: 0,
        totaleUscite: 0,
        utilePerditaLordo: 0,
        impostaReddito: 0,
        utilePerditaNetto: 0,
        capitalePreRendimento: 0,
        rendimentoLordo: 0,
        impostaRendite: 0,
        rendimentoNetto: 0,
        capitaleFinale: 0,
        capitalePerConto: {},
        capitaleEsaurito: true,
        etaEsaurimento: etaEsaurimentoPrecedente,
      };
      risultatiFinali.push(risultatoAnnoVuoto);
      etaCorrente++;
      continue;
    }

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
        if (anno > e.inizio) valoriRicorrenti[e.desc] *= 1 + e.incr / 100;
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

    // DEBUG LOGGING START
    console.log(`--- ANNO ${anno} (Età: ${etaCorrente}) ---`);
    console.log(`Fase Ritiro: ${inFaseDiRitiro}`);
    console.log(`Strategia Prelievo: ${inputs.impostazioni.strategiaPrelievo}`);
    console.log(`Percentuale Prelievo (da input): ${inputs.impostazioni.percentualePrelievo}`);
    console.log(`Capitale Iniziale Anno: ${risultatoAnno.capitaleIniziale}`);
    // DEBUG LOGGING END

    if (inFaseDiRitiro && inputs.impostazioni.strategiaPrelievo === 'percentualeCostante') {
        console.log('BRANCH: Calcolo prelievo a percentuale');
        const withdrawalRate = inputs.impostazioni.percentualePrelievo / 100;
        const withdrawalAmount = risultatoAnno.capitaleIniziale * withdrawalRate;
        totalExpensesForYear = (totaleRataDebiti || 0) + withdrawalAmount;
        risultatoAnno.prelievo = withdrawalAmount;
        console.log(`Prelievo Calcolato: ${withdrawalAmount}, Spese Totali (con prelievo): ${totalExpensesForYear}`);
    } else {
        console.log('BRANCH: Calcolo uscite standard');
        let totaleUsciteRicorrenti = 0;
        inputs.uscite.ricorrenti.forEach((u) => {
          if (anno >= u.inizio && anno <= u.fine) {
            const inflazioneApplicata =
              u.inflazioneSpecifica > 0
                ? u.inflazioneSpecifica
                : inputs.impostazioni.tassoInflazione;
            if (anno > u.inizio)
              valoriRicorrenti[u.desc] *=
                1 + u.incr / 100 + inflazioneApplicata / 100;
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
        console.log(`Uscite Ricorrenti: ${totaleUsciteRicorrenti}, Uscite Lump Sum: ${usciteLumpSum}, Debiti: ${totaleRataDebiti}, Spese Totali (standard): ${totalExpensesForYear}`);
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

    inputs.assetAllocation.forEach(asset => {
      const rendimentoAnnuoAsset = isMonteCarloRun 
        ? getNormalRandom(asset.rendimento / 100, asset.devStd / 100)
        : asset.rendimento / 100;
      
      const rendimentoLordoAsset = capitalePerConto[asset.nome] * rendimentoAnnuoAsset;
      totaleRendimentoLordo += rendimentoLordoAsset;

      let impostaRenditeAsset = 0;
      if (rendimentoLordoAsset > 0) {
        if (asset.tipoConto === "tassabile") {
          impostaRenditeAsset = rendimentoLordoAsset * (asset.tassazioneSpecifica > 0 ? asset.tassazioneSpecifica / 100 : inputs.impostazioni.tassazioneRendite / 100);
        }
      }
      totaleImpostaRendite += impostaRenditeAsset;
      capitalePerConto[asset.nome] += rendimentoLordoAsset - impostaRenditeAsset;
    });

    risultatoAnno.rendimentoLordo = totaleRendimentoLordo;
    risultatoAnno.impostaRendite = totaleImpostaRendite;
    risultatoAnno.rendimentoNetto = totaleRendimentoLordo - totaleImpostaRendite;

    const capitaleFinale = Object.values(capitalePerConto).reduce((sum, val) => sum + val, 0);
    risultatoAnno.capitaleFinale = capitaleFinale;
    risultatoAnno.capitalePerConto = { ...capitalePerConto };
    risultatiFinali.push(risultatoAnno);

    if (capitaleFinale <= 0 && !risultatoAnno.capitaleEsaurito) {
      risultatoAnno.capitaleEsaurito = true;
      risultatoAnno.etaEsaurimento = etaCorrente;
      capitaleEsauritoInPrecedenza = true;
    }

    etaCorrente++;
  }
  return risultatiFinali;
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

export function calcolaSimulazioneMonteCarlo(inputs, annoInizio, annoFine) {
  const allSimulations = [];
  const numeroSimulazioni = inputs.impostazioni.numeroSimulazioni;
  let simulazioniFallite = 0;
  let sommaEtaEsaurimento = 0;

  for (let i = 0; i < numeroSimulazioni; i++) {
    const inputsCopia = JSON.parse(JSON.stringify(inputs));
    const simulazione = calcolaProiezione(inputsCopia, annoInizio, annoFine, true);
    allSimulations.push(simulazione);

    const ultimoAnno = simulazione[simulazione.length - 1];
    if (ultimoAnno.capitaleEsaurito) {
      simulazioniFallite++;
      sommaEtaEsaurimento += ultimoAnno.etaEsaurimento;
    }
  }

  const etaMediaEsaurimento =
    simulazioniFallite > 0 ? sommaEtaEsaurimento / simulazioniFallite : null;

  return {
    simulations: allSimulations,
    numeroSimulazioniFallite: simulazioniFallite,
    etaMediaEsaurimento: etaMediaEsaurimento,
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
  console.log("DEBUG: avviaSimulazione chiamata.");
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
        backtestResults,
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
      results = backtestResults;
      break;
    default: // deterministic
      const deterministicResults = calcolaProiezione(
        inputs,
        annoInizioSimulazione,
        annoFineSimulazione
      );
      mostraRisultatiDeterministici(
        deterministicResults,
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
      results = deterministicResults;
      break;
  }

  showResultsRef.value = true;
  loaderHiddenRef.value = true;
  return results;
}