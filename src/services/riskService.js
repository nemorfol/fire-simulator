import { reactive } from 'vue';

const defaultRisks = [
  { id: 'sequence', name: 'Sequenza dei Rendimenti', description: "Rischio di subire perdite di mercato significative nei primi anni di ritiro, erodendo il capitale in modo sproporzionato." },
  { id: 'inflation', name: 'Inflazione Elevata', description: "Rischio che un'inflazione superiore alle attese eroda il potere d'acquisto del capitale e delle rendite." },
  { id: 'longevity', name: 'Longevità', description: "Rischio di vivere più a lungo del previsto, esaurendo il capitale prima della fine della vita." },
  { id: 'health', name: 'Spese Sanitarie Impreviste', description: "Rischio di dover affrontare costi medici o di assistenza a lungo termine non pianificati." },
  { id: 'market_crash', name: 'Crollo di Mercato Prolungato', description: "Rischio di un mercato ribassista che dura molti anni, mettendo a dura prova i tassi di prelievo." },
  { id: 'cognitive_decline', name: 'Declino Cognitivo', description: "Rischio di non essere più in grado di gestire le proprie finanze in modo efficace a causa dell'invecchiamento." },
  { id: 'tax_changes', name: 'Modifiche Fiscali Sfavorevoli', description: "Rischio che cambiamenti nella legislazione fiscale aumentino le imposte su rendite e prelievi." },
  { id: 'family_needs', name: 'Esigenze Familiari Impreviste', description: "Rischio di dover sostenere finanziariamente figli, genitori anziani o altri familiari." },
  { id: 'behavioral', name: 'Errori Comportamentali', description: "Rischio di prendere decisioni di investimento sbagliate (es. vendere nel panico) guidate dall'emotività." },
  { id: 'lifestyle_creep', name: 'Aumento del Tenore di Vita', description: "Rischio che le spese aumentino involontariamente nel tempo, rendendo il piano insostenibile." },
];

export const userRiskAssessments = reactive(
  defaultRisks.map(risk => ({
    ...risk,
    probability: 'Basso',
    impact: 'Basso',
  }))
);

export function updateRiskAssessment(riskId, field, value) {
  const riskToUpdate = userRiskAssessments.find(r => r.id === riskId);
  if (riskToUpdate) {
    riskToUpdate[field] = value;
  }
}