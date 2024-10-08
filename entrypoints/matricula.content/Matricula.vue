<script setup lang="ts">
import { getStudentId } from '@/utils/UFMatricula'
type Filter = {
  name: 'Santo André' | 'São Bernardo' | 'Noturno' | 'Matutino'
  val: boolean
  comparator: 'bernardo' | 'andr' | 'matutino' | 'noturno'
  class: 'notAndre' | 'notBernardo' | 'notNoturno' | 'notMatutino'
}

const selected = ref(false)

const campusFilters = ref<Filter[]>([
  {
    name: 'São Bernardo',
    class: 'notBernardo',
    val: true,
    comparator: 'andr', //isso está correto
  },
  {
    name: 'Santo André',
    class: 'notAndre',
    val: true,
    comparator: 'bernardo',
  },
]);

const shiftFilters = ref<Filter[]>([
  {
    name: 'Noturno',
    class: 'notNoturno',
    val: true,
    comparator: 'matutino',
  },
  {
    name: 'Matutino',
    class: 'notMatutino',
    val: true,
    comparator: 'noturno',
  },
]);

function changeSelected() {
  const notSelected =  document.querySelectorAll<HTMLTableCaptionElement>('.notSelecionada')
  if (!selected.value) {
    for (const $el of notSelected) {
      $el.style.display = ''
    }
    return;
  }

  const studentId = getStudentId();
  const enrollments = window.matriculas[studentId] || [];
  const tableRows = document.querySelectorAll('tr')

  for(const $row of tableRows) {
    const componentId = $row.getAttribute('value')
    if (componentId && !enrollments.includes(componentId.toString())) {
      $row.classList.add('notSelecionada')
      $row.style.display = 'none'
    }
  }
}

function applyFilter(params: Filter) {
  if (!params.val) {
    const tableData = document.querySelectorAll<HTMLTableElement>('#tabeladisciplinas tr td:nth-child(3)')
    for(const data of tableData) {
      const campus = data.textContent?.toLocaleLowerCase()
      if(!campus?.includes(params.comparator.toLocaleLowerCase())) {
        data?.parentElement?.classList.add(params.class);
      }
    }
    return
  }


  const allTr = document.querySelectorAll('#tabeladisciplinas tr')
  for (const tr of allTr) {
    tr.classList.remove(params.class)
  }
}
</script>

<template>
  <div class="flex flex-row sticky top-0 bg-white min-h-14 pl-6 pt-1.5 z-10 pb-3 border-b border-black/[0.08] rounded-b-lg">
    <div class="mr-3 flex flex-row items-center">
      <img src="/assets/vue.svg" class="w-8 h-8" />
    </div>

    <section class="mr-5">
      <h3 class="text-sm mb-0.5 text-black/90">Câmpus</h3>
      <el-checkbox
          v-for="(filter, index) in campusFilters"
          :key="index"
          @change="applyFilter(filter)"
          v-model="filter.val"
      >
      {{ filter.name }}
      </el-checkbox>
    </section>
    
    <section class="mr-5">
      <h3 class="text-sm mb-0.5 text-black/90">Turno</h3>
      <el-checkbox
      v-for="(filter, index) in shiftFilters"
      :key="index"
      @change="applyFilter(filter)"
      v-model="filter.val"
    >
      {{ filter.name }}
    </el-checkbox>
    </section>

    <section class="pr-5">
      <h3 class="text-sm mb-0.5 text-black/90">Filtros</h3>
      <el-switch
        class="mr-3 ufabc-element-switch"
        active-text="Disciplinas escolhidas"
        style="font-size: 13px;"
        v-model="selected"
        @change="changeSelected()"
      >
        
      </el-switch>
    </section>
  </div>
</template>
