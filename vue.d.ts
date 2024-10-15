declare module "*.vue" {
	import type { DefineComponent } from "vue";
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	// biome-ignore lint/complexity/noBannedTypes: <explanation>
	const component: DefineComponent<{}, {}, any>;
	export default component;
}
