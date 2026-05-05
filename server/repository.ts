import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import type { RunTarget } from './providers/types';
import type { ScoreResult } from './scoring';

export interface TestCaseRecord {
    id: string;
    createdAt: number;
    audioPath: string;
    mimeType: string;
    expectedTranscript: string;
    birdTerms: string[];
    notes: string;
    tags: string[];
}

export interface RunRecord {
    id: string;
    testCaseId: string;
    mode: string;
    createdAt: number;
    status: string;
    testCase?: TestCaseRecord;
    results?: ResultRecord[];
}

export interface ResultRecord {
    id: string;
    runId: string;
    providerId: string;
    providerName: string;
    modelId: string;
    methodId: string;
    methodName: string;
    status: string;
    transcript: string;
    error: string;
    latencyMs: number;
    scores: ScoreResult | null;
    matchedBirds: string[];
    missedBirds: string[];
    falsePositiveBirds: string[];
    costEstimate: string;
    manualGrade: number | null;
    manualNotes: string;
    acceptedTranscript: string;
    reviewedAt: number | null;
}

export interface CreateRunInput {
    audioPath: string;
    mimeType: string;
    expectedTranscript: string;
    birdTerms: string[];
    mode: string;
    notes: string;
    tags: string[];
}

export interface CreateResultInput {
    runId: string;
    target: RunTarget;
    providerName: string;
    methodName: string;
    status: string;
    transcript: string;
    error: string;
    latencyMs: number;
    scores: ScoreResult | null;
    costEstimate?: string;
}

const storageDir = path.join(process.cwd(), 'data', 'benchmark');
const recordingsDir = path.join(storageDir, 'recordings');
const dbPath = path.join(storageDir, 'ornitho-benchmark.sqlite');

function ensureStorage(): void {
    fs.mkdirSync(recordingsDir, { recursive: true });
}

function parseJsonArray(value: unknown): string[] {
    if (typeof value !== 'string' || !value) {
        return [];
    }

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
        return [];
    }
}

function parseScore(value: unknown): ScoreResult | null {
    if (typeof value !== 'string' || !value) {
        return null;
    }

    try {
        return JSON.parse(value) as ScoreResult;
    } catch {
        return null;
    }
}

function textValue(row: Record<string, unknown>, key: string): string {
    const value = row[key];
    return typeof value === 'string' ? value : '';
}

function numberValue(row: Record<string, unknown>, key: string): number {
    const value = row[key];
    return typeof value === 'number' ? value : 0;
}

function nullableNumber(row: Record<string, unknown>, key: string): number | null {
    const value = row[key];
    return typeof value === 'number' ? value : null;
}

export class BenchmarkRepository {
    private db: DatabaseSync;

    constructor() {
        ensureStorage();
        this.db = new DatabaseSync(dbPath);
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS test_cases (
                id TEXT PRIMARY KEY,
                created_at INTEGER NOT NULL,
                audio_path TEXT NOT NULL,
                mime_type TEXT NOT NULL,
                expected_transcript TEXT NOT NULL,
                bird_terms_json TEXT NOT NULL,
                notes TEXT NOT NULL,
                tags_json TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS runs (
                id TEXT PRIMARY KEY,
                test_case_id TEXT NOT NULL,
                mode TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                status TEXT NOT NULL,
                FOREIGN KEY(test_case_id) REFERENCES test_cases(id)
            );

            CREATE TABLE IF NOT EXISTS results (
                id TEXT PRIMARY KEY,
                run_id TEXT NOT NULL,
                provider_id TEXT NOT NULL,
                provider_name TEXT NOT NULL,
                model_id TEXT NOT NULL,
                method_id TEXT NOT NULL,
                method_name TEXT NOT NULL,
                status TEXT NOT NULL,
                transcript TEXT NOT NULL,
                error TEXT NOT NULL,
                latency_ms INTEGER NOT NULL,
                scores_json TEXT,
                matched_birds_json TEXT NOT NULL,
                missed_birds_json TEXT NOT NULL,
                false_positive_birds_json TEXT NOT NULL,
                cost_estimate TEXT NOT NULL,
                manual_grade INTEGER,
                manual_notes TEXT NOT NULL DEFAULT '',
                accepted_transcript TEXT NOT NULL DEFAULT '',
                reviewed_at INTEGER,
                FOREIGN KEY(run_id) REFERENCES runs(id)
            );
        `);
    }

    getRecordingsDir(): string {
        ensureStorage();
        return recordingsDir;
    }

    createRun(input: CreateRunInput): RunRecord {
        const testCaseId = crypto.randomUUID();
        const runId = crypto.randomUUID();
        const createdAt = Date.now();

        this.db.prepare(`
            INSERT INTO test_cases (id, created_at, audio_path, mime_type, expected_transcript, bird_terms_json, notes, tags_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            testCaseId,
            createdAt,
            input.audioPath,
            input.mimeType,
            input.expectedTranscript,
            JSON.stringify(input.birdTerms),
            input.notes,
            JSON.stringify(input.tags),
        );

        this.db.prepare(`
            INSERT INTO runs (id, test_case_id, mode, created_at, status)
            VALUES (?, ?, ?, ?, ?)
        `).run(runId, testCaseId, input.mode, createdAt, 'running');

        return {
            id: runId,
            testCaseId,
            mode: input.mode,
            createdAt,
            status: 'running',
        };
    }

    finishRun(runId: string, status: string): void {
        this.db.prepare('UPDATE runs SET status = ? WHERE id = ?').run(status, runId);
    }

    createResult(input: CreateResultInput): ResultRecord {
        const id = crypto.randomUUID();
        const matchedBirds = input.scores?.matchedBirds || [];
        const missedBirds = input.scores?.missedBirds || [];
        const falsePositiveBirds = input.scores?.falsePositiveBirds || [];

        this.db.prepare(`
            INSERT INTO results (
                id, run_id, provider_id, provider_name, model_id, method_id, method_name,
                status, transcript, error, latency_ms, scores_json, matched_birds_json,
                missed_birds_json, false_positive_birds_json, cost_estimate
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id,
            input.runId,
            input.target.providerId,
            input.providerName,
            input.target.modelId,
            input.target.methodId,
            input.methodName,
            input.status,
            input.transcript,
            input.error,
            input.latencyMs,
            input.scores ? JSON.stringify(input.scores) : null,
            JSON.stringify(matchedBirds),
            JSON.stringify(missedBirds),
            JSON.stringify(falsePositiveBirds),
            input.costEstimate || '',
        );

        const result = this.getResult(id);
        if (!result) {
            throw new Error('Result was not saved');
        }

        return result;
    }

    gradeResult(id: string, grade: number | null, manualNotes: string, acceptedTranscript: string): ResultRecord | null {
        this.db.prepare(`
            UPDATE results
            SET manual_grade = ?, manual_notes = ?, accepted_transcript = ?, reviewed_at = ?
            WHERE id = ?
        `).run(grade, manualNotes, acceptedTranscript, Date.now(), id);

        return this.getResult(id);
    }

    getRun(id: string): RunRecord | null {
        const row = this.db.prepare('SELECT * FROM runs WHERE id = ?').get(id) as Record<string, unknown> | undefined;
        if (!row) {
            return null;
        }

        const testCase = this.getTestCase(textValue(row, 'test_case_id'));
        const results = this.listResultsForRun(id);
        return {
            id: textValue(row, 'id'),
            testCaseId: textValue(row, 'test_case_id'),
            mode: textValue(row, 'mode'),
            createdAt: numberValue(row, 'created_at'),
            status: textValue(row, 'status'),
            testCase: testCase || undefined,
            results,
        };
    }

    listRuns(limit = 25): RunRecord[] {
        const rows = this.db.prepare('SELECT * FROM runs ORDER BY created_at DESC LIMIT ?').all(limit) as Record<string, unknown>[];
        return rows.map((row) => this.getRun(textValue(row, 'id'))).filter((run): run is RunRecord => Boolean(run));
    }

    private getTestCase(id: string): TestCaseRecord | null {
        const row = this.db.prepare('SELECT * FROM test_cases WHERE id = ?').get(id) as Record<string, unknown> | undefined;
        if (!row) {
            return null;
        }

        return {
            id: textValue(row, 'id'),
            createdAt: numberValue(row, 'created_at'),
            audioPath: textValue(row, 'audio_path'),
            mimeType: textValue(row, 'mime_type'),
            expectedTranscript: textValue(row, 'expected_transcript'),
            birdTerms: parseJsonArray(row.bird_terms_json),
            notes: textValue(row, 'notes'),
            tags: parseJsonArray(row.tags_json),
        };
    }

    private getResult(id: string): ResultRecord | null {
        const row = this.db.prepare('SELECT * FROM results WHERE id = ?').get(id) as Record<string, unknown> | undefined;
        return row ? this.mapResult(row) : null;
    }

    private listResultsForRun(runId: string): ResultRecord[] {
        const rows = this.db.prepare('SELECT * FROM results WHERE run_id = ? ORDER BY latency_ms ASC, provider_name ASC').all(runId) as Record<string, unknown>[];
        return rows.map((row) => this.mapResult(row));
    }

    private mapResult(row: Record<string, unknown>): ResultRecord {
        return {
            id: textValue(row, 'id'),
            runId: textValue(row, 'run_id'),
            providerId: textValue(row, 'provider_id'),
            providerName: textValue(row, 'provider_name'),
            modelId: textValue(row, 'model_id'),
            methodId: textValue(row, 'method_id'),
            methodName: textValue(row, 'method_name'),
            status: textValue(row, 'status'),
            transcript: textValue(row, 'transcript'),
            error: textValue(row, 'error'),
            latencyMs: numberValue(row, 'latency_ms'),
            scores: parseScore(row.scores_json),
            matchedBirds: parseJsonArray(row.matched_birds_json),
            missedBirds: parseJsonArray(row.missed_birds_json),
            falsePositiveBirds: parseJsonArray(row.false_positive_birds_json),
            costEstimate: textValue(row, 'cost_estimate'),
            manualGrade: nullableNumber(row, 'manual_grade'),
            manualNotes: textValue(row, 'manual_notes'),
            acceptedTranscript: textValue(row, 'accepted_transcript'),
            reviewedAt: nullableNumber(row, 'reviewed_at'),
        };
    }
}
