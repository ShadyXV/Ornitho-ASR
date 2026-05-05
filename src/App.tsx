import { Bird } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { ResultsFeed } from './components/ResultsFeed';
import { useASRTests } from './hooks/useASRTests';

function App() {
  const { testResults, runTest, isLoading, clearResults, error } = useASRTests();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Bird className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              Bird-ASR Comparison Lab
            </h1>
          </div>
          <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-500">
            v0.2.0-beta
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Error Toast */}
        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Dashboard */}
        <section>
          <Dashboard onRunTest={runTest} isProcessing={isLoading} />
        </section>

        {/* Results Feed */}
        <section>
          <ResultsFeed results={testResults} onClear={clearResults} />
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center text-slate-400 text-sm">
          <p>© 2024 Ornitho-ASR Lab. Research Tool.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
