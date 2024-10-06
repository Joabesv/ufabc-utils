import { ofetch } from "ofetch";
import { storage } from "wxt/storage";

type UFCourses = {
	name: string;
	campus: "santo andré" | "são bernardo do campo";
	coordinator: string;
	UFCourseId: number;
};

const ufParserService = ofetch.create({
	baseURL: import.meta.env.VITE_UFABC_PARSER_URL,
});

const CACHE_KEY = "ufCoursesCache";

export async function getUFCourses() {
	const cachedCourses = await storage.getItem<UFCourses[]>(
		`session:${CACHE_KEY}`,
	);
	if (cachedCourses) {
		return cachedCourses;
	}
	const courses = await ufParserService<UFCourses[]>("/courses");
	await storage.setItem(`session:${CACHE_KEY}`, courses);
	return courses;
}
