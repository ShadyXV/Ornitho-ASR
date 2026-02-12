import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Settings, Activity } from 'lucide-react';
import { useASR } from '../context/ASRContext';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

export const Dashboard: React.FC = () => {
    const { currentProviderId, selectProvider, providers, transcribe, isTranscribing } = useASR();
    const { isRecording, startRecording, stopRecording, audioBlob, visualizerData, error } = useVoiceRecorder();

    const [prompt, setPrompt] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Auto-transcribe when recording stops and blob is available
    useEffect(() => {
        if (audioBlob && !isRecording) {
            transcribe(audioBlob, { prompt });
        }
    }, [audioBlob, isRecording]); // transcribe is stable

    // Visualizer Drawing
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgb(255, 255, 255)'; // or transparent

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

            {/* Header / Method Selection */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-600" />
                        ASR Control Center
                    </h2>
                    <p className="text-sm text-slate-500">Select a model and start recording</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {providers.map(provider => (
                        <button
                            key={provider.id}
                            onClick={() => selectProvider(provider.id)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${currentProviderId === provider.id
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {provider.name.split(' ')[0]} {/* Simplified name for tab */}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Recording Area */}
            <div className="flex flex-col items-center justify-center py-8">

                <div className="relative mb-6">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isTranscribing}
                        className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording
                                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 scale-110'
                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30'
                            } ${isTranscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isRecording ? (
                            <Square className="w-10 h-10 text-white fill-current" />
                        ) : (
                            <Mic className="w-10 h-10 text-white" />
                        )}
                    </button>

                    {isRecording && (
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-bold text-red-500 animate-pulse bg-white px-2 py-0.5 rounded-full border border-red-100">
                            RECORDING
                        </span>
                    )}
                </div>

                {/* Visualizer Canvas */}
                <canvas
                    ref={canvasRef}
                    width={300}
                    height={60}
                    className="w-full max-w-md h-16 bg-slate-50 rounded-lg mb-4"
                />

                {error && (
                    <div className="text-red-500 text-sm mb-4 bg-red-50 px-3 py-1 rounded">
                        {error}
                    </div>
                )}

                {isTranscribing && (
                    <div className="flex items-center gap-2 text-indigo-600 font-medium animate-pulse">
                        <Activity className="w-4 h-4 animate-spin" />
                        Transcribing audio...
                    </div>
                )}

            </div>

            {/* Contextual Settings (Only for Prompted) */}
            {currentProviderId === 'whisper-prompted' && (
                <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Contextual Prompts (Bird List / Domain Terms)
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter list of bird names, technical terms, or context here..."
                        className="w-full h-24 p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-800 placeholder:text-slate-400"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        These terms will be provided to the model to improve recognition accuracy.
                    </p>
                </div>
            )}

        </div>
    );
};
