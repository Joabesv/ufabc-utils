<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean
  subjectId: string | null
}>()

const emit = defineEmits(['close'])
const subjectInfo = ref(null)

function closeDialog() {
  emit('close')
}

watch(() => props.subjectId, async (newSubjectId) => {
  if (newSubjectId) {
    console.log(newSubjectId)
    subjectInfo.value = await fetchSubjectInfo(newSubjectId)
  }
})
</script>


<template>
  <el-dialog @close="closeDialog" :model-value="isOpen" width="800px" top="2vh">
    Joabe
  </el-dialog>
</template>