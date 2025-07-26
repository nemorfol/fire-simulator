<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'add-asset', 'remove-asset']);

const totalAllocationStatus = computed(() => {
  const total = props.modelValue.reduce(
    (sum, asset) => parseFloat(asset.quota) || 0,
    0
  );
  return `Totale Allocato: ${total}%`;
});

const totalAllocationClass = computed(() => {
  const total = props.modelValue.reduce(
    (sum, asset) => parseFloat(asset.quota) || 0,
    0
  );
  return total === 100 ? "text-green-600" : "text-red-600";
});

function updateAssetQuota(event, index) {
  const newAssets = [...props.modelValue];
  newAssets[index].quota = parseFloat(event.target.value);
  emit('update:modelValue', newAssets);
}

function aggiungiAsset(dati = {}) {
  const newAssets = [...props.modelValue];
  newAssets.push({ nome: "", quota: 0, rendimento: 0, devStd: 0, tipoConto: "tassabile", tassazioneSpecifica: 0, ...dati });
  emit('update:modelValue', newAssets);
}

function rimuoviAsset(index) {
  const newAssets = [...props.modelValue];
  newAssets.splice(index, 1);
  emit('update:modelValue', newAssets);
}
</script>

<template>
  <div class="card">
    <h3 class="card-title">3. Asset Allocation del Portafoglio</h3>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="table-header">
          <tr>
            <th>Nome Asset</th>
            <th>Quota (%)</th>
            <th>Rendimento Atteso (%)</th>
            <th>Dev. Standard (%)</th>
            <th>Tipo Conto</th>
            <th>Tassazione Specifica (%)</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="asset-allocation-body">
          <tr
            v-for="(asset, index) in modelValue"
            :key="index"
            class="table-row"
          >
            <td>
              <input type="text" class="asset-nome" v-model="modelValue[index].nome" />
            </td>
            <td>
              <input
                type="number"
                class="asset-quota"
                :value="asset.quota"
                @input="updateAssetQuota($event, index)"
                step="1"
              />
            </td>
            <td>
              <input
                type="number"
                class="asset-rendimento"
                v-model="modelValue[index].rendimento"
                step="0.1"
              />
            </td>
            <td>
              <input
                type="number"
                class="asset-devstd"
                v-model="modelValue[index].devStd"
                step="0.1"
              />
            </td>
            <td>
              <select v-model="modelValue[index].tipoConto" class="asset-tipo-conto">
                <option value="tassabile">Tassabile</option>
                <option value="esente">Esente</option>
                <option value="differito">Differito</option>
              </select>
            </td>
            <td>
              <input
                type="number"
                class="asset-tassazione-specifica"
                v-model="modelValue[index].tassazioneSpecifica"
                step="0.1"
              />
            </td>
            <td>
              <button
                @click="rimuoviAsset(index)"
                class="btn btn-danger btn-sm p-2 leading-none"
              >
                X
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="flex justify-between items-center mt-4">
      <button @click="aggiungiAsset()" class="btn btn-secondary">
        Aggiungi Asset
      </button>
      <div
        id="total-allocation-status"
        class="font-bold"
        :class="totalAllocationClass"
      >
        {{ totalAllocationStatus }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Stili specifici per AssetAllocation.vue */
</style>
