import axios from 'axios';
import type { ASRProvider } from './ASRProvider';

export class WhisperPromptedProvider implements ASRProvider {
    id = 'whisper-prompted';
    name = 'Whisper with Contextual Prompting';

    async transcribe(audioBlob: Blob, options: { prompt: string }): Promise<string> {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');
        if (options?.prompt) {
            formData.append('prompt', options.prompt);
        }

        const response = await axios.post('/api/transcribe', formData, {
            headers: {
                'x-method-id': this.id,
            },
        });

        return response.data.text;
    }
}
