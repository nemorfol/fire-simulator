<script setup>
import { defineProps, watch, ref } from 'vue';
import Plotly from 'plotly.js-dist-min';

const props = defineProps({
  simulationResults: {
    type: Array,
    required: true,
  },
  incomeCategories: {
    type: Array,
    default: () => [],
  },
  expenseCategories: {
    type: Array,
    default: () => [],
  },
});

const chartDiv = ref(null);

const drawChart = () => {
  if (!props.simulationResults || props.simulationResults.length === 0 || !chartDiv.value) {
    return;
  }

  const years = props.simulationResults.map(r => r.anno);
  const incomeTraces = [];
  const expenseTraces = [];

  // Raccogli tutte le descrizioni di entrate e uscite dalle prop
  const allIncomeDescs = Array.from(new Set(props.incomeCategories));
  const allExpenseDescs = Array.from(new Set(props.expenseCategories));

  const incomeColors = ['#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9', '#E8F5E9']; // Sfumature di verde
  const expenseColors = ['#F44336', '#E57373', '#EF9A9A', '#FFCDD2', '#FFEBEE', '#FFEBEE']; // Sfumature di rosso

  // Crea le tracce per le entrate
  allIncomeDescs.forEach((desc, index) => {
    const values = props.simulationResults.map(r => r[desc] || 0);
    const color = incomeColors[index % incomeColors.length];
    incomeTraces.push({
      x: years,
      y: values,
      name: desc,
      type: 'bar',
      marker: { color: color }, // Colore dalla palette
      hovertemplate: `<b>%{x}</b><br>%{fullData.name}: %{y:.2f}<extra></extra>`,
    });
  });

  // Crea le tracce per le uscite
  allExpenseDescs.forEach((desc, index) => {
    const values = props.simulationResults.map(r => -(r[desc] || 0)); // Valori negativi per le uscite
    const color = expenseColors[index % expenseColors.length];
    expenseTraces.push({
      x: years,
      y: values,
      name: desc,
      type: 'bar',
      marker: { color: color }, // Colore dalla palette
      hovertemplate: `<b>%{x}</b><br>%{fullData.name}: %{y:.2f}<extra></extra>`,
    });
  });

  const data = [...incomeTraces, ...expenseTraces];

  const layout = {
    barmode: 'relative',
    title: {
      text: 'Entrate e Uscite per Categoria nel Tempo',
      y: 0.95, // Posiziona il titolo più in alto (0.95 è vicino al top)
      yref: 'paper', // Riferimento alla "carta" del grafico (0 a 1)
    },
    xaxis: { title: 'Anno' },
    yaxis: { title: 'Importo (€)' },
    height: 1000,
    width: 1620,
    margin: { t: 50, b: 50, l: 50, r: 50 },
  };

  Plotly.newPlot(chartDiv.value, data, layout);
};

watch(() => props.simulationResults, drawChart, { deep: true, immediate: true });
watch(() => props.incomeCategories, drawChart, { deep: true });
watch(() => props.expenseCategories, drawChart, { deep: true });
</script>

<template>
  <div ref="chartDiv" class="income-expense-chart"></div>
</template>

<style scoped>
.income-expense-chart {
  margin-top: 20px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
