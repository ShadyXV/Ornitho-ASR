import { ArrowRight, CheckCircle2, KeyRound, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { providerTargetCount } from '../../lib/providerTargets';
import type { ProviderInfo } from '../../types';

interface ProviderLaunchCardProps {
  provider: ProviderInfo;
  onConfigureKeys: (provider: ProviderInfo) => void;
}

export function ProviderLaunchCard({ provider, onConfigureKeys }: ProviderLaunchCardProps) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{provider.name}</h3>
          <p className="text-sm text-zinc-600">
            {provider.available ? `${providerTargetCount(provider)} available targets` : `Missing ${provider.missingEnv.join(', ')}`}
          </p>
        </div>
        {provider.available ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-700" />
        ) : (
          <XCircle className="h-5 w-5 text-zinc-400" />
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {provider.available ? (
          <Link to={`/test/provider/${provider.id}`} className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            Start provider test
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <button onClick={() => onConfigureKeys(provider)} className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100">
            <KeyRound className="h-4 w-4" />
            Add keys
          </button>
        )}
      </div>

      {provider.available && (
        <div className="mt-4 space-y-2">
          {provider.models.slice(0, 3).map((model) => (
            <Link key={model.id} to={`/test/provider/${provider.id}/model/${model.id}`} className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-100">
              <span>{model.name}</span>
              <ArrowRight className="h-4 w-4 text-zinc-500" />
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
