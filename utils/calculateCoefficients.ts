import type { HydratedComponent } from "@/scripts/sig/homepage";
import type { Course } from "./transformCourse";

type ComponentPerYearAndPeriod = Map<number, Map<number, HydratedComponent[]>>;
type ComponentCoefficient = Map<number, Map<number, Record<string, unknown>>>;
type Coefficients = {
	periodCA: number;
	accumulatedCA: number;
	periodCR: number;
	accumulatedCR: number;
	accumulatedCP: number;
	approvedPercentage: number;
	accumulatedCredits: number;
	periodCredits: number;
};
export type GraduationCoefficients = Record<
	number,
	Record<1 | 2 | 3, Coefficients>
>;
export type ScopedCoefficients = ReturnType<typeof summarizeCoefficients>;

type GraduationCurriculum = {
	curso: Course;
	grade: string;
	creditsTotal: number;
	freeCredits: number;
	limitedCredits: number;
	mandatoryCredits: number;
};

/**
 * @description This function returns the student progress, since the first period
 */
export function calculateCoefficients(
	components: HydratedComponent[],
	graduation: GraduationCurriculum,
) {
	const componentsPerYearAndPeriod: ComponentPerYearAndPeriod = new Map();
	const componentsCoefficient: ComponentCoefficient = new Map();

	for (const component of components) {
		const { period } = component;
		const year = Number(component.year);
		if (!componentsPerYearAndPeriod.has(Number(year))) {
			componentsPerYearAndPeriod.set(Number(year), new Map());
		}

		if (!componentsCoefficient.has(Number(year))) {
			componentsCoefficient.set(Number(year), new Map());
		}

		if (!componentsPerYearAndPeriod.get(year)?.has(Number.parseInt(period))) {
			componentsPerYearAndPeriod.get(year)?.set(Number.parseInt(period), []);
		}

		if (!componentsCoefficient.get(year)?.has(Number.parseInt(period))) {
			componentsCoefficient.get(year)?.set(Number.parseInt(period), {});
		}

		componentsPerYearAndPeriod
			.get(year)
			?.get(Number.parseInt(period))
			?.push(component);
	}

	const unique: Record<string, boolean> = {};
	const uniqComponent: Record<string, boolean> = {};
	let accumulatedCredits = 0;
	let accumulatedConcepts = 0;
	let accumulatedUniq = 0;
	let accumulatedCreditsFree = 0;
	let accumulatedCreditsLimited = 0;
	let accumulatedCreditsMandatory = 0;

	for (const [year, periodMap] of componentsPerYearAndPeriod) {
		for (const [period, components] of periodMap) {
			let periodCredits = 0;
			let conceptsPeriod = 0;
			let periodUnique = 0;
			let periodPassed = 0;
			let freeCredits = 0;
			let mandatoryCredits = 0;
			let limitedCredits = 0;

			for (const component of components) {
				const { credits, category, UFCode, name, grade } = component;

				const convertable = convertLetterToNumber(grade) * credits;

				if (category && isApproved(grade)) {
					if (category === "free") {
						freeCredits += credits;
					}
					if (category === "mandatory") {
						mandatoryCredits += credits;
					}
					if (category === "limited") {
						limitedCredits += credits;
					}
				}

				if (convertable < 0) {
					continue;
				}

				conceptsPeriod += convertable;
				periodCredits += credits;

				if (isApproved(grade)) {
					periodPassed += credits;
				}

				if (!(name in uniqComponent)) {
					unique[UFCode] = true;
					uniqComponent[name] = true;
					accumulatedUniq += credits;
					periodUnique += credits;
				}
			}

			accumulatedCredits += periodCredits;
			accumulatedConcepts += conceptsPeriod;
			accumulatedCreditsFree += freeCredits;
			accumulatedCreditsLimited += limitedCredits;
			accumulatedCreditsMandatory += mandatoryCredits;

			const periodCA = periodUnique === 0 ? 0 : conceptsPeriod / periodUnique;
			const accumulatedCA =
				accumulatedUniq === 0 ? 0 : accumulatedConcepts / accumulatedUniq;
			const periodCR = periodCredits === 0 ? 0 : conceptsPeriod / periodCredits;
			const accumulatedCR =
				accumulatedCredits === 0 ? 0 : accumulatedConcepts / accumulatedCredits;
			const approvedPercentage =
				periodCredits === 0 ? 0 : periodPassed / periodCredits;

			let accumulatedCP = 0;

			if (graduation != null) {
				const totalLimitedCredits = Math.min(
					accumulatedCreditsLimited,
					graduation.limitedCredits,
				);
				const totalMandatoryCredits = Math.min(
					accumulatedCreditsMandatory,
					graduation.mandatoryCredits,
				);

				// excess limited credits are added to free credits
				let excessLimitedCredits = 0;

				if (accumulatedCreditsFree > graduation.limitedCredits) {
					excessLimitedCredits = accumulatedCreditsFree - totalLimitedCredits;
				}

				const totalFreeCredits = Math.min(
					accumulatedCreditsFree + excessLimitedCredits,
					graduation.freeCredits,
				);
				const totalCredits =
					Math.max(totalFreeCredits, 0) +
					Math.max(totalLimitedCredits, 0) +
					Math.max(totalMandatoryCredits, 0);

				accumulatedCP = (totalCredits * 1) / graduation.creditsTotal;
			}

			const result = {
				periodCA,
				accumulatedCA,
				periodCR,
				accumulatedCR,
				accumulatedCP: accumulatedCP
					? Math.round(accumulatedCP * 1000) / 1000
					: accumulatedCP,
				approvedPercentage,
				accumulatedCredits,
				periodCredits,
			};

			componentsCoefficient.get(year)?.set(period, result);
		}
	}

	return mapToObject(componentsCoefficient) as GraduationCoefficients;
}

/** @description This function normalize the output so it can be easily shown */

/** @description This function outputs only the high-level values */

export function summarizeCoefficients(coefficients: GraduationCoefficients) {
	let cp = 0;
	let cr = 0;
	let ca = 0;
	let count = 0;

	for (const year of Object.values(coefficients)) {
		for (const period of Object.values(year)) {
			cp = Math.max(cp, period.accumulatedCP);
			cr = period.accumulatedCR;
			ca = period.accumulatedCA;
			count++;
		}
	}

	return {
		cp: Number(cp.toFixed(4)),
		cr: Number(cr.toFixed(4)),
		ca: Number(ca.toFixed(4)),
	};
}

function convertLetterToNumber(letter: string) {
	switch (letter) {
		case "A":
			return 4;
		case "B":
			return 3;
		case "C":
			return 2;
		case "D":
			return 1;
		case "F":
		case "O":
			return 0;
		case "-":
		case "E":
		case "I":
			return -1;
		default:
			return 1; // Default value when the input is not recognized
	}
}

function mapToObject(map: Map<unknown, unknown>): Record<string, unknown> {
	return Object.fromEntries(
		Array.from(map.entries(), ([k, v]) =>
			v instanceof Map ? [k, mapToObject(v)] : [k, v],
		),
	);
}

function isApproved(concept: string) {
	return !["F", "0", "O", "I"].includes(concept);
}
