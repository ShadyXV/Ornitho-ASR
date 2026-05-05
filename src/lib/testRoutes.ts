import { blindTargetIds, defaultTargetIds, targetsForProvider } from './runTargets';
import type { ProviderInfo } from '../types';

export function routeMode(pathname: string, providerId?: string): string {
  if (pathname.startsWith('/test/sample/')) {
    return 'sample';
  }
  if (pathname === '/test/full') {
    return 'full';
  }
  if (pathname === '/test/blind') {
    return 'blind';
  }
  return providerId ? 'provider' : 'blind';
}

export function routeTargetIds(providers: ProviderInfo[], pathname: string, providerId?: string, modelId?: string): Set<string> {
  if (providerId) {
    return targetsForProvider(providers, providerId, modelId);
  }
  if (pathname.startsWith('/test/sample/')) {
    return defaultTargetIds(providers);
  }
  if (pathname === '/test/full') {
    return defaultTargetIds(providers);
  }
  return blindTargetIds(providers);
}

export function routeTitle(pathname: string, providers: ProviderInfo[], providerId?: string, modelId?: string): string {
  if (pathname === '/test/full') {
    return 'Full test';
  }
  if (pathname.startsWith('/test/sample/')) {
    return 'Sample comparison';
  }
  if (pathname === '/test/blind') {
    return 'Blind test';
  }

  const provider = providers.find((item) => item.id === providerId);
  if (!provider) {
    return modelId ? 'Model test' : 'Provider test';
  }

  const model = provider.models.find((item) => item.id === modelId);
  return model ? `${provider.name} / ${model.name}` : `${provider.name} test`;
}

export function routeDescription(pathname: string, providerId?: string, modelId?: string): string {
  if (pathname === '/test/full') {
    return 'Runs every available provider, method, and model one by one.';
  }
  if (pathname.startsWith('/test/sample/')) {
    return 'Loads saved sample audio and transcript for provider comparison.';
  }
  if (pathname === '/test/blind') {
    return 'Starts with baseline targets and keeps transcript expectations optional.';
  }
  if (modelId) {
    return 'Targets one model across its available methods. You can still adjust methods before running.';
  }
  if (providerId) {
    return 'Targets every available model and method for this provider. You can still adjust the selection.';
  }
  return 'Configure audio, context, and target methods before running.';
}
