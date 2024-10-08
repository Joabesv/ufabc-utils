import Matricula from "./Matricula.vue";
import type { ContentScriptContext } from "wxt/client";
import "./style.css";

export default defineContentScript({
	async main(ctx) {
		// retrieve data from the sig scrapped data
		// inject the matricula modal here
		// init kicks again
		const ui = await mountMatriculaFilters(ctx);
		console.log("joabe", ctx);
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

function mountMatriculaFilters(ctx: ContentScriptContext) {
	return createShadowRootUi(ctx, {
		name: "matriculas-filter",
		position: "modal",
		onMount(container, _shadow, _shadowhost) {
			const app = createApp(Matricula);
			app.mount(container);
			return app;
		},
	});
}
