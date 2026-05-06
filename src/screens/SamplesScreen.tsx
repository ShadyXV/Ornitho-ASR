import { useMemo, useState } from 'react';
import { Calendar, ChevronDown, FileAudio, Pencil, PlayCircle, Save, Search, SlidersHorizontal, Tags, Upload, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppShell, SectionTitle, ShellCard } from '../components/layout/AppShell';
import { SampleEditor } from '../components/samples/SampleEditor';
import audioWaveBanner from '../assets/ornitho/audio-wave-banner.png';
import { dummySamples, type DummySampleRecord } from '../data/dummySamples';
import { formatDate } from '../lib/formatters';

type SortKey = 'updated-desc' | 'updated-asc' | 'quality-desc' | 'title-asc';

interface EditState {
  id: string;
  transcript: string;
  birdTerms: string;
  notes: string;
  tags: string;
}

export function SamplesScreen() {
  const [samples, setSamples] = useState<DummySampleRecord[]>(dummySamples);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('updated-desc');
  const [editing, setEditing] = useState<EditState | null>(null);

  const audioSources = useMemo(() => new Map(samples.map((sample) => [sample.id, createToneDataUri(sample.toneFrequency)])), [samples]);

  const filteredSamples = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...samples]
      .filter((sample) => {
        const searchable = [
          sample.title,
          sample.transcript,
          sample.notes,
          sample.habitat,
          sample.transcriptStatus,
          sample.birdTerms.join(' '),
          sample.tags.join(' '),
        ].join(' ').toLowerCase();
        const matchesQuery = normalizedQuery.length === 0 || searchable.includes(normalizedQuery);
        const matchesStatus = statusFilter === 'all' || sample.transcriptStatus === statusFilter;
        return matchesQuery && matchesStatus;
      })
      .sort((first, second) => {
        if (sortKey === 'updated-asc') {
          return first.updatedAt - second.updatedAt;
        }
        if (sortKey === 'quality-desc') {
          return second.qualityScore - first.qualityScore;
        }
        if (sortKey === 'title-asc') {
          return first.title.localeCompare(second.title);
        }
        return second.updatedAt - first.updatedAt;
      });
  }, [query, samples, sortKey, statusFilter]);

  function startEditing(sample: DummySampleRecord) {
    setEditing({
      id: sample.id,
      transcript: sample.transcript,
      birdTerms: sample.birdTerms.join(', '),
      notes: sample.notes,
      tags: sample.tags.join(', '),
    });
  }

  function saveEditing() {
    if (!editing) {
      return;
    }

    setSamples((current) => current.map((sample) => sample.id === editing.id ? {
      ...sample,
      transcript: editing.transcript,
      birdTerms: splitList(editing.birdTerms),
      notes: editing.notes,
      tags: splitList(editing.tags),
      transcriptStatus: sample.transcriptStatus === 'generated' ? 'edited' : sample.transcriptStatus,
      updatedAt: Date.now(),
    } : sample));
    setEditing(null);
  }

  const editingSample = editing ? samples.find((sample) => sample.id === editing.id) : null;

  return (
    <AppShell
      title="Samples"
      description="Review, play, and curate reusable ASR benchmark audio."
      providerCount={3}
      targetCount={samples.length}
    >
      <div className="space-y-6">
        <ShellCard className="overflow-hidden">
          <div className="grid min-h-28 gap-5 p-4 pb-0 lg:grid-cols-[minmax(420px,1fr)_minmax(360px,520px)_auto] lg:items-center">
            <div className="flex items-center gap-5 pb-4 lg:pb-0">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700">
                <FileAudio className="h-8 w-8" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold">Sample library</h2>
                <p className="mt-1 max-w-md text-sm leading-6 text-slate-600">
                  Keep known audio, transcript expectations, and bird terms ready for repeatable provider comparisons.
                </p>
              </div>
            </div>
            <div className="flex items-end gap-6 self-end">
              <img src={audioWaveBanner} alt="" className="hidden h-24 w-[520px] object-contain object-bottom md:block" />
            </div>
            <Link to="/samples/new" className="mb-4 inline-flex items-center justify-center gap-2 self-end rounded-md bg-teal-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-800 lg:mb-5">
              <FileAudio className="h-4 w-4" />
              Record sample
            </Link>
          </div>
        </ShellCard>

        <section className="space-y-3">
          <SectionTitle title="Library" description={`${filteredSamples.length} of ${samples.length} samples shown.`} />
          <ShellCard className="p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_190px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search samples, species, tags..."
                  className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm"
                />
              </label>
              <label className="relative block">
                <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 w-full appearance-none rounded-md border border-slate-300 bg-white pl-10 pr-10 text-sm">
                  <option value="all">All statuses</option>
                  <option value="manual">Manual</option>
                  <option value="generated">Generated</option>
                  <option value="edited">Edited</option>
                  <option value="reviewed">Reviewed</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </label>
              <label className="relative block">
                <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} className="h-11 w-full appearance-none rounded-md border border-slate-300 bg-white px-3 pr-10 text-sm">
                  <option value="updated-desc">Newest updated</option>
                  <option value="updated-asc">Oldest updated</option>
                  <option value="quality-desc">Highest quality</option>
                  <option value="title-asc">Title A-Z</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </label>
            </div>
          </ShellCard>

          <div className="grid gap-4 xl:grid-cols-2">
            {filteredSamples.map((sample) => (
              <SampleLibraryCard
                key={sample.id}
                sample={sample}
                audioSource={audioSources.get(sample.id) || ''}
                testSample={toSampleRecord(sample)}
                onEdit={() => startEditing(sample)}
              />
            ))}
          </div>

          {filteredSamples.length === 0 && (
            <ShellCard className="grid min-h-48 place-items-center p-8 text-center">
              <div>
                <h3 className="font-bold">No matching samples</h3>
                <p className="mt-2 text-sm text-slate-600">Adjust the search, status filter, or sort selection.</p>
              </div>
            </ShellCard>
          )}
        </section>
      </div>

      {editing && editingSample && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6">
          <div className="max-h-full w-full max-w-5xl overflow-auto rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-xl font-bold">Edit sample</h2>
                <p className="mt-1 text-sm text-slate-600">{editingSample.title}</p>
              </div>
              <button onClick={() => setEditing(null)} className="grid h-10 w-10 place-items-center rounded-full text-slate-600 hover:bg-slate-100" aria-label="Close editor">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[340px_minmax(0,1fr)]">
              <ShellCard className="p-5">
                <h3 className="text-lg font-bold">Audio</h3>
                <p className="mt-1 text-sm text-slate-600">Preview this sample before editing transcript metadata.</p>
                <audio controls src={audioSources.get(editingSample.id)} className="mt-4 w-full" />
                <div className="mt-4 flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
                  <FileAudio className="h-4 w-4" />
                  {editingSample.durationLabel} WAV sample
                </div>
                <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50">
                  <Upload className="h-4 w-4" />
                  Replace audio
                </button>
              </ShellCard>

              <SampleEditor
                transcript={editing.transcript}
                onTranscriptChange={(value) => setEditing((current) => current ? { ...current, transcript: value } : current)}
                birdTerms={editing.birdTerms}
                onBirdTermsChange={(value) => setEditing((current) => current ? { ...current, birdTerms: value } : current)}
                notes={editing.notes}
                onNotesChange={(value) => setEditing((current) => current ? { ...current, notes: value } : current)}
                tags={editing.tags}
                onTagsChange={(value) => setEditing((current) => current ? { ...current, tags: value } : current)}
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <button onClick={() => setEditing(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={saveEditing} className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800">
                <Save className="h-4 w-4" />
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function SampleLibraryCard({ sample, audioSource, testSample, onEdit }: { sample: DummySampleRecord; audioSource: string; testSample: DummySampleRecord; onEdit: () => void }) {
  return (
    <ShellCard className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-950">{sample.title}</h3>
            <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-bold capitalize text-teal-700">{sample.transcriptStatus}</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{sample.habitat} | {sample.durationLabel} | quality {sample.qualityScore}%</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <Link
            to={`/test/sample/${sample.id}`}
            state={{ sample: testSample }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-700 px-3 py-2 text-sm font-bold text-white hover:bg-teal-800"
          >
            <PlayCircle className="h-4 w-4" />
            Test
          </Link>
          <button onClick={onEdit} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        </div>
      </div>

      <audio controls src={audioSource} className="mt-4 w-full" />

      <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-700">{sample.transcript}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {sample.birdTerms.map((term) => (
          <span key={term} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
            <FileAudio className="h-3 w-3" />
            {term}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(sample.updatedAt)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Tags className="h-3.5 w-3.5" />
          {sample.tags.join(', ')}
        </span>
      </div>
    </ShellCard>
  );
}

function toSampleRecord(sample: DummySampleRecord): DummySampleRecord {
  return {
    ...sample,
    audioPath: sample.audioPath || `/dummy-samples/${sample.id}.wav`,
  };
}

function splitList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function createToneDataUri(frequency: number): string {
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
    const sample = Math.sin((2 * Math.PI * frequency * index) / sampleRate) * 0.22 * fade;
    view.setInt16(44 + index * 2, sample * 32767, true);
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return `data:audio/wav;base64,${btoa(binary)}`;
}

function writeString(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}
