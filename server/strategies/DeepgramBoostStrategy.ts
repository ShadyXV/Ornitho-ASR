import { createClient } from '@deepgram/sdk';
import { TranscriptionStrategy } from './TranscriptionStrategy';

export class DeepgramBoostStrategy implements TranscriptionStrategy {
    id = 'deepgram-boost';
    name = 'Deepgram (Keyword Boost)';

    constructor() { }

    async transcribe(audioBuffer: Buffer, birdList: string[]): Promise<string> {
        const apiKey = process.env.DEEPGRAM_API_KEY;
        if (!apiKey) {
            throw new Error('Deepgram API Key missing');
        }

        const deepgram = createClient(apiKey);

        const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
            audioBuffer,
            {
                model: 'nova-2',
                smart_format: true,
                keywords: birdList.map(bird => `${bird}:2`), // Boost value of 2
            }
        );

        if (error) {
            throw new Error(`Deepgram error: ${error.message}`);
        }

        return result?.results?.channels[0]?.alternatives[0]?.transcript || '';
    }
}
