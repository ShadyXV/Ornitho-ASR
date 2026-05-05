import { CheckCircle2, KeyRound, XCircle } from 'lucide-react';
import type { ProviderInfo } from '../../types';

interface ProviderKeysSectionProps {
  providers: ProviderInfo[];
  onConfigureProvider: (provider: ProviderInfo) => void;
}

export function ProviderKeysSection({ providers, onConfigureProvider }: ProviderKeysSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Provider keys</h2>
        <p className="text-sm text-zinc-600">Manage API access for providers without mixing key inputs into the test launcher.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {providers.map((provider) => (
          <article key={provider.id} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{provider.name}</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  {provider.available ? 'Ready' : `Missing ${provider.missingEnv.join(', ')}`}
                </p>
              </div>
              {provider.available ? <CheckCircle2 className="h-5 w-5 text-emerald-700" /> : <XCircle className="h-5 w-5 text-zinc-400" />}
            </div>
            <button onClick={() => onConfigureProvider(provider)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100">
              <KeyRound className="h-4 w-4" />
              {provider.available ? 'Update keys' : 'Add keys'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
