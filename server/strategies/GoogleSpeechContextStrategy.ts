import speech from '@google-cloud/speech';
import { TranscriptionStrategy } from './TranscriptionStrategy';

export class GoogleSpeechContextStrategy implements TranscriptionStrategy {
    id = 'google-context';
    name = 'Google Speech (Context)';

    constructor() { }

    async transcribe(audioBuffer: Buffer, birdList: string[]): Promise<string> {
        // Automatically looks for GOOGLE_APPLICATION_CREDENTIALS env var or default path
        const client = new speech.SpeechClient();

        const audio = {
            content: audioBuffer.toString('base64'),
        };

        const config = {
            // encoding: 'LINEAR16' as const, // Assuming wav/webm is converted or supported. 
            // Note: Google is strict about encoding. We might need to ensure input is correct.
            // For this demo, let's assume usage of WEBM_OPUS if from browser or LINEAR16 if wav.
            // A robust production app would transcode using ffmpeg.
            // Let's rely on auto-detection or generic config if possible, 
            // but for Google Speech v1, explicit config is often needed.
            // Attempting to use 'WEBM_OPUS' which is common for browser audio.
            encoding: 'WEBM_OPUS' as const,
            sampleRateHertz: 48000,
            languageCode: 'en-US',
            speechContexts: [{
                phrases: birdList,
                boost: 20.0
            }]
        };

        const request = {
            audio: audio,
            config: config,
        };

        try {
            const [response] = await client.recognize(request);
            const transcription = response.results
                ?.map(result => result.alternatives?.[0]?.transcript)
                .join('\n');

            return transcription || '';
        } catch (err: any) {
            console.error("Google Speech Error:", err);
            throw new Error(`Google Speech failed: ${err.message}`);
        }
    }
}
