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
import { getComponentKicks } from '@/services/next';
import type { UFSeasonComponents } from '@/services/UFParser'
import { findIdeais, findSeasonKey } from '@/utils/tenant'
import { ElNotification } from 'element-plus'
import { orderBy } from 'lodash-es'

const matriculas = inject<typeof window.matriculas>('matriculas')
const parserComponents = inject<UFSeasonComponents[]>('parserComponents')

const props = defineProps<{
  isOpen: boolean;
  corteId: string | null;
}>();
const emit = defineEmits(['close']);

const loading = ref(false)
const kicks = ref([])
const headers = ref([])

const criteriaContent = "Os critérios são definidos com base nos critérios abaixo e seu peso, você pode alterar o peso arrastando o critérios para que fiquem na ordem desejada."

async function fetch() {
  const corteId = props.corteId ?? ''
  if(!corteId) {
    return
  }

  const studentId = 557736
  loading.value = true

  try {
    const res = await getComponentKicks(Number(corteId), studentId)
    kicks.value = res
    console.log(res)
    resort()
  } catch(error: any) {
    if(error.name === 'forbidden') {
      ElNotification({
        message: 'Não temos as disciplinas que você cursou, acesse o Sigaa'
      })
    }
  } finally {
    loading.value = false
  }
}

function closeModal() {
  emit('close');
}

function resort() {
  const sortOrder = headers.value.map(h => h.value)
  const sortRef = Array(sortOrder.length).fill('desc')
  
  const turnoIndex = sortOrder.indexOf('turno')
  if (turnoIndex !== -1) {
    sortRef[turnoIndex] = component.value?.turno === 'diurno' ? 'asc' : 'desc'
  }

  kicks.value = orderBy(kicks.value, sortOrder, sortRef)
}

const removedFilter = (value) => {
  headers.value = headers.value.filter(h => h.value !== value)
  resort()
}

const restore = () => {
  headers.value = defaultHeaders.value
  resort()
}

const defaultHeaders = computed(() => {
  const isIdeal = findIdeais().includes(component.value?.UFComponentCode!)
  const base = [
    { text: 'Reserva', sortable: false, value: 'reserva' },
    { text: 'Turno', value: 'turno', sortable: false },
    { text: 'Ik', value: 'ik', sortable: false },
  ]

  const season = findSeasonKey()

  if (isIdeal && !['2020:3', '2021:1', '2021:2'].includes(season)) {
    base.push({ text: 'CR', value: 'cr', sortable: false })
    base.push({ text: 'CP', value: 'cp', sortable: false })
  } else {
    base.push({ text: 'CP', value: 'cp', sortable: false })
    base.push({ text: 'CR', value: 'cr', sortable: false })
  }

  return base
})

const getRequests = computed(() => {
  return Object.keys(matriculas).reduce((a, c) => c.includes(component.value?.UFComponentId.toString()) ? a + 1 : a, 0)
})

const computeKicksForecast = computed(() => {
  return (kicks.value.length * component?.value?.vacancies) / getRequests.value
})

const component = computed(() => parserComponents?.find(c => c.UFComponentId === Number(props.corteId)))

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