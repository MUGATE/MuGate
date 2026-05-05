export interface SendMessageDto {
    sessionId: string;
    content: string;
    reasoning?: boolean;
}
