import { CheckCircle2, KeyRound, Save, XCircle } from 'lucide-react';
import { envKeys, type EnvKey } from '../../constants/providerKeys';
import type { ProviderInfo } from '../../types';

interface ProviderSetupProps {
  providers: ProviderInfo[];
  sessionKeys: Record<EnvKey, string>;
  onKeyChange: (key: EnvKey, value: string) => void;
  onSave: () => void;
}

export function ProviderSetup({ providers, sessionKeys, onKeyChange, onSave }: ProviderSetupProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Provider setup</h2>
          <p className="text-sm text-zinc-600">Keys from `.env` are used first. Session keys stay on the local server.</p>
        </div>
        <KeyRound className="h-5 w-5 text-emerald-700" />
      </div>

      <div className="space-y-3">
        {envKeys.map((key) => (
          <label key={key} className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-600">{key}</span>
            <input
              value={sessionKeys[key]}
              onChange={(event) => onKeyChange(key, event.target.value)}
              type="password"
              placeholder="Optional session value"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
            />
          </label>
        ))}
      </div>

      <button onClick={onSave} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800">
        <Save className="h-4 w-4" />
        Update provider status
      </button>

      <div className="mt-4 divide-y divide-zinc-100">
        {providers.map((provider) => (
          <div key={provider.id} className="flex items-start justify-between py-3">
            <div>
              <p className="font-medium">{provider.name}</p>
              <p className="text-xs text-zinc-500">
                {provider.available ? 'Ready' : `Missing ${provider.missingEnv.join(', ')}`}
              </p>
            </div>
            {provider.available ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            ) : (
              <XCircle className="h-5 w-5 text-zinc-400" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
