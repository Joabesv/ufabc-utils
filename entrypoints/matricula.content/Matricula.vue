<script setup lang="ts">
import Teacher from '@/components/Teacher.vue'
import Cortes from '@/components/Cortes.vue'
import Modal from './Modal.vue'
import { toast, Toaster } from 'vue-sonner'
import { getStudentId,  currentUser } from '@/utils/UFMatricula'
import { useStorage } from '@/composables/useStorage'
import { getComponents, type Component } from '@/services/next'
import { render } from 'vue'
import type { Student } from '@/scripts/sig/homepage';


type Filter = {
  name: 'Santo André' | 'São Bernardo' | 'Noturno' | 'Matutino'
  val: boolean
  comparator: 'bernardo' | 'andr' | 'diurno' | 'noturno'
  class: 'notAndre' | 'notBernardo' | 'notNoturno' | 'notMatutino'
}

const matriculas = inject<typeof window.matriculas>('matriculas')
const selected = ref(false)
const cursadas = ref(false)
 
const showWarning = ref(false);
const teachers = ref(false);
const modalState = ref<{ isOpen: boolean; corteId: string | null }>({
  isOpen: false,
  corteId: null
})

provide('modalState', modalState)

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

const student = ref<Student | null>(null)

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
    console.log('show some message to the user')
    return
  } 
  const enrollments = matriculas?.[557736] || []
  const tableRows = document.querySelectorAll('tr')

  for(const $row of tableRows) {
    const componentId = $row.getAttribute('value')
    if (componentId && !enrollments?.includes(componentId.toString())) {
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

  if (!student.value) {
    toast.warning('Não encontramos suas disciplinas cursadas, por favor acesse o sigaa')
    return
  }

  const passed = student.value?.graduation.components
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
        data.parentElement.style.display = 'none';
      }
    }

    return
  }


  const allTr = document.querySelectorAll<HTMLTableRowElement>('#tabeladisciplinas tr')
  for (const tr of allTr) {
    tr.style.display = ''
  }
}


function openModal(corteId: string) {
  modalState.value.isOpen = true;
  modalState.value.corteId = corteId;
  console.log('Opening modal', modalState.value);
}

function closeModal() {
  modalState.value.isOpen = false;
  modalState.value.corteId = null;
  console.log('closing modal', modalState.value);
}

function handleClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (target.closest("#cortes")) {
    const corteElement = target.closest("#cortes");
    if (!corteElement) return;
    const corteId = corteElement.parentElement?.parentElement?.getAttribute("value");
    if (corteId) {
      console.log('Opening modal with corteId:', corteId);
      openModal(corteId);
    }
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


  const mainTable = document.querySelectorAll('table tr');
  for (const row of mainTable) {
    const el = row.querySelector<HTMLTableColElement>('td:nth-child(3)');
    const subjectEl = row.querySelector<HTMLSpanElement>('td:nth-child(3) > span');
    const corteEl = row.querySelector('td:nth-child(5)');
    const componentId = row.getAttribute('value');

    if(!componentId) {
      continue;
    }

    const component = componentsMap.get(componentId);

    if (!component) {
      continue;
    }

    if (component.subject) {
      subjectEl?.setAttribute('subjectId', component.subjectId);
    }

    const teacherContainer = document.createElement('div')
    el?.appendChild(teacherContainer)

    render(h(Teacher, {
      teoria: component.teoria,
      teoriaId: component.teoriaId,
      pratica: component.pratica,
      praticaId: component.praticaId,
    }), teacherContainer)

    const cortesContainer = document.createElement('div');
    corteEl?.appendChild(cortesContainer);
    
    render(h(Cortes), cortesContainer)
  } 
}

onMounted(async () => {
  document.body.addEventListener('click', handleClick)
  try {
    const { state: storageStudent } = await useStorage<Student>('sync:student')
    student.value = storageStudent.value
    teachers.value = true;
    await buildComponents();
  } catch(error) {
    console.error('Error during onMounted execution:', error);
  }
})

onUnmounted(() => {
  document.body.removeEventListener('click', handleClick)
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
  <Modal 
    :is-open="modalState.isOpen"
    :corte-id="modalState.corteId"
    @close="closeModal"
  />
</template>
