import fs from 'fs';
import OpenAI from 'openai';
import { getConfigValue } from '../runtimeConfig';
import type { ProviderPlugin, TranscriptionInput, TranscriptionOutput } from './types';

function buildPrompt(input: TranscriptionInput): string | undefined {
    const terms = input.birdTerms.join(', ');

    if (input.methodId === 'bird-list-prompt' && terms) {
        return `Bird names that may appear in this audio: ${terms}.`;
    }

    if (input.methodId === 'spelling-context-prompt' && terms) {
        return `This is an ornithology field note. Preserve exact bird-name spelling and capitalization when possible. Expected bird names may include: ${terms}.`;
    }

    if (input.methodId === 'previous-context-prompt') {
        const previous = input.previousTranscript?.trim();
        return [previous ? `Previous transcript segment: ${previous}` : undefined, terms ? `Bird names that may appear: ${terms}.` : undefined]
            .filter(Boolean)
            .join('\n');
    }

    return undefined;
}

export const openAIProvider: ProviderPlugin = {
    id: 'openai',
    name: 'OpenAI',
    requiredEnv: ['OPENAI_API_KEY'],
    supportedAudioFormats: ['audio/webm', 'audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/m4a'],
    models: [
        { id: 'whisper-1', name: 'Whisper 1' },
        { id: 'gpt-4o-transcribe', name: 'GPT-4o Transcribe' },
        { id: 'gpt-4o-mini-transcribe', name: 'GPT-4o Mini Transcribe' },
    ],
    methods: [
        {
            id: 'baseline',
            name: 'Baseline',
            kind: 'baseline',
            description: 'No vocabulary help.',
            models: ['whisper-1', 'gpt-4o-transcribe', 'gpt-4o-mini-transcribe'],
            requiresBirdTerms: false,
        },
        {
            id: 'bird-list-prompt',
            name: 'Bird List Prompt',
            kind: 'prompt',
            description: 'Adds the expected bird names as context.',
            models: ['whisper-1', 'gpt-4o-transcribe', 'gpt-4o-mini-transcribe'],
            requiresBirdTerms: true,
        },
        {
            id: 'spelling-context-prompt',
            name: 'Spelling Context Prompt',
            kind: 'prompt',
            description: 'Adds spelling instructions and bird-name context.',
            models: ['whisper-1', 'gpt-4o-transcribe', 'gpt-4o-mini-transcribe'],
            requiresBirdTerms: true,
        },
        {
            id: 'previous-context-prompt',
            name: 'Previous Segment Prompt',
            kind: 'prompt',
            description: 'Adds previous transcript context for longer clips.',
            models: ['whisper-1', 'gpt-4o-transcribe', 'gpt-4o-mini-transcribe'],
            requiresBirdTerms: false,
        },
    ],
    async transcribe(input: TranscriptionInput): Promise<TranscriptionOutput> {
        const apiKey = getConfigValue('OPENAI_API_KEY');
        if (!apiKey) {
            throw new Error('OpenAI API key missing');
        }

        const client = new OpenAI({ apiKey });
        const prompt = buildPrompt(input);
        const response = await client.audio.transcriptions.create({
            file: fs.createReadStream(input.audioPath),
            model: input.modelId,
            response_format: 'json',
            ...(prompt ? { prompt } : {}),
        });

        return {
            text: response.text || '',
            raw: response,
        };
    },
};
