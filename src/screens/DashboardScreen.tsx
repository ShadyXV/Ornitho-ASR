import { useEffect, useState } from 'react';
import { BarChart3, Play, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProviderLaunchCard } from '../components/dashboard/ProviderLaunchCard';
import { RecentResults } from '../components/dashboard/RecentResults';
import { envKeys, type EnvKey } from '../constants/providerKeys';
import { dummyRecentRuns } from '../data/dummyRecentRuns';
import { fetchJson } from '../lib/api';
import { providerTargetCount } from '../lib/providerTargets';
import type { ProviderInfo } from '../types';

function emptySessionKeys(): Record<EnvKey, string> {
  return Object.fromEntries(envKeys.map((key) => [key, ''])) as Record<EnvKey, string>;
}

export function DashboardScreen() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [sessionKeys, setSessionKeys] = useState<Record<EnvKey, string>>(emptySessionKeys);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadProviders() {
      const data = await fetchJson<{ providers: ProviderInfo[] }>('/api/providers');
      if (!ignore) {
        setProviders(data.providers);
      }
    }

    void loadProviders().catch((error: unknown) => {
      if (!ignore) {
        setMessage(error instanceof Error ? error.message : 'Could not load providers.');
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  const availableProviders = providers.filter((provider) => provider.available);
  const missingProviders = providers.filter((provider) => !provider.available);
  const totalTargets = availableProviders.reduce((count, provider) => count + providerTargetCount(provider), 0);

  async function saveSessionKeys() {
    const data = await fetchJson<{ providers: ProviderInfo[] }>('/api/session-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: sessionKeys }),
    });
    setProviders(data.providers);
    setMessage('Provider status updated for this server session.');
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Ornitho ASR</p>
            <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
            <span>{availableProviders.length} provider{availableProviders.length === 1 ? '' : 's'} ready</span>
            <span>{totalTargets} test target{totalTargets === 1 ? '' : 's'}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-5 py-6">
        {message && (
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
            {message}
          </div>
        )}

        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Start a test</h2>
              <p className="text-sm text-zinc-600">Run ready providers immediately, or add session keys for unavailable providers.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/test/blind" className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-100">
                <Play className="h-4 w-4" />
                Blind test
              </Link>
              <Link to="/test/full" className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
                <BarChart3 className="h-4 w-4" />
                Full test
              </Link>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {providers.map((provider) => (
              <ProviderLaunchCard
                key={provider.id}
                provider={provider}
                sessionKeys={sessionKeys}
                onKeyChange={(key, value) => setSessionKeys((current) => ({ ...current, [key]: value }))}
              />
            ))}
          </div>

          {missingProviders.length > 0 && (
            <button onClick={() => void saveSessionKeys()} className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
              <Save className="h-4 w-4" />
              Update provider status
            </button>
          )}
        </section>

        <RecentResults runs={dummyRecentRuns} />
      </main>
    </div>
  );
}
