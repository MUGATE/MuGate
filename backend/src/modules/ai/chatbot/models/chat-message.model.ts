export interface ChatMessage {
    id: string;
    sessionId: string;
    role: "user" | "assistant" | "system";
    content: string;
    tokensUsed: number;
    createdAt: Date;
}
