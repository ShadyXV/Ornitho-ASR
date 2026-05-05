import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { ProviderSetup } from '../components/test/ProviderSetup';
import { ResultsPanel } from '../components/test/ResultsPanel';
import { RunComposer } from '../components/test/RunComposer';
import { TestHeader } from '../components/test/TestHeader';
import type { EnvKey } from '../constants/providerKeys';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { fetchJson } from '../lib/api';
import { exportFile, runsToCsv } from '../lib/runExports';
import { routeDescription, routeMode, routeTargetIds, routeTitle } from '../lib/testRoutes';
import { defaultTargetIds, selectedTargets as getSelectedTargets, targetKey } from '../lib/runTargets';
import type { ProviderInfo, ResultRecord, RunRecord, RunTarget } from '../types';

export function TestScreen() {
  const { providerId, modelId } = useParams();
  const location = useLocation();
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
  const [mode, setMode] = useState(routeMode(location.pathname, providerId));
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      const [providerData, runsData] = await Promise.all([
        fetchJson<{ providers: ProviderInfo[] }>('/api/providers'),
        fetchJson<{ runs: RunRecord[] }>('/api/runs'),
      ]);

      if (!ignore) {
        setProviders(providerData.providers);
        setSelectedTargetIds(routeTargetIds(providerData.providers, location.pathname, providerId, modelId));
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
  }, [location.pathname, modelId, providerId]);

  useEffect(() => {
    setMode(routeMode(location.pathname, providerId));
    if (providers.length > 0) {
      setSelectedTargetIds(routeTargetIds(providers, location.pathname, providerId, modelId));
    }
  }, [location.pathname, modelId, providerId, providers]);

  const selectedTargets = useMemo<RunTarget[]>(
    () => getSelectedTargets(providers, selectedTargetIds),
    [providers, selectedTargetIds],
  );
  const availableCount = providers.filter((provider) => provider.available).length;
  const audioSource = uploadedFile || recorder.audioBlob;
  const testTitle = routeTitle(location.pathname, providers, providerId, modelId);
  const testDescription = routeDescription(location.pathname, providerId, modelId);

  async function refreshRuns() {
    const data = await fetchJson<{ runs: RunRecord[] }>('/api/runs');
    setRuns(data.runs);
    setActiveRun(data.runs[0] || null);
  }

  async function saveSessionKeys() {
    const data = await fetchJson<{ providers: ProviderInfo[] }>('/api/session-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: sessionKeys }),
    });
    setProviders(data.providers);
    setSelectedTargetIds(routeTargetIds(data.providers, location.pathname, providerId, modelId));
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
      const data = await fetchJson<{ run: RunRecord }>('/api/runs', {
        method: 'POST',
        body: formData,
      });

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

  function updateResult(result: ResultRecord) {
    setActiveRun((current) => current ? {
      ...current,
      results: (current.results || []).map((item) => item.id === result.id ? result : item),
    } : current);
    setRuns((current) => current.map((run) => ({
      ...run,
      results: (run.results || []).map((item) => item.id === result.id ? result : item),
    })));
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <TestHeader
        title={testTitle}
        description={testDescription}
        availableProviderCount={availableCount}
        onExportJson={() => exportFile('ornitho-asr-runs.json', JSON.stringify(runs, null, 2), 'application/json')}
        onExportCsv={() => exportFile('ornitho-asr-runs.csv', runsToCsv(runs), 'text/csv')}
      />

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
            routeTitle={testTitle}
            routeDescription={testDescription}
            selectedTargetCount={selectedTargets.length}
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
            onResultUpdated={updateResult}
          />
        </section>
      </main>
    </div>
  );
}
