import { calculateFIREMetrics } from '@/services/financialCalculator.js';

// --- ENUMs e Costanti ---
export const PlanStepStatus = {
    COMPLETED: 'Completato',
    IN_PROGRESS: 'In corso',
    NOT_STARTED: 'Da iniziare',
};

export const PlanStepKey = {
    EMERGENCY_FUND: 'EMERGENCY_FUND',
    HIGH_INTEREST_DEBT: 'HIGH_INTEREST_DEBT',
    SAVINGS_RATE: 'SAVINGS_RATE',
    PENSION_PLANNING: 'PENSION_PLANNING',
    INVESTMENT_OPTIMIZATION: 'INVESTMENT_OPTIMIZATION',
};

const DEBT_HIGH_INTEREST_THRESHOLD = 4.0; // %
const SAVINGS_RATE_GOOD_THRESHOLD = 20; // %
const SAVINGS_RATE_TARGET_THRESHOLD = 50; // %

/**
 * Genera un piano finanziario guidato basato sui dati dell'utente.
 * @returns {Array<Object>} Un array di oggetti che rappresentano i passi del piano.
 */
export function generateFinancialPlan(financialData) {
    const metrics = calculateFIREMetrics(financialData);

    const plan = [
        createEmergencyFundStep(financialData, metrics),
        createHighInterestDebtStep(financialData, metrics),
        createSavingsRateStep(financialData, metrics),
        createPensionPlanningStep(financialData, metrics),
    ];

    // Ordina i passi per priorità logica (es. il fondo di emergenza è sempre il primo)
    const priorityOrder = [PlanStepKey.EMERGENCY_FUND, PlanStepKey.HIGH_INTEREST_DEBT, PlanStepKey.SAVINGS_RATE, PlanStepKey.PENSION_PLANNING];
    
    return plan.sort((a, b) => priorityOrder.indexOf(a.key) - priorityOrder.indexOf(b.key));
}


// --- Funzioni per la creazione dei singoli passi ---

/**
 * Crea il passo per il Fondo di Emergenza.
 */
function createEmergencyFundStep(data, metrics) {
    const monthlyExpenses = metrics.totalMonthlyExpenses;
    const recommendedFund = monthlyExpenses * 3; // 3 mesi di spese
    const currentCash = metrics.totalCash;
    
    let status = PlanStepStatus.NOT_STARTED;
    let progress = 0;

    if (currentCash > 0) {
        progress = Math.min(100, (currentCash / recommendedFund) * 100);
    }

    if (progress >= 100) {
        status = PlanStepStatus.COMPLETED;
    } else if (progress > 0) {
        status = PlanStepStatus.IN_PROGRESS;
    }

    return {
        key: PlanStepKey.EMERGENCY_FUND,
        title: 'Costruisci il Fondo di Emergenza',
        description: `Un fondo di emergenza copre le spese impreviste. Ti consigliamo di accantonare l'equivalente di 3-6 mesi di spese.`,
        details: `Spese mensili: **${monthlyExpenses.toFixed(2)} €**. Fondo raccomandato (3 mesi): **${recommendedFund.toFixed(2)} €**. Liquidità attuale: **${currentCash.toFixed(2)} €**.`,
        status,
        progress,
        action: {
            label: 'Analizza le tue spese',
            target: 'income-expense-tabs',
            tabName: 'Entrate/Uscite'
        }
    };
}

/**
 * Crea il passo per l'estinzione dei debiti ad alto interesse.
 */
function createHighInterestDebtStep(data, metrics) {
    const highInterestDebts = data.debiti.filter(d => d.tassoInteresse > DEBT_HIGH_INTEREST_THRESHOLD);
    const totalHighInterestDebt = highInterestDebts.reduce((sum, d) => sum + d.importoIniziale, 0);

    let status = PlanStepStatus.COMPLETED;
    let description = 'Ottimo! Non hai debiti con un alto tasso di interesse.';
    let details = `Continua a gestire i tuoi debiti in modo responsabile.`;

    if (highInterestDebts.length > 0) {
        status = PlanStepStatus.IN_PROGRESS;
        description = `I debiti con un alto tasso di interesse (> ${DEBT_HIGH_INTEREST_THRESHOLD}%) possono rallentare il tuo percorso. Estinguerli è una priorità.`;
        details = `Hai **${highInterestDebts.length} debiti** considerati ad alto interesse, per un totale di **${totalHighInterestDebt.toFixed(2)} €**.`;
    }
    
    // Se non ci sono debiti in generale, consideralo completato
    if (data.debiti.length === 0) {
        details = 'Non hai debiti registrati. Ben fatto!';
    }


    return {
        key: PlanStepKey.HIGH_INTEREST_DEBT,
        title: 'Estingui i Debiti ad Alto Interesse',
        description,
        details,
        status,
        progress: status === PlanStepStatus.COMPLETED ? 100 : 0,
        action: {
            label: 'Vai alla sezione Debiti',
            target: 'debt-section'
        }
    };
}

/**
 * Crea il passo per l'analisi e l'ottimizzazione del Tasso di Risparmio.
 */
function createSavingsRateStep(data, metrics) {
    const savingsRate = metrics.savingsRate;
    let status = PlanStepStatus.NOT_STARTED;
    let description = `Il tuo tasso di risparmio è un motore fondamentale per l'indipendenza finanziaria. Analizziamolo.`;
    let details = `Il tuo tasso di risparmio attuale è del **${savingsRate.toFixed(2)}%**.`;

    if (savingsRate >= SAVINGS_RATE_TARGET_THRESHOLD) {
        status = PlanStepStatus.COMPLETED;
        description = `Complimenti! Il tuo tasso di risparmio è eccellente e ti sta portando rapidamente verso i tuoi obiettivi.`;
    } else if (savingsRate >= SAVINGS_RATE_GOOD_THRESHOLD) {
        status = PlanStepStatus.IN_PROGRESS;
        description = `Buon lavoro! Il tuo tasso di risparmio è solido. Cerca opportunità per ottimizzarlo ulteriormente.`;
    } else {
        description = `Il tuo tasso di risparmio ha un grande potenziale di miglioramento. Incrementarlo farà una differenza enorme.`;
    }

    return {
        key: PlanStepKey.SAVINGS_RATE,
        title: 'Ottimizza il Tasso di Risparmio',
        description,
        details,
        status,
        progress: Math.min(100, (savingsRate / SAVINGS_RATE_TARGET_THRESHOLD) * 100),
        action: {
            label: 'Analizza Entrate e Uscite',
            target: 'income-expense-tabs',
            tabName: 'Entrate/Uscite'
        }
    };
}

/**
 * Crea il passo per la pianificazione previdenziale.
 */
function createPensionPlanningStep(data, metrics) {
    // Questo passo è più che altro un promemoria, dato che la valutazione è complessa.
    return {
        key: PlanStepKey.PENSION_PLANNING,
        title: 'Pianifica la tua Pensione',
        description: `Oltre ai tuoi investimenti personali, è importante capire a quanto ammonterà la tua pensione pubblica o complementare.`,
        details: `Usa il nostro simulatore per avere una stima e integrare questo dato nel tuo piano generale.`,
        status: PlanStepStatus.NOT_STARTED, // L'utente deve interagire per completarlo
        progress: 0,
        action: {
            label: 'Vai al simulatore pensione',
            target: 'pension-estimator'
        }
    };
}