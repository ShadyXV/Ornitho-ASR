import axios from 'axios';
import type { ASRProvider } from './ASRProvider';

export class StandardOpenAIProvider implements ASRProvider {
    id = 'standard-openai';
    name = 'Standard OpenAI Whisper';

    async transcribe(audioBlob: Blob): Promise<string> {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');

        const response = await axios.post('/api/transcribe', formData, {
            headers: {
                'x-method-id': this.id,
            },
        });

        return response.data.text;
    }
}
