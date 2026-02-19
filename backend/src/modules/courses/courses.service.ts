import { CoursesRepository } from "./courses.repository";

export class CoursesService {
    static async getAllCourses() {
        return CoursesRepository.findAll();
    }

    static async getCourseById(id: string) {
        return CoursesRepository.findById(id);
    }
}
