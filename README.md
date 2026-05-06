# Ornitho ASR

Ornitho ASR is a local benchmark app for testing speech-to-text providers on
bird names. The is still work in progress...

The app records or uploads audio, runs the same clip through selected providers
and methods, scores the output, and lets you add a manual grade.

## What it does

- Shows which providers are available from local keys.
- Records audio in the browser or accepts an uploaded audio file.
- Runs one audio sample against many provider, model, and method combinations.
- Stores test cases, runs, results, scores, and manual grades in SQLite.
- Scores transcripts with word error rate, bird-name recall, bird-name
  precision, matched birds, missed birds, and likely false positives.
- Exports saved runs as JSON or CSV.

## Providers and methods

The server uses provider plugins. Each plugin lists its required keys, models,
methods, and supported audio formats.

Current plugins:

- OpenAI
  - `whisper-1`
  - `gpt-4o-transcribe`
  - `gpt-4o-mini-transcribe`
  - baseline and prompt-based methods
- Deepgram
  - `nova-2`
  - `nova-3`
  - baseline, Nova 2 keyword boost, and Nova 3 keyterm prompt methods
- Google Speech-to-Text
  - `latest_short`
  - `latest_long`
  - baseline, inline phrase set, custom class, and ABNF grammar methods

Missing keys do not break the app. Providers without keys are marked
unavailable and are skipped.

## Test modes

- Blind: no vocabulary help.
- Prompted/context: sends expected bird names or context to methods that use it.
- Provider adaptation: uses provider-native vocabulary help such as keyword
  boost, keyterm prompt, phrase set, custom class, or grammar.
- Regression: reruns a saved audio case against current provider methods.

## Requirements

- Node.js with `node:sqlite` support. This project was tested on Node `v25.3.0`.
- npm
- A browser with microphone access
- API credentials for any provider you want to test

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root if you want to load keys at startup:

```bash
OPENAI_API_KEY=your_openai_key
DEEPGRAM_API_KEY=your_deepgram_key
GOOGLE_APPLICATION_CREDENTIALS=/path/to/google-service-account.json
PORT=3001
```

You can also enter keys in the setup panel. Those keys are kept in server
memory for the current local session.

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
npm run build    # type-check and build the frontend
npm run lint     # run ESLint
npm run test     # run server unit tests
npm run preview  # preview the built app
```

## API overview

- `GET /api/providers`: provider status, models, methods, and missing keys.
- `POST /api/session-keys`: set local-session provider keys.
- `GET /api/runs`: saved benchmark runs.
- `POST /api/runs`: upload audio and run selected provider/model/method targets.
- `POST /api/runs/:id/rerun`: rerun a saved test case.
- `POST /api/results/:id/grade`: save a manual grade and notes.

## Stored data

Runtime benchmark data is written under `data/benchmark/`:

- `ornitho-benchmark.sqlite`
- uploaded or recorded audio files in `recordings/`

This folder is ignored by git.

## Current limits

- The app is local-first and has no user accounts.
- API keys entered in the UI are kept only in server memory.
- Cost estimates are not calculated yet.
- Google grammar and adaptation support depends on the model and account setup.
- Provider APIs can change; plugin methods may need small updates over time.
