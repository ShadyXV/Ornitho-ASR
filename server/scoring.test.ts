import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText, scoreTranscript, splitTerms } from './scoring';

test('splitTerms accepts comma and newline separated bird names', () => {
    assert.deepEqual(splitTerms('Snow Partridge, Himalayan Monal\nCommon Quail'), [
        'Snow Partridge',
        'Himalayan Monal',
        'Common Quail',
    ]);
});

test('normalizeText keeps comparable words and removes punctuation noise', () => {
    assert.equal(normalizeText('Baer’s Pochard, Himalayan-Monal!'), 'baers pochard himalayan monal');
});

test('scoreTranscript reports bird recall, precision, and WER', () => {
    const score = scoreTranscript(
        'I saw Snow Partridge and Himalayan Monal near the ridge.',
        'I saw Snow Partridge and Himalayan Monal near the ridge.',
        ['Snow Partridge', 'Himalayan Monal', 'Common Quail'],
    );

    assert.equal(score.wordErrorRate, 0);
    assert.equal(score.exactBirdMatches, 2);
    assert.deepEqual(score.matchedBirds, ['Snow Partridge', 'Himalayan Monal']);
    assert.deepEqual(score.missedBirds, ['Common Quail']);
    assert.equal(score.birdRecall, 2 / 3);
    assert.equal(score.birdPrecision, 1);
});
