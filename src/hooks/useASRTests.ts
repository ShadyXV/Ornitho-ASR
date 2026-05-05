import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { type TestResult, TestResultsRepository } from '../services/repository/TestResultsRepository';

// Extend TestResult to include confidence score if needed or new fields
// For now, re-using existing interface but we might want to extend it.
export interface ASRTestResult extends TestResult {
    providerName: string;
    confidence?: number;
}

export const useASRTests = () => {
    const [testResults, setTestResults] = useState<ASRTestResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load initial state
    useEffect(() => {
        const stored = TestResultsRepository.getAll();
        setTestResults(stored as ASRTestResult[]);
    }, []);

    const runTest = useCallback(async (audioBlob: Blob, strategyId: string, birdList: string) => {
        setIsLoading(true);
        setError(null);

        const startTime = Date.now();

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            formData.append('strategyId', strategyId);
            formData.append('birdList', birdList);

            const response = await axios.post('/api/test-asr', formData);
            const { text, provider } = response.data;

            const duration = Date.now() - startTime;

            // Convert Blob to Base64 for storage
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                const base64Audio = reader.result as string;

                const newResult: ASRTestResult = {
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    methodId: strategyId,
                    methodName: provider,
                    transcription: text,
                    durationMs: duration,
                    audioBase64: base64Audio,
                    providerName: provider,
                    // confidence: response.data.confidence // if available
                };

                TestResultsRepository.save(newResult);
                setTestResults(prev => [newResult, ...prev]);
                setIsLoading(false);
            };

        } catch (err: any) {
            console.error("ASR Test failed:", err);
            setError(err.message || "ASR Test Failed");
            setIsLoading(false);
        }
    }, []);

    const clearResults = useCallback(() => {
        TestResultsRepository.clear();
        setTestResults([]);
    }, []);

    return {
        testResults,
        isLoading,
        error,
        runTest,
        clearResults
    };
};
