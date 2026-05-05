import { Download } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TestHeaderProps {
  title: string;
  description: string;
  availableProviderCount: number;
  onExportJson: () => void;
  onExportCsv: () => void;
}

export function TestHeader({ title, description, availableProviderCount, onExportJson, onExportCsv }: TestHeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">Ornitho ASR</p>
          <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
          <p className="mt-1 text-sm text-zinc-600">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
          <Link to="/" className="rounded-md border border-zinc-300 px-3 py-2 hover:bg-zinc-100">Dashboard</Link>
          <span>{availableProviderCount} provider{availableProviderCount === 1 ? '' : 's'} available</span>
          <button onClick={onExportJson} className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 hover:bg-zinc-100">
            <Download className="h-4 w-4" />
            JSON
          </button>
          <button onClick={onExportCsv} className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 hover:bg-zinc-100">
            <Download className="h-4 w-4" />
            CSV
          </button>
        </div>
      </div>
    </header>
  );
}
