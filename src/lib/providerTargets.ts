import type { ProviderInfo } from '../types';

export function providerTargetCount(provider: ProviderInfo): number {
  return provider.methods.reduce((count, method) => count + method.models.length, 0);
}
