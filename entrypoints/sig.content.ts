import { handleItinerary, walkTree } from "@/scripts/sig/itinerary";

export default defineContentScript({
	main() {
		const sigURL = new URL(document.location.href);
		const itineraryTable =
			document.querySelector<HTMLTableElement>("#turmas-portal");
		const shouldFormatItinerary =
			sigURL.pathname.includes("/portais/discente/discente.jsf") &&
			itineraryTable;
		if (shouldFormatItinerary) {
			handleItinerary(itineraryTable);
		}
	},
	runAt: "document_start",
	matches: ["https://sig.ufabc.edu.br/sigaa/**"],
});
