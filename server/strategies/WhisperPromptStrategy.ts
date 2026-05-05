import OpenAI from 'openai';
import { TranscriptionStrategy } from './TranscriptionStrategy';
import fs from 'fs';
import path from 'path';

export class WhisperPromptStrategy implements TranscriptionStrategy {
    id = 'whisper-prompt';
    name = 'Whisper (Prompted)';
    private openai: OpenAI;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.warn('OPENAI_API_KEY not found. Whisper strategy will fail.');
        }
        this.openai = new OpenAI({ apiKey: apiKey || 'dummy' });
    }

    async transcribe(audioBuffer: Buffer, birdList: string[]): Promise<string> {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OpenAI API Key missing');
        }

        // OpenAI Node SDK expects a File object or ReadStream.
        // We need to write buffer to a temp file or use a workaround.
        // For simplicity and robustness, let's write to a temp file.
        const tempFilePath = path.join('uploads', `temp-${Date.now()}.wav`);
        fs.writeFileSync(tempFilePath, audioBuffer);

        try {
            const prompt = `Context: Ornithology. Bird list: ${birdList.join(', ')}.`;

            const response = await this.openai.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: 'whisper-1',
                prompt: prompt,
            });

            return response.text;
        } finally {
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        }
    }
}
