import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bestScore, formatDate, formatPercent } from '../../lib/formatters';
import type { RunRecord } from '../../types';

interface RecentResultsSummaryProps {
  runs: RunRecord[];
}

export function RecentResultsSummary({ runs }: RecentResultsSummaryProps) {
  const latestRuns = runs.slice(0, 3);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Recent results</h2>
          <p className="text-sm text-zinc-600">Latest comparison outcomes at a glance.</p>
        </div>
        <Link to="/results" className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-100">
          View all results
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white">
        {latestRuns.map((run) => {
          const results = run.results || [];
          const errors = results.filter((result) => result.status === 'error').length;
          const bestWer = bestScore(run, 'wordErrorRate');
          const bestRecall = bestScore(run, 'birdRecall');
          const bestProvider = results
            .filter((result) => result.status === 'completed')
            .sort((a, b) => (a.scores?.wordErrorRate ?? 1) - (b.scores?.wordErrorRate ?? 1))[0];

          return (
            <div key={run.id} className="grid gap-3 border-b border-zinc-100 px-4 py-3 last:border-b-0 md:grid-cols-[1fr_120px_120px_120px_140px] md:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium uppercase text-zinc-700">{run.mode}</span>
                  <span className="text-xs text-zinc-500">{formatDate(run.createdAt)}</span>
                </div>
                <p className="mt-1 truncate font-medium">{run.testCase?.notes || 'Untitled run'}</p>
              </div>
              <SummaryCell label="Best model" value={bestProvider ? `${bestProvider.providerName} / ${bestProvider.modelId}` : '-'} />
              <SummaryCell label="Best WER" value={formatPercent(bestWer)} />
              <SummaryCell label="Best recall" value={formatPercent(bestRecall)} />
              <SummaryCell label="Results" value={`${results.length} total, ${errors} errors`} />
            </div>
          );
        })}
        {latestRuns.length === 0 && <div className="p-4 text-sm text-zinc-500">No results yet.</div>}
      </div>
    </section>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
