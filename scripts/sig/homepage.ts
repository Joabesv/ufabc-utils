import { fetchGrades, getUFStudent } from "@/services/UFSigaa";
import { normalizeDiacritics } from "@/utils/removeDiacritics";
import { useChangeCase } from "@vueuse/integrations/useChangeCase";
import type { Course } from "@/utils/transformCourse";

type SigStudent = {
	matricula: string;
	email: string;
	/** @example 2022:2 */
	entrada: string;
	nivel: "graduacao" | "licenciatura";
	status: string;
	curso: string;
};

type ShallowStudent = {
	name: string;
	ra: string;
	login: string;
	email: string | undefined;
	graduation: {
		course: Course;
		campus: string;
		shift: string;
	};
	startedAt: string;
};

type Component = {
	UFCode: string;
	name: string;
	grade: string;
	status: string;
	year: string;
	period: "1" | "2" | "3";
};

type Student = {
	name: string;
	ra: string;
	login: string;
	email: string | undefined;
	graduation: {
		course: Course;
		campus: string;
		shift: string;
		components: Component[];
	};
	startedAt: string;
};

export async function retrieveStudent(
	pageTrs: NodeListOf<HTMLTableRowElement>,
): Promise<ShallowStudent | null> {
	const rows = Array.from(pageTrs);
	const kvStudent = rows.map((row) => {
		const $childrens = row.children as HTMLCollectionOf<HTMLElement>;
		const cleaned = Array.from($childrens).map((column) =>
			normalizeDiacritics(column.innerText ?? ""),
		);
		return cleaned;
	});

	const rawStudent: SigStudent = Object.fromEntries(kvStudent);
	const [course, campus, kind, shift] = rawStudent.curso.split("  ");
	const NTIStudent = await getUFStudent(rawStudent.matricula);
	if (!NTIStudent || "error" in NTIStudent) {
		console.log(NTIStudent);
		return null;
	}
	const fixedShift = shift === "n" ? "noturno" : "matutino";
	const { value: name } = useChangeCase(
		NTIStudent.fullname ?? "",
		"capitalCase",
		{ locale: "pt-BR" },
	);

	const student = {
		name,
		ra: rawStudent.matricula,
		login: NTIStudent.username,
		email: NTIStudent.email.find((email) =>
			email.includes("@aluno.ufabc.edu.br"),
		),
		graduation: {
			course: transformCourseName(course, kind),
			campus: campus === "santo andre" ? "sa" : "sbc",
			shift: fixedShift,
		},
		startedAt: rawStudent.entrada,
	};

	type ShallowStudent = typeof student;

	return student;
}

export async function scrapeMenu(
	trs: NodeListOf<HTMLTableRowElement>,
): Promise<Student | null> {
	const { data: page, error } = await fetchGrades();
	if (error && !page) {
		console.log({
			msg: "Ocorreu um erro ao extrair as disciplinas cursadas, por favor tente novamente mais tarde!",
			error,
		});
		return null;
	}

	const shallowStudent = await retrieveStudent(trs);

	if (!shallowStudent) {
		return null;
	}

	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const graduationHistory = await scrapeStudentHistory(page!);

	if (!graduationHistory) {
		console.log("error scrapping student history", graduationHistory);
		return null;
	}

	const student = {
		...shallowStudent,
		graduation: {
			...shallowStudent.graduation,
			components: graduationHistory,
		},
	};

	return student;
}

async function scrapeStudentHistory(page: string) {
	const parser = new DOMParser();
	const gradesDocument = parser.parseFromString(page, "text/html");
	if (!gradesDocument.body) {
		console.log("could not mount document", document);
		return null;
	}

	const $periodsTable =
		gradesDocument.querySelectorAll<HTMLTableElement>(".tabelaRelatorio");
	const historyTables = Array.from($periodsTable);
	const components = historyTables.flatMap(extractComponents);

	return components;
}

function extractComponents(table: HTMLTableElement) {
	const caption = table.querySelector("caption")?.textContent?.trim() || "";
	const [year, period] = caption.split(".") as [string, "1" | "2" | "3"];
	const headers = extractHeaders(table);
	const rows = Array.from(
		table.querySelectorAll<HTMLTableRowElement>("tbody > tr"),
	);
	const components = rows.map((row) => {
		const cells = Array.from(row.children) as unknown as HTMLTableColElement[];
		const component = {
			year,
			period,
		} as Component;

		headers.forEach((header, index) => {
			switch (header) {
				case "codigo":
					component.UFCode = cells[index].innerText;
					break;
				case "disciplina":
					component.name = cells[index].innerText;
					break;
				case "resultado": {
					const gradeCell = cells.find(
						(cell) =>
							cell.classList.contains("nota") && cell.innerText.trim() !== "",
					);
					component.grade = gradeCell ? gradeCell.innerText.trim() : "";
					break;
				}
				case "situacao": {
					const statusCell = cells[cells.length - 1];
					component.status = statusCell ? statusCell.innerText.trim() : "";
					break;
				}
			}
		});

		return component;
	});

	return components;
}

function extractHeaders(table: HTMLTableElement) {
	const headerCells = Array.from(table.querySelectorAll("th"));
	const wantedFields = ["codigo", "disciplina", "resultado", "situacao"];
	return headerCells
		.map((cell) => normalizeDiacritics(cell.innerText))
		.filter((header) => wantedFields.includes(header));
}
