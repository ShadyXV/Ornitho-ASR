import { ASRProviderComponent } from './context/ASRContext';
import { Dashboard } from './components/Dashboard';
import { ResultsFeed } from './components/ResultsFeed';
import { Mic2 } from 'lucide-react';

function App() {
  return (
    <ASRProviderComponent>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">

        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-500/20 shadow-lg">
                <Mic2 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-indigo-500 bg-clip-text text-transparent">
                Ornitho-ASR Lab
              </h1>
            </div>
            <div className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded">
              v0.1.0-alpha
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">

          <section>
            <Dashboard />
          </section>

          <section>
            <ResultsFeed />
          </section>

        </main>

        {/* Footer */}
        <footer className="text-center py-8 text-slate-400 text-sm">
          <p>© 2024 Ornitho-ASR Lab. Research & Development.</p>
        </footer>

      </div>
    </ASRProviderComponent>
  );
}

export default App;
