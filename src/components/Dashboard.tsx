import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Settings, Activity } from 'lucide-react'; // Added FileAudio for visual
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

interface DashboardProps {
    onRunTest: (blob: Blob, strategyId: string, birdList: string) => void;
    isProcessing: boolean;
}

const STRATEGIES = [
    { id: 'whisper-prompt', name: 'Whisper (Prompted)' },
    { id: 'deepgram-boost', name: 'Deepgram (Boost)' },
    { id: 'google-context', name: 'Google (Context)' }
];

export const Dashboard: React.FC<DashboardProps> = ({ onRunTest, isProcessing }) => {
    const { isRecording, startRecording, stopRecording, audioBlob, visualizerData, error } = useVoiceRecorder();

    const [strategyId, setStrategyId] = useState('whisper-prompt');
    const [birdList, setBirdList] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Auto-transcribe when recording stops and blob is available
    useEffect(() => {
        if (audioBlob && !isRecording) {
            onRunTest(audioBlob, strategyId, birdList);
        }
    }, [audioBlob, isRecording]);

    // Visualizer Drawing
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Draw frequency bars
        const barWidth = (width / visualizerData.length) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < visualizerData.length; i++) {
            barHeight = visualizerData[i] / 2;

            // Gradient or Color based on recording state
            ctx.fillStyle = isRecording ? `rgb(${barHeight + 100}, 50, 50)` : 'rgb(200, 200, 200)';

            ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }

    }, [visualizerData, isRecording]);


    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">

            {/* Header / Config Panel */}
            <div className="flex flex-col lg:flex-row gap-8 mb-8">

                {/* Controls */}
                <div className="flex-1 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2 mb-2">
                            <Activity className="w-5 h-5 text-indigo-600" />
                            ASR Lab Control
                        </h2>
                        <p className="text-sm text-slate-500">Configure your test parameters and record.</p>
                    </div>

                    {/* Strategy Selector */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Transcription Strategy
                        </label>
                        <select
                            value={strategyId}
                            onChange={(e) => setStrategyId(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {STRATEGIES.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Bird List Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Target Vocabulary (Bird List)
                        </label>
                        <textarea
                            value={birdList}
                            onChange={(e) => setBirdList(e.target.value)}
                            placeholder="Peregrine Falcon, Buteo buteo, ..."
                            className="w-full h-24 p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-sm placeholder:text-slate-400"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Comma-separated list to boost or hint to the model.
                        </p>
                    </div>
                </div>

                {/* Recorder Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="relative mb-6">
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isProcessing}
                            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording
                                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 scale-110 animate-pulse'
                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30'
                                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isRecording ? (
                                <Square className="w-12 h-12 text-white fill-current" />
                            ) : (
                                <Mic className="w-12 h-12 text-white" />
                            )}
                        </button>
                    </div>

                    {/* Visualizer Canvas */}
                    <canvas
                        ref={canvasRef}
                        width={300}
                        height={60}
                        className="w-full max-w-sm h-16 bg-white rounded-lg mb-4 border border-slate-200"
                    />

                    {error && (
                        <div className="text-red-500 text-sm mb-4 bg-red-50 px-3 py-1 rounded">
                            {error}
                        </div>
                    )}

                    {isProcessing && (
                        <div className="flex items-center gap-2 text-indigo-600 font-medium animate-pulse">
                            <Activity className="w-4 h-4 animate-spin" />
                            Processing Audio...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
