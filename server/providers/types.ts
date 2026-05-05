export type ProviderMethodKind = 'baseline' | 'prompt' | 'adaptation' | 'grammar';

export interface ProviderModel {
    id: string;
    name: string;
}

export interface ProviderMethod {
    id: string;
    name: string;
    kind: ProviderMethodKind;
    description: string;
    models: string[];
    requiresBirdTerms: boolean;
}

export interface ProviderInfo {
    id: string;
    name: string;
    requiredEnv: string[];
    supportedAudioFormats: string[];
    models: ProviderModel[];
    methods: ProviderMethod[];
}

export interface PublicProviderInfo extends ProviderInfo {
    available: boolean;
    missingEnv: string[];
}

export interface TranscriptionInput {
    audioBuffer: Buffer;
    audioPath: string;
    mimeType: string;
    modelId: string;
    methodId: string;
    birdTerms: string[];
    expectedTranscript?: string;
    previousTranscript?: string;
}

export interface TranscriptionOutput {
    text: string;
    raw?: unknown;
    costEstimate?: string;
}

export interface ProviderPlugin extends ProviderInfo {
    transcribe(input: TranscriptionInput): Promise<TranscriptionOutput>;
}

export interface RunTarget {
    providerId: string;
    modelId: string;
    methodId: string;
}
