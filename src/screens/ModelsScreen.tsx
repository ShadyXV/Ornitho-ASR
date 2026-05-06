import { useEffect, useState } from 'react';
import { Bot, CheckCircle2, Cpu, XCircle } from 'lucide-react';
import { AppShell, SectionTitle, ShellCard } from '../components/layout/AppShell';
import { fetchJson } from '../lib/api';
import { providerTargetCount } from '../lib/providerTargets';
import type { ProviderInfo } from '../types';

export function ModelsScreen() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
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

  return (
    <AppShell title="Models" description="Review provider models and available benchmark methods." providerCount={ready.length} targetCount={targetCount} apiStatus={message ? 'paused' : 'active'}>
      <div className="space-y-6">
        {message && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">{message}</div>}
        <SectionTitle title="Provider Models" description="Availability is based on the current local server session." />
        <div className="grid gap-4 xl:grid-cols-3">
          {providers.map((provider) => (
            <ShellCard key={provider.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-teal-50 text-teal-700">
                    <Bot className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-bold">{provider.name}</h2>
                    <p className="text-sm text-slate-500">{provider.models.length} models, {providerTargetCount(provider)} targets</p>
                  </div>
                </div>
                {provider.available ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-amber-500" />}
              </div>
              <div className="mt-4 space-y-2">
                {provider.models.map((model) => (
                  <div key={model.id} className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm">
                    <Cpu className="h-4 w-4 text-slate-500" />
                    <span className="font-medium">{model.name}</span>
                  </div>
                ))}
              </div>
            </ShellCard>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
