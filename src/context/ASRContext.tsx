import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ASRProvider } from '../services/asr/ASRProvider';
import { StandardOpenAIProvider } from '../services/asr/StandardOpenAIProvider';
import { WhisperPromptedProvider } from '../services/asr/WhisperPromptedProvider';
import { VoskGrammarProvider } from '../services/asr/VoskGrammarProvider';
import { TestResultsRepository, type TestResult } from '../services/repository/TestResultsRepository';

interface ASRContextType {
    providers: ASRProvider[];
    currentProviderId: string;
    selectProvider: (id: string) => void;
    transcribe: (blob: Blob, options?: any) => Promise<void>;
    isTranscribing: boolean;
    history: TestResult[];
    clearHistory: () => void;
}

const providers: ASRProvider[] = [
    new StandardOpenAIProvider(),
    new WhisperPromptedProvider(),
    new VoskGrammarProvider(),
];

const ASRContext = createContext<ASRContextType | undefined>(undefined);

export const ASRProviderComponent = ({ children }: { children: ReactNode }) => {
    const [currentProviderId, setCurrentProviderId] = useState<string>(providers[0].id);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [history, setHistory] = useState<TestResult[]>([]);

    useEffect(() => {
        setHistory(TestResultsRepository.getAll());
    }, []);

    const selectProvider = (id: string) => {
        if (providers.find(p => p.id === id)) {
            setCurrentProviderId(id);
        }
    };

    const transcribe = async (blob: Blob, options?: any) => {
        setIsTranscribing(true);
        const provider = providers.find(p => p.id === currentProviderId);

        if (!provider) {
            console.error('Provider not found');
            setIsTranscribing(false);
            return;
        }

        const startTime = Date.now();
        try {
            const text = await provider.transcribe(blob, options);
            const duration = Date.now() - startTime;

            // Convert Blob to Base64 for storage (simple solution for demo)
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64Audio = reader.result as string;

                const newResult: TestResult = {
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    methodId: provider.id,
                    methodName: provider.name,
                    transcription: text,
                    durationMs: duration,
                    audioBase64: base64Audio
                };

                try {
                    TestResultsRepository.save(newResult);
                    setHistory(prev => [newResult, ...prev]);
                } catch (e) {
                    console.error("Failed to save result (likely localStorage quota exceeded)", e);
                    // Fallback: save to state without persistence if quota exceeded
                    setHistory(prev => [newResult, ...prev]);
                }
                setIsTranscribing(false); // Move setIsTranscribing here to ensure it runs after save/setHistory
            };

        } catch (error) {
            console.error('Transcription failed', error);
            // Ideally handle error state here
            setIsTranscribing(false); // Ensure setIsTranscribing is called on error too
        }
    };

    const clearHistory = () => {
        TestResultsRepository.clear();
        setHistory([]);
    };

    return (
        <ASRContext.Provider value={{
            providers,
            currentProviderId,
            selectProvider,
            transcribe,
            isTranscribing,
            history,
            clearHistory
        }}>
            {children}
        </ASRContext.Provider>
    );
};

export const useASR = () => {
    const context = useContext(ASRContext);
    if (!context) {
        throw new Error('useASR must be used within an ASRProviderComponent');
    }
    return context;
};
