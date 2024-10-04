import { storage } from "wxt/storage";
import { handleItinerary } from "@/scripts/sig/itinerary";
import { retrieveStudent, scrapeMenu } from "@/scripts/sig/homepage";

export default defineContentScript({
	async main() {
		const sigURL = new URL(document.location.href);
		const itineraryTable =
			document.querySelector<HTMLTableElement>("#turmas-portal");
		const $trs = document.querySelectorAll<HTMLTableRowElement>(
			"#agenda-docente tbody tr",
		);
		const shouldFormatItinerary =
			sigURL.pathname.includes("/portais/discente/discente.jsf") &&
			itineraryTable;

		if (shouldFormatItinerary) {
			handleItinerary(itineraryTable);
			const student = await scrapeMenu($trs);
			console.log(student);
			// storage.setItem("sync:student", student);
		}
	},
	runAt: "document_start",
	matches: ["https://sig.ufabc.edu.br/sigaa/portais/discente/discente.jsf"],
});
