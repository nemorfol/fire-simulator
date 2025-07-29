
import lifeExpectancyData from '../data/istat-life-expectancy.json';

/**
 * Fetches remaining life expectancy for a given age and sex in Italy from local ISTAT data.
 * @param {number} age - The current age.
 * @param {string} sex - The sex ('M' for Male, 'F' for Female).
 * @returns {Promise<number|null>} A promise that resolves with the remaining life expectancy, or null if not found.
 */
export async function getLifeExpectancy(age, sex) {
  try {
    const genderData = lifeExpectancyData[sex];
    if (genderData && genderData[age] !== undefined) {
      return genderData[age];
    }
    return null;
  } catch (error) {
    console.error('Error reading local life expectancy data:', error);
    return null;
  }
}

