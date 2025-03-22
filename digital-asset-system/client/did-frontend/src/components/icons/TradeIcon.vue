<!-- src/components/icons/TradeIcon.vue -->
<template>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      :fill="color"
      :class="['trade-icon', className]"
      aria-hidden="true"
    >
      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
    </svg>
  </template>
  
  <script setup lang="ts">
  defineProps({
    size: { type: [Number, String], default: 24 },
    color: { type: String, default: 'currentColor' },
    className: { type: String, default: '' }
  })
  </script>
  
  <style scoped>
  .trade-icon {
    transition: opacity 0.3s ease;
  }
  </style>
  