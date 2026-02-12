export interface TestResult {
    id: string;
    timestamp: number;
    methodId: string;
    methodName: string;
    transcription: string;
    durationMs: number;
    audioBase64?: string;
}

const STORAGE_KEY = 'ornitho-asr-results';

export const TestResultsRepository = {
    save(result: TestResult): void {
        const existing = this.getAll();
        const updated = [result, ...existing];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },

    getAll(): TestResult[] {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    clear(): void {
        localStorage.removeItem(STORAGE_KEY);
    }
};
