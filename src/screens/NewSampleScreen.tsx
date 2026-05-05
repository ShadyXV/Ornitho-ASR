import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowLeft, FileAudio, Mic, Save, Square, Upload } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SampleEditor } from '../components/samples/SampleEditor';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { fetchJson } from '../lib/api';
import { defaultTranscriptTarget } from '../lib/samples';
import type { ProviderInfo, RunTarget, SampleRecord } from '../types';

export function NewSampleScreen() {
  const navigate = useNavigate();
  const recorder = useVoiceRecorder();
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState('');
  const [birdTerms, setBirdTerms] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [sourceTarget, setSourceTarget] = useState<RunTarget | null>(null);
  const [transcriptStatus, setTranscriptStatus] = useState('manual');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let ignore = false;
    void fetchJson<{ providers: ProviderInfo[] }>('/api/providers')
      .then((data) => {
        if (!ignore) {
          setProviders(data.providers);
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setMessage(error instanceof Error ? error.message : 'Could not load providers.');
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const audioSource = uploadedFile || recorder.audioBlob;
  const target = useMemo(() => defaultTranscriptTarget(providers), [providers]);
  const targetLabel = target ? `${target.providerId} / ${target.modelId}` : 'No available provider';

  async function generateTranscript() {
    if (!audioSource) {
      setMessage('Record or upload audio first.');
      return;
    }
    if (!target) {
      setMessage('Add a provider key before auto-generating a transcript.');
      return;
    }

    setIsTranscribing(true);
    setMessage('');

    const formData = new FormData();
    formData.append('audio', audioSource, uploadedFile?.name || 'sample.webm');
    formData.append('selectedTargets', JSON.stringify([target]));

    try {
      const data = await fetchJson<{ transcript: string; target: RunTarget }>('/api/samples/transcribe', {
        method: 'POST',
        body: formData,
      });
      setTranscript(data.transcript);
      setSourceTarget(data.target);
      setTranscriptStatus('generated');
      setMessage('Transcript generated. Review and edit before saving.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Transcript generation failed. You can enter it manually.');
    } finally {
      setIsTranscribing(false);
    }
  }

  async function saveSample() {
    if (!audioSource) {
      setMessage('Record or upload audio before saving.');
      return;
    }

    setIsSaving(true);
    setMessage('');

    const formData = new FormData();
    formData.append('audio', audioSource, uploadedFile?.name || 'sample.webm');
    formData.append('transcript', transcript);
    formData.append('birdTerms', birdTerms);
    formData.append('notes', notes);
    formData.append('tags', tags);
    formData.append('transcriptStatus', transcriptStatus === 'generated' ? 'edited' : transcriptStatus);
    const selectedTarget = sourceTarget || target;
    if (selectedTarget) {
      formData.append('selectedTargets', JSON.stringify([selectedTarget]));
      formData.append('sourceProviderId', selectedTarget.providerId);
      formData.append('sourceModelId', selectedTarget.modelId);
      formData.append('sourceMethodId', selectedTarget.methodId);
    }

    try {
      const data = await fetchJson<{ sample: SampleRecord }>('/api/samples', {
        method: 'POST',
        body: formData,
      });
      navigate(`/samples/${data.sample.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save sample.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Ornitho ASR</p>
            <h1 className="text-2xl font-semibold">Record a sample</h1>
            <p className="mt-1 text-sm text-zinc-600">Create reusable audio and transcript data for comparison tests.</p>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <section className="space-y-5">
          {message && <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">{message}</div>}

          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Audio</h2>
            <p className="mt-1 text-sm text-zinc-600">Default transcript target: {targetLabel}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                onClick={recorder.isRecording ? recorder.stopRecording : recorder.startRecording}
                className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-3 text-sm font-medium text-white ${recorder.isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-900 hover:bg-zinc-800'}`}
              >
                {recorder.isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {recorder.isRecording ? 'Stop recording' : 'Record audio'}
              </button>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 py-3 text-sm font-medium hover:bg-zinc-100">
                <Upload className="h-4 w-4" />
                Upload audio
                <input type="file" accept="audio/*" className="hidden" onChange={(event) => setUploadedFile(event.target.files?.[0] || null)} />
              </label>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
              <FileAudio className="h-4 w-4" />
              {uploadedFile?.name || (recorder.audioBlob ? 'Recorded audio ready' : 'No audio selected')}
            </div>
            {recorder.error && <p className="mt-2 text-sm text-red-700">{recorder.error}</p>}

            <button onClick={() => void generateTranscript()} disabled={isTranscribing || !audioSource} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-3 text-sm font-medium text-white hover:bg-emerald-800 disabled:bg-zinc-300">
              {isTranscribing ? <Activity className="h-4 w-4 animate-spin" /> : <FileAudio className="h-4 w-4" />}
              Generate transcript
            </button>
          </div>

          <button onClick={() => void saveSample()} disabled={isSaving || !audioSource} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 px-3 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:bg-zinc-300">
            {isSaving ? <Activity className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save sample
          </button>
        </section>

        <SampleEditor
          transcript={transcript}
          onTranscriptChange={(value) => {
            setTranscript(value);
            if (transcriptStatus === 'generated') {
              setTranscriptStatus('edited');
            }
          }}
          birdTerms={birdTerms}
          onBirdTermsChange={setBirdTerms}
          notes={notes}
          onNotesChange={setNotes}
          tags={tags}
          onTagsChange={setTags}
        />
      </main>
    </div>
  );
}
