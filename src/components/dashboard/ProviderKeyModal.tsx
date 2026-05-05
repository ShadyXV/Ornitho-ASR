import { Save, X } from 'lucide-react';
import type { EnvKey } from '../../constants/providerKeys';
import type { ProviderInfo } from '../../types';

interface ProviderKeyModalProps {
  provider: ProviderInfo | null;
  sessionKeys: Record<EnvKey, string>;
  onKeyChange: (key: EnvKey, value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function ProviderKeyModal({ provider, sessionKeys, onKeyChange, onClose, onSave }: ProviderKeyModalProps) {
  if (!provider) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{provider.name} keys</h2>
            <p className="mt-1 text-sm text-zinc-600">Session keys stay on the local server and are used until the server restarts.</p>
          </div>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-zinc-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {provider.requiredEnv.map((key) => (
            <label key={key} className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600">{key}</span>
              <input
                value={sessionKeys[key as EnvKey] || ''}
                onChange={(event) => onKeyChange(key as EnvKey, event.target.value)}
                type="password"
                placeholder="Session key"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </label>
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100">Cancel</button>
          <button onClick={onSave} className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            <Save className="h-4 w-4" />
            Save keys
          </button>
        </div>
      </div>
    </div>
  );
}
