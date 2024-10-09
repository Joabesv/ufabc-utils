<script setup lang="ts">
import Teacher from '@/components/Teacher.vue'
import Cortes from '@/components/Cortes.vue'
import { toast, Toaster } from 'vue-sonner'
import { getStudentId,  currentUser } from '@/utils/UFMatricula'
import { useStorage } from '@/composables/useStorage'
import { getComponents, type Component } from '@/services/next'
import Mustache from 'mustache'
import type { Student } from '@/scripts/sig/homepage';

type Filter = {
  name: 'Santo André' | 'São Bernardo' | 'Noturno' | 'Matutino'
  val: boolean
  comparator: 'bernardo' | 'andr' | 'diurno' | 'noturno'
  class: 'notAndre' | 'notBernardo' | 'notNoturno' | 'notMatutino'
}

const selected = ref(false)
const cursadas = ref(false)
const showWarning = ref(false);
const teachers = ref(false);


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
    comparator: 'diurno',
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
  if (!studentId) {
    return
  }
  const enrollments = window.matriculas[studentId] || [];
  const tableRows = document.querySelectorAll('tr')
  console.log(tableRows)

  for(const $row of tableRows) {
    const componentId = $row.getAttribute('value')
    if (componentId && !enrollments.includes(componentId.toString())) {
      $row.classList.add('notSelecionada')
      $row.style.display = 'none'
    }
  }
}

function changeCursadas() {
  const isCursadas = document.querySelectorAll<HTMLSpanElement>('.isCursada');
  if (!cursadas.value) {
    for(const $el of isCursadas) {
      $el.style.display = ''
    }
    return;
  }

  const { state: storageStudent } = useStorage<Student>('sync:student')
  if (!storageStudent.value) {
    toast.warning('Não encontramos suas disciplinas cursadas, por favor acesse o sigaa')
    return
  }
  console.log(storageStudent.value)
  const passed = storageStudent.value?.graduation.components
  .filter((c) => ['A', 'B', 'C', 'D', 'E'].includes(c.grade))
  .map((c) => c.name);

  const trData = document.querySelectorAll<HTMLTableSectionElement>('table tr td:nth-child(3)')
  for(const $el of trData) {
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const [component] = $el?.textContent?.split('-')!
    const name = component.substring(0, component.lastIndexOf(' '))
    if(passed?.includes(name)) {
      $el?.parentElement?.classList.add('isCursada');
      $el.parentElement.style.display = 'none';
    }
  }
}


function applyFilter(params: Filter) {
  if (!params.val) {
    const tableData = document.querySelectorAll<HTMLTableElement>('#tabeladisciplinas tr td:nth-child(3)')
    for (const data of tableData) {
      const subject = data.textContent?.toLocaleLowerCase()
      if(!subject) {
        return;
      }
      if(!subject?.includes(params.comparator.toLocaleLowerCase())) {
        data?.parentElement?.classList.add(params.class);
      }
    }
    return
  }


  const allTr = document.querySelectorAll('#tabeladisciplinas tr')
  for (const tr of allTr) {
    console.log(params.class)
    tr.classList.remove(params.class)
  }
}

async function buildComponents() {
 if (!teachers.value) {
    for (const $element of document.querySelectorAll<HTMLTableCaptionElement>('.isTeacherReview')) {
      $element.style.display = 'none'
    }
    return
 }
  // se ja tiver calculado nao refaz o trabalho
  const teacherReviews = document.querySelectorAll<HTMLTableCaptionElement>('.isTeacherReview');
  if (teacherReviews.length > 0) {
    for (const $element of document.querySelectorAll<HTMLTableCaptionElement>('.isTeacherReview')) {
      $element.style.display = ''
    }
    return;
  }
  const { state: components } = await useStorage<Component[] | null>('local:components', null)
  if(!components.value) {
    components.value = await getComponents()
  }

  const componentsMap = new Map(
    components.value?.map((component) => [
      component.disciplina_id.toString(),
      component,
    ]),
  );

  const teacherPop = browser.runtime.getURL('/teacherPopover.html')
  const cortesHtml = browser.runtime.getURL('/corte.html')
  const mainTable = document.querySelectorAll('table tr');
  console.log(mainTable)
  for (const row of mainTable) {
    const el = row.querySelector('td:nth-child(3)');
    const subjectEl = row.querySelector<HTMLSpanElement>('td:nth-child(3) > span');
    const corteEl = row.querySelector('td:nth-child(5)');
    const componentId = row.getAttribute('value');
    const component = componentsMap.get(componentId ?? '');
    if (!component) {
      continue;
    }

    if (component.subject) {
      subjectEl?.setAttribute('subjectId', component.subjectId);
    }
    
    const rendered = Mustache.render(teacherPop, component)
    console.log(rendered)
    el?.insertAdjacentHTML(
      'beforeend',
      rendered,
    );
    corteEl?.insertAdjacentHTML('beforeend', cortesHtml);
  } 
}

onMounted(async () => {
  try {
    const students = await useStorage<Student[]>('sync:students')
    const currentStudent = currentUser()
    let student: Student | null = null
    if(students && Array.isArray(students)) {
      student = students.find(student => student.name === currentStudent)
    }

    if (student?.lastUpdate) {
      const diff = Date.now() - student.lastUpdate;
      const MAX_UPDATE_DIFF = 1000 * 60 * 60 * 24 * 7; // 7 days
      if (diff > MAX_UPDATE_DIFF) {
        showWarning.value = true;
      }
    }

    teachers.value = true;
    await buildComponents();
  } catch(error) {
    console.error('Error during onMounted execution:', error);
  }
})
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
      <Toaster position="bottom-right" theme="light" rich-colors />
      <el-switch
        class="mr-3"
        active-text="Disciplinas escolhidas"
        v-model="selected"
        @change="changeSelected()"
      >
      </el-switch>

      <el-switch
          class="mr-3"
          active-text="Disciplinas cursadas"
          style="font-size: 13px;"
          v-model="cursadas"
          @change="changeCursadas()"
        >
      </el-switch>


      <el-popover 
        v-if="showWarning"
        placement="bottom"
        title="Atenção"
        width="450"
        trigger="hover"
      >
        <div>
          Faz mais de uma semana que você não sincroniza seus dados.<br />
          Isso pode acabar afetando a ordem dos chutes. <br /><br />
          <a
            href="https://aluno.ufabc.edu.br/fichas_individuais"
            target="_blank"
            class="text-[#0000ee]"
          >
            Atualizar dados agora
          </a>
        </div>
        <el-button
          v-if="showWarning"
          slot="reference"
          type="danger"
          icon="el-icon-warning"
          class="ml-3"
          circle
        >
        </el-button>
      </el-popover>
    </section>
  </div>
</template>
