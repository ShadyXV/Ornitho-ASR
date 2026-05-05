import { ArrowRight, FileAudio, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../lib/formatters';
import type { SampleRecord } from '../../types';

interface SampleListProps {
  samples: SampleRecord[];
}

export function SampleList({ samples }: SampleListProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Samples</h2>
          <p className="text-sm text-zinc-600">Reusable audio and transcript data for provider comparisons.</p>
        </div>
        <Link to="/samples/new" className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800">
          <FileAudio className="h-4 w-4" />
          Record a sample
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white">
        {samples.map((sample) => (
          <div key={sample.id} className="grid gap-3 border-b border-zinc-100 p-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{sample.notes || 'Untitled sample'}</h3>
                <span className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-700">{sample.transcriptStatus}</span>
                <span className="text-xs text-zinc-500">{formatDate(sample.updatedAt)}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-700">{sample.transcript || sample.birdTerms.join(', ') || 'No transcript yet.'}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sample.tags.map((tag) => (
                  <span key={tag} className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600">{tag}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/test/sample/${sample.id}`} className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
                <Play className="h-4 w-4" />
                Compare
              </Link>
              <Link to={`/samples/${sample.id}`} className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100">
                Open
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
        {samples.length === 0 && (
          <div className="p-6 text-sm text-zinc-500">No samples yet. Record or upload one to build a comparison library.</div>
        )}
      </div>
    </section>
  );
}
