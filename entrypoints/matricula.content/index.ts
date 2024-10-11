import Matricula from "./Matricula.vue";
import Modal from "./Modal.vue";
import TeacherReview from "./TeacherReview.vue";
import SubjectReview from "./SubjectReview.vue";
import type { ContentScriptContext } from "wxt/client";
import "./style.css";
import { getUFEnrolled } from "@/services/UFParser";

export default defineContentScript({
	async main(ctx) {
		// retrieve data from the sig scrapped data
		// inject the matricula modal here
		// init kicks again
		const ui = await mountMatriculaFilters(ctx);
		ui.mount();

		const mountedUi = document.querySelector("#meio")
			?.firstChild as unknown as HTMLDivElement;

		mountedUi.style.position = "sticky";
		mountedUi.style.top = "0px";
		mountedUi.style.zIndex = "9";

		const modal = await mountModal(ctx);
		modal.mount();
		await mountTeacherReview(ctx);
		await mountSubjectReview(ctx);
		addEventListeners();
	},
	runAt: "document_end",
	cssInjectionMode: "ui",
	matches: [
		"https://ufabc-matricula-snapshot.vercel.app/",
		"https://matricula.ufabc.edu.br/matricula",
		"https://matricula.ufabc.edu.br/matricula/resumo",
		"https://api.ufabcnext.com/snapshot",
	],
});

async function mountMatriculaFilters(ctx: ContentScriptContext) {
	return createShadowRootUi(ctx, {
		name: "matriculas-filter",
		position: "inline",
		anchor: "#meio",
		append: "first",
		async onMount(container, shadow, _shadowhost) {
			const wrapper = document.createElement("div");
			container.append(wrapper);
			const matriculas = await getUFEnrolled();
			window.matriculas = matriculas;
			const app = createApp(Matricula);
			app.provide("matriculas", window.matriculas);

			app.mount(wrapper);
			return { app, wrapper };
		},
		onRemove(mounted) {
			mounted?.app.unmount();
			mounted?.wrapper.remove();
		},
	});
}

async function mountModal(ctx: ContentScriptContext) {
	return createShadowRootUi(ctx, {
		name: "kicked-modal",
		position: "modal",
		anchor: "#menu",
		append: "first",
		onMount(container) {
			const wrapper = document.createElement("div");
			container.append(wrapper);
			const app = createApp(Modal, {
				modalState: modalState.value,
				onClose: () => {
					modalState.value.isOpen = false;
					modalState.value.corteId = null;
				},
			});

			app.mount(wrapper);
			return { app, wrapper };
		},
		onRemove(mounted) {
			mounted?.app.unmount();
			mounted?.wrapper.remove();
		},
	});
}

async function mountTeacherReview(ctx: ContentScriptContext) {
	return createShadowRootUi(ctx, {
		name: "teacher-review",
		position: "inline",
		anchor: "body",
		onMount(container) {
			const wrapper = document.createElement("div");
			container.append(wrapper);
			const app = createApp(TeacherReview);
			app.mount(wrapper);
			return { app, wrapper };
		},
		onRemove(mounted) {
			mounted?.app.unmount();
			mounted?.wrapper.remove();
		},
	});
}

async function mountSubjectReview(ctx: ContentScriptContext) {
	return createShadowRootUi(ctx, {
		name: "subject-review",
		position: "inline",
		anchor: "body",
		onMount(container) {
			const wrapper = document.createElement("div");
			container.append(wrapper);
			const app = createApp(SubjectReview);
			app.mount(wrapper);
			return { app, wrapper };
		},
		onRemove(mounted) {
			mounted?.app.unmount();
			mounted?.wrapper.remove();
		},
	});
}

const modalState = ref<{ isOpen: boolean; corteId: null | string }>({
	isOpen: false,
	corteId: null,
});
const teacherReviewState = ref({
	isOpen: false,
	teacherId: null,
	teacherName: null,
});
const subjectReviewState = ref({ isOpen: false, subjectId: null });

function addEventListeners() {
	document.body.addEventListener("click", (e) => {
		const target = e.target as HTMLSpanElement;
		if (target.closest("#cortes")) {
			const corteElement = target.closest("#cortes");
			if (!corteElement) {
				return;
			}
			const corteId =
				corteElement.parentElement?.parentElement?.getAttribute("value");
			if (corteId) {
				console.log("here fuck", modalState.value);
				modalState.value.isOpen = true;
				modalState.value.corteId = corteId;
			}
		}

		if (target.classList.contains("ReviewTeacher")) {
			const teacherId = target.getAttribute("data");
			const teacherName = target.getAttribute("teacherName");
			// Trigger teacher review open with teacherId and teacherName
		}

		if (target.matches("span.sa, span.sbc")) {
			const subjectId = target.getAttribute("subjectId");
			// Trigger subject review open with subjectId
		}
	});
}
