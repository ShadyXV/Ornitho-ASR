import type { ReactNode } from 'react';
import { BarChart3, Bot, EyeOff, FileAudio, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppShell, SectionTitle, ShellCard } from '../components/layout/AppShell';
import { dummyRecentRuns } from '../data/dummyRecentRuns';

export function TestsIndexScreen() {
  const targetCount = dummyRecentRuns.reduce((count, run) => count + (run.results?.length || 0), 0);

  return (
    <AppShell title="Tests" description="Choose a benchmark flow and launch a focused ASR evaluation." providerCount={3} targetCount={targetCount}>
      <div className="space-y-6">
        <SectionTitle title="Start a test" description="Pick the run type that matches the comparison you need." />
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <TestCard icon={<EyeOff className="h-7 w-7" />} title="Blind Test" description="Run a comparison without exposing expected transcript context." to="/test/blind" />
          <TestCard icon={<BarChart3 className="h-7 w-7" />} title="Full Evaluation" description="Evaluate every available provider target in one run." to="/test/full" />
          <TestCard icon={<FileAudio className="h-7 w-7" />} title="Sample-Based Test" description="Record or choose sample audio before comparing providers." to="/samples/new" />
          <TestCard icon={<Bot className="h-7 w-7" />} title="Provider Test" description="Start from a configured provider or model on the dashboard." to="/" />
        </div>
      </div>
    </AppShell>
  );
}

function TestCard({ icon, title, description, to }: { icon: ReactNode; title: string; description: string; to: string }) {
  return (
    <ShellCard className="p-5">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-teal-50 text-teal-700">{icon}</div>
      <h2 className="mt-4 font-bold text-slate-950">{title}</h2>
      <p className="mt-2 min-h-16 text-sm leading-6 text-slate-600">{description}</p>
      <Link to={to} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800">
        Open
        <Play className="h-4 w-4" />
      </Link>
    </ShellCard>
  );
}
