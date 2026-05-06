import { ArrowRight, Filter, Info, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bestScore, formatDate, formatPercent } from '../../lib/formatters';
import type { RunRecord } from '../../types';

interface RecentResultsSummaryProps {
  runs: RunRecord[];
}

export function RecentResultsSummary({ runs }: RecentResultsSummaryProps) {
  const latestRuns = runs.slice(0, 3);

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-normal text-slate-950">Recent ASR Evaluations</h2>
        </div>
        <Link to="/reports" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50">
          View all results
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative block md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="h-10 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-teal-600" placeholder="Search evaluations..." />
        </label>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
          <Filter className="h-4 w-4 text-slate-700" />
          Filter
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
        <table className="min-w-[980px] w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-700">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Test Name</th>
              <th className="px-4 py-3">Date & Time</th>
              <th className="px-4 py-3">Best Performer</th>
              <th className="px-4 py-3">
                <span className="inline-flex items-center gap-1">WER <Info className="h-3.5 w-3.5" /></span>
              </th>
              <th className="px-4 py-3">
                <span className="inline-flex items-center gap-1">Recall <Info className="h-3.5 w-3.5" /></span>
              </th>
              <th className="px-4 py-3">Summary</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {latestRuns.map((run) => {
              const results = run.results || [];
              const errors = results.filter((result) => result.status === 'error').length;
              const bestWer = bestScore(run, 'wordErrorRate');
              const bestRecall = bestScore(run, 'birdRecall');
              const bestProvider = results
                .filter((result) => result.status === 'completed')
                .sort((a, b) => (a.scores?.wordErrorRate ?? 1) - (b.scores?.wordErrorRate ?? 1))[0];

              return (
                <tr key={run.id} className="text-slate-800">
                  <td className="px-4 py-3"><ModeBadge mode={run.mode} /></td>
                  <td className="px-4 py-3 font-medium text-slate-950">{run.testCase?.notes || 'Untitled run'}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(run.createdAt)}</td>
                  <td className="px-4 py-3">
                    {bestProvider ? (
                      <span className="font-medium">{bestProvider.providerName} / {bestProvider.modelId}</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatPercent(bestWer)}</td>
                  <td className="px-4 py-3 font-semibold">{formatPercent(bestRecall)}</td>
                  <td className="px-4 py-3">
                    <span className={errors > 0 ? 'text-red-600' : 'text-emerald-700'}>
                      {results.length} total, {errors} error{errors === 1 ? '' : 's'}
                    </span>
                  </td>
                  <td className="px-4 py-3"><ArrowRight className="h-4 w-4 text-slate-900" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {latestRuns.length === 0 && <div className="p-5 text-sm text-slate-500">No results yet.</div>}
      </div>
    </section>
  );
}

function ModeBadge({ mode }: { mode: string }) {
  const tone = mode === 'full'
    ? 'bg-teal-100 text-teal-800'
    : mode === 'blind'
      ? 'bg-orange-100 text-orange-700'
      : 'bg-violet-100 text-violet-800';

  return <span className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase ${tone}`}>{mode}</span>;
}
