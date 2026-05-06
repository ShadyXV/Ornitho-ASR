import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { BarChart3, EyeOff, FileAudio, Mic, MoreVertical, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppShell, SectionTitle, ShellCard, StatusDot } from '../components/layout/AppShell';
import { ProviderKeyModal } from '../components/dashboard/ProviderKeyModal';
import { RecentResultsSummary } from '../components/dashboard/RecentResultsSummary';
import audioWaveBanner from '../assets/ornitho/audio-wave-banner.png';
import dashboardSparkles from '../assets/ornitho/dashboard-sparkles.png';
import uploadAsset from '../assets/ornitho/upload.png';
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
  const [samplesMessage, setSamplesMessage] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadProviders() {
      const providerData = await fetchJson<{ providers: ProviderInfo[] }>('/api/providers');
      if (!ignore) {
        setProviders(providerData.providers);
      }
    }

    async function loadSamples() {
      const sampleData = await fetchJson<{ samples: SampleRecord[] }>('/api/samples');
      if (!ignore) {
        setSamples(sampleData.samples);
      }
    }

    void loadProviders().catch((error: unknown) => {
      if (!ignore) {
        setMessage(error instanceof Error ? error.message : 'Could not load providers.');
      }
    });

    void loadSamples().catch(() => {
      if (!ignore) {
        setSamplesMessage('Start the local API server to unlock sample tools.');
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
    <AppShell
      title="Dashboard"
      description="Evaluate and compare ASR providers with confidence."
      providerCount={availableProviders.length}
      targetCount={totalTargets}
      apiStatus={message ? 'paused' : 'active'}
    >
      <div className="space-y-6">
        {message && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            {message}
          </div>
        )}

        <section className="space-y-3">
          <SectionTitle title="Start a new test" description="Three simple steps to powerful insights." />
          <div className="grid gap-4 xl:grid-cols-3">
            <StartActionCard
              icon={<Mic className="h-9 w-9" />}
              tone="coral"
              title="Record Samples"
              description="Capture new audio or upload files to build your library."
              primary={<Link to="/samples/new" className="inline-flex items-center justify-center gap-2 rounded-md bg-[#ff4e4e] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#eb3e3e]"><Mic className="h-4 w-4" /> Record Samples</Link>}
              secondary={<Link to="/samples/new" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"><img src={uploadAsset} alt="" className="h-5 w-5 object-contain" /> Upload Audio</Link>}
            />
            <StartActionCard
              icon={<EyeOff className="h-9 w-9" />}
              tone="blue"
              title="Configure Blind Test"
              description="Hide reference text and sample set to run a fair comparison."
              primary={<Link to="/test/blind" className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700">Configure Blind Test</Link>}
              backgroundImage={dashboardSparkles}
            />
            <StartActionCard
              icon={<BarChart3 className="h-9 w-9" />}
              tone="green"
              title="Run Full Evaluation"
              description="Launch a full evaluation and compare provider performance."
              primary={<Link to="/test/full" className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-700">Run Full Evaluation</Link>}
              backgroundImage={dashboardSparkles}
            />
          </div>
        </section>

        <section className="space-y-3">
          <SectionTitle title="ASR Provider Integrations" description="Manage your provider connections." />
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {providers.map((provider) => (
              <ProviderIntegrationCard key={provider.id} provider={provider} onConfigure={() => setKeyProvider(provider)} />
            ))}
            <button className="grid min-h-[160px] place-items-center rounded-lg border border-dashed border-slate-300 bg-white p-5 text-center hover:border-teal-400 hover:bg-teal-50">
              <span>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-teal-100 text-teal-700">
                  <Plus className="h-7 w-7" />
                </span>
                <span className="mt-4 block font-bold text-teal-700">Add Integration</span>
                <span className="mt-1 block text-sm text-slate-500">Connect another ASR provider</span>
              </span>
            </button>
          </div>
        </section>

        {samplesMessage && (
          <ShellCard className="overflow-hidden border-amber-300 bg-amber-50">
            <div className="grid min-h-28 gap-4 p-4 pb-0 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
              <div className="grid h-16 w-16 self-center place-items-center rounded-lg bg-amber-100 text-amber-700">
                <FileAudio className="h-8 w-8" />
              </div>
              <div className="self-center pb-4 md:pb-0">
                <h3 className="font-bold text-orange-700">Sample library paused</h3>
                <p className="mt-1 text-sm text-slate-700">{samplesMessage}</p>
              </div>
              <div className="flex items-end gap-6 self-end">
                <img src={audioWaveBanner} alt="" className="hidden h-24 w-[520px] object-contain object-bottom md:block" />
                <Link to="/samples/new" className="mb-5 inline-flex items-center justify-center rounded-md bg-teal-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-800">
                  Add your first sample
                </Link>
              </div>
            </div>
          </ShellCard>
        )}

        {!samplesMessage && samples.length > 0 && (
          <ShellCard className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold">Sample library ready</h3>
                <p className="text-sm text-slate-600">{samples.length} saved sample{samples.length === 1 ? '' : 's'} available for comparison tests.</p>
              </div>
              <Link to="/samples/new" className="rounded-md bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800">Add sample</Link>
            </div>
          </ShellCard>
        )}

        <RecentResultsSummary runs={dummyRecentRuns} />
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

function StartActionCard({
  icon,
  tone,
  title,
  description,
  primary,
  secondary,
  backgroundImage,
}: {
  icon: ReactNode;
  tone: 'coral' | 'blue' | 'green';
  title: string;
  description: string;
  primary: ReactNode;
  secondary?: ReactNode;
  backgroundImage?: string;
}) {
  const tones = {
    coral: 'bg-red-50 text-red-500',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-teal-50 text-teal-700',
  };

  return (
    <ShellCard className="relative overflow-hidden p-4">
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt=""
          className="pointer-events-none absolute right-0 top-1/2 z-0 h-[70%] w-1/2 -translate-y-1/2 object-contain object-right opacity-45"
        />
      )}
      <div className="relative z-10 flex gap-4">
        <div className={`grid h-18 w-18 shrink-0 place-items-center rounded-full ${tones[tone]}`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-950">{title}</h3>
          <p className="mt-2 min-h-11 text-sm leading-6 text-slate-600">{description}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {primary}
            {secondary}
          </div>
        </div>
      </div>
    </ShellCard>
  );
}

function ProviderIntegrationCard({ provider, onConfigure }: { provider: ProviderInfo; onConfigure: () => void }) {
  const isGoogle = provider.id.includes('google');

  return (
    <ShellCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          <ProviderLogo id={provider.id} name={provider.name} />
          <h3 className="truncate font-bold text-slate-950">{provider.name}</h3>
        </div>
        <MoreVertical className="h-5 w-5 text-slate-500" />
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
        <StatusDot active={provider.available} />
        {provider.available ? `${providerTargetCount(provider)} targets ready` : `Missing ${isGoogle ? 'JSON credentials' : 'API key'}`}
      </div>
      <button onClick={onConfigure} className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-teal-700 px-3 py-3 text-sm font-bold text-teal-700 hover:bg-teal-50">
        {provider.available ? 'Update Credentials' : isGoogle ? 'Upload Credentials' : 'Configure Key'}
      </button>
    </ShellCard>
  );
}

function ProviderLogo({ id, name }: { id: string; name: string }) {
  const initial = name.slice(0, 1).toUpperCase();
  const color = id.includes('openai') ? 'bg-slate-950 text-white' : id.includes('deepgram') ? 'bg-red-500 text-white' : 'bg-white text-blue-600 border border-slate-200';
  return <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg text-2xl font-black ${color}`}>{initial}</span>;
}
