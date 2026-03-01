import { ScheduleRepository } from "./schedule.repository";

export class ScheduleService {
    static async getByUserId(userId: string) {
        return ScheduleRepository.findByUserId(userId);
    }

    static async save(userId: string, scheduleData: any) {
        return ScheduleRepository.create(userId, scheduleData);
    }
}
