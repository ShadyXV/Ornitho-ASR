import { useState, useRef, useCallback } from 'react';

declare global {
    interface Window {
        webkitAudioContext?: typeof AudioContext;
    }
}

export interface UseVoiceRecorderReturn {
    isRecording: boolean;
    audioBlob: Blob | null;
    visualizerData: Uint8Array;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    error: string | null;
}

export const useVoiceRecorder = (): UseVoiceRecorderReturn => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [visualizerData, setVisualizerData] = useState<Uint8Array>(new Uint8Array(0));

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const animationFrameRef = useRef<number | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const startRecording = useCallback(async () => {
        try {
            setError(null);
            setAudioBlob(null);
            chunksRef.current = [];

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Visualizer Setup
            const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextConstructor) {
                throw new Error('Audio recording is not supported in this browser');
            }

            const audioContext = new AudioContextConstructor();
            audioContextRef.current = audioContext;
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            // MediaRecorder Setup
            // Prefer webm/opus for consistency with our server strategy expectation
            let mimeType = 'audio/webm;codecs=opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/webm'; // Fallback
            }
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = ''; // Let browser decide
            }

            const options = mimeType ? { mimeType } : undefined;
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const finalType = mediaRecorder.mimeType || 'audio/webm';
                const fullBlob = new Blob(chunksRef.current, { type: finalType });
                setAudioBlob(fullBlob);

                // Cleanup stream tracks
                stream.getTracks().forEach(track => track.stop());

                // Cleanup AudioContext
                if (audioContextRef.current?.state !== 'closed') {
                    audioContextRef.current?.close();
                }
            };

            mediaRecorder.start();
            setIsRecording(true);

            // Animation Loop for Visualizer
            const updateVisualizer = () => {
                if (!analyserRef.current) return;
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);
                // Intentionally causing re-render for visualization
                setVisualizerData(new Uint8Array(dataArray));

                if (mediaRecorder.state === 'recording') {
                    animationFrameRef.current = requestAnimationFrame(updateVisualizer);
                }
            };

            updateVisualizer();

        } catch (err: unknown) {
            console.error("Recording error:", err);
            setError(err instanceof Error ? err.message : 'Could not start recording');
            setIsRecording(false);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }
    }, []);

    return {
        isRecording,
        audioBlob,
        visualizerData,
        startRecording,
        stopRecording,
        error
    };
};
