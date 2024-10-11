<script setup lang="ts">
import { computed } from 'vue';

type ModalState = {
  isOpen: boolean;
  corteId: string | null;
};

type ModalProps = {
  modalState: ModalState;
  onClose: () => void;
};

const props = defineProps<ModalProps>();
console.log('porra', props)
const show = computed(() => props.modalState.isOpen);

// const closeModal = () => {
//   props.onClose();
// };
</script>


<template>
  <div v-if="show">
    <el-dialog title="Corte Details" :visible="show" light class="w-[712px]">
      Corte ID: {{ modalState.corteId }}
      <!-- Add more content here based on the corteId -->
    </el-dialog>
  </div>
</template>