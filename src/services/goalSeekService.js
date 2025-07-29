import { leggiInput } from "./financialCalculator";
import { calcolaProiezione } from "./simulationService.js";

export async function eseguiGoalSeek(
  formInputs,
  loaderHiddenRef,
  mostraNotifica
) {
  loaderHiddenRef.value = false;
  await new Promise(resolve => setTimeout(resolve, 50));

  try {
    const targetAge = parseInt(formInputs.goalSeek.goalSeekTarget, 10);
    const variableToChange = formInputs.goalSeek.goalSeekVariable;

    if (!variableToChange) {
      mostraNotifica("Errore", "Seleziona una variabile da modificare per il Goal Seek.", true);
      loaderHiddenRef.value = true;
      return;
    }

    const [type, indexStr] = variableToChange.split("-");
    const index = parseInt(indexStr, 10);

    let low = 0;
    let high = 200000; // Range di ricerca generico per le entrate
    let bestSolution = null;

    if (type === 'uscita') {
      // Limita la ricerca al valore attuale della spesa per non renderla negativa
      high = formInputs.usciteRicorrenti[index].valore;
    }

    for (let i = 0; i < 30; i++) { // Limita le iterazioni per evitare loop infiniti
      const mid = (low + high) / 2;
      if (Math.abs(high - low) < 0.01) break; // Interrompi se la soluzione è abbastanza precisa

      const tempFormInputs = JSON.parse(JSON.stringify(formInputs));

      if (type === "entrata") {
        tempFormInputs.entrateRicorrenti[index].valore += mid;
      } else {
        tempFormInputs.usciteRicorrenti[index].valore -= mid;
      }

      const tempInputs = leggiInput(tempFormInputs);
      if (!tempInputs) continue;

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
      const annoFineSimulazione = Math.max(...anniCoinvolti, formInputs.etaIniziale + 100);

      const risultati = calcolaProiezione(
        tempInputs,
        annoInizioSimulazione,
        annoFineSimulazione
      ).simulations;

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

    if (bestSolution !== null) {
      if (type === "entrata") {
        formInputs.entrateRicorrenti[index].valore = parseFloat(formInputs.entrateRicorrenti[index].valore) + bestSolution;
      } else {
        formInputs.usciteRicorrenti[index].valore = parseFloat(formInputs.usciteRicorrenti[index].valore) - bestSolution;
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
  } catch (error) {
    console.error("Errore durante il Goal Seek:", error);
    mostraNotifica("Errore", "Si è verificato un errore imprevisto durante il Goal Seek. Controlla la console per i dettagli.", true);
  } finally {
    loaderHiddenRef.value = true;
  }
}