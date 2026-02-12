export interface ASRProvider {
    id: string;
    name: string;
    transcribe(audioBlob: Blob, options?: any): Promise<string>;
}
