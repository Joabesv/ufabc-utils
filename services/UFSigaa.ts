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
		return grades;
	} catch (error) {
		console.log("deu merda mestre", error);
		return null;
	}
}
