<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  hidden: {
    type: Boolean,
    default: true,
  },
  title: {
    type: String,
    default: '',
  },
  body: {
    type: String,
    default: '',
  },
  isError: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close']);

function closeModal() {
  emit('close');
}
</script>

<template>
  <div
    id="notificationModal"
    v-show="!hidden"
    style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    "
  >
    <div
      class="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" style="background-color: white;"
    >
      <div class="mt-3 text-center">
        
        <h3
          class="text-xl leading-6 font-bold text-gray-900"
          id="notificationTitle"
        >
          {{ title }}
        </h3>
        <div class="mt-2 px-7 py-3">
          <p class="text-base text-gray-800" id="notificationBody">
            {{ body }}
          </p>
        </div>
        <div class="items-center px-4 py-3">
          <button
            id="closeModalBtn"
            @click="closeModal()"
            class="px-4 py-2 bg-teal-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Stili specifici per NotificationModal.vue */
</style>
