export interface CreateSessionDto {
    title?: string;
    isPinned?: boolean;
    source?: string; // 'chat' (default) | 'resume' — separates feature histories
}
