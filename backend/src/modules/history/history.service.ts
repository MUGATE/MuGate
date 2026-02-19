import { HistoryRepository } from "./history.repository";

export class HistoryService {
    static async getStudentHistory(userId: string) {
        return HistoryRepository.findByUserId(userId);
    }

    static async getCompletedElectives(userId: string) {
        // TODO: Filter completed courses that are electives
        const history = await HistoryRepository.findByUserId(userId);
        return history.filter((course: any) => course.isElective);
    }

    static async checkEligibility(userId: string, courseId: string) {
        // TODO: Check prerequisites against completed courses
        return { eligible: true, missingPrereqs: [] };
    }
}
