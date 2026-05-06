import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { AppShell, SectionTitle, ShellCard } from '../components/layout/AppShell';
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
    <AppShell title="Evaluation Reports" description="Sort and filter benchmark outcomes by provider, model, date, status, and metrics." providerCount={3} targetCount={rows.length}>
      <div className="space-y-6">
        <ShellCard className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-teal-700" />
            <h2 className="font-bold">Filters</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            <Select label="Provider" value={providerFilter} onChange={setProviderFilter} options={providers} />
            <Select label="Model" value={modelFilter} onChange={setModelFilter} options={models} />
            <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={statuses} />
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Date</span>
              <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm">
                <option value="all">All dates</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Sort by</span>
              <select value={sortKey} onChange={(event) => setSortKey(event.target.value as ResultSortKey)} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm">
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
        </ShellCard>

        <section className="space-y-3">
          <SectionTitle title="Evaluation Results" description={`${filteredRows.length} rows shown`} />
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
            <table className="min-w-[1040px] w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Run / Provider</th>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">WER</th>
                  <th className="px-4 py-3">Recall</th>
                  <th className="px-4 py-3">Precision</th>
                  <th className="px-4 py-3">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map(({ run, result }) => (
                  <tr key={result.id}>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-950">{result.providerName}</span>
                        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold uppercase text-slate-700">{run.mode}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(run.createdAt)} · {run.testCase?.notes || 'Untitled run'}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{result.modelId}</td>
                    <td className="px-4 py-4 text-slate-700">{result.methodName}</td>
                    <td className="px-4 py-4"><StatusBadge status={result.status} /></td>
                    <td className="px-4 py-4 font-bold">{formatPercent(result.scores?.wordErrorRate ?? null)}</td>
                    <td className="px-4 py-4 font-bold">{formatPercent(result.scores?.birdRecall ?? null)}</td>
                    <td className="px-4 py-4 font-bold">{formatPercent(result.scores?.birdPrecision ?? null)}</td>
                    <td className="px-4 py-4 font-bold">{result.latencyMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRows.length === 0 && <div className="p-6 text-sm text-slate-500">No results match these filters.</div>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm">
        <option value="all">All {label.toLowerCase()}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === 'completed' ? 'bg-emerald-100 text-emerald-800' : status === 'error' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700';
  return <span className={`w-fit rounded-md px-2.5 py-1 text-xs font-bold ${tone}`}>{status}</span>;
}
