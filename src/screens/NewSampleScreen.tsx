import { useEffect, useMemo, useState } from 'react';
import { Activity, FileAudio, Mic, Save, Square, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell, ShellCard } from '../components/layout/AppShell';
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
  const availableCount = providers.filter((provider) => provider.available).length;

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
    <AppShell title="Record a sample" description="Create reusable audio and transcript data for comparison tests." providerCount={availableCount} targetCount={target ? 1 : 0} apiStatus={message ? 'paused' : 'active'}>
      <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <section className="space-y-5">
          {message && <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">{message}</div>}

          <ShellCard className="p-5">
            <h2 className="text-lg font-bold">Audio</h2>
            <p className="mt-1 text-sm text-slate-600">Default transcript target: {targetLabel}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                onClick={recorder.isRecording ? recorder.stopRecording : recorder.startRecording}
                className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-3 text-sm font-bold text-white ${recorder.isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-700 hover:bg-teal-800'}`}
              >
                {recorder.isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {recorder.isRecording ? 'Stop recording' : 'Record audio'}
              </button>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-3 text-sm font-bold hover:bg-slate-50">
                <Upload className="h-4 w-4" />
                Upload audio
                <input type="file" accept="audio/*" className="hidden" onChange={(event) => setUploadedFile(event.target.files?.[0] || null)} />
              </label>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
              <FileAudio className="h-4 w-4" />
              {uploadedFile?.name || (recorder.audioBlob ? 'Recorded audio ready' : 'No audio selected')}
            </div>
            {recorder.error && <p className="mt-2 text-sm text-red-700">{recorder.error}</p>}

            <button onClick={() => void generateTranscript()} disabled={isTranscribing || !audioSource} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-3 py-3 text-sm font-bold text-white hover:bg-teal-800 disabled:bg-slate-300">
              {isTranscribing ? <Activity className="h-4 w-4 animate-spin" /> : <FileAudio className="h-4 w-4" />}
              Generate transcript
            </button>
          </ShellCard>

          <button onClick={() => void saveSample()} disabled={isSaving || !audioSource} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:bg-slate-300">
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
      </div>
    </AppShell>
  );
}
