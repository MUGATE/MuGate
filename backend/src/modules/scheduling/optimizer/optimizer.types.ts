export interface SchedulePreferences {
    preferredTimes?: string[];       // e.g., ["morning", "afternoon"]
    preferredInstructors?: string[];
    maxGapMinutes?: number;
    minCredits: number;
    maxCredits: number;
    avoidDays?: string[];            // e.g., ["Friday"]
}

export interface ScoredSchedule {
    schedule: any[];
    score: number;
}
