export interface SavedSchedule {
    id: string;
    userId: string;
    name: string;
    sections: string[];
    totalCredits: number;
    score: number;
    createdAt: Date;
}
