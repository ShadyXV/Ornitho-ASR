import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { formatDate, formatPercent } from '../../lib/formatters';
import type { ResultRecord, RunRecord } from '../../types';

interface ResultsPanelProps {
  activeRun: RunRecord | null;
  runs: RunRecord[];
  onSelectRun: (run: RunRecord) => void;
  onRefresh: () => void;
  onResultUpdated: (result: ResultRecord) => void;
}

export function ResultsPanel({ activeRun, runs, onSelectRun, onRefresh, onResultUpdated }: ResultsPanelProps) {
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
