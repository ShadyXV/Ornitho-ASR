import React from 'react';
import { Clock, FileText, BarChart2 } from 'lucide-react';
import type { ASRTestResult } from '../hooks/useASRTests';

interface ResultsFeedProps {
    results: ASRTestResult[];
    onClear: () => void;
}

export const ResultsFeed: React.FC<ResultsFeedProps> = ({ results, onClear }) => {
    if (results.length === 0) {
        return (
            <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                <p>No recording history yet. Start testing above.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h3 className="text-lg font-medium text-slate-700 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Test Logs
                </h3>
                <button
                    onClick={onClear}
                    className="text-xs font-medium text-red-500 hover:text-red-700 px-3 py-1 bg-red-50 rounded-full transition-colors"
                >
                    Clear History
                </button>
            </div>

            <div className="flex flex-col gap-4">
                {results.map((result) => (
                    <ResultCard key={result.id} result={result} />
                ))}
            </div>
        </div>
    );
};

const ResultCard: React.FC<{ result: ASRTestResult }> = ({ result }) => {
    // Helper to format timestamp
    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleString();
    };

    // Word count
    const wordCount = result.transcription.trim().split(/\s+/).length;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${result.methodId.includes('deepgram') ? 'bg-indigo-100 text-indigo-700' :
                        result.methodId.includes('google') ? 'bg-amber-100 text-amber-700' :
                            'bg-purple-100 text-purple-700'
                        }`}>
                        {result.providerName || result.methodName}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(result.timestamp)}
                    </span>
                </div>
                <div className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    {result.durationMs}ms
                </div>
            </div>

            <div className="mb-4 pl-4 border-l-2 border-slate-200">
                <p className="text-slate-800 text-lg leading-relaxed font-medium">
                    {result.transcription || <span className="text-slate-300 italic">No speech detected</span>}
                </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-4">
                    {result.audioBase64 && (
                        <audio controls src={result.audioBase64} className="h-8 w-64 opacity-80 hover:opacity-100 transition-opacity" />
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {result.confidence !== undefined && (
                        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                            Confidence: {(result.confidence * 100).toFixed(1)}%
                        </div>
                    )}
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                        <BarChart2 className="w-3 h-3" />
                        {wordCount} words
                    </div>
                </div>
            </div>
        </div>
    );
};
