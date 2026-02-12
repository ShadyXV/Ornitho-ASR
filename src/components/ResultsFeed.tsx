import React from 'react';
import { Clock, FileText, BarChart2 } from 'lucide-react';
import { useASR } from '../context/ASRContext';
import type { TestResult } from '../services/repository/TestResultsRepository';

export const ResultsFeed: React.FC = () => {
    const { history, clearHistory } = useASR();

    if (history.length === 0) {
        return (
            <div className="text-center py-10 text-slate-400">
                <p>No recording history yet. Start testing above.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-lg font-medium text-slate-700">Test Results</h3>
                <button
                    onClick={clearHistory}
                    className="text-xs text-red-500 hover:text-red-700"
                >
                    Clear All
                </button>
            </div>

            <div className="flex flex-col gap-4">
                {history.map((result) => (
                    <ResultCard key={result.id} result={result} />
                ))}
            </div>
        </div>
    );
};

const ResultCard: React.FC<{ result: TestResult }> = ({ result }) => {
    // Helper to format timestamp
    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleString();
    };

    // Word count
    const wordCount = result.transcription.trim().split(/\s+/).length;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${result.methodId.includes('vosk') ? 'bg-amber-100 text-amber-700' :
                        result.methodId.includes('prompted') ? 'bg-purple-100 text-purple-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                        {result.methodName}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(result.timestamp)}
                    </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                    {result.durationMs}ms
                </div>
            </div>

            <div className="mb-4">
                <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-slate-300 mt-1 shrink-0" />
                    <p className="text-slate-800 text-lg leading-relaxed font-medium">
                        {result.transcription || <span className="text-slate-300 italic">No speech detected</span>}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <div className="flex items-center gap-4">
                    {result.audioBase64 && (
                        <audio controls src={result.audioBase64} className="h-8 w-64" />
                    )}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                    <BarChart2 className="w-3 h-3" />
                    {wordCount} words
                </div>
            </div>
        </div>
    );
};
