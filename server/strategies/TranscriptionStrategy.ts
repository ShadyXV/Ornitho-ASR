export interface TranscriptionStrategy {
    id: string;
    name: string;
    transcribe(audioBuffer: Buffer, birdList: string[]): Promise<string>;
}
