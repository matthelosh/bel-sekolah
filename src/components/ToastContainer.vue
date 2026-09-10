<script setup lang="ts">
import type { Toast } from '../composables/useToast';

defineProps<{
  toasts: Toast[];
}>();
</script>

<template>
  <div class="toast toast-end toast-top z-50">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="[
        'alert shadow-lg mb-2 min-w-[320px]',
        toast.type === 'success' && 'alert-success',
        toast.type === 'error' && 'alert-error',
        toast.type === 'warning' && 'alert-warning',
        toast.type === 'info' && 'alert-info'
      ]"
    >
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>
