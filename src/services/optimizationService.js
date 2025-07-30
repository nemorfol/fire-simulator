

/**
 * Trova la riduzione percentuale ottimale delle spese per raggiungere il numero FIRE.
 * @param {object} formInputs - I dati di input del form.
 * @param {number} fireNumber - L'obiettivo del Numero FIRE da raggiungere.
 * @param {function} simulationRunner - La funzione che esegue la simulazione.
 * @returns {Promise<object>} - Un oggetto con il risultato dell'ottimizzazione.
 */
export async function findOptimalExpenseReduction(formInputs, fireNumber, simulationRunner) {
  let lowerBound = 0; // 0% di riduzione
  let upperBound = 100; // 100% di riduzione
  let bestResult = null;

  // Esegui una simulazione iniziale senza alcuna riduzione per vedere se l'obiettivo è già raggiunto.
  const initialResult = await simulationRunner(formInputs);
  if (initialResult.ultimoRisultato[initialResult.ultimoRisultato.length - 1].capitaleFinale >= fireNumber) {
    return {
      success: true,
      message: "Obiettivo già raggiunto! Non è necessaria alcuna riduzione delle spese.",
      reduction: 0,
    };
  }

  for (let i = 0; i < 10; i++) { // 10 iterazioni sono sufficienti per una buona precisione
    const midPoint = (lowerBound + upperBound) / 2;
    const tempInputs = JSON.parse(JSON.stringify(formInputs)); // Deep copy

    // Applica la riduzione percentuale alle spese ricorrenti
    tempInputs.usciteRicorrenti.forEach(uscita => {
      uscita.valore *= (1 - midPoint / 100);
    });

    const result = await simulationRunner(tempInputs);
    const finalCapital = result.ultimoRisultato[result.ultimoRisultato.length - 1].capitaleFinale;

    if (finalCapital >= fireNumber) {
      // Successo, prova a ridurre di meno
      bestResult = midPoint;
      upperBound = midPoint;
    } else {
      // Fallimento, devi ridurre di più
      lowerBound = midPoint;
    }
  }

  if (bestResult !== null) {
    return {
      success: true,
      message: `Per raggiungere il tuo obiettivo, è necessaria una riduzione delle spese ricorrenti del ${bestResult.toFixed(2)}%.`,
      reduction: bestResult,
    };
  } else {
    return {
      success: false,
      message: "Non è stato possibile trovare una soluzione. Anche con una riduzione del 100% delle spese, l'obiettivo non viene raggiunto.",
      reduction: null,
    };
  }
}
