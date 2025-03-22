<!-- src/components/common/LoadingSpinner.vue -->
<template>
    <div class="spinner" :style="spinnerStyle"></div>
  </template>
  
  <script setup lang="ts">
import { computed } from 'vue';

  const props = defineProps({
    size: {
      type: [Number, String],
      default: 24
    },
    color: {
      type: String,
      default: '#3498db'
    }
  })
  
  const spinnerStyle = computed(() => ({
    width: typeof props.size === 'number' ? `${props.size}px` : props.size,
    height: typeof props.size === 'number' ? `${props.size}px` : props.size,
    borderColor: `${props.color} transparent transparent transparent`
  }))
  </script>
  
  <style scoped>
  .spinner {
    display: inline-block;
    border-radius: 50%;
    border: 2px solid;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  </style>
  