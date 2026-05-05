import { useEffect, useState } from 'react';
import { BarChart3, FileAudio, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProviderKeyModal } from '../components/dashboard/ProviderKeyModal';
import { ProviderKeysSection } from '../components/dashboard/ProviderKeysSection';
import { ProviderLaunchCard } from '../components/dashboard/ProviderLaunchCard';
import { RecentResults } from '../components/dashboard/RecentResults';
import { SampleList } from '../components/samples/SampleList';
import { envKeys, type EnvKey } from '../constants/providerKeys';
import { dummyRecentRuns } from '../data/dummyRecentRuns';
import { fetchJson } from '../lib/api';
import { providerTargetCount } from '../lib/providerTargets';
import type { ProviderInfo, SampleRecord } from '../types';

function emptySessionKeys(): Record<EnvKey, string> {
  return Object.fromEntries(envKeys.map((key) => [key, ''])) as Record<EnvKey, string>;
}

export function DashboardScreen() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [samples, setSamples] = useState<SampleRecord[]>([]);
  const [sessionKeys, setSessionKeys] = useState<Record<EnvKey, string>>(emptySessionKeys);
  const [keyProvider, setKeyProvider] = useState<ProviderInfo | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      const [providerData, sampleData] = await Promise.all([
        fetchJson<{ providers: ProviderInfo[] }>('/api/providers'),
        fetchJson<{ samples: SampleRecord[] }>('/api/samples'),
      ]);
      if (!ignore) {
        setProviders(providerData.providers);
        setSamples(sampleData.samples);
      }
    }

    void loadDashboard().catch((error: unknown) => {
      if (!ignore) {
        setMessage(error instanceof Error ? error.message : 'Could not load providers.');
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  const availableProviders = providers.filter((provider) => provider.available);
  const totalTargets = availableProviders.reduce((count, provider) => count + providerTargetCount(provider), 0);

  async function saveSessionKeys() {
    const data = await fetchJson<{ providers: ProviderInfo[] }>('/api/session-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: sessionKeys }),
    });
    setProviders(data.providers);
    setKeyProvider(null);
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

        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Start a test</h2>
              <p className="text-sm text-zinc-600">Launch a benchmark directly, or start from a saved sample below.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/samples/new" className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800">
                <FileAudio className="h-4 w-4" />
                Record a sample
              </Link>
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

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {providers.map((provider) => (
              <ProviderLaunchCard
                key={provider.id}
                provider={provider}
                onConfigureKeys={setKeyProvider}
              />
            ))}
          </div>
        </section>

        <ProviderKeysSection providers={providers} onConfigureProvider={setKeyProvider} />
        <SampleList samples={samples} />
        <RecentResults runs={dummyRecentRuns} />
      </main>

      <ProviderKeyModal
        provider={keyProvider}
        sessionKeys={sessionKeys}
        onKeyChange={(key, value) => setSessionKeys((current) => ({ ...current, [key]: value }))}
        onClose={() => setKeyProvider(null)}
        onSave={() => void saveSessionKeys()}
      />
    </div>
  );
}
