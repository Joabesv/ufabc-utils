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

export type Grade = "A" | "B" | "C" | "D" | "O" | "F";

type Distribution = {
	conceito: Grade;
	weight: number;
	count: number;
	cr_medio: number;
	numeric: number;
	numericWeight: number;
	amount: number;
	cr_professor: number;
};

type DetailedReviews = {
	_id: {
		mainTeacher: string;
	};
	distribution: Array<Distribution>;
	numericWeight: number;
	numeric: number;
	amount: number;
	count: number;
	cr_professor: number;
	cr_medio: number;
	teacher: {
		_id: string;
		name: string;
		alias: string[] | null;
	};
};

export type SubjectReview = {
	subject: {
		_id: string;
		name: string;
		search: string;
		updatedAt: string;
		creditos: number;
	};
	general: {
		distribution: Array<Distribution>;
		cr_medio: number;
		cr_professor: number;
		count: number;
		amount: number;
		numeric: number;
		numericWeight: number;
		weight: number;
	};
	specific: Array<DetailedReviews>;
};

function resolveEndpoint(env: string) {
	return (
		{
			development: "http://localhost:5000",
			staging: "https://ufabc-matricula-test.cdd.naoseiprogramar.com.br/v1",
			production: "https://api.v2.ufabcnext.com/v2",
		}[env] || "http://localhost:5000"
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

export async function getComponentKicks(
	componentId: number,
	studentId: number,
) {
	try {
		const kicksData = await nextService(
			`/entities/components/${componentId}/kicks?studentId=${studentId}`,
		);
		return kicksData;
	} catch (error: any) {
		if (error.name === "Forbidden") {
			console.log("deu nao pai");
		}
		console.log(error);
	}
}

export async function getSubjectReviews(subjectId: string) {
	const reviews = await nextService<SubjectReview>(
		`/entities/subjects/reviews/${subjectId}`,
	);
	return reviews;
}
