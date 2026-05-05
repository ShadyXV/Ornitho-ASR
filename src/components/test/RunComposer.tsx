import { Activity, BarChart3, CheckCircle2, Circle, FileAudio, Mic, Square, Upload } from 'lucide-react';
import { targetKey } from '../../lib/runTargets';
import type { UseVoiceRecorderReturn } from '../../hooks/useVoiceRecorder';
import type { ProviderInfo, RunTarget } from '../../types';

interface RunComposerProps {
  providers: ProviderInfo[];
  recorder: UseVoiceRecorderReturn;
  routeTitle: string;
  routeDescription: string;
  selectedTargetCount: number;
  hasSampleAudio?: boolean;
  uploadedFile: File | null;
  onFileChange: (file: File | null) => void;
  expectedTranscript: string;
  onExpectedTranscriptChange: (value: string) => void;
  birdTerms: string;
  onBirdTermsChange: (value: string) => void;
  previousTranscript: string;
  onPreviousTranscriptChange: (value: string) => void;
  mode: string;
  onModeChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  tags: string;
  onTagsChange: (value: string) => void;
  selectedTargetIds: Set<string>;
  onToggleTarget: (target: RunTarget) => void;
  onSelectAll: () => void;
  onClearTargets: () => void;
  onRun: () => void;
  isRunning: boolean;
}

export function RunComposer(props: RunComposerProps) {
  const hasAudio = Boolean(props.uploadedFile || props.recorder.audioBlob);
  const canRun = hasAudio || Boolean(props.hasSampleAudio);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{props.routeTitle}</h2>
          <p className="text-sm text-zinc-600">{props.routeDescription}</p>
        </div>
        <BarChart3 className="h-5 w-5 text-emerald-700" />
      </div>

      <div className="mb-4 grid gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-zinc-500">Selected targets</p>
          <p className="font-semibold text-zinc-900">{props.selectedTargetCount}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500">Run mode</p>
          <p className="font-semibold capitalize text-zinc-900">{props.mode}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={props.recorder.isRecording ? props.recorder.stopRecording : props.recorder.startRecording}
          disabled={props.isRunning}
          className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-3 text-sm font-medium text-white ${props.recorder.isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-900 hover:bg-zinc-800'}`}
        >
          {props.recorder.isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {props.recorder.isRecording ? 'Stop recording' : 'Record audio'}
        </button>
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 py-3 text-sm font-medium hover:bg-zinc-100">
          <Upload className="h-4 w-4" />
          Upload audio
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(event) => props.onFileChange(event.target.files?.[0] || null)}
          />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
        <FileAudio className="h-4 w-4" />
        {props.uploadedFile?.name || (props.recorder.audioBlob ? 'Recorded audio ready' : 'No audio selected')}
      </div>
      {props.hasSampleAudio && (
        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Saved sample audio loaded for this comparison.
        </div>
      )}
      {props.recorder.error && <p className="mt-2 text-sm text-red-700">{props.recorder.error}</p>}

      <div className="mt-5 grid gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Test mode</span>
          <select value={props.mode} onChange={(event) => props.onModeChange(event.target.value)} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm">
            <option value="blind">Blind</option>
            <option value="prompted">Prompted/context</option>
            <option value="adaptation">Provider adaptation</option>
            <option value="regression">Regression</option>
            <option value="full">Full</option>
            <option value="provider">Provider</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Expected bird terms</span>
          <textarea value={props.birdTerms} onChange={(event) => props.onBirdTermsChange(event.target.value)} rows={3} placeholder="Snow Partridge, Himalayan Monal" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Expected transcript</span>
          <textarea value={props.expectedTranscript} onChange={(event) => props.onExpectedTranscriptChange(event.target.value)} rows={3} placeholder="Optional text for automatic WER scoring" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Previous transcript context</span>
          <textarea value={props.previousTranscript} onChange={(event) => props.onPreviousTranscriptChange(event.target.value)} rows={2} placeholder="Optional context for previous-segment prompt methods" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Notes</span>
            <input value={props.notes} onChange={(event) => props.onNotesChange(event.target.value)} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Tags</span>
            <input value={props.tags} onChange={(event) => props.onTagsChange(event.target.value)} placeholder="noise, rare-name" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
          </label>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Methods</h3>
          <div className="flex gap-2">
            <button onClick={props.onSelectAll} className="text-xs font-medium text-emerald-700 hover:text-emerald-900">Select all</button>
            <button onClick={props.onClearTargets} className="text-xs font-medium text-zinc-600 hover:text-zinc-900">Clear</button>
          </div>
        </div>
        <div className="max-h-72 space-y-3 overflow-auto rounded-md border border-zinc-200 p-3">
          {props.providers.filter((provider) => provider.available).map((provider) => (
            <div key={provider.id}>
              <p className="mb-2 text-sm font-medium">{provider.name}</p>
              <div className="space-y-2">
                {provider.methods.flatMap((method) => method.models.map((modelId) => {
                  const target = { providerId: provider.id, modelId, methodId: method.id };
                  const checked = props.selectedTargetIds.has(targetKey(target));
                  return (
                    <button key={targetKey(target)} onClick={() => props.onToggleTarget(target)} className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-zinc-100">
                      {checked ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" /> : <Circle className="mt-0.5 h-4 w-4 text-zinc-400" />}
                      <span>
                        <span className="block font-medium">{method.name} / {modelId}</span>
                        <span className="block text-xs text-zinc-500">{method.description}</span>
                      </span>
                    </button>
                  );
                }))}
              </div>
            </div>
          ))}
          {props.providers.every((provider) => !provider.available) && (
            <p className="text-sm text-zinc-500">Add at least one provider key to run tests.</p>
          )}
        </div>
      </div>

      <button
        onClick={props.onRun}
        disabled={props.isRunning || !canRun}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-3 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {props.isRunning ? <Activity className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
        Run benchmark
      </button>
    </div>
  );
}
