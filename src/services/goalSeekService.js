import { leggiInput } from "./financialCalculator";

export async function eseguiGoalSeek(
  formInputs,
  loaderHiddenRef,
  mostraNotifica
) {
  loaderHiddenRef.value = false;
  await new Promise((resolve) => setTimeout(resolve, 50));

  const targetAge = parseInt(formInputs.goalSeekTarget);
  const variableToChange = formInputs.goalSeekVariable;
  const [type, indexStr] = variableToChange.split("-");
  const index = parseInt(indexStr);

  let low = 0,
    high = 200000; // Search range for the adjustment
  let bestSolution = null;

  for (let i = 0; i < 30; i++) {
    // Binary search-like iteration
    const mid = (low + high) / 2;
    const tempFormInputs = JSON.parse(JSON.stringify(formInputs)); // Deep copy

    if (type === "entrata") {
      tempFormInputs.entrateRicorrenti[index].valore += mid;
    } else {
      tempFormInputs.usciteRicorrenti[index].valore -= mid;
    }

    const tempInputs = {
      impostazioni: { ...tempFormInputs },
      taxBrackets: tempFormInputs.taxBrackets,
      assetAllocation: tempFormInputs.assetAllocation,
      entrate: {
        ricorrenti: tempFormInputs.entrateRicorrenti,
        lumpSum: tempFormInputs.entrateLumpSum,
      },
      uscite: {
        ricorrenti: tempFormInputs.usciteRicorrenti,
        lumpSum: tempFormInputs.usciteLumpSum,
      },
    };

    // Calculate rendimentoCapitale and deviazioneStandard for tempInputs
    let rendimentoPonderato = 0;
    tempInputs.assetAllocation.forEach((asset) => {
      rendimentoPonderato += (asset.quota / 100) * asset.rendimento;
    });
    tempInputs.impostazioni.rendimentoCapitale = rendimentoPonderato;

    let devStdPonderata = 0;
    tempInputs.assetAllocation.forEach((asset) => {
      devStdPonderata += (asset.quota / 100) * asset.devStd;
    });
    tempInputs.impostazioni.deviazioneStandard = devStdPonderata;

    const anniCoinvolti = [];
    const raccogliAnni = (items) => {
      items.forEach((item) => {
        if (item.inizio) anniCoinvolti.push(item.inizio);
        if (item.fine) anniCoinvolti.push(item.fine);
        if (item.anno) anniCoinvolti.push(item.anno);
      });
    };
    raccogliAnni(tempInputs.entrate.ricorrenti);
    raccogliAnni(tempInputs.uscite.ricorrenti);
    raccogliAnni(tempInputs.entrate.lumpSum);
    raccogliAnni(tempInputs.uscite.lumpSum);
    const annoInizioSimulazione = Math.min(...anniCoinvolti);
    const annoFineSimulazione = Math.max(...anniCoinvolti);

    const risultati = calcolaProiezione(
      tempInputs,
      annoInizioSimulazione,
      annoFineSimulazione
    );

    const totaleSpeseAnnuali = tempInputs.uscite.ricorrenti.reduce(
      (sum, u) => sum + u.valore,
      0
    );
    const regolaFIRE =
      tempInputs.impostazioni.regolaFIRE > 0
        ? tempInputs.impostazioni.regolaFIRE
        : 4;
    const moltiplicatoreFIRE = 100 / regolaFIRE;
    const numeroFIRE =
      totaleSpeseAnnuali > 0 ? totaleSpeseAnnuali * moltiplicatoreFIRE : 0;

    const fireYearData = risultati.find((r) => r.capitaleFinale >= numeroFIRE);

    if (fireYearData && fireYearData.eta <= targetAge) {
      bestSolution = mid;
      high = mid;
    } else {
      low = mid;
    }
  }

  loaderHiddenRef.value = true;

  if (bestSolution !== null) {
    if (type === "entrata") {
      formInputs.entrateRicorrenti[index].valore = (
        formInputs.entrateRicorrenti[index].valore + bestSolution
      ).toFixed(2);
    } else {
      formInputs.usciteRicorrenti[index].valore = (
        formInputs.usciteRicorrenti[index].valore - bestSolution
      ).toFixed(2);
    }
    mostraNotifica(
      "Soluzione Trovata!",
      `Per raggiungere il tuo obiettivo, il valore della voce selezionata è stato aggiornato. Riavvia la simulazione per vedere i risultati.`
    );
  } else {
    mostraNotifica(
      "Nessuna Soluzione",
      "Non è stato possibile trovare una soluzione con i parametri attuali. Prova con un obiettivo meno ambizioso o modifica altri parametri.",
      true
    );
  }
}