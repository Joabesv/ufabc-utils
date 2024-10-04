import { storage } from "wxt/storage";
import { handleItinerary } from "@/scripts/sig/itinerary";
import { scrapeMenu } from "@/scripts/sig/homepage";
import { successToast } from "@/utils/toasts";
import "toastify-js/src/toastify.css";

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
			storage.setItem("sync:student", student);
			// add toast
			console.log(successToast.toastElement);
			successToast.showToast();
		}
	},
	runAt: "document_end",
	matches: ["https://sig.ufabc.edu.br/sigaa/portais/discente/discente.jsf"],
});
