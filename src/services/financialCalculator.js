export function leggiInput(formInputs) {
  const inputs = {
    impostazioni: {
      etaIniziale: parseInt(formInputs.etaIniziale),
      capitaleIniziale: parseFloat(formInputs.capitaleIniziale),
      tassoInflazione: parseFloat(formInputs.tassoInflazione),
      regolaFIRE: parseFloat(formInputs.regolaFIRE),
      tassazioneRendite: parseFloat(formInputs.tassazioneRendite),
      simMode: formInputs.simMode,
      numeroSimulazioni: parseInt(formInputs.numeroSimulazioni) || 1000, // Aggiunto con fallback
      inflationScenario: formInputs.inflationScenario, // Corretto
      initialCrisisOptions: formInputs.initialCrisisOptions,
      rendimentoCapitale: formInputs.assetAllocation.reduce(
        (sum, asset) =>
          sum + (parseFloat(asset.quota) / 100) * parseFloat(asset.rendimento),
        0
      ),
      deviazioneStandard: formInputs.assetAllocation.reduce(
        (sum, asset) =>
          sum + (parseFloat(asset.quota) / 100) * parseFloat(asset.devStd),
        0
      ),
      correlazioneAsset: parseFloat(formInputs.correlazioneAsset) || 0,
    },
    taxBrackets: formInputs.taxBrackets.map((b) => ({
      finoA: b.finoA === Infinity ? Infinity : parseFloat(b.finoA),
      aliquota: parseFloat(b.aliquota),
    })),
    assetAllocation: formInputs.assetAllocation.map((a) => ({
      nome: a.nome,
      quota: parseFloat(a.quota),
      rendimento: parseFloat(a.rendimento),
      devStd: parseFloat(a.devStd),
      tipoConto: a.tipoConto, // es. "tassabile", "esente", "differito"
      tassazioneSpecifica: parseFloat(a.tassazioneSpecifica) || 0,
    })),
    entrate: {
      ricorrenti: formInputs.entrateRicorrenti.map((e) => ({
        desc: e.desc,
        valore: parseFloat(e.valore),
        isTodayValue: e.isTodayValue,
        inizio: parseInt(e.inizio),
        fine: parseInt(e.fine),
        incr: parseFloat(e.incr),
        inPensione: e.inPensione,
        taxRegime: e.taxRegime,
        aliquotaSost: parseFloat(e.aliquotaSost),
      })),
      lumpSum: formInputs.entrateLumpSum.map((e) => ({
        desc: e.desc,
        importo: parseFloat(e.importo),
        isTodayValue: e.isTodayValue,
        anno: parseInt(e.anno),
      })),
    },
    uscite: {
      ricorrenti: formInputs.usciteRicorrenti.map((u) => ({
        desc: u.desc,
        valore: parseFloat(u.valore),
        isTodayValue: u.isTodayValue,
        inizio: parseInt(u.inizio),
        fine: parseInt(u.fine),
        incr: parseFloat(u.incr) || 0,
        inflazioneSpecifica: parseFloat(u.inflazioneSpecifica) || 0,
      })),
      lumpSum: formInputs.usciteLumpSum.map((u) => ({
        desc: u.desc,
        importo: parseFloat(u.importo),
        isTodayValue: u.isTodayValue,
        anno: parseInt(u.anno),
      })),
    },
    debiti: formInputs.debiti.map((d) => ({
      desc: d.desc,
      tipoDebito: d.tipoDebito,
      importoIniziale: parseFloat(d.importoIniziale),
      tassoInteresse: parseFloat(d.tassoInteresse),
      durataAnni: parseInt(d.durataAnni),
      annoInizio: parseInt(d.annoInizio),
    })),
  };

  // Validazione di base
  if (
    isNaN(inputs.impostazioni.etaIniziale) ||
    inputs.impostazioni.etaIniziale <= 0
  ) {
    // mostraNotifica(
    //   "Errore di Input",
    //   "L'età iniziale deve essere un numero valido e maggiore di zero.",
    //   true
    // );
    return null;
  }
  if (
    isNaN(inputs.impostazioni.capitaleIniziale) ||
    inputs.impostazioni.capitaleIniziale < 0
  ) {
    // mostraNotifica(
    //   "Errore di Input",
    //   "Il capitale iniziale deve essere un numero valido e non negativo.",
    //   true
    // );
    return null;
  }
  if (
    inputs.assetAllocation.reduce((sum, asset) => sum + asset.quota, 0) !== 100
  ) {
    // mostraNotifica(
    //   "Errore di Input",
    //   "La somma delle quote di asset allocation deve essere esattamente 100%.",
    //   true
    // );
    return null;
  }
  if (inputs.taxBrackets.length === 0) {
    // mostraNotifica(
    //   "Errore di Input",
    //   "Devi definire almeno uno scaglione fiscale.",
    //   true
    // );
    return null;
  }

  return inputs;
}

/**
 * Calcola le metriche finanziarie chiave basate sui dati dell'utente.
 * @param {Object} financialData - L'oggetto contenente tutti i dati finanziari.
 * @returns {Object} Un oggetto con le metriche calcolate.
 */
export function calculateFIREMetrics(financialData) {
  const totalMonthlyIncome = financialData.entrateRicorrenti.reduce((sum, income) => sum + income.valore, 0);
  const totalMonthlyExpenses = financialData.usciteRicorrenti.reduce((sum, expense) => sum + expense.valore, 0);
  
  const savingsRate = totalMonthlyIncome > 0 ? ((totalMonthlyIncome - totalMonthlyExpenses) / totalMonthlyIncome) * 100 : 0;
  
  // Calcola la liquidità totale in base all'asset allocation
  const totalCash = financialData.assetAllocation
    .filter(asset => asset.nome.toLowerCase().includes('liquidit'))
    .reduce((sum, asset) => sum + (financialData.capitaleIniziale * (asset.quota / 100)), 0);

  const totalDebt = financialData.debiti.reduce((sum, debt) => sum + debt.importoIniziale, 0);

  return {
    totalMonthlyIncome,
    totalMonthlyExpenses,
    savingsRate,
    totalCash,
    totalDebt,
  };
}


/**
 * Calcola il prelievo annuale utilizzando la strategia Variable Percentage Withdrawal (VPW).
 * @param {number} portfolioValue - Il valore attuale del portafoglio.
 * @param {number} age - L'età attuale.
 * @param {number} lifeExpectancy - L'aspettativa di vita.
 * @returns {number} Il prelievo annuale calcolato.
 */
export function calculateVpwWithdrawal(portfolioValue, age, lifeExpectancy) {
  if (age >= lifeExpectancy) {
    return portfolioValue;
  }
  const remainingYears = lifeExpectancy - age;
  const withdrawalRate = 1 / remainingYears;
  return portfolioValue * withdrawalRate;
}

// Coefficienti di trasformazione ministeriali per il calcolo della rendita (validi per il 2024)
const TRANSFORMATION_COEFFICIENTS = {
  57: 0.04270,
  58: 0.04378,
  59: 0.04493,
  60: 0.04615,
  61: 0.04744,
  62: 0.04882,
  63: 0.05028,
  64: 0.05184,
  65: 0.05352,
  66: 0.05531,
  67: 0.05723,
  68: 0.05931,
  69: 0.06154,
  70: 0.06395,
  71: 0.06655,
};

/**
 * Stima la rendita annua di un fondo pensione.
 * @param {object} pensionFundInputs Dati di input del fondo pensione.
 * @param {number} retirementAge Età di pensionamento.
 * @param {number} currentAge Età attuale.
 * @returns {object} Un oggetto con la rendita lorda, netta e il montante finale.
 */
export function calculatePensionAnnuity(pensionFundInputs, retirementAge, currentAge) {
  const { 
    currentLumpSum, 
    pensionFundStartYear, 
    annualContribution, 
    annualReturnRate, 
    nonDeductedContributionRate 
  } = pensionFundInputs;

  const yearsToRetirement = retirementAge - currentAge;
  const returnRate = annualReturnRate / 100;

  // 1. Calcola il montante finale alla data del pensionamento
  let finalLumpSum = currentLumpSum * Math.pow(1 + returnRate, yearsToRetirement);
  for (let i = 0; i < yearsToRetirement; i++) {
    finalLumpSum += annualContribution * Math.pow(1 + returnRate, yearsToRetirement - i - 1);
  }

  // 2. Calcola l'anzianità di partecipazione per l'aliquota fiscale
  const participationYears = (new Date().getFullYear()) - pensionFundStartYear + yearsToRetirement;
  let taxRate = 0.15;
  if (participationYears > 15) {
    const reduction = (participationYears - 15) * 0.003;
    taxRate = Math.max(0.09, 0.15 - reduction);
  }

  // 3. Recupera il coefficiente di trasformazione
  const coefficient = TRANSFORMATION_COEFFICIENTS[retirementAge] || TRANSFORMATION_COEFFICIENTS[71]; // Fallback all'ultimo

  if (!coefficient) {
    return { error: "Coefficiente di trasformazione non disponibile per l'età specificata." };
  }

  // 4. Calcola la rendita annua lorda
  const grossAnnuity = finalLumpSum * coefficient;

  // 5. Calcola la rendita netta
  // Si assume che i rendimenti siano già stati tassati in fase di accumulo.
  // La tassazione si applica sulla parte di rendita derivante dai contributi dedotti.
  const taxablePortion = 1 - (nonDeductedContributionRate / 100);
  const taxes = (grossAnnuity * taxablePortion) * taxRate;
  const netAnnuity = grossAnnuity - taxes;

  return {
    finalLumpSum: finalLumpSum,
    grossAnnuity: grossAnnuity,
    netAnnuity: netAnnuity,
    appliedTaxRate: taxRate,
    transformationCoefficient: coefficient,
  };
}