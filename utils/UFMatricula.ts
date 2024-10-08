import { storage } from "wxt/storage";

export async function getStudentId(ra: string) {
	const scripts = document.querySelectorAll("script");
	const searchString = "todasMatriculas";
	let studentId = null;

	for (const script of Array.from(scripts)) {
		const content = script.textContent || script.innerHTML;
		if (content.includes(searchString)) {
			const regex = /matriculas\[(\d+)\]/;
			const match = content.match(regex);

			if (match?.[1]) {
				studentId = Number.parseInt(match[1], 10);
				await storage.setItem("session:matricula-student", {
					ra,
					studentId,
				});
				break; // Interrompe o loop quando o ID é encontrado
			}
		}
	}

	const cachedStudent = await storage.getItem("session:matricula-student", {
		fallback: studentId,
	});
	return cachedStudent;
}

function currentUser() {
	const $span = document.querySelector<HTMLSpanElement>("#usuario_top");
	const rawContent = $span?.textContent || $span?.innerHTML;
	const content = rawContent?.replace(/\s*/, "");
	if (!content) {
		return null;
	}
	const [user] = content.split("|");
	return user.trim().toLocaleLowerCase();
}
