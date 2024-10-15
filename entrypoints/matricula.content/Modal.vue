<template>
  <el-dialog :title="component?.name ? `Disciplina: ${component.name}` : 'Cortes'" :modelValue="isOpen"
    @update:modelValue="closeModal" light width="720px" class="next-dialog">
    <div class="border mb-3 pb-2">
      <div class="flex flex-row items-center justify-between ml-4 mt-4">
        <div class="flex gap-1">
          Critérios
          <el-popover placement="top-start" width="340" trigger="hover" :content="criteriaContent" class="bg-white">
            <template #reference>
              <Info :size="16" class="ml-1 cursor-pointer" />
            </template>
          </el-popover>
        </div>

        <el-button round text type="primary" @click="restore">
          Restaurar ordem
        </el-button>
      </div>

      <div class="p-4">
        <VueDraggableNext v-model="headers" @update="resort" item-key="value">
          <template #item="{ element }">
            <div class="ufabc-cursor-grabbing" style="display: inline-block !important;">
              <el-tag closable @close="removedFilter(element.value)" class="mr-1 mb-1">
                {{ element.text }}
              </el-tag>
            </div>
          </template>
        </VueDraggableNext>
        <h3 class="text-sm mt-2">
          * Arraste para alterar a ordem dos critérios
        </h3>
      </div>
    </div>



    <div class="border mb-2 p-2">
      <p class="mb-2">Legenda</p>
      <div class="flex flex-row" style="justify-content: space-between;">
        <LegendItem class="bg-[#B7D3FF]" text="Você" />
        <LegendItem class="bg-[#f95469]" text="Certeza de chute" />
        <LegendItem class="bg-[#f3a939]" text="Provavelmente será chutado" />
        <LegendItem class="bg-[#3fcf8c]" text="Provavelmente não será chutado" />
      </div>
    </div>

    <el-table v-loading="loading" element-loading-text="Carregando" :data="transformed" max-height="250"
      style="width: 100%" empty-text="Não Há Dados" :row-class-name="tableRowClassName">
      <el-table-column type="index" width="50" />
      <el-table-column v-for="header in headers" :key="header.value" :prop="header.value" :label="header.text" />
    </el-table>

    <div class="flex bg-[#f4f4f5] h-[78px] w-full mt-6 rounded-xl flex-wrap items-center justify-center pt-2 pb-2">
      <el-alert class="alert-update" :closable="false"
        title="Mantenha sempre seus dados atualizados para a previsão dos chutes ser mais precisa." type="info"
        show-icon>
        <template #default>
          <a class="underline" href='https://sig.ufabc.edu.br/sigaa/portais/discente/discente.jsf'
            target='_blank'>Clique aqui para
            atualizar</a>
        </template>
      </el-alert>
    </div>
    <template #footer>
      <div class="flex">
        <div class="text-left flex-auto">
          <a class="text-[#ed5167] underline"></a>
        </div>
        <i class="information">* Dados baseados nos alunos que utilizam a extensão</i>
        <el-button @click="closeModal">Fechar</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { getComponentKicks } from '@/services/next';
import type { UFSeasonComponents } from '@/services/UFParser'
import { findIdeais, findSeasonKey } from '@/utils/tenant'
import { ElNotification } from 'element-plus'
import VueDraggableNext from 'vuedraggable'
import { orderBy } from 'lodash-es'
import { Info } from 'lucide-vue-next';
import LegendItem from '@/components/LegendItem.vue'

const matriculas = inject<typeof window.matriculas>('matriculas')
const parserComponents = inject<UFSeasonComponents[]>('parserComponents')

const props = defineProps<{
  isOpen: boolean;
  corteId: string | null;
}>();
const emit = defineEmits(['close']);

type Headers = {
  text: string;
  sortable: boolean;
  value: string;
}

const loading = ref(false)
const kicks = ref([])
const headers = ref<Headers[]>([])

const criteriaContent = "Os critérios são definidos com base nos critérios abaixo e seu peso, você pode alterar o peso arrastando o critérios para que fiquem na ordem desejada."

async function fetch() {
  const corteId = props.corteId ?? ''
  if (!corteId) {
    return
  }

  const studentId = 557736
  loading.value = true

  try {
    const res = await getComponentKicks(Number(corteId), studentId)
    kicks.value = res
    resort()
  } catch (error: any) {
    if (error.name === 'forbidden') {
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

const component = computed(() => parserComponents?.find(c => c.UFComponentId === Number(props.corteId)) ?? {} as UFSeasonComponents)

const transformed = computed(() => {
  return kicks.value.map(d => ({
    ...d,
    reserva: d.reserva ? 'Sim' : 'Não',
    ik: d.ik.toFixed(3)
  }))
})

const defaultHeaders = computed(() => {
  const isIdeal = findIdeais().includes(component.value?.UFComponentCode ?? '')
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
  return Object.keys(matriculas ?? {}).reduce((a, c) => c.includes(component.value?.UFComponentId.toString()) ? a + 1 : a, 0)
})

const computeKicksForecast = computed(() => {
  return (kicks.value.length * component?.value?.vacancies) / getRequests.value
})

function resort() {
  const sortOrder = headers.value.map(h => h.value)
  const sortRef = Array(sortOrder.length).fill('desc')

  const turnoIndex = sortOrder.indexOf('turno')
  if (turnoIndex !== -1) {
    sortRef[turnoIndex] = component.value?.turno === 'diurno' ? 'asc' : 'desc'
  }

  kicks.value = orderBy(kicks.value, sortOrder, sortRef)
}

const removedFilter = (value: string) => {
  headers.value = headers.value.filter(h => h.value !== value)
  resort()
}

const restore = () => {
  headers.value = defaultHeaders.value
  resort()
}

const tableRowClassName = ({ row, rowIndex }: { row: unknown; rowIndex: number }) => {
  if (row.studentId === 557736) {
    return 'aluno-row'
  } if (rowIndex <= computeKicksForecast.value) {
    return 'not-kicked-row'
  } if (rowIndex >= component.value?.vacancies) {
    return 'kicked-row'
  }
  return 'probably-kicked-row'
}

watch(() => props.isOpen, (newIsOpen) => {
  if (newIsOpen && props.corteId) {
    headers.value = defaultHeaders.value
    fetch()
  }
})

onMounted(async () => {
  await fetch()
});
</script>

<style>
next-dialog .el-dialog__body {
  padding-top: 1rem;
}

.el-table .aluno-row {
  background-color: #B7D3FF !important;
}

.el-table .kicked-row {
  color: #f95469 !important;
}

.el-table .probably-kicked-row {
  color: #f3a939 !important;
}

.el-table .not-kicked-row {
  color: #3fcf8c !important;
}
</style>