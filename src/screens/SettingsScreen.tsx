import { useEffect, useState } from 'react';
import { KeyRound, Server, Settings } from 'lucide-react';
import { AppShell, SectionTitle, ShellCard } from '../components/layout/AppShell';
import { ProviderKeyModal } from '../components/dashboard/ProviderKeyModal';
import { envKeys, type EnvKey } from '../constants/providerKeys';
import { fetchJson } from '../lib/api';
import { providerTargetCount } from '../lib/providerTargets';
import type { ProviderInfo } from '../types';

function emptySessionKeys(): Record<EnvKey, string> {
  return Object.fromEntries(envKeys.map((key) => [key, ''])) as Record<EnvKey, string>;
}

export function SettingsScreen() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [sessionKeys, setSessionKeys] = useState<Record<EnvKey, string>>(emptySessionKeys);
  const [keyProvider, setKeyProvider] = useState<ProviderInfo | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let ignore = false;
    void fetchJson<{ providers: ProviderInfo[] }>('/api/providers')
      .then((data) => {
        if (!ignore) {
          setProviders(data.providers);
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setMessage(error instanceof Error ? error.message : 'Could not load providers.');
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const ready = providers.filter((provider) => provider.available);
  const targetCount = ready.reduce((count, provider) => count + providerTargetCount(provider), 0);

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
    <AppShell title="System Settings" description="Manage local API status and provider credentials." providerCount={ready.length} targetCount={targetCount} apiStatus={message ? 'paused' : 'active'}>
      <div className="space-y-6">
        {message && <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">{message}</div>}
        <SectionTitle title="Local Server" description="Runtime state for the local benchmark API." />
        <div className="grid gap-4 lg:grid-cols-2">
          <ShellCard className="p-5">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                <Server className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-bold">API Server</h2>
                <p className="mt-1 text-sm text-slate-600">{message ? 'Connection needs attention.' : 'Local API is responding.'}</p>
              </div>
            </div>
          </ShellCard>
          <ShellCard className="p-5">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-violet-50 text-violet-700">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-bold">Session Credentials</h2>
                <p className="mt-1 text-sm text-slate-600">Keys are stored only on the local server session.</p>
              </div>
            </div>
          </ShellCard>
        </div>

        <SectionTitle title="Provider Keys" description="Configure missing providers from the same modal used on the dashboard." />
        <div className="grid gap-4 xl:grid-cols-3">
          {providers.map((provider) => (
            <ShellCard key={provider.id} className="p-5">
              <h2 className="font-bold">{provider.name}</h2>
              <p className="mt-1 text-sm text-slate-600">{provider.available ? 'Ready' : `Missing ${provider.missingEnv.join(', ')}`}</p>
              <button onClick={() => setKeyProvider(provider)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-teal-700 px-4 py-3 text-sm font-bold text-teal-700 hover:bg-teal-50">
                <KeyRound className="h-4 w-4" />
                {provider.available ? 'Update Credentials' : 'Configure Key'}
              </button>
            </ShellCard>
          ))}
        </div>
      </div>

      <ProviderKeyModal
        provider={keyProvider}
        sessionKeys={sessionKeys}
        onKeyChange={(key, value) => setSessionKeys((current) => ({ ...current, [key]: value }))}
        onClose={() => setKeyProvider(null)}
        onSave={() => void saveSessionKeys()}
      />
    </AppShell>
  );
}
