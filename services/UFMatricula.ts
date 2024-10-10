// workaround cause shadow root cannot access mainWindow globals

import { ofetch } from "ofetch";

// TOOD: fix after we are hosting the snapshot
const ufMatriculaService = ofetch.create({
	baseURL: "https://matricula.ufabc.edu.br/cache",
});

export async function getAllMatriculas() {
	const matriculas = await ufMatriculaService<typeof window.matriculas>(
		"/matriculas.js",
		{
			parseResponse(body) {
				const [entity, payload] = body.split("=");
				if (!payload) {
					const UFPayloadError = new Error(
						`could not parse uf ${entity || "unknown"} response`,
					);
					console.error(UFPayloadError);
					return [];
				}
				const [ufJson] = payload.split(";");
				const data = JSON.parse(ufJson);
				return data;
			},
		},
	);
	return matriculas;
}
