export const envKeys = ['OPENAI_API_KEY', 'DEEPGRAM_API_KEY', 'GOOGLE_APPLICATION_CREDENTIALS'] as const;

export type EnvKey = typeof envKeys[number];
