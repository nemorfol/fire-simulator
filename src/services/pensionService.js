/**
 * Stima la pensione pubblica basandosi sul sistema contributivo italiano.
 * Questo è un modello semplificato e non deve essere considerato un calcolo ufficiale.
 */

// Coefficienti di trasformazione ufficiali (esempio basato su dati 2023-2024)
const transformationCoefficients = {
  57: 0.0427,
  58: 0.04376,
  59: 0.04488,
  60: 0.04607,
  61: 0.04734,
  62: 0.04868,
  63: 0.0501,
  64: 0.0516,
  65: 0.05318,
  66: 0.05485,
  67: 0.05661,
  68: 0.05847,
  69: 0.06046,
  70: 0.06258,
  71: 0.06486,
};

// Aliquota di computo per lavoratori dipendenti
const contributionRate = 0.33;

// Tasso di capitalizzazione medio annuo del montante (basato sulla media del PIL a 5 anni)
// Usiamo un valore conservativo e semplificato.
const capitalizationRate = 0.015; // 1.5%

// Coefficienti di rivalutazione del montante contributivo storici e futuri noti
const specificCapitalizationRates = {
  1996: 0.055871,
  1997: 0.053597,
  1998: 0.056503,
  1999: 0.051781,
  2000: 0.047781,
  2001: 0.043698,
  2002: 0.041614,
  2003: 0.039272,
  2004: 0.040506,
  2005: 0.035386,
  2006: 0.033937,
  2007: 0.034625,
  2008: 0.033201,
  2009: 0.017935,
  2010: 0.016165,
  2011: 0.011344,
  2012: 0.001643,
  2013: 0.000000,
  2014: 0.005058,
  2015: 0.004684,
  2016: 0.005205,
  2017: 0.013478,
  2018: 0.018254,
  2019: 0.019199,
  2020: 0.000000,
  2021: 0.009756,
  2022: 0.023082,
  2023: 0.036622,
  2024: 0.036622, // Coefficiente per le pensioni con decorrenza 2025 (rivalutazione del montante al 31/12/2023)
};

/**
 * @param {object} pensionInputs - Dati per la stima.
 * @param {number} pensionInputs.initialGrossSalary - Reddito Annuo Lordo attuale.
 * @param {number} pensionInputs.contributionStartYear - Anno di inizio contribuzione.
 * @param {number} pensionInputs.salaryGrowthRate - Tasso di crescita annuo dello stipendio (%).
 * @param {number} pensionInputs.retirementAge - Età di ritiro target.
 * @param {number} pensionInputs.currentAge - Età attuale dell'utente.
 * @param {number} pensionInputs.simulationEndAge - Età di fine simulazione.
 * @param {number} pensionInputs.contributionEndYear - Anno di fine contribuzione.
 * @param {number} [pensionInputs.averageCapitalizationRate=0.015] - Tasso di capitalizzazione medio annuo per anni futuri (default 1.5%).
 * @returns {object|null} Un oggetto Entrata Ricorrente o null se i dati non sono validi.
 */
export function estimatePublicPension(pensionInputs) {
  const { 
    initialGrossSalary, 
    contributionStartYear, 
    salaryGrowthRate,
    retirementAge,
    currentAge,
    simulationEndAge,
    contributionEndYear,
    averageCapitalizationRate = 0.015 // Default a 1.5% se non specificato
  } = pensionInputs;

  if (!initialGrossSalary || !contributionStartYear || !retirementAge || !currentAge) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const retirementYear = currentYear + (retirementAge - currentAge);

  let totalContributions = 0;
  let currentSalary = initialGrossSalary;

  // Calcola il montante contributivo da oggi fino alla pensione o all'anno di fine contribuzione
  for (let year = currentYear; year < retirementYear; year++) {
    if (year >= contributionEndYear) { // Interrompi se si raggiunge l'anno di fine contribuzione
      break;
    }
    const annualContribution = currentSalary * contributionRate;
    
    let effectiveCapitalizationRate = specificCapitalizationRates[year] || averageCapitalizationRate;

    // Capitalizza i contributi per gli anni rimanenti fino alla pensione
    const yearsToCapitalize = retirementYear - year;
    const capitalizedContribution = annualContribution * Math.pow(1 + effectiveCapitalizationRate, yearsToCapitalize);
    
    totalContributions += capitalizedContribution;

    // Aggiorna lo stipendio per l'anno successivo
    currentSalary *= (1 + salaryGrowthRate / 100);
  }

  // Se non ci sono contributi accumulati, la pensione è zero
  if (totalContributions <= 0) {
    return null;
  }

  // Scegli il coefficiente di trasformazione corretto
  const coefficient = transformationCoefficients[retirementAge];
  if (!coefficient) {
    // Se non c'è un coefficiente per l'età esatta, potremmo interpolare o usare il più vicino.
    // Per semplicità, usiamo il più vicino o restituiamo un errore.
    console.error(`Coefficiente di trasformazione non disponibile per l'età ${retirementAge}`);
    return null;
  }

  const grossAnnualPension = totalContributions * coefficient;

  // Crea l'oggetto Entrata Ricorrente
  const pensionIncome = {
    desc: "Pensione Pubblica (Stimata)",
    valore: grossAnnualPension,
    isTodayValue: false, // Il valore è già calcolato all'anno di pensionamento
    inizio: retirementYear,
    fine: currentYear + (simulationEndAge - currentAge),
    incr: 0, // La pensione viene già rivalutata dall'INPS, per semplicità non applichiamo crescita extra
    inPensione: true,
    taxRegime: "ordinaria",
    aliquotaSost: 0,
  };

  return pensionIncome;
}
