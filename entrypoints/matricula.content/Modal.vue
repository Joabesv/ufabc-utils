<template>
  <el-dialog
    title="Jobe"
    :visible="isOpen"
    @close="closeModal"
    width="720px"
  >
    <!-- Modal content -->
    <el-table v-if="cortesData" :data="[{ name: 'glauber', value: 3 }]">
      <!-- Table content -->
    </el-table>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watchEffect, onMounted } from 'vue';
import { getComponentKicks } from '@/services/next'
import { ElLoading } from 'element-plus'

const props = defineProps<{
  isOpen: boolean;
  corteId: string | null;
}>();

const emit = defineEmits(['close']);

const cortesData = ref(null);
const loading = ref(false);
const kicks = ref([]);

function closeModal() {
  emit('close');
}

async function setupComponents() {
  if (!props.corteId) return;

  const studentId = 557766; // Make sure this is correct
  loading.value = true;
  const kicksData = await getComponentKicks(props.corteId, studentId);
  kicks.value = kicksData;
  loading.value = false;
}

watchEffect(() => {
  if (props.isOpen && props.corteId) {
    setupComponents();
  }
});

onMounted(() => {
  // Any initialization if needed
});
</script>