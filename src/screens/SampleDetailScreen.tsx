import { useEffect, useState } from 'react';
import { Play, Save } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
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
    <AppShell
      title={sample?.notes || 'Sample'}
      description="Review the sample transcript before launching provider comparisons."
      providerCount={0}
      targetCount={sample ? 1 : 0}
      apiStatus={message ? 'paused' : 'active'}
      actions={sample && (
        <Link to={`/test/sample/${sample.id}`} className="inline-flex h-10 items-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800">
          <Play className="h-4 w-4" />
          Compare
        </Link>
      )}
    >
      <div className="mx-auto max-w-5xl space-y-5">
        {message && <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">{message}</div>}
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
        <button onClick={() => void saveSample()} className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800">
          <Save className="h-4 w-4" />
          Save changes
        </button>
      </div>
    </AppShell>
  );
}
