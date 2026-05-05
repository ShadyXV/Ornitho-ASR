import { useMemo, useState } from 'react';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dummyRecentRuns } from '../data/dummyRecentRuns';
import { formatDate, formatPercent } from '../lib/formatters';
import { flattenRunResults, sortResultRows, uniqueResultValues, type ResultSortKey } from '../lib/results';

export function ResultsScreen() {
  const [providerFilter, setProviderFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortKey, setSortKey] = useState<ResultSortKey>('date');
  const [now] = useState(() => Date.now());

  const rows = useMemo(() => flattenRunResults(dummyRecentRuns), []);
  const providers = useMemo(() => uniqueResultValues(rows, 'providerName'), [rows]);
  const models = useMemo(() => uniqueResultValues(rows, 'modelId'), [rows]);
  const statuses = useMemo(() => uniqueResultValues(rows, 'status'), [rows]);

  const filteredRows = useMemo(() => {
    const dateCutoff = dateFilter === '24h'
      ? now - 1000 * 60 * 60 * 24
      : dateFilter === '7d'
        ? now - 1000 * 60 * 60 * 24 * 7
        : 0;

    return sortResultRows(rows.filter(({ run, result }) => {
      if (providerFilter !== 'all' && result.providerName !== providerFilter) {
        return false;
      }
      if (modelFilter !== 'all' && result.modelId !== modelFilter) {
        return false;
      }
      if (statusFilter !== 'all' && result.status !== statusFilter) {
        return false;
      }
      if (dateCutoff > 0 && run.createdAt < dateCutoff) {
        return false;
      }
      return true;
    }), sortKey);
  }, [dateFilter, modelFilter, now, providerFilter, rows, sortKey, statusFilter]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Ornitho ASR</p>
            <h1 className="text-2xl font-semibold">Results</h1>
            <p className="mt-1 text-sm text-zinc-600">Sort and filter benchmark outcomes by provider, model, date, status, and metrics.</p>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-100">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-5 py-6">
        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-emerald-700" />
            <h2 className="font-semibold">Filters</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            <Select label="Provider" value={providerFilter} onChange={setProviderFilter} options={providers} />
            <Select label="Model" value={modelFilter} onChange={setModelFilter} options={models} />
            <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={statuses} />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600">Date</span>
              <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm">
                <option value="all">All dates</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600">Sort by</span>
              <select value={sortKey} onChange={(event) => setSortKey(event.target.value as ResultSortKey)} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm">
                <option value="date">Newest</option>
                <option value="provider">Provider</option>
                <option value="model">Model</option>
                <option value="wer">Best WER</option>
                <option value="recall">Best recall</option>
                <option value="precision">Best precision</option>
                <option value="latency">Fastest</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white">
          <div className="grid border-b border-zinc-200 px-4 py-3 text-xs font-semibold uppercase text-zinc-500 md:grid-cols-[1fr_140px_140px_90px_90px_90px_90px]">
            <span>Run / provider</span>
            <span>Model</span>
            <span>Method</span>
            <span>Status</span>
            <span>WER</span>
            <span>Recall</span>
            <span>Latency</span>
          </div>
          {filteredRows.map(({ run, result }) => (
            <article key={result.id} className="grid gap-3 border-b border-zinc-100 px-4 py-4 last:border-b-0 md:grid-cols-[1fr_140px_140px_90px_90px_90px_90px] md:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{result.providerName}</span>
                  <span className="rounded bg-zinc-100 px-2 py-1 text-xs uppercase text-zinc-700">{run.mode}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{formatDate(run.createdAt)} · {run.testCase?.notes || 'Untitled run'}</p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-700">{result.error || result.transcript || 'No transcript.'}</p>
              </div>
              <span className="text-sm">{result.modelId}</span>
              <span className="text-sm">{result.methodName}</span>
              <span className={`w-fit rounded px-2 py-1 text-xs ${result.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : result.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-zinc-100 text-zinc-700'}`}>{result.status}</span>
              <Metric value={formatPercent(result.scores?.wordErrorRate ?? null)} />
              <Metric value={formatPercent(result.scores?.birdRecall ?? null)} />
              <Metric value={`${result.latencyMs}ms`} />
            </article>
          ))}
          {filteredRows.length === 0 && <div className="p-6 text-sm text-zinc-500">No results match these filters.</div>}
        </section>
      </main>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-600">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm">
        <option value="all">All {label.toLowerCase()}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Metric({ value }: { value: string }) {
  return <span className="text-sm font-semibold">{value}</span>;
}
