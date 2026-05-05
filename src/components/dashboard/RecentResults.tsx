import { bestScore, formatDate, formatPercent } from '../../lib/formatters';
import type { RunRecord } from '../../types';

interface RecentResultsProps {
  runs: RunRecord[];
}

export function RecentResults({ runs }: RecentResultsProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">Recent test results</h2>
        <p className="text-sm text-zinc-600">Dummy data for reviewing the results summary layout.</p>
      </div>

      <div className="space-y-3">
        {runs.map((run) => {
          const results = run.results || [];
          const completed = results.filter((result) => result.status === 'completed').length;
          const errors = results.filter((result) => result.status === 'error').length;
          const bestWer = bestScore(run, 'wordErrorRate');
          const bestRecall = bestScore(run, 'birdRecall');

          return (
            <article key={run.id} className="rounded-lg border border-zinc-200 bg-white">
              <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_420px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium uppercase text-zinc-700">{run.mode}</span>
                    <span className={`rounded px-2 py-1 text-xs font-medium ${run.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-700'}`}>{run.status}</span>
                    <span className="text-xs text-zinc-500">{formatDate(run.createdAt)}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{run.testCase?.notes || 'Untitled test run'}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-700">
                    {run.testCase?.expectedTranscript || run.testCase?.birdTerms.join(', ') || 'No expected transcript supplied.'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(run.testCase?.tags || []).map((tag) => (
                      <span key={tag} className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                  <Metric label="Results" value={results.length} />
                  <Metric label="Errors" value={errors} />
                  <Score label="Best WER" value={formatPercent(bestWer)} />
                  <Score label="Best recall" value={formatPercent(bestRecall)} />
                </div>
              </div>

              <div className="border-t border-zinc-100 px-5 py-4">
                <div className="grid gap-3 lg:grid-cols-2">
                  {results.map((result) => (
                    <div key={result.id} className="rounded-md border border-zinc-200 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{result.providerName}</span>
                        <span className="rounded bg-zinc-100 px-2 py-1 text-xs">{result.modelId}</span>
                        <span className="rounded bg-zinc-100 px-2 py-1 text-xs">{result.methodName}</span>
                        <span className={`rounded px-2 py-1 text-xs ${result.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : result.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-zinc-100 text-zinc-700'}`}>{result.status}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        <Score label="WER" value={formatPercent(result.scores?.wordErrorRate ?? null)} />
                        <Score label="Recall" value={formatPercent(result.scores?.birdRecall ?? null)} />
                        <Score label="Latency" value={`${result.latencyMs}ms`} />
                      </div>
                      {result.error ? (
                        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{result.error}</p>
                      ) : (
                        <p className="mt-3 line-clamp-2 rounded-md bg-zinc-50 px-3 py-2 text-sm leading-6 text-zinc-700">{result.transcript}</p>
                      )}
                      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                        <BirdList label="Matched" birds={result.matchedBirds} />
                        <BirdList label="Missed" birds={result.missedBirds} />
                        <BirdList label="False positives" birds={result.falsePositiveBirds} />
                      </div>
                    </div>
                  ))}
                </div>
                {completed === 0 && errors === 0 && (
                  <p className="text-sm text-zinc-500">No completed results in this run.</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
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
