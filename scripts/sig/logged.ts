import { normalizeDiacritics } from "@/utils/removeDiacritics";
import { useFetch } from "@vueuse/core";
import { useChangeCase } from "@vueuse/integrations/useChangeCase";

type Student = {
	matricula: string;
	email: string;
	/** @example 2022:2 */
	entrada: string;
	nivel: "graduacao" | "licenciatura";
	status: string;
	curso: string;
};

type NTIStudent = {
	firstname: string;
	fullname: string;
	lastname: string;
	username: string;
	email: string[];
};

export async function retrieveStudent(
	pageTrs: NodeListOf<HTMLTableRowElement>,
) {
	const rows = Array.from(pageTrs);
	const kvStudent = rows.map((row) => {
		const $childrens = row.children;
		const cleaned = Array.from($childrens).map((column) =>
			normalizeDiacritics(column.innerText!),
		);
		return cleaned;
	});

	const rawStudent: Student = Object.fromEntries(kvStudent);
	const [course, campus, kind, shift] = rawStudent.curso.split("  ");
	const { data: UFData } = await useFetch(
		`https://sig.ufabc.edu.br/sigaa/APISistemasNTI?funcao=2&valor=${rawStudent.matricula}`,
	).json<NTIStudent>();

	const fixedShift = shift === "n" ? "noturno" : "matutino";
	const { value: name } = useChangeCase(UFData.value?.fullname, "capitalCase");

	const student = {
		name,
		ra: rawStudent.matricula,
		login: UFData.value?.username,
		email: UFData.value?.email.find((email) =>
			email.includes("@aluno.ufabc.edu.br"),
		),
		graduation: {
			course: transformCourseName(course, kind),
			campus,
			shift: fixedShift,
		},
		startedAt: rawStudent.entrada,
	};

	return student;
}
