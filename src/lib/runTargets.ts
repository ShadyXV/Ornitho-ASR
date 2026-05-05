import type { ProviderInfo, RunTarget } from '../types';

export function targetKey(target: RunTarget): string {
  return `${target.providerId}:${target.modelId}:${target.methodId}`;
}

export function allAvailableTargets(providers: ProviderInfo[]): RunTarget[] {
  return providers
    .filter((provider) => provider.available)
    .flatMap((provider) => provider.methods.flatMap((method) => method.models.map((modelId) => ({
      providerId: provider.id,
      modelId,
      methodId: method.id,
    }))));
}

export function defaultTargetIds(providers: ProviderInfo[]): Set<string> {
  return new Set(allAvailableTargets(providers).map(targetKey));
}

export function targetsForProvider(providers: ProviderInfo[], providerId: string, modelId?: string): Set<string> {
  const ids = providers
    .filter((provider) => provider.available && provider.id === providerId)
    .flatMap((provider) => provider.methods.flatMap((method) => method.models
      .filter((candidateModelId) => !modelId || candidateModelId === modelId)
      .map((candidateModelId) => targetKey({
        providerId: provider.id,
        modelId: candidateModelId,
        methodId: method.id,
      }))));

  return new Set(ids);
}

export function blindTargetIds(providers: ProviderInfo[]): Set<string> {
  const ids = providers
    .filter((provider) => provider.available)
    .flatMap((provider) => provider.methods
      .filter((method) => method.kind === 'baseline')
      .flatMap((method) => method.models.map((modelId) => targetKey({
        providerId: provider.id,
        modelId,
        methodId: method.id,
      }))));

  return ids.length > 0 ? new Set(ids) : defaultTargetIds(providers);
}

export function selectedTargets(providers: ProviderInfo[], selectedTargetIds: Set<string>): RunTarget[] {
  return allAvailableTargets(providers).filter((target) => selectedTargetIds.has(targetKey(target)));
}
