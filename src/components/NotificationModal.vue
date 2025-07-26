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
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full"
    v-show="!hidden"
  >
    <div
      class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
    >
      <div class="mt-3 text-center">
        <div
          id="notificationIcon"
          class="mx-auto flex items-center justify-center h-12 w-12 rounded-full"
          :class="isError ? 'bg-red-100' : 'bg-teal-100'"
        ></div>
        <h3
          class="text-lg leading-6 font-bold text-gray-900"
          id="notificationTitle"
        >
          {{ title }}
        </h3>
        <div class="mt-2 px-7 py-3">
          <p class="text-sm text-gray-600" id="notificationBody">
            {{ body }}
          </p>
        </div>
        <div class="items-center px-4 py-3">
          <button
            id="closeModalBtn"
            @click="closeModal()"
            class="px-4 py-2 bg-teal-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Stili specifici per NotificationModal.vue */
</style>
