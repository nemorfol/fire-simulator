<template>
  <div class="relative h-[600px]">
    <canvas ref="incomeExpenseChartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick, markRaw } from 'vue';
import Chart from 'chart.js/auto';

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

const chartInstance = ref(null);
const incomeExpenseChartCanvas = ref(null);

const drawChart = () => {
  if (!incomeExpenseChartCanvas.value || !props.simulationResults || props.simulationResults.length === 0) return;

  const labels = props.simulationResults.map(r => r.anno);
  
  const incomeColors = ['#4CAF50', '#81C784', '#A5D6A7', '#C8E6C9'];
  const expenseColors = ['#F44336', '#E57373', '#EF9A9A', '#FFCDD2'];

  const incomeDatasets = props.incomeCategories.map((category, index) => ({
    label: category,
    data: props.simulationResults.map(r => r[category] || 0),
    backgroundColor: incomeColors[index % incomeColors.length],
    stack: 'income'
  }));

  const expenseDatasets = props.expenseCategories.map((category, index) => ({
    label: category,
    data: props.simulationResults.map(r => (r[category] || 0)), // Valori positivi per la visualizzazione
    backgroundColor: expenseColors[index % expenseColors.length],
    stack: 'expense'
  }));

  const chartData = {
    labels: labels,
    datasets: [...incomeDatasets, ...expenseDatasets],
  };

  const ctx = incomeExpenseChartCanvas.value.getContext('2d');
  if (chartInstance.value) {
    chartInstance.value.data = chartData;
    chartInstance.value.update();
  } else {
    chartInstance.value = markRaw(new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            title: { display: true, text: 'Anno' }
          },
          y: {
            stacked: true,
            title: { display: true, text: 'Importo (€)' },
            ticks: {
              callback: (value) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value)
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Entrate e Uscite per Categoria nel Tempo',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        }
      }
    }));
  }
};

onMounted(() => {
  nextTick(drawChart);
});

watch(() => [props.simulationResults, props.incomeCategories, props.expenseCategories], () => {
  nextTick(drawChart);
}, { deep: true });

onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy();
    chartInstance.value = null;
  }
});
</script>

<style scoped>
/* Stili specifici se necessari */
</style>
