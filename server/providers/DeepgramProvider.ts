import { createClient } from '@deepgram/sdk';
import { getConfigValue } from '../runtimeConfig';
import type { ProviderPlugin, TranscriptionInput, TranscriptionOutput } from './types';

function buildOptions(input: TranscriptionInput): Record<string, unknown> {
    const options: Record<string, unknown> = {
        model: input.modelId,
        smart_format: true,
    };

    const keyterms = input.birdTerms.slice(0, 100);
    if (input.methodId === 'keyword-boost' && input.modelId === 'nova-2') {
        options.keywords = keyterms.map((term) => `${term}:2`);
    }

    if (input.methodId === 'keyterm-prompt' && input.modelId === 'nova-3') {
        options.keyterm = keyterms;
    }

    return options;
}

export const deepgramProvider: ProviderPlugin = {
    id: 'deepgram',
    name: 'Deepgram',
    requiredEnv: ['DEEPGRAM_API_KEY'],
    supportedAudioFormats: ['audio/webm', 'audio/wav', 'audio/mpeg', 'audio/mp4'],
    models: [
        { id: 'nova-2', name: 'Nova 2' },
        { id: 'nova-3', name: 'Nova 3' },
    ],
    methods: [
        {
            id: 'baseline',
            name: 'Baseline',
            kind: 'baseline',
            description: 'No vocabulary help.',
            models: ['nova-2', 'nova-3'],
            requiresBirdTerms: false,
        },
        {
            id: 'keyword-boost',
            name: 'Keyword Boost',
            kind: 'adaptation',
            description: 'Boosts up to 100 bird terms on Nova 2.',
            models: ['nova-2'],
            requiresBirdTerms: true,
        },
        {
            id: 'keyterm-prompt',
            name: 'Keyterm Prompt',
            kind: 'adaptation',
            description: 'Uses Nova 3 keyterm prompting.',
            models: ['nova-3'],
            requiresBirdTerms: true,
        },
    ],
    async transcribe(input: TranscriptionInput): Promise<TranscriptionOutput> {
        const apiKey = getConfigValue('DEEPGRAM_API_KEY');
        if (!apiKey) {
            throw new Error('Deepgram API key missing');
        }

        const deepgram = createClient(apiKey);
        const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
            input.audioBuffer,
            buildOptions(input),
        );

        if (error) {
            throw new Error(`Deepgram error: ${error.message}`);
        }

        return {
            text: result?.results?.channels[0]?.alternatives[0]?.transcript || '',
            raw: result,
        };
    },
};
