<template>
  <div class="flex flex-row items-center">
    <div :class="colorClass" class="mr-1" style="width: 12px; height: 12px;" />
    <span>{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type LegendProps = {
  text: string
  class: string
}

const props = defineProps<LegendProps>()
const colorClass = computed(() => props.class);
</script>
