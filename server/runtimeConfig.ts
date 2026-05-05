const sessionKeys: Record<string, string> = {};

export const requiredEnvKeys = [
    'OPENAI_API_KEY',
    'DEEPGRAM_API_KEY',
    'GOOGLE_APPLICATION_CREDENTIALS',
] as const;

export type RequiredEnvKey = typeof requiredEnvKeys[number];

export function setSessionKeys(keys: Partial<Record<RequiredEnvKey, string>>): void {
    for (const [key, value] of Object.entries(keys)) {
        if (!requiredEnvKeys.includes(key as RequiredEnvKey)) {
            continue;
        }

        const trimmed = value?.trim();
        if (trimmed) {
            sessionKeys[key] = trimmed;
        }
    }
}

export function getConfigValue(key: string): string | undefined {
    return sessionKeys[key] || process.env[key];
}

export function hasConfigValue(key: string): boolean {
    return Boolean(getConfigValue(key));
}

export function getProviderStatus(requiredEnv: string[]): { available: boolean; missingEnv: string[] } {
    const missingEnv = requiredEnv.filter((key) => !hasConfigValue(key));
    return {
        available: missingEnv.length === 0,
        missingEnv,
    };
}
