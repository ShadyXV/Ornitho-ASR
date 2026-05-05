interface SampleEditorProps {
  transcript: string;
  onTranscriptChange: (value: string) => void;
  birdTerms: string;
  onBirdTermsChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  tags: string;
  onTagsChange: (value: string) => void;
}

export function SampleEditor(props: SampleEditorProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Sample transcript</h2>
        <p className="text-sm text-zinc-600">Edit the transcript and metadata before using this sample in comparisons.</p>
      </div>

      <div className="grid gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Transcript</span>
          <textarea value={props.transcript} onChange={(event) => props.onTranscriptChange(event.target.value)} rows={8} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Bird terms</span>
          <textarea value={props.birdTerms} onChange={(event) => props.onBirdTermsChange(event.target.value)} rows={3} placeholder="Snow Partridge, Himalayan Monal" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
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
    </div>
  );
}
