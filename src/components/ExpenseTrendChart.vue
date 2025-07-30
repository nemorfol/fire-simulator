<template>
  <div class="relative h-[500px] md:h-[600px] w-full">
    <canvas ref="expenseTrendChartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount, markRaw, nextTick, toRaw } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
  labels: { // Years
    type: Array,
    default: () => [],
  },
  datasets: { // Each dataset is a category
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['year-selected']);

const chartInstance = ref(null);
const expenseTrendChartCanvas = ref(null);

function drawChart(labels, datasets) {
  if (!expenseTrendChartCanvas.value) {
    return;
  }

  const ctx = expenseTrendChartCanvas.value.getContext('2d');
  if (!ctx) {
    return;
  }

  if (chartInstance.value) {
    chartInstance.value.data.labels = labels && Array.isArray(labels) ? labels : [];
    chartInstance.value.data.datasets = datasets && Array.isArray(datasets) ? JSON.parse(JSON.stringify(datasets)) : [];
    chartInstance.value.update();
  } else {
    chartInstance.value = markRaw(new Chart(ctx, {
      type: "bar", // Stacked bar chart
      data: {
        labels: labels && Array.isArray(labels) ? labels : [],
        datasets: datasets && Array.isArray(datasets) ? JSON.parse(JSON.stringify(datasets)).map(dataset => ({ ...dataset, hitRadius: 20, barThickness: 'flex', maxBarThickness: 10 })) : [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Anno'
            },
            barPercentage: 1.0, // Make bars take full width of their category
            categoryPercentage: 1.0, // Make categories take full width of their space
          },
          y: {
            stacked: true,
            title: {
              display: true,
              text: 'Importo (€)'
            },
            ticks: {
              callback: (value) =>
                new Intl.NumberFormat("it-IT", {
                  style: "currency",
                  currency: "EUR" ,
                }).format(value),
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: 'Andamento Spese Ricorrenti per Categoria nel Tempo',
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: (context) =>
                `${context.dataset.label || ""}: ${new Intl.NumberFormat(
                  "it-IT",
                  { style: "currency", currency: "EUR" }
                ).format(context.parsed.y)}`, 
            },
          },
          legend: {
            position: 'top',
          },
        },
        hover: {
          mode: 'x',
          intersect: true,
        },
        onClick: (e, activeElements) => {
          
          
          if (activeElements.length > 0) {
            const clickedElementIndex = activeElements[0].index;
            const year = chartInstance.value.data.labels[clickedElementIndex];
            
            
            emit('year-selected', year);
          }
        }
      },
    }));
  }
}

onMounted(() => {
  nextTick(() => {
    drawChart(toRaw(props.labels), toRaw(props.datasets));
  });
});

watch(() => [props.labels, props.datasets], ([newLabels, newDatasets]) => {
  nextTick(() => {
    drawChart(toRaw(newLabels), toRaw(newDatasets));
  });
}, { deep: true });

onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy();
  }
});
</script>

<style scoped>
/* Add any specific styles for the chart container if needed */
</style>
