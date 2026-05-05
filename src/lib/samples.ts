import type { ProviderInfo, RunTarget, SampleRecord } from '../types';

export function sampleBirdTermsText(sample: SampleRecord): string {
  return sample.birdTerms.join(', ');
}

export function sampleTagsText(sample: SampleRecord): string {
  return sample.tags.join(', ');
}

export function defaultTranscriptTarget(providers: ProviderInfo[]): RunTarget | null {
  const available = providers.filter((provider) => provider.available);
  const preference = ['openai', 'deepgram', 'google'];
  const ordered = [
    ...preference
      .map((id) => available.find((provider) => provider.id === id))
      .filter((provider): provider is ProviderInfo => Boolean(provider)),
    ...available.filter((provider) => !preference.includes(provider.id)),
  ];

  for (const provider of ordered) {
    const baseline = provider.methods.find((method) => method.kind === 'baseline' && method.models.length > 0);
    if (baseline) {
      return {
        providerId: provider.id,
        modelId: baseline.models[0],
        methodId: baseline.id,
      };
    }
  }

  return null;
}

export function sampleSourceLabel(sample: SampleRecord, providers: ProviderInfo[]): string {
  const provider = providers.find((item) => item.id === sample.sourceProviderId);
  const model = provider?.models.find((item) => item.id === sample.sourceModelId);
  const method = provider?.methods.find((item) => item.id === sample.sourceMethodId);
  return [provider?.name || sample.sourceProviderId, model?.name || sample.sourceModelId, method?.name || sample.sourceMethodId]
    .filter(Boolean)
    .join(' / ') || 'Manual transcript';
}
