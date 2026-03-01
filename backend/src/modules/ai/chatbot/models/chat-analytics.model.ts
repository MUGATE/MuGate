export interface ChatAnalytics {
    id: string;
    questionCategory: string | null;
    isFailed: boolean;
    responseTimeMs: number;
    createdAt: Date;
}
