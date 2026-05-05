import { useEffect, useState } from 'react';
import { ArrowLeft, Play, Save } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { SampleEditor } from '../components/samples/SampleEditor';
import { fetchJson } from '../lib/api';
import { sampleBirdTermsText, sampleTagsText } from '../lib/samples';
import type { SampleRecord } from '../types';

export function SampleDetailScreen() {
  const { id } = useParams();
  const [sample, setSample] = useState<SampleRecord | null>(null);
  const [transcript, setTranscript] = useState('');
  const [birdTerms, setBirdTerms] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let ignore = false;
    void fetchJson<{ sample: SampleRecord }>(`/api/samples/${id}`)
      .then((data) => {
        if (!ignore) {
          setSample(data.sample);
          setTranscript(data.sample.transcript);
          setBirdTerms(sampleBirdTermsText(data.sample));
          setNotes(data.sample.notes);
          setTags(sampleTagsText(data.sample));
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setMessage(error instanceof Error ? error.message : 'Could not load sample.');
        }
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  async function saveSample() {
    const data = await fetchJson<{ sample: SampleRecord }>(`/api/samples/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript,
        birdTerms,
        notes,
        tags,
        transcriptStatus: 'edited',
      }),
    });
    setSample(data.sample);
    setMessage('Sample updated.');
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Ornitho ASR</p>
            <h1 className="text-2xl font-semibold">{sample?.notes || 'Sample'}</h1>
            <p className="mt-1 text-sm text-zinc-600">Review the sample transcript before launching provider comparisons.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/" className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            {sample && (
              <Link to={`/test/sample/${sample.id}`} className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
                <Play className="h-4 w-4" />
                Compare
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-5 py-6">
        {message && <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">{message}</div>}
        <SampleEditor
          transcript={transcript}
          onTranscriptChange={setTranscript}
          birdTerms={birdTerms}
          onBirdTermsChange={setBirdTerms}
          notes={notes}
          onNotesChange={setNotes}
          tags={tags}
          onTagsChange={setTags}
        />
        <button onClick={() => void saveSample()} className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
          <Save className="h-4 w-4" />
          Save changes
        </button>
      </main>
    </div>
  );
}
