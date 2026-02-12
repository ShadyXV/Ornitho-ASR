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

// Transcription Route
app.post('/api/transcribe', upload.single('audio'), async (req, res): Promise<any> => {
    const methodId = req.headers['x-method-id'];
    const audioFile = req.file;
    const prompt = req.body.prompt; // Used for context

    if (!audioFile) {
        return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log(`Received transcription request. Method: ${methodId}, File: ${audioFile.path}`);

    try {
        let transcription = '';

        if (methodId === 'standard-openai') {
            if (!openai) throw new Error('OpenAI API Key not configured');
            const response = await openai.audio.transcriptions.create({
                file: fs.createReadStream(audioFile.path),
                model: 'whisper-1',
            });
            transcription = response.text;

        } else if (methodId === 'whisper-prompted') {
            if (!openai) throw new Error('OpenAI API Key not configured');
            const response = await openai.audio.transcriptions.create({
                file: fs.createReadStream(audioFile.path),
                model: 'whisper-1',
                prompt: prompt || '',
            });
            transcription = response.text;

        } else if (methodId === 'vosk-grammar') {
            // Stub for Vosk
            transcription = "[Vosk functionality is currently mocked. ASR successful.]";
        } else {
            // Default fallback or error
            // For now, let's default to standard OpenAI if unknown, or error
            // but better to be explicit.
            if (!methodId) {
                if (!openai) throw new Error('OpenAI API Key not configured');
                const response = await openai.audio.transcriptions.create({
                    file: fs.createReadStream(audioFile.path),
                    model: 'whisper-1',
                });
                transcription = response.text;
            } else {
                return res.status(400).json({ error: 'Unknown method ID' });
            }
        }

        res.json({ text: transcription });

    } catch (error: any) {
        console.error('Transcription error:', error);
        res.status(500).json({ error: error.message || 'Transcription failed' });
    } finally {
        // Cleanup upload
        fs.unlink(audioFile.path, (err) => {
            if (err) console.error('Error deleting temp file:', err);
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
