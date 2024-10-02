export function normalizeDiacritics(stringElement: string) {
	return stringElement
		.trim()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[-:]/g, "")
		.toLocaleLowerCase();
}
