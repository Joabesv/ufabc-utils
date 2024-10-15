import { ofetch } from "ofetch";
import { storage } from "wxt/storage";

export type Component = {
	identifier: string;
	disciplina_id: number;
	subject: string;
	subjectId: string;
	turma: string;
	turno: "diurno" | "noturno";
	vagas: number;
	requisicoes: number;
	campus: "sbc" | "sa";
	teoria?: string;
	teoriaId?: string;
	pratica?: string;
	praticaId?: string;
};

function resolveEndpoint(env: string) {
	return (
		{
			development: "http://localhost:5000/v2",
			staging: "https://ufabc-matricula-test.cdd.naoseiprogramar.com.br/v1",
			production: "https://api.v2.ufabcnext.com/v2",
		}[env] || "http://localhost:5000/v2"
	);
}

const nextService = ofetch.create({
	baseURL: resolveEndpoint(import.meta.env.MODE),
});

export async function getComponents() {
	const components = await nextService<Component[]>("/entities/components");
	await storage.setItems([
		{ key: "session:components-last-update", value: Date.now() },
		{ key: "local:components", value: components },
	]);
	return components;
}

export async function enrollmentsComponents(lastCall: number) {
	const timeDiff = (Date.now() - lastCall) / (1000 * 60);

	await getComponents();
	if (!lastCall || timeDiff > 0.2) {
		await getComponents();
	}
}

export async function getComponentKicks(componentId: number, studentId: number){
	try {
		const kicksData = await nextService(`/entities/components/${componentId}/kicks?studentId=${studentId}`)
		return kicksData
	} catch(error: any) {
		if (error.name === 'Forbidden') {
			console.log('deu nao pai')
		}
		console.log(error)
	}
}