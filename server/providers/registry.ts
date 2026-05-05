import { getProviderStatus } from '../runtimeConfig';
import { deepgramProvider } from './DeepgramProvider';
import { googleProvider } from './GoogleProvider';
import { openAIProvider } from './OpenAIProvider';
import type { ProviderPlugin, PublicProviderInfo, RunTarget } from './types';

const providers: ProviderPlugin[] = [openAIProvider, deepgramProvider, googleProvider];

export function getProviders(): ProviderPlugin[] {
    return providers;
}

export function getPublicProviders(): PublicProviderInfo[] {
    return providers.map((provider) => ({
        id: provider.id,
        name: provider.name,
        requiredEnv: provider.requiredEnv,
        supportedAudioFormats: provider.supportedAudioFormats,
        models: provider.models,
        methods: provider.methods,
        ...getProviderStatus(provider.requiredEnv),
    }));
}

export function findProvider(id: string): ProviderPlugin | undefined {
    return providers.find((provider) => provider.id === id);
}

export function validateTarget(target: RunTarget): { ok: true } | { ok: false; reason: string } {
    const provider = findProvider(target.providerId);
    if (!provider) {
        return { ok: false, reason: `Unknown provider: ${target.providerId}` };
    }

    const status = getProviderStatus(provider.requiredEnv);
    if (!status.available) {
        return { ok: false, reason: `Missing ${status.missingEnv.join(', ')}` };
    }

    if (!provider.models.some((model) => model.id === target.modelId)) {
        return { ok: false, reason: `Unknown model: ${target.modelId}` };
    }

    const method = provider.methods.find((item) => item.id === target.methodId);
    if (!method) {
        return { ok: false, reason: `Unknown method: ${target.methodId}` };
    }

    if (!method.models.includes(target.modelId)) {
        return { ok: false, reason: `${method.name} does not support ${target.modelId}` };
    }

    return { ok: true };
}
