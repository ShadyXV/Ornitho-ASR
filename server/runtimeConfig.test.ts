import test from 'node:test';
import assert from 'node:assert/strict';
import { getProviderStatus, setSessionKeys } from './runtimeConfig';

test('getProviderStatus reports missing keys', () => {
    assert.deepEqual(getProviderStatus(['ORNITHO_TEST_MISSING_KEY']), {
        available: false,
        missingEnv: ['ORNITHO_TEST_MISSING_KEY'],
    });
});

test('session keys can make a provider requirement available', () => {
    setSessionKeys({ OPENAI_API_KEY: 'test-key' });
    assert.deepEqual(getProviderStatus(['OPENAI_API_KEY']), {
        available: true,
        missingEnv: [],
    });
});
