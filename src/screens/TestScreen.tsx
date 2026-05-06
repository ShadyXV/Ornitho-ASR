import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useLocation, useParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ResultsPanel } from '../components/test/ResultsPanel';
import { RunComposer } from '../components/test/RunComposer';
import { dummySamples } from '../data/dummySamples';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { fetchJson } from '../lib/api';
import { exportFile, runsToCsv } from '../lib/runExports';
import { routeDescription, routeMode, routeTargetIds, routeTitle } from '../lib/testRoutes';
import { defaultTargetIds, selectedTargets as getSelectedTargets, targetKey } from '../lib/runTargets';
import { sampleBirdTermsText, sampleTagsText } from '../lib/samples';
import type { ProviderInfo, ResultRecord, RunRecord, RunTarget, SampleRecord } from '../types';

interface TestLocationState {
  sample?: SampleRecord;
}

export function TestScreen() {
  const { providerId, modelId, sampleId } = useParams();
  const location = useLocation();
  const recorder = useVoiceRecorder();
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [activeRun, setActiveRun] = useState<RunRecord | null>(null);
  const [selectedTargetIds, setSelectedTargetIds] = useState<Set<string>>(new Set());
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [expectedTranscript, setExpectedTranscript] = useState('');
  const [birdTerms, setBirdTerms] = useState('');
  const [previousTranscript, setPreviousTranscript] = useState('');
  const [mode, setMode] = useState(routeMode(location.pathname, providerId));
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState('');
  const [sample, setSample] = useState<SampleRecord | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      const routedSample = sampleFromLocationState(location.state) || dummySamples.find((item) => item.id === sampleId) || null;
      const [providerData, runsData, sampleData] = await Promise.all([
        fetchJson<{ providers: ProviderInfo[] }>('/api/providers'),
        fetchJson<{ runs: RunRecord[] }>('/api/runs'),
        sampleId && !routedSample ? fetchJson<{ sample: SampleRecord }>(`/api/samples/${sampleId}`).catch(() => null) : Promise.resolve(routedSample ? { sample: routedSample } : null),
      ]);

      if (!ignore) {
        setProviders(providerData.providers);
        setSelectedTargetIds(routeTargetIds(providerData.providers, location.pathname, providerId, modelId));
        setRuns(runsData.runs);
        setActiveRun(runsData.runs[0] || null);
        if (sampleData?.sample) {
          setSample(sampleData.sample);
          setExpectedTranscript(sampleData.sample.transcript);
          setBirdTerms(sampleBirdTermsText(sampleData.sample));
          setNotes(sampleData.sample.notes);
          setTags(sampleTagsText(sampleData.sample));
        } else {
          setSample(null);
          setExpectedTranscript('');
          setBirdTerms('');
          setNotes('');
          setTags('');
        }
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
  }, [location.pathname, location.state, modelId, providerId, sampleId]);

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

  async function runBenchmark() {
    const generatedSampleAudio = sample ? audioBlobForSample(sample) : null;
    const benchmarkAudio = audioSource || generatedSampleAudio;

    if (!benchmarkAudio && !sample) {
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
    if (benchmarkAudio) {
      formData.append('audio', benchmarkAudio, uploadedFile?.name || `${sample?.id || 'recording'}.wav`);
    }
    if (sample) {
      formData.append('sampleId', sample.id);
    }
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
    <AppShell
        title={testTitle}
        description={testDescription}
        providerCount={availableCount}
        targetCount={selectedTargets.length}
        apiStatus={message ? 'paused' : 'active'}
        actions={(
          <>
            <button onClick={() => exportFile('ornitho-asr-runs.json', JSON.stringify(runs, null, 2), 'application/json')} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold hover:bg-slate-50">
              <Download className="h-4 w-4" />
              JSON
            </button>
            <button onClick={() => exportFile('ornitho-asr-runs.csv', runsToCsv(runs), 'text/csv')} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold hover:bg-slate-50">
              <Download className="h-4 w-4" />
              CSV
            </button>
          </>
        )}
      >

      <div className="grid min-h-[calc(100vh-7.5rem)] items-start gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="xl:sticky xl:top-6 xl:h-[calc(100vh-10.5rem)]">
          <RunComposer
            providers={providers}
            recorder={recorder}
            routeTitle={testTitle}
            routeDescription={testDescription}
            selectedTargetCount={selectedTargets.length}
            hasSampleAudio={Boolean(sample)}
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
      </div>
    </AppShell>
  );
}

function sampleFromLocationState(state: unknown): SampleRecord | null {
  const sample = (state as TestLocationState | null)?.sample;
  if (!sample || typeof sample.id !== 'string' || typeof sample.transcript !== 'string') {
    return null;
  }

  return sample;
}

function audioBlobForSample(sample: SampleRecord): Blob | null {
  const frequency = (sample as { toneFrequency?: unknown }).toneFrequency;
  if (typeof frequency !== 'number') {
    return null;
  }

  const sampleRate = 8000;
  const durationSeconds = 1.4;
  const sampleCount = Math.floor(sampleRate * durationSeconds);
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, sampleCount * 2, true);

  for (let index = 0; index < sampleCount; index += 1) {
    const fade = Math.min(index / 800, (sampleCount - index) / 800, 1);
    const generatedSample = Math.sin((2 * Math.PI * frequency * index) / sampleRate) * 0.22 * fade;
    view.setInt16(44 + index * 2, generatedSample * 32767, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}
