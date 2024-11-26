<script setup lang="ts">
import { ref, watch } from 'vue'
import { getSubjectReviews, type Grade, type SubjectReview } from '@/services/next'
import { Chart } from 'highcharts-vue';
import Highcharts3D from 'highcharts/highcharts-3d'
import Highcharts from 'highcharts';

Highcharts3D(Highcharts);

const props = defineProps<{
  isOpen: boolean
  subjectId: string | null
}>()


const emit = defineEmits(['close'])
const subjectDistributionData = ref<SubjectReview | null>(null)
const loading = ref(false);
const samplesCount = ref<number | undefined>();
const filterSelected = ref(null)
const chartOptions = ref({
  chart: {
    type: "pie",
    plotBackgroundColor: null,
    plotBorderWidth: null,
    plotShadow: false,
    options3d: {
      enabled: true,
      alpha: 45
    },
    width: 380,
    height: 240
  },
  title: {
    text: ''
  },
  tooltip: {
    pointFormat: 'Porcentagem: <b>{point.percentage:.1f}%</b>'
  },
  plotOptions: {
    pie: {
      animation: {
        duration: 200,
      },
      depth: 20,
      allowPointSelect: true,
      cursor: 'pointer',
      dataLabels: {
        format: '{key}: <b>{point.percentage:.1f}%</b>',
        enabled: true
      },
      showInLegend: true
    }
  },
  series: []
});


const subject = computed(() => subjectDistributionData.value?.subject.name ?? '')

const possibleComponents = computed(() => {
  if (!subjectDistributionData.value) {
    return []
  }
  const components: any[] = [...subjectDistributionData.value.specific];
  const generalDefaults = {
    _id: {
      _id: 'all',
      name: 'Todas as matérias'
    }
  }

  const general = Object.assign(generalDefaults, subjectDistributionData.value?.general)
  components?.push(general)
  return components.reverse()
})

function closeDialog() {
  filterSelected.value = null
  subjectDistributionData.value = null;
  samplesCount.value = 0
  emit('close')
}

function resolveColorForConcept(grade: Grade) {
  return {
    'A': '#3fcf8c',
    'B': '#b8e986',
    'C': '#f8b74c',
    'D': '#ffa004',
    'F': '#f95469',
    'O': '#A9A9A9'
  }[grade] || '#A9A9A9'
}


async function setupSubjectStats(subjectId: string) {
  if (!subjectId) {
    return
  }

  loading.value = true

  try {
    const reviews = await getSubjectReviews(subjectId)
    subjectDistributionData.value = reviews

    if (possibleComponents.value.length > 0) {
      filterSelected.value = possibleComponents.value[0]._id._id
    }

    if (reviews.general.count) {
      setTimeout(() => {
        updateFilter();
      }, 500)
    }

  } catch (error) {
    console.log(error)
    closeDialog()
  } finally {
    loading.value = false;
  }
}

function updateFilter() {
  if (!subjectDistributionData.value) {
    return
  }

  let filter = subjectDistributionData.value.general
  if (filterSelected.value !== 'all') {
    filter = subjectDistributionData.value.specific.find(
      specific => specific._id._id === filterSelected.value
    ) ?? subjectDistributionData.value.general
  }

  const gradesFiltered = filter.distribution.map(grade => ({
    name: grade.conceito,
    y: grade.count,
    color: resolveColorForConcept(grade.conceito)
  }))

  samplesCount.value = filter.count


  chartOptions.value = {
    ...chartOptions.value,
    series: [{
      name: 'Conceito',
      data: gradesFiltered
    }],
    plotOptions: {
      colors: gradesFiltered.map(grade => resolveColorForConcept(grade.name))
    }
  }
}

watch(() => props.subjectId, async (newSubjectId) => {
  if (newSubjectId) {
    await setupSubjectStats(newSubjectId)
  }
}, { immediate: true })

watch(filterSelected, () => {
  if (subjectDistributionData.value) {
    updateFilter()
  }
})

</script>


<template>
  <el-dialog @close="closeDialog" :model-value="isOpen" :title="'Disciplina: ' + subject" :visible="isOpen"
    width="800px" top="2vh">
    <div v-if="loading || (subjectDistributionData?.specific?.length ?? 0) > 0" v-loading="loading"
      element-loading="Carregando">
      <div v-if="samplesCount !== undefined" class="text-center my-4">
        Total de amostras <b>{{ samplesCount }}</b>
      </div>

      <Chart :options="chartOptions" :highcharts="Highcharts" class="flex flex-row items-center justify-center" />

      <div v-if="possibleComponents.length > 0" class="mt-4">
        <el-select v-model="filterSelected" placeholder="Selecione um filtro" @change="updateFilter">
          <el-option v-for="component in possibleComponents" :key="component._id._id" :label="component._id.name"
            :value="component._id._id" />
        </el-select>
      </div>
    </div>


    <div v-else class="flex flex-row overflow-y-auto overflow-x-hidden items-center justify-center min-h-24">
      Nenhum dado encontrado
    </div>

    <template #footer>
      <span class="text-xs text-gray-500">
        * Dados baseados nos alunos que utilizam a extensão
      </span>
    </template>
  </el-dialog>
</template>