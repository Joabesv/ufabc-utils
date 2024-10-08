<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useStorage } from '@/composables/useStorage'
import { useDateFormat } from '@vueuse/core'
import { calculateCoefficients, type ScopedCoefficients, summarizeCoefficients } from '@/utils/calculateCoefficients'
import type { Student } from '@/scripts/sig/homepage'

const student = ref<Student | null>(null)
const loading = ref(true)
const error = ref(false)
const studentCoefficients = ref<ScopedCoefficients>()

const formattedDate = computed(() => {
  if (student.value?.lastUpdate) {
    return useDateFormat(student.value.lastUpdate, 'DD/MM/YYYY HH:mm', { locales: 'pt-BR' }).value
  }
  return ''
})

async function fetchStudentData() {
  const { state: storageStudent, isLoading, error: storageError } = await useStorage<Student>('sync:student')
  
  loading.value = isLoading.value

  try {
    student.value = storageStudent.value
    if (!student.value) {
      return;
    }
    const coefficients = calculateStudentCoefficients(student.value.graduation)
    studentCoefficients.value = coefficients
    error.value = !!storageError.value
    console.log('error calling storage: ', storageError.value)
  } catch(err) {
    error.value = true
    console.error('Error fetching student data:', err)
  } finally {
    loading.value = false
  }
}

function reloadData() {
  loading.value = true
  error.value = false
  fetchStudentData()
}

function calculateStudentCoefficients(graduation: Student['graduation']) {
  const mocked2017BCT = {
    curso: "Bacharelado em Ciência e Tecnologia",
    grade: "2017",
    creditsTotal: 190,
    freeCredits: 43,
    limitedCredits: 57, 
    mandatoryCredits: 90
  }


  const graduationTotalCoefficients = calculateCoefficients(graduation.components, mocked2017BCT)
  const studentCoefficients = summarizeCoefficients(graduationTotalCoefficients)
  return studentCoefficients
}


console.log(studentCoefficients.value)


onMounted(() => {
  setTimeout(fetchStudentData, 2000)
})
</script>

<template>
  <div class="w-64 p-4">
    <img src="/wxt.svg" class="h-8 w-36" alt="WXT logo" />

    <main class="mt-4 text-sm">
      <div class="flex items-center justify-center h-[4.4rem]" v-if="loading">
        <Loader2 class="h-4 w-4 animate-spin" />
        <span class="ml-2">Carregando informações...</span>
      </div>

      <div v-else-if="error">
        Aconteceu um erro ao carregar suas informações. 😬
        <br /><br />
        Caso o error persistir, entre em contato conosco pelo <a href='https://instagram.com/ufabc_next' target='_blank'>Instagram</a>
        <button @click="reloadData" class="flex items-center justify-center mt-2 py-2.5 p-4 text-sm bg-[#2E7EED] text-white rounded-[0.5rem] cursor-pointer">
          Recarregar
        </button>
      </div>

      <div v-else-if="student">
        <p class="mb-2">Esses são seus dados</p>
        <section class="mb-2 border border-solid border-b-gray-400 rounded p-1.5">
          <div class="flex mb-2">
            <h3 class="font-bold flex-auto">{{ student.login }}</h3>
            <span class="flex-none text-right text-sm">{{ student.ra }}</span>
          </div>
          <template v-if="studentCoefficients && student.graduation">
            <div class="mb-2 border border-solid border-[#efefef] rounded p-1.5">
              <div class="text-sm mb-1">
                {{ student.graduation.course }}<br />
                <b>{{ student.graduation.shift }}</b>
              </div>
              <div class="flex">
                <span class="flex-1 text-sm text-left text-[#c78d00]">CP: {{ studentCoefficients.cp }}</span>
                <span class="flex-1 text-sm text-center text-[#05C218]">CR: {{ studentCoefficients.cr }}</span>
                <span class="flex-1 text-sm text-right text-[#2E7EED]">CA: {{ studentCoefficients.ca }}</span>
              </div>
            </div>
          </template>
          <p class="flex-none text-sm">Última atualização: {{ formattedDate }}</p>
        </section>

        <div class="flex items-center justify-center mb-3">
          <a href='https://sig.ufabc.edu.br/sigaa/portais/discente/discente.jsf' target='_blank'>Atualizar dados agora</a>
        </div>
      </div>

      <template v-else>
        <p class="mb-1.5 text-xs">Seja bem-vindo à extensão do UFABC next.</p>
        <p class="mb-1.5 text-xs">Parece que nós não temos suas informações, 
          <a 
          href='https://sig.ufabc.edu.br/sigaa/portais/discente/discente.jsf' 
          target='_blank'
          class="underline text-xs"
          >vamos carregá-las?</a>
        </p>
      </template>

      <div class="text-center underline text-[11px] font-normal">
        <a href='https://bit.ly/extensao-problemas' target='_blank'>Está com problemas com a extensão? <br />Clique aqui</a>
      </div>
    </main>
  </div>
</template>
