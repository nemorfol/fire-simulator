<script setup>
import { ref, onMounted, watch, onBeforeUnmount, markRaw, nextTick, toRaw } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
  labels: {
    type: Array,
    default: () => [],
  },
  datasets: {
    type: Array,
    default: () => [],
  },
});

const chartIstanza = ref(null);
const capitalChartCanvas = ref(null);

function disegnaGraficoCapitale(labels, datasets) {
  if (!capitalChartCanvas.value) {
    console.warn("Canvas element not available yet.");
    return;
  }

  const ctx = capitalChartCanvas.value.getContext('2d');
  if (!ctx) {
    console.warn("2D context not available for canvas.");
    return;
  }

  if (chartIstanza.value) {
    // Aggiorna i dati del grafico esistente
    chartIstanza.value.data.labels = labels && Array.isArray(labels) ? labels : [];
    chartIstanza.value.data.datasets = datasets && Array.isArray(datasets) ? JSON.parse(JSON.stringify(datasets)).map(dataset => ({ ...dataset, fill: false })) : [];
    chartIstanza.value.update();
  } else {
    // Crea una nuova istanza del grafico
    chartIstanza.value = markRaw(new Chart(ctx, {
      type: "line",
      data: {
        labels: labels && Array.isArray(labels) ? labels : [],
        datasets: datasets && Array.isArray(datasets) ? JSON.parse(JSON.stringify(datasets)).map(dataset => ({ ...dataset, fill: false })) : [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            ticks: {
              callback: (value) =>
                new Intl.NumberFormat("it-IT", {
                  style: "currency",
                  currency: "EUR",
                }).format(value),
              font: { weight: "bold" },
            },
          },
          x: { ticks: { font: { weight: "bold" } } },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) =>
                `${context.dataset.label || ""}: ${new Intl.NumberFormat(
                  "it-IT",
                  { style: "currency", currency: "EUR" }
                ).format(context.parsed.y)}`,
            },
          },
          legend: { labels: { font: { weight: "bold" } } },
        },
      },
    }));
  }
}

onMounted(() => {
  nextTick(() => {
    disegnaGraficoCapitale(toRaw(props.labels), toRaw(props.datasets));
  });
});

watch(() => [props.labels, props.datasets], ([newLabels, newDatasets]) => {
  nextTick(() => {
    disegnaGraficoCapitale(toRaw(newLabels), toRaw(newDatasets));
  });
});
</script>

<template>
  <div class="relative h-96 md:h-[450px]">
    <canvas ref="capitalChartCanvas"></canvas>
  </div>
</template>

<style scoped>
/* Stili specifici per CapitalChart.vue */
</style>
