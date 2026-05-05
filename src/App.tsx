import { useMemo, useState, useEffect } from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Circle,
  Download,
  FileAudio,
  KeyRound,
  Mic,
  RefreshCw,
  Save,
  Square,
  Upload,
  XCircle,
} from 'lucide-react';
import { useVoiceRecorder } from './hooks/useVoiceRecorder';
import type { ProviderInfo, ResultRecord, RunRecord, RunTarget } from './types';

const envKeys = ['OPENAI_API_KEY', 'DEEPGRAM_API_KEY', 'GOOGLE_APPLICATION_CREDENTIALS'] as const;

type EnvKey = typeof envKeys[number];

function targetKey(target: RunTarget): string {
  return `${target.providerId}:${target.modelId}:${target.methodId}`;
}

function defaultTargetIds(providers: ProviderInfo[]): Set<string> {
  const ids = providers
    .filter((provider) => provider.available)
    .flatMap((provider) => provider.methods.flatMap((method) => method.models.map((modelId) => targetKey({
      providerId: provider.id,
      modelId,
      methodId: method.id,
    }))));

  return new Set(ids);
}

function formatPercent(value: number | null): string {
  return value === null ? '-' : `${Math.round(value * 100)}%`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function toCsv(runs: RunRecord[]): string {
  const rows = runs.flatMap((run) => (run.results || []).map((result) => [
    run.id,
    run.mode,
    formatDate(run.createdAt),
    result.providerName,
    result.modelId,
    result.methodName,
    result.status,
    result.latencyMs,
    result.scores?.wordErrorRate ?? '',
    result.scores?.birdRecall ?? '',
    result.scores?.birdPrecision ?? '',
    result.matchedBirds.join('; '),
    result.missedBirds.join('; '),
    result.falsePositiveBirds.join('; '),
    result.manualGrade ?? '',
    result.manualNotes,
    result.transcript,
    result.error,
  ]));

  const header = [
    'run_id',
    'mode',
    'created_at',
    'provider',
    'model',
    'method',
    'status',
    'latency_ms',
    'wer',
    'bird_recall',
    'bird_precision',
    'matched_birds',
    'missed_birds',
    'false_positive_birds',
    'manual_grade',
    'manual_notes',
    'transcript',
    'error',
  ];

  return [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

function exportFile(name: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function App() {
  const recorder = useVoiceRecorder();
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [activeRun, setActiveRun] = useState<RunRecord | null>(null);
  const [selectedTargetIds, setSelectedTargetIds] = useState<Set<string>>(new Set());
  const [sessionKeys, setSessionKeys] = useState<Record<EnvKey, string>>({
    OPENAI_API_KEY: '',
    DEEPGRAM_API_KEY: '',
    GOOGLE_APPLICATION_CREDENTIALS: '',
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [expectedTranscript, setExpectedTranscript] = useState('');
  const [birdTerms, setBirdTerms] = useState('');
  const [previousTranscript, setPreviousTranscript] = useState('');
  const [mode, setMode] = useState('blind');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      const [providerResponse, runsResponse] = await Promise.all([
        fetch('/api/providers'),
        fetch('/api/runs'),
      ]);
      const providerData = await providerResponse.json() as { providers: ProviderInfo[] };
      const runsData = await runsResponse.json() as { runs: RunRecord[] };

      if (!ignore) {
        setProviders(providerData.providers);
        setSelectedTargetIds(defaultTargetIds(providerData.providers));
        setRuns(runsData.runs);
        setActiveRun(runsData.runs[0] || null);
      }
    }

    void loadInitialData().catch((error: unknown) => {
      if (!ignore) {
        setMessage(error instanceof Error ? error.message : 'Could not load benchmark data.');
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  const selectedTargets = useMemo<RunTarget[]>(() => providers
    .filter((provider) => provider.available)
    .flatMap((provider) => provider.methods.flatMap((method) => method.models.map((modelId) => ({
      providerId: provider.id,
      modelId,
      methodId: method.id,
    }))))
    .filter((target) => selectedTargetIds.has(targetKey(target))), [providers, selectedTargetIds]);

  const availableCount = providers.filter((provider) => provider.available).length;
  const audioSource = uploadedFile || recorder.audioBlob;

  async function refreshRuns() {
    const response = await fetch('/api/runs');
    const data = await response.json() as { runs: RunRecord[] };
    setRuns(data.runs);
    setActiveRun(data.runs[0] || null);
  }

  async function saveSessionKeys() {
    const response = await fetch('/api/session-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: sessionKeys }),
    });
    const data = await response.json() as { providers: ProviderInfo[] };
    setProviders(data.providers);
    setSelectedTargetIds(defaultTargetIds(data.providers));
    setMessage('Provider status updated for this server session.');
  }

  async function runBenchmark() {
    if (!audioSource) {
      setMessage('Record or upload audio first.');
      return;
    }

    if (selectedTargets.length === 0) {
      setMessage('Select at least one available provider method.');
      return;
    }

    setIsRunning(true);
    setMessage('');

    const formData = new FormData();
    formData.append('audio', audioSource, uploadedFile?.name || 'recording.webm');
    formData.append('selectedTargets', JSON.stringify(selectedTargets));
    formData.append('expectedTranscript', expectedTranscript);
    formData.append('birdTerms', birdTerms);
    formData.append('previousTranscript', previousTranscript);
    formData.append('mode', mode);
    formData.append('notes', notes);
    formData.append('tags', tags);

    try {
      const response = await fetch('/api/runs', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json() as { run?: RunRecord; error?: string };
      if (!response.ok || !data.run) {
        throw new Error(data.error || 'Benchmark run failed.');
      }

      setActiveRun(data.run);
      await refreshRuns();
      setMessage('Benchmark run completed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Benchmark run failed.');
    } finally {
      setIsRunning(false);
    }
  }

  function toggleTarget(target: RunTarget) {
    const key = targetKey(target);
    setSelectedTargetIds((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function exportJson() {
    exportFile('ornitho-asr-runs.json', JSON.stringify(runs, null, 2), 'application/json');
  }

  function exportCsv() {
    exportFile('ornitho-asr-runs.csv', toCsv(runs), 'text/csv');
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Ornitho ASR</p>
            <h1 className="text-2xl font-semibold tracking-normal">Bird-name transcription benchmark</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-600">
            <span>{availableCount} provider{availableCount === 1 ? '' : 's'} available</span>
            <button onClick={exportJson} className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 hover:bg-zinc-100">
              <Download className="h-4 w-4" />
              JSON
            </button>
            <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 hover:bg-zinc-100">
              <Download className="h-4 w-4" />
              CSV
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-5 py-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="space-y-5">
          <ProviderSetup
            providers={providers}
            sessionKeys={sessionKeys}
            onKeyChange={(key, value) => setSessionKeys((current) => ({ ...current, [key]: value }))}
            onSave={saveSessionKeys}
          />

          <RunComposer
            providers={providers}
            recorder={recorder}
            uploadedFile={uploadedFile}
            onFileChange={setUploadedFile}
            expectedTranscript={expectedTranscript}
            onExpectedTranscriptChange={setExpectedTranscript}
            birdTerms={birdTerms}
            onBirdTermsChange={setBirdTerms}
            previousTranscript={previousTranscript}
            onPreviousTranscriptChange={setPreviousTranscript}
            mode={mode}
            onModeChange={setMode}
            notes={notes}
            onNotesChange={setNotes}
            tags={tags}
            onTagsChange={setTags}
            selectedTargetIds={selectedTargetIds}
            onToggleTarget={toggleTarget}
            onSelectAll={() => setSelectedTargetIds(defaultTargetIds(providers))}
            onClearTargets={() => setSelectedTargetIds(new Set())}
            onRun={runBenchmark}
            isRunning={isRunning}
          />
        </section>

        <section className="space-y-5">
          {message && (
            <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
              {message}
            </div>
          )}

          <ResultsPanel
            activeRun={activeRun}
            runs={runs}
            onSelectRun={setActiveRun}
            onRefresh={refreshRuns}
            onResultUpdated={(result) => {
              setActiveRun((current) => current ? {
                ...current,
                results: (current.results || []).map((item) => item.id === result.id ? result : item),
              } : current);
              setRuns((current) => current.map((run) => ({
                ...run,
                results: (run.results || []).map((item) => item.id === result.id ? result : item),
              })));
            }}
          />
        </section>
      </main>
    </div>
  );
}

interface ProviderSetupProps {
  providers: ProviderInfo[];
  sessionKeys: Record<EnvKey, string>;
  onKeyChange: (key: EnvKey, value: string) => void;
  onSave: () => void;
}

function ProviderSetup({ providers, sessionKeys, onKeyChange, onSave }: ProviderSetupProps) {
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

interface RunComposerProps {
  providers: ProviderInfo[];
  recorder: ReturnType<typeof useVoiceRecorder>;
  uploadedFile: File | null;
  onFileChange: (file: File | null) => void;
  expectedTranscript: string;
  onExpectedTranscriptChange: (value: string) => void;
  birdTerms: string;
  onBirdTermsChange: (value: string) => void;
  previousTranscript: string;
  onPreviousTranscriptChange: (value: string) => void;
  mode: string;
  onModeChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  tags: string;
  onTagsChange: (value: string) => void;
  selectedTargetIds: Set<string>;
  onToggleTarget: (target: RunTarget) => void;
  onSelectAll: () => void;
  onClearTargets: () => void;
  onRun: () => void;
  isRunning: boolean;
}

function RunComposer(props: RunComposerProps) {
  const hasAudio = Boolean(props.uploadedFile || props.recorder.audioBlob);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">New benchmark run</h2>
          <p className="text-sm text-zinc-600">One recording can run against many provider methods.</p>
        </div>
        <BarChart3 className="h-5 w-5 text-emerald-700" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={props.recorder.isRecording ? props.recorder.stopRecording : props.recorder.startRecording}
          disabled={props.isRunning}
          className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-3 text-sm font-medium text-white ${props.recorder.isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-900 hover:bg-zinc-800'}`}
        >
          {props.recorder.isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {props.recorder.isRecording ? 'Stop recording' : 'Record audio'}
        </button>
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 py-3 text-sm font-medium hover:bg-zinc-100">
          <Upload className="h-4 w-4" />
          Upload audio
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(event) => props.onFileChange(event.target.files?.[0] || null)}
          />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
        <FileAudio className="h-4 w-4" />
        {props.uploadedFile?.name || (props.recorder.audioBlob ? 'Recorded audio ready' : 'No audio selected')}
      </div>
      {props.recorder.error && <p className="mt-2 text-sm text-red-700">{props.recorder.error}</p>}

      <div className="mt-5 grid gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Test mode</span>
          <select value={props.mode} onChange={(event) => props.onModeChange(event.target.value)} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm">
            <option value="blind">Blind</option>
            <option value="prompted">Prompted/context</option>
            <option value="adaptation">Provider adaptation</option>
            <option value="regression">Regression</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Expected bird terms</span>
          <textarea value={props.birdTerms} onChange={(event) => props.onBirdTermsChange(event.target.value)} rows={3} placeholder="Snow Partridge, Himalayan Monal" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Expected transcript</span>
          <textarea value={props.expectedTranscript} onChange={(event) => props.onExpectedTranscriptChange(event.target.value)} rows={3} placeholder="Optional text for automatic WER scoring" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Previous transcript context</span>
          <textarea value={props.previousTranscript} onChange={(event) => props.onPreviousTranscriptChange(event.target.value)} rows={2} placeholder="Optional context for previous-segment prompt methods" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Notes</span>
            <input value={props.notes} onChange={(event) => props.onNotesChange(event.target.value)} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Tags</span>
            <input value={props.tags} onChange={(event) => props.onTagsChange(event.target.value)} placeholder="noise, rare-name" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
          </label>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Methods</h3>
          <div className="flex gap-2">
            <button onClick={props.onSelectAll} className="text-xs font-medium text-emerald-700 hover:text-emerald-900">Select all</button>
            <button onClick={props.onClearTargets} className="text-xs font-medium text-zinc-600 hover:text-zinc-900">Clear</button>
          </div>
        </div>
        <div className="max-h-72 space-y-3 overflow-auto rounded-md border border-zinc-200 p-3">
          {props.providers.filter((provider) => provider.available).map((provider) => (
            <div key={provider.id}>
              <p className="mb-2 text-sm font-medium">{provider.name}</p>
              <div className="space-y-2">
                {provider.methods.flatMap((method) => method.models.map((modelId) => {
                  const target = { providerId: provider.id, modelId, methodId: method.id };
                  const checked = props.selectedTargetIds.has(targetKey(target));
                  return (
                    <button key={targetKey(target)} onClick={() => props.onToggleTarget(target)} className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-zinc-100">
                      {checked ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" /> : <Circle className="mt-0.5 h-4 w-4 text-zinc-400" />}
                      <span>
                        <span className="block font-medium">{method.name} / {modelId}</span>
                        <span className="block text-xs text-zinc-500">{method.description}</span>
                      </span>
                    </button>
                  );
                }))}
              </div>
            </div>
          ))}
          {props.providers.every((provider) => !provider.available) && (
            <p className="text-sm text-zinc-500">Add at least one provider key to run tests.</p>
          )}
        </div>
      </div>

      <button
        onClick={props.onRun}
        disabled={props.isRunning || !hasAudio}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-3 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {props.isRunning ? <Activity className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
        Run benchmark
      </button>
    </div>
  );
}

interface ResultsPanelProps {
  activeRun: RunRecord | null;
  runs: RunRecord[];
  onSelectRun: (run: RunRecord) => void;
  onRefresh: () => void;
  onResultUpdated: (result: ResultRecord) => void;
}

function ResultsPanel({ activeRun, runs, onSelectRun, onRefresh, onResultUpdated }: ResultsPanelProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-zinc-200 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Results</h2>
          <p className="text-sm text-zinc-600">Compare transcripts, scores, and manual grades.</p>
        </div>
        <button onClick={() => void onRefresh()} className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid border-b border-zinc-200 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="max-h-96 overflow-auto border-b border-zinc-200 md:border-b-0 md:border-r">
          {runs.map((run) => (
            <button key={run.id} onClick={() => onSelectRun(run)} className={`block w-full px-4 py-3 text-left text-sm hover:bg-zinc-100 ${activeRun?.id === run.id ? 'bg-emerald-50' : ''}`}>
              <span className="block font-medium">{run.mode}</span>
              <span className="block text-xs text-zinc-500">{formatDate(run.createdAt)}</span>
              <span className="block text-xs text-zinc-500">{run.results?.length || 0} results</span>
            </button>
          ))}
          {runs.length === 0 && <p className="p-4 text-sm text-zinc-500">No runs yet.</p>}
        </aside>

        <div className="p-5">
          {activeRun ? (
            <div className="space-y-4">
              <RunSummary run={activeRun} />
              <div className="space-y-3">
                {(activeRun.results || []).map((result) => (
                  <ResultRow key={result.id} result={result} onUpdated={onResultUpdated} />
                ))}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-zinc-500">Run a benchmark to see results.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function RunSummary({ run }: { run: RunRecord }) {
  const results = run.results || [];
  const completed = results.filter((result) => result.status === 'completed').length;
  const errors = results.filter((result) => result.status === 'error').length;
  const reviewed = results.filter((result) => result.manualGrade !== null).length;

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Metric label="Completed" value={completed} />
      <Metric label="Errors" value={errors} />
      <Metric label="Reviewed" value={reviewed} />
      <Metric label="Expected birds" value={run.testCase?.birdTerms.length || 0} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-zinc-200 px-4 py-3">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ResultRow({ result, onUpdated }: { result: ResultRecord; onUpdated: (result: ResultRecord) => void }) {
  const [manualGrade, setManualGrade] = useState(result.manualGrade?.toString() || '');
  const [manualNotes, setManualNotes] = useState(result.manualNotes);
  const [acceptedTranscript, setAcceptedTranscript] = useState(result.acceptedTranscript);

  async function saveGrade() {
    const response = await fetch(`/api/results/${result.id}/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        manualGrade: manualGrade ? Number(manualGrade) : null,
        manualNotes,
        acceptedTranscript,
      }),
    });
    const data = await response.json() as { result?: ResultRecord; error?: string };
    if (!response.ok || !data.result) {
      throw new Error(data.error || 'Could not save grade.');
    }
    onUpdated(data.result);
  }

  return (
    <article className="rounded-md border border-zinc-200 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{result.providerName}</span>
            <span className="rounded bg-zinc-100 px-2 py-1 text-xs">{result.modelId}</span>
            <span className="rounded bg-zinc-100 px-2 py-1 text-xs">{result.methodName}</span>
            <span className={`rounded px-2 py-1 text-xs ${result.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : result.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-zinc-100 text-zinc-700'}`}>{result.status}</span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">{result.latencyMs}ms</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <Score label="WER" value={formatPercent(result.scores?.wordErrorRate ?? null)} />
          <Score label="Recall" value={formatPercent(result.scores?.birdRecall ?? null)} />
          <Score label="Precision" value={formatPercent(result.scores?.birdPrecision ?? null)} />
        </div>
      </div>

      {result.error ? (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{result.error}</p>
      ) : (
        <p className="mt-3 whitespace-pre-wrap rounded-md bg-zinc-50 px-3 py-3 text-sm leading-6">{result.transcript || 'No speech detected.'}</p>
      )}

      <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
        <BirdList label="Matched" birds={result.matchedBirds} />
        <BirdList label="Missed" birds={result.missedBirds} />
        <BirdList label="False positives" birds={result.falsePositiveBirds} />
      </div>

      <div className="mt-4 grid gap-3 border-t border-zinc-100 pt-4 md:grid-cols-[120px_1fr_1fr_auto]">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Grade</span>
          <select value={manualGrade} onChange={(event) => setManualGrade(event.target.value)} className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm">
            <option value="">None</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Notes</span>
          <input value={manualNotes} onChange={(event) => setManualNotes(event.target.value)} className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Accepted transcript</span>
          <input value={acceptedTranscript} onChange={(event) => setAcceptedTranscript(event.target.value)} className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm" />
        </label>
        <button onClick={() => void saveGrade()} className="self-end rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          Save
        </button>
      </div>
    </article>
  );
}

function Score({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 px-3 py-2">
      <p className="text-zinc-500">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function BirdList({ label, birds }: { label: string; birds: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-zinc-800">{birds.length > 0 ? birds.join(', ') : '-'}</p>
    </div>
  );
}

export default App;
