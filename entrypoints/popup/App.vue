<script lang="ts" setup>
import { Loader2 } from 'lucide-vue-next'
import { useStorage } from '@/composables/useStorage'
import { useDateFormat } from '@vueuse/core';

const loading = ref(false)
const error = ref(false)
const students = ref(null)


const formattedDate = useDateFormat(students.value?.lastUpdate, 'DD/MM/YYYY HH:mm', { locales: 'pt-BR' })

async function fetchData() {
  loading.value = true;
  error.value = false

  try {
    const { state } = useStorage<any>('session:student', null)
    students.value = state.value
    error.value = false
  } catch(error) {
    console.log(error)
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loading.value = true
  setTimeout(() => fetchData(), 2_000)
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
        <button @click="fetchData" class="flex items-center justify-center mt-2 py-2.5 p-4 text-sm bg-[#2E7EED] text-white rounded-[0.5rem] cursor-pointer">
          Recarregar
        </button>
      </div>

      <div v-else-if="students?.length">
        <p class="mb-2">Esses sao seus dados</p>
        <section class="mb-2 border border-solid border-b-gray-400 rounded p-1.5" v-for="student in students" :key="student.name">
          <div class="flex mb-2">
            <h3 class="font-bold flex-auto">{{ student.name }}</h3>
            <span class="flex-none text-right text-sm">{{ student.ra }}</span>
          </div>
          <template v-if="student?.cursos?.length">
            <div class="mb-2 border border-solid border-[#efefef] rounded p-1.5" v-for="graduation in student.cursos">
              <div class="text-sm mb-1">
                {{ graduation.curso }}<br />
                <b>{{ graduation.turno }}</b>
              </div>
              <div class="flex">
                <span class="flex-1 text-sm text-left text-[#c78d00]">CP: {{ graduation.cp }}</span>
                <span class="flex-1 text-sm text-center text-[#05C218]">CR: {{ graduation.cr }}</span>
                <span class="flex-1 text-sm text-right text-[#2E7EED]">CA: {{ graduation.ca }}</span>
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
        <p>Seja bem-vindo à extensão do UFABC next.</p>
        <p style="margin-bottom: 5px;">Parece que nós não temos suas informações, <a href='https://sig.ufabc.edu.br/sigaa/portais/discente/discente.jsf' target='_blank'>vamos carregá-las?</a></p>
      </template>

      <div class="text-center underline text-[11px] font-normal">
        <a href='https://bit.ly/extensao-problemas' target='_blank'>Está com problemas com a extensão? <br />Clique aqui</a>
      </div>
    </main>
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #54bc4ae0);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
