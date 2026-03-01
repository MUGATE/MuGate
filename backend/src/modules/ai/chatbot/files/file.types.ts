export interface FileUploadResult {
    fileName: string;
    mimeType: string;
    extractedText?: string;
    isImage: boolean;
}

export interface VoiceUploadResult {
    transcription: string;
    durationSeconds?: number;
}
