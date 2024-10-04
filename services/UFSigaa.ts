import { useFetch } from "@vueuse/core";

type NTIStudent = {
	firstname: string;
	fullname: string;
	lastname: string;
	username: string;
	email: string[];
};

export async function fetchGrades() {
	const sigURL = "/sigaa/portais/discente/discente.jsf";
	const formData = new FormData();

	formData.append("menu:form_menu_discente", "menu:form_menu_discente");
	formData.append("id", "82316");
	formData.append(
		"jscook_action",
		"menu_form_menu_discente_j_id_jsp_340461267_98_menu:A]#{ relatorioNotasAluno.gerarRelatorio }",
	);
	formData.append(
		"javax.faces.ViewState",
		document.querySelector<HTMLInputElement>(
			'input[name="javax.faces.ViewState"]',
		)?.value || "",
	);

	try {
		const response = await fetch(sigURL, {
			method: "POST",
			credentials: "include",
			body: formData,
		});
		const grades = await response.text();
		return { data: grades, error: null };
	} catch (error) {
		console.log("deu merda mestre", error);
		return {
			data: null,
			error,
		};
	}
}

export async function getUFStudent(ra: string) {
	const { data: student, error } = await useFetch(
		`https://sig.ufabc.edu.br/sigaa/APISistemasNTI?funcao=2&valor=${ra}`,
	).json<NTIStudent>();

	if (error.value) {
		return {
			msg: "A problem has ocurred when fetching, please try again",
			error: error.value,
		};
	}

	return student.value;
}
