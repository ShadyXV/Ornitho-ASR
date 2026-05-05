import express, { type Request, type Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import dotenv from 'dotenv';
import { BenchmarkRepository } from './repository';
import { findProvider, getPublicProviders, validateTarget } from './providers/registry';
import type { RunTarget } from './providers/types';
import { requiredEnvKeys, setSessionKeys } from './runtimeConfig';
import { scoreTranscript, splitTerms } from './scoring';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
const repository = new BenchmarkRepository();
const upload = multer({ dest: repository.getRecordingsDir() });

app.use(cors());
app.use(express.json());

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

function parseTargets(value: unknown): RunTarget[] {
    if (typeof value !== 'string' || !value.trim()) {
        return [];
    }

    try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
            .map((item) => ({
                providerId: String(item.providerId || ''),
                modelId: String(item.modelId || ''),
                methodId: String(item.methodId || ''),
            }))
            .filter((item) => item.providerId && item.modelId && item.methodId);
    } catch {
        return [];
    }
}

function defaultTargets(): RunTarget[] {
    return getPublicProviders()
        .filter((provider) => provider.available)
        .flatMap((provider) => provider.methods.flatMap((method) => method.models.map((modelId) => ({
            providerId: provider.id,
            modelId,
            methodId: method.id,
        }))));
}

function parseStringField(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

function parseTags(value: unknown): string[] {
    return splitTerms(parseStringField(value));
}

async function runTargets(params: {
    runId: string;
    audioBuffer: Buffer;
    audioPath: string;
    mimeType: string;
    birdTerms: string[];
    expectedTranscript: string;
    previousTranscript: string;
    targets: RunTarget[];
}): Promise<void> {
    for (const target of params.targets) {
        const validation = validateTarget(target);
        if (!validation.ok) {
            continue;
        }

        const provider = findProvider(target.providerId);
        const method = provider?.methods.find((item) => item.id === target.methodId);
        if (!provider || !method) {
            continue;
        }

        if (method.requiresBirdTerms && params.birdTerms.length === 0) {
            repository.createResult({
                runId: params.runId,
                target,
                providerName: provider.name,
                methodName: method.name,
                status: 'skipped',
                transcript: '',
                error: 'This method needs expected bird terms.',
                latencyMs: 0,
                scores: null,
            });
            continue;
        }

        const start = Date.now();
        try {
            const output = await provider.transcribe({
                audioBuffer: params.audioBuffer,
                audioPath: params.audioPath,
                mimeType: params.mimeType,
                modelId: target.modelId,
                methodId: target.methodId,
                birdTerms: params.birdTerms,
                expectedTranscript: params.expectedTranscript,
                previousTranscript: params.previousTranscript,
            });
            const latencyMs = Date.now() - start;
            const scores = scoreTranscript(output.text, params.expectedTranscript, params.birdTerms);

            repository.createResult({
                runId: params.runId,
                target,
                providerName: provider.name,
                methodName: method.name,
                status: 'completed',
                transcript: output.text,
                error: '',
                latencyMs,
                scores,
                costEstimate: output.costEstimate,
            });
        } catch (error) {
            repository.createResult({
                runId: params.runId,
                target,
                providerName: provider.name,
                methodName: method.name,
                status: 'error',
                transcript: '',
                error: errorMessage(error),
                latencyMs: Date.now() - start,
                scores: null,
            });
        }
    }
}

app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/providers', (_req: Request, res: Response) => {
    res.json({ providers: getPublicProviders() });
});

app.post('/api/session-keys', (req: Request, res: Response) => {
    const body = req.body as { keys?: Record<string, string> };
    const allowedKeys: Partial<Record<typeof requiredEnvKeys[number], string>> = {};

    for (const key of requiredEnvKeys) {
        const value = body.keys?.[key];
        if (typeof value === 'string') {
            allowedKeys[key] = value;
        }
    }

    setSessionKeys(allowedKeys);
    res.json({ providers: getPublicProviders() });
});

app.get('/api/runs', (_req: Request, res: Response) => {
    res.json({ runs: repository.listRuns() });
});

app.get('/api/runs/:id', (req: Request, res: Response) => {
    const run = repository.getRun(req.params.id);
    if (!run) {
        res.status(404).json({ error: 'Run not found' });
        return;
    }

    res.json({ run });
});

app.post('/api/runs', upload.single('audio'), async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
        res.status(400).json({ error: 'No audio file provided' });
        return;
    }

    const expectedTranscript = parseStringField(req.body.expectedTranscript);
    const birdTerms = splitTerms(parseStringField(req.body.birdTerms));
    const previousTranscript = parseStringField(req.body.previousTranscript);
    const targets = parseTargets(req.body.selectedTargets);
    const selectedTargets = targets.length > 0 ? targets : defaultTargets();
    const audioBuffer = fs.readFileSync(file.path);

    const run = repository.createRun({
        audioPath: file.path,
        mimeType: file.mimetype || 'audio/webm',
        expectedTranscript,
        birdTerms,
        mode: parseStringField(req.body.mode) || 'blind',
        notes: parseStringField(req.body.notes),
        tags: parseTags(req.body.tags),
    });

    await runTargets({
        runId: run.id,
        audioBuffer,
        audioPath: file.path,
        mimeType: file.mimetype || 'audio/webm',
        birdTerms,
        expectedTranscript,
        previousTranscript,
        targets: selectedTargets,
    });

    repository.finishRun(run.id, 'completed');
    res.json({ run: repository.getRun(run.id) });
});

app.post('/api/runs/:id/rerun', async (req: Request, res: Response) => {
    const sourceRun = repository.getRun(req.params.id);
    if (!sourceRun?.testCase) {
        res.status(404).json({ error: 'Run not found' });
        return;
    }

    const targets = parseTargets(req.body?.selectedTargets);
    const selectedTargets = targets.length > 0 ? targets : defaultTargets();
    const testCase = sourceRun.testCase;
    const audioBuffer = fs.readFileSync(testCase.audioPath);
    const run = repository.createRun({
        audioPath: testCase.audioPath,
        mimeType: testCase.mimeType,
        expectedTranscript: testCase.expectedTranscript,
        birdTerms: testCase.birdTerms,
        mode: 'regression',
        notes: testCase.notes,
        tags: [...testCase.tags, 'regression'],
    });

    await runTargets({
        runId: run.id,
        audioBuffer,
        audioPath: testCase.audioPath,
        mimeType: testCase.mimeType,
        birdTerms: testCase.birdTerms,
        expectedTranscript: testCase.expectedTranscript,
        previousTranscript: '',
        targets: selectedTargets,
    });

    repository.finishRun(run.id, 'completed');
    res.json({ run: repository.getRun(run.id) });
});

app.post('/api/results/:id/grade', (req: Request, res: Response) => {
    const body = req.body as { manualGrade?: unknown; manualNotes?: unknown; acceptedTranscript?: unknown };
    const numericGrade = typeof body.manualGrade === 'number' ? body.manualGrade : null;
    const manualGrade = numericGrade !== null && numericGrade >= 1 && numericGrade <= 5 ? numericGrade : null;
    const result = repository.gradeResult(
        req.params.id,
        manualGrade,
        parseStringField(body.manualNotes),
        parseStringField(body.acceptedTranscript),
    );

    if (!result) {
        res.status(404).json({ error: 'Result not found' });
        return;
    }

    res.json({ result });
});

app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}`);
});
