# Ornitho ASR

Ornitho ASR is a small test app for trying speech-to-text tools with bird names.

The app records audio in the browser, sends it to a local server, and shows the
transcription result. You can add a comma-separated bird list so each provider
gets some context for the words you expect.

## What it does

- Records audio from the browser microphone.
- Lets you choose one ASR strategy before recording.
- Sends the recording and bird list to the local API.
- Shows the returned text, response time, word count, and the saved audio clip.
- Stores test results in browser local storage until you clear them.

## ASR strategies

The server currently has three strategies:

- `whisper-prompt`: OpenAI Whisper with a short bird-list prompt.
- `deepgram-boost`: Deepgram with boosted bird-name keywords.
- `google-context`: Google Speech-to-Text with speech context phrases.

These are simple wrappers around each provider. They are useful for quick
manual checks, not for a full accuracy benchmark.

## Project structure

```text
src/                    React app
src/components/          Recorder and results UI
src/hooks/               Recording and ASR test hooks
src/services/            Local result storage and older provider interfaces
server/                  Express API server
server/strategies/       Provider-specific transcription strategies
data/eng-birds.txt       Bird-name data file
```

## Requirements

- Node.js
- npm
- API credentials for the provider you want to test
- A browser with microphone access

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root if you need provider credentials:

```bash
OPENAI_API_KEY=your_openai_key
DEEPGRAM_API_KEY=your_deepgram_key
GOOGLE_APPLICATION_CREDENTIALS=/path/to/google-service-account.json
```

You only need the key for the strategy you plan to use.

## Run locally

Start the API server:

```bash
npm run server
```

In another terminal, start the Vite app:

```bash
npm run dev
```

Open the Vite URL shown in the terminal. The Vite dev server proxies `/api`
requests to `http://localhost:3001`.

## Available scripts

```bash
npm run dev      # start the React app
npm run server   # start the local API server
npm run build    # type-check and build the app
npm run lint     # run ESLint
npm run preview  # preview the built app
```

## Notes

- The browser recorder prefers WebM/Opus audio.
- The Google strategy is configured for `WEBM_OPUS` at `48000` Hz.
- The server writes uploaded audio to `uploads/` while processing and then
  removes the temporary file.
- Results are stored only in browser local storage.
- Some older frontend provider classes still point to `/api/transcribe`; the
  current UI uses `/api/test-asr`.

## Current limits

- There is no automated scoring against a reference transcript.
- There is no shared database or user account system.
- Audio is not transcoded before being sent to providers.
- Provider errors are shown in the UI, but retry handling is minimal.
