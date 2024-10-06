export default defineContentScript({
	async main() {
		// retrieve data from the sig scrapped data
    // inject the matricula modal here
    // init kicks again
	},
	runAt: "document_end",
	matches: ["https://matricula.ufabc.edu.br/*", 'https://api.ufabcnext.com/snapshot'],
});