<script setup>
import { ref, onMounted, watch, defineProps } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
  risultati: {
    type: Array,
    default: () => [],
  },
});

const chartCanvas = ref(null);
let chartInstance = null;

const disegnaGraficoFlussi = (risultati) => {
  if (!chartCanvas.value || !risultati || !Array.isArray(risultati) || risultati.some(r => !r.anno)) {
    return; // Non disegnare se il canvas non è pronto o i dati non sono validi
  }

  const ctx = chartCanvas.value.getContext('2d');
  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: risultati.map((r) => r.anno),
      datasets: [
        {
          label: "Entrate Totali",
          data: risultati.map((r) => r.totaleEntrate),
          backgroundColor: "#14b8a6",
        },
        {
          label: "Uscite Totali",
          data: risultati.map((r) => r.totaleUscite),
          backgroundColor: "#f43f5e",
        },
      ],
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
  });
};

onMounted(() => {
  disegnaGraficoFlussi(props.risultati);
});

watch(() => props.risultati, (newRisultati) => {
  disegnaGraficoFlussi(newRisultati);
}, { deep: true });

</script>

<template>
  <div class="relative h-96 md:h-[450px]">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>
