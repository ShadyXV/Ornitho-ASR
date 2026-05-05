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

function defaultSampleTarget(): RunTarget | null {
    const providerPreference = ['openai', 'deepgram', 'google'];
    const providers = getPublicProviders().filter((provider) => provider.available);
    const orderedProviders = [
        ...providerPreference
            .map((id) => providers.find((provider) => provider.id === id))
            .filter((provider): provider is NonNullable<typeof provider> => Boolean(provider)),
        ...providers.filter((provider) => !providerPreference.includes(provider.id)),
    ];

    for (const provider of orderedProviders) {
        const baseline = provider.methods.find((method) => method.kind === 'baseline' && method.models.length > 0);
        if (baseline) {
            return {
                providerId: provider.id,
                modelId: baseline.models[0],
                methodId: baseline.id,
            };
        }
    }

    return null;
}

async function transcribeSample(params: {
    audioBuffer: Buffer;
    audioPath: string;
    mimeType: string;
    target: RunTarget;
}): Promise<{ transcript: string; providerName: string; target: RunTarget; costEstimate: string }> {
    const validation = validateTarget(params.target);
    if (!validation.ok) {
        throw new Error(validation.reason);
    }

    const provider = findProvider(params.target.providerId);
    if (!provider) {
        throw new Error('Provider not found');
    }

    const output = await provider.transcribe({
        audioBuffer: params.audioBuffer,
        audioPath: params.audioPath,
        mimeType: params.mimeType,
        modelId: params.target.modelId,
        methodId: params.target.methodId,
        birdTerms: [],
        expectedTranscript: '',
        previousTranscript: '',
    });

    return {
        transcript: output.text,
        providerName: provider.name,
        target: params.target,
        costEstimate: output.costEstimate || '',
    };
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

app.get('/api/samples', (_req: Request, res: Response) => {
    res.json({ samples: repository.listSamples() });
});

app.get('/api/samples/:id', (req: Request, res: Response) => {
    const sample = repository.getSample(req.params.id);
    if (!sample) {
        res.status(404).json({ error: 'Sample not found' });
        return;
    }

    res.json({ sample });
});

app.post('/api/samples/transcribe', upload.single('audio'), async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
        res.status(400).json({ error: 'No audio file provided' });
        return;
    }

    const parsedTargets = parseTargets(req.body.selectedTargets);
    const target = parsedTargets[0] || defaultSampleTarget();
    if (!target) {
        res.status(400).json({ error: 'Add a provider key before auto-generating a transcript.' });
        return;
    }

    try {
        const result = await transcribeSample({
            audioBuffer: fs.readFileSync(file.path),
            audioPath: file.path,
            mimeType: file.mimetype || 'audio/webm',
            target,
        });
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: errorMessage(error) });
    }
});

app.post('/api/samples', upload.single('audio'), (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
        res.status(400).json({ error: 'No audio file provided' });
        return;
    }

    const parsedTargets = parseTargets(req.body.selectedTargets);
    const target = parsedTargets[0] || defaultSampleTarget() || {
        providerId: '',
        modelId: '',
        methodId: '',
    };

    const sample = repository.createSample({
        audioPath: file.path,
        mimeType: file.mimetype || 'audio/webm',
        transcript: parseStringField(req.body.transcript),
        birdTerms: splitTerms(parseStringField(req.body.birdTerms)),
        notes: parseStringField(req.body.notes),
        tags: parseTags(req.body.tags),
        sourceProviderId: parseStringField(req.body.sourceProviderId) || target.providerId,
        sourceModelId: parseStringField(req.body.sourceModelId) || target.modelId,
        sourceMethodId: parseStringField(req.body.sourceMethodId) || target.methodId,
        transcriptStatus: parseStringField(req.body.transcriptStatus) || 'manual',
    });

    res.json({ sample });
});

app.patch('/api/samples/:id', (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const sample = repository.updateSample(req.params.id, {
        transcript: parseStringField(body.transcript),
        birdTerms: splitTerms(parseStringField(body.birdTerms)),
        notes: parseStringField(body.notes),
        tags: parseTags(body.tags),
        transcriptStatus: parseStringField(body.transcriptStatus) || 'edited',
    });

    if (!sample) {
        res.status(404).json({ error: 'Sample not found' });
        return;
    }

    res.json({ sample });
});

app.post('/api/runs', upload.single('audio'), async (req: Request, res: Response) => {
    const sampleId = parseStringField(req.body.sampleId);
    const sample = sampleId ? repository.getSample(sampleId) : null;
    const file = req.file;
    if (!file && !sample) {
        res.status(400).json({ error: 'No audio file provided' });
        return;
    }

    const expectedTranscript = parseStringField(req.body.expectedTranscript) || sample?.transcript || '';
    const birdTerms = splitTerms(parseStringField(req.body.birdTerms) || sample?.birdTerms.join(', ') || '');
    const previousTranscript = parseStringField(req.body.previousTranscript);
    const targets = parseTargets(req.body.selectedTargets);
    const selectedTargets = targets.length > 0 ? targets : defaultTargets();
    const audioPath = file?.path || sample?.audioPath || '';
    const mimeType = file?.mimetype || sample?.mimeType || 'audio/webm';
    const audioBuffer = fs.readFileSync(audioPath);

    const run = repository.createRun({
        audioPath,
        mimeType,
        expectedTranscript,
        birdTerms,
        mode: parseStringField(req.body.mode) || 'blind',
        notes: parseStringField(req.body.notes) || sample?.notes || '',
        tags: parseTags(req.body.tags).length > 0 ? parseTags(req.body.tags) : sample?.tags || [],
        sampleId: sample?.id,
    });

    await runTargets({
        runId: run.id,
        audioBuffer,
        audioPath,
        mimeType,
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
