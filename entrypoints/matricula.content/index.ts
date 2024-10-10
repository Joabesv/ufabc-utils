import Matricula from "./Matricula.vue";
import type { ContentScriptContext } from "wxt/client";
import "./style.css";
import { getAllMatriculas } from "@/services/UFMatricula";

export default defineContentScript({
	async main(ctx) {
		// retrieve data from the sig scrapped data
		// inject the matricula modal here
		// init kicks again
		const ui = await mountMatriculaFilters(ctx);
		ui.mount();
	},
	runAt: "document_end",
	cssInjectionMode: "ui",
	matches: [
		"https://matricula.ufabc.edu.br/matricula",
		"https://matricula.ufabc.edu.br/matricula/resumo",
		"https://api.ufabcnext.com/snapshot",
	],
});

async function mountMatriculaFilters(ctx: ContentScriptContext) {
	return createShadowRootUi(ctx, {
		name: "matriculas-filter",
		position: "modal",
		anchor: "#meio",
		append: "first",
		zIndex: 9999,
		async onMount(container, shadow, _shadowhost) {
			const wrapper = document.createElement("div");
			container.append(wrapper);
			const matriculas = await getAllMatriculas();
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
