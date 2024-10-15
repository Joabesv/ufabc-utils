<template>
  <el-dialog
    title="Jobe"
    :modelValue="isOpen"
    @update:modelValue="closeModal"
    width="720px"
  >
  </el-dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean;
  corteId: string | null;
}>();
const emit = defineEmits(['close']);


function closeModal() {
  emit('close');
}

watch(() => props.isOpen, (newIsOpen) => {
  console.log('hearing', newIsOpen)

  if(newIsOpen && props.corteId) {
    console.log('should work')
  }
})

onMounted(() => {
  // Any initialization if needed
});
</script>