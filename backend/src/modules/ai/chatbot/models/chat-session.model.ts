export interface ChatSession {
    id: string;
    userId: string | null; // Null if public/anonymous mode
    title: string | null;
    isPinned: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
