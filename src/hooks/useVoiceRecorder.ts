import { useState, useRef, useCallback } from 'react';

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
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const startRecording = useCallback(async () => {
        try {
            setError(null);
            setAudioBlob(null);
            chunksRef.current = [];

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Visualizer Setup
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            sourceRef.current = source;

            // MediaRecorder Setup
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/wav')) {
                mimeType = 'audio/wav';
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const fullBlob = new Blob(chunksRef.current, { type: mimeType });
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
                setVisualizerData(new Uint8Array(dataArray)); // Copy to trigger state update if needed, strictly speaking state updates on every frame is heavy, but for this demo it's fine. 
                // Note: For better performance in production, use a ref for the canvas and draw directly instead of state updates.
                // But the requirement says "visualizer data... to show the user they are actually making noise". 
                // Passing data back via state is okay for simple UI indicators.

                if (mediaRecorder.state === 'recording') {
                    animationFrameRef.current = requestAnimationFrame(updateVisualizer);
                }
            };

            updateVisualizer();

        } catch (err: any) {
            setError(err.message || 'Could not start recording');
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
