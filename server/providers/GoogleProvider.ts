import speech from '@google-cloud/speech';
import { getConfigValue } from '../runtimeConfig';
import type { ProviderPlugin, TranscriptionInput, TranscriptionOutput } from './types';

function buildBirdGrammar(birdTerms: string[]): string {
    const options = birdTerms
        .slice(0, 80)
        .map((term) => term.replace(/[^\w\s'-]/g, '').trim())
        .filter(Boolean)
        .join(' | ');

    return `#ABNF 1.0 UTF-8; language en-US; mode voice; root $bird; $bird = ${options};`;
}

function buildConfig(input: TranscriptionInput): Record<string, unknown> {
    const config: Record<string, unknown> = {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: 'en-US',
        model: input.modelId,
    };

    const phrases = input.birdTerms.slice(0, 100).map((term) => ({ value: term, boost: 12 }));

    if (input.methodId === 'inline-phrase-set') {
        config.adaptation = {
            phraseSets: [{ phrases }],
        };
    }

    if (input.methodId === 'custom-class') {
        config.adaptation = {
            customClasses: [
                {
                    customClassId: 'bird_names',
                    items: input.birdTerms.slice(0, 100).map((term) => ({ value: term })),
                },
            ],
            phraseSets: [
                {
                    phrases: [{ value: '${bird_names}', boost: 15 }],
                },
            ],
        };
    }

    if (input.methodId === 'abnf-grammar') {
        config.adaptation = {
            abnfGrammar: {
                abnfStrings: [buildBirdGrammar(input.birdTerms)],
            },
        };
    }

    return config;
}

export const googleProvider: ProviderPlugin = {
    id: 'google',
    name: 'Google Speech-to-Text',
    requiredEnv: ['GOOGLE_APPLICATION_CREDENTIALS'],
    supportedAudioFormats: ['audio/webm', 'audio/wav'],
    models: [
        { id: 'latest_short', name: 'Latest Short' },
        { id: 'latest_long', name: 'Latest Long' },
    ],
    methods: [
        {
            id: 'baseline',
            name: 'Baseline',
            kind: 'baseline',
            description: 'No vocabulary help.',
            models: ['latest_short', 'latest_long'],
            requiresBirdTerms: false,
        },
        {
            id: 'inline-phrase-set',
            name: 'Inline Phrase Set',
            kind: 'adaptation',
            description: 'Uses inline phrase hints with boost.',
            models: ['latest_short', 'latest_long'],
            requiresBirdTerms: true,
        },
        {
            id: 'custom-class',
            name: 'Custom Class',
            kind: 'adaptation',
            description: 'Groups bird names into a reusable class for recognition.',
            models: ['latest_short', 'latest_long'],
            requiresBirdTerms: true,
        },
        {
            id: 'abnf-grammar',
            name: 'ABNF Grammar',
            kind: 'grammar',
            description: 'Constrains likely bird-name phrases with a grammar.',
            models: ['latest_short'],
            requiresBirdTerms: true,
        },
    ],
    async transcribe(input: TranscriptionInput): Promise<TranscriptionOutput> {
        const credentialsPath = getConfigValue('GOOGLE_APPLICATION_CREDENTIALS');
        if (!credentialsPath) {
            throw new Error('Google credentials path missing');
        }

        process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
        const client = new speech.SpeechClient();
        const [response] = await client.recognize({
            audio: { content: input.audioBuffer.toString('base64') },
            config: buildConfig(input),
        });

        const text = response.results
            ?.map((result) => result.alternatives?.[0]?.transcript)
            .filter(Boolean)
            .join('\n') || '';

        return {
            text,
            raw: response,
        };
    },
};
