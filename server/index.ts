import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// File upload configuration
const upload = multer({ dest: 'uploads/' });

// OpenAI Configuration
const apiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI | null = null;
if (apiKey) {
    openai = new OpenAI({ apiKey });
} else {
    console.warn('OPENAI_API_KEY not found. Transcriptions will fail.');
}

import { TranscriptionStrategy } from './strategies/TranscriptionStrategy';
import { WhisperPromptStrategy } from './strategies/WhisperPromptStrategy';
import { DeepgramBoostStrategy } from './strategies/DeepgramBoostStrategy';
import { GoogleSpeechContextStrategy } from './strategies/GoogleSpeechContextStrategy';

// Strategies Registry
const strategies: Record<string, TranscriptionStrategy> = {
    'whisper-prompt': new WhisperPromptStrategy(),
    'deepgram-boost': new DeepgramBoostStrategy(),
    'google-context': new GoogleSpeechContextStrategy(),
};

// Unified Endpoint
app.post('/api/test-asr', upload.single('audio'), async (req, res): Promise<any> => {
    const strategyId = req.body.strategyId;
    const birdListStr = req.body.birdList || '';
    const birdList = birdListStr.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
    const audioFile = req.file;

    if (!audioFile) {
        return res.status(400).json({ error: 'No audio file provided' });
    }

    if (!strategyId || !strategies[strategyId]) {
        return res.status(400).json({ error: `Invalid or missing strategyId. Available: ${Object.keys(strategies).join(', ')}` });
    }

    console.log(`Received test-asr request. Strategy: ${strategyId}, Birds: ${birdList.length}, File: ${audioFile.path}`);

    try {
        const audioBuffer = fs.readFileSync(audioFile.path);
        const strategy = strategies[strategyId];
        const transcription = await strategy.transcribe(audioBuffer, birdList);

        res.json({
            text: transcription,
            provider: strategy.name,
            strategyId: strategyId
        });

    } catch (error: any) {
        console.error('Transcription error:', error);
        res.status(500).json({ error: error.message || 'Transcription failed' });
    } finally {
        // Cleanup upload
        if (fs.existsSync(audioFile.path)) {
            fs.unlink(audioFile.path, (err) => {
                if (err) console.error('Error deleting temp file:', err);
            });
        }
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
