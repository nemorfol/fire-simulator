import istatLifeExpectancyData from '../data/istat-life-expectancy.json';

// Fattori di aggiustamento per i percentili superiori (basati su dati generali, da affinare se necessario)
const percentileAdjustmentFactors = {
  50: 0,   // Mediana (nessun aggiustamento)
  75: 3,   // +3 anni rispetto alla mediana
  90: 7,   // +7 anni rispetto alla mediana
  95: 10,  // +10 anni rispetto alla mediana
};

/**
 * Restituisce l'aspettativa di vita totale per un dato sesso, età e percentile, usando i dati ISTAT e interpolazione.
 * @param {number} currentAge - L'età attuale dell'utente.
 * @param {string} gender - Il sesso dell'utente ('male' o 'female').
 * @param {number} percentile - Il percentile di longevità desiderato (50, 75, 90, 95).
 * @returns {number|null} L'età massima di simulazione stimata o null se i dati non sono disponibili.
 */
export function getLifespanByPercentile(currentAge, gender, percentile) {
  const genderKey = gender === 'male' ? 'M' : 'F';
  const dataForGender = istatLifeExpectancyData[genderKey];

  if (!dataForGender) {
    console.warn(`Dati di aspettativa di vita non disponibili per il sesso: ${gender}.`);
    return null;
  }

  const ages = Object.keys(dataForGender).map(Number).sort((a, b) => a - b);

  // Trova le due età più vicine per l'interpolazione
  let lowerAge = ages[0];
  let upperAge = ages[ages.length - 1];

  for (let i = 0; i < ages.length; i++) {
    if (ages[i] <= currentAge) {
      lowerAge = ages[i];
    }
    if (ages[i] >= currentAge) {
      upperAge = ages[i];
      break;
    }
  }

  let remainingLifeExpectancy;

  if (lowerAge === upperAge) {
    // Età esatta trovata o fuori range (usa il valore più vicino)
    remainingLifeExpectancy = dataForGender[lowerAge];
  } else {
    // Interpolazione lineare
    const lowerValue = dataForGender[lowerAge];
    const upperValue = dataForGender[upperAge];
    remainingLifeExpectancy = lowerValue + ((upperValue - lowerValue) * (currentAge - lowerAge)) / (upperAge - lowerAge);
  }

  // Calcola l'età massima di simulazione per il 50° percentile
  const baseLifespan = currentAge + remainingLifeExpectancy;

  // Applica l'aggiustamento per il percentile desiderato
  const adjustment = percentileAdjustmentFactors[percentile];
  if (adjustment === undefined) {
    console.warn(`Percentile ${percentile} non supportato. Utilizzo il 50° percentile.`);
    return Math.round(baseLifespan); // Fallback al 50° percentile
  }

  return Math.round(baseLifespan + adjustment);
}