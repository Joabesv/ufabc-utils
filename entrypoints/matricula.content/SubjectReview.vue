<script setup lang="ts">
import { ref, watch } from 'vue'
import { Chart, type ChartProps } from 'highcharts-vue'
import Highcharts from 'highcharts'
import Highcharts3D from 'highcharts/highcharts-3d'
import { getSubjectReviews, type SubjectReview } from '@/services/next'
import { sortBy } from 'lodash-es'

Highcharts3D(Highcharts)

type ChartOptions = ChartProps['options']

const props = defineProps<{
  isOpen: boolean
  subjectId: string | null
}>()
const emit = defineEmits(['close'])

const chartOptions = ref<ChartOptions>({
  chart: {
    type: 'pie',
    options3d: {
      enabled: true,
      alpha: 45,
    },
    width: 380,
    height: 240,
  },
  title: {
    text: '',
  },
  tooltip: {
    pointFormat: 'Porcentagem: <b>{point.percentage:.1f}%</b>',
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
        enabled: true,
      },
      showInLegend: true,
    },
  },
  series: [],
})

const highcharts = ref(Highcharts)
const subjectInfo = ref<SubjectReview | null>(null)
const loading = ref(false)
const filterSelected = ref(null)
const samplesCount = ref<number | null>(null)
const chart = useTemplateRef('subject-chart')

const subject = computed(() => subjectInfo.value?.subject?.name ?? '')

const possibleComponents = computed(() => {
  const components = subjectInfo.value?.specific;
  const generalDefaults = {
    _id: {
      _id: 'all',
      name: 'Todas as matérias',
    },
  };
  const general = Object.assign(generalDefaults, subjectInfo.value?.general);
  components.push(general);

  return components.reverse();
})

function closeDialog() {
  emit('close')
  filterSelected.value = null
  subjectInfo.value = null
  samplesCount.value = 0
}

function resolveColorForConcept(concept: string) {
  return (
    {
      A: '#3fcf8c',
      B: '#b8e986',
      C: '#f8b74c',
      D: '#ffa004',
      F: '#f95469',
      O: '#A9A9A9',
    }[concept] || '#A9A9A9'
  );
}

async function fetchSubjectInfo(subjectId: string) {
  loading.value = true
  try {
    const reviews = await getSubjectReviews(subjectId)
    subjectInfo.value = reviews
    loading.value = false
    filterSelected.value = possibleComponents.value[0]._id._id
    console.log(subjectInfo.value, possibleComponents.value)
    if (reviews.general.count || 0) {
      console.log('here?')
      setTimeout(() => updateFilter(), 500)
    }
  } catch (error) {
    loading.value = false
    console.log('reveiw subject error', error)
    closeDialog()
  }
}

function updateFilter() {
  // if (!chart.value) return;

  console.log(chart)

  chart.value.delegateMethod('showLoading', 'Carregando...');

  setTimeout(() => {
    chart.value.removeSeries();
    let filter;
    if (filterSelected.value === 'all') {
      filter = subjectInfo.value?.general;
    } else {
      filter = subjectInfo.value?.specific?.find((specific) =>
        specific._id._id === filterSelected.value
      );
    }

    const filteredConcepts = [];
    const distributionConcepts = filter.distribution;

    for (const { conceito, count } of distributionConcepts) {
      filteredConcepts.push({
        name: conceito,
        y: count,
        color: resolveColorForConcept(conceito),
      });
    }

    samplesCount.value = filter.count;

    chart.value.addSeries({
      data: sortBy(filteredConcepts, 'name'),
    });

    chart.value.hideLoading();
  }, 500);
}


watch(() => props.subjectId, async (newSubjectId) => {
  if (newSubjectId) {
    await fetchSubjectInfo(newSubjectId)
  }
}, { immediate: true, deep: true })
</script>


<template>
  <el-dialog @close="closeDialog" :model-value="isOpen" width="800px" top="2vh" class="mt-1" :title="subject">
    <div v-if="loading || subjectInfo?.specific?.length" class="min-h-[200px]" v-loading="loading">
      <span class="text-center mt-4" v-if="samplesCount >= 0">
        Total de amostras <b>{{ samplesCount }}</b>
      </span>

      <Chart class="flex flex-row items-center justify-center" v-if="subjectInfo?.specific?.length"
        :options="chartOptions" :highcharts="highcharts" ref="subject-chart"></Chart>

      <!-- TeacherList -->
    </div>
    <div class="flex flex-row items-center justify-center">
      Nenhum Dado Encontrado
    </div>
    <template #footer>
      <span class="flex" ref="end-ref">
        <i class="text-black/60 inline-flex text-xs flex-row mr-4">* Dados baseados nos alunos que utilizam a
          extensão</i>
      </span>
    </template>
  </el-dialog>
</template>