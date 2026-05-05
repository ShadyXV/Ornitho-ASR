import fs from 'fs';
import path from 'path';

export interface ScoreResult {
    wordErrorRate: number | null;
    birdRecall: number | null;
    birdPrecision: number | null;
    exactBirdMatches: number;
    matchedBirds: string[];
    missedBirds: string[];
    falsePositiveBirds: string[];
}

let birdLexiconCache: string[] | null = null;

export function splitTerms(input: string): string[] {
    return input
        .split(/[\n,]+/)
        .map((term) => term.trim())
        .filter(Boolean);
}

export function normalizeText(input: string): string {
    return input
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[’']/g, '')
        .replace(/[^\w\s-]/g, ' ')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function containsTerm(text: string, term: string): boolean {
    const normalizedText = ` ${normalizeText(text)} `;
    const normalizedTerm = normalizeText(term);
    return Boolean(normalizedTerm) && normalizedText.includes(` ${normalizedTerm} `);
}

function levenshtein(a: string[], b: string[]): number {
    const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    const current = Array.from({ length: b.length + 1 }, () => 0);

    for (let i = 1; i <= a.length; i += 1) {
        current[0] = i;
        for (let j = 1; j <= b.length; j += 1) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            current[j] = Math.min(
                current[j - 1] + 1,
                previous[j] + 1,
                previous[j - 1] + cost,
            );
        }
        previous.splice(0, previous.length, ...current);
    }

    return previous[b.length] || 0;
}

function loadBirdLexicon(): string[] {
    if (birdLexiconCache) {
        return birdLexiconCache;
    }

    const filePath = path.join(process.cwd(), 'data', 'eng-birds.txt');
    if (!fs.existsSync(filePath)) {
        birdLexiconCache = [];
        return birdLexiconCache;
    }

    birdLexiconCache = fs.readFileSync(filePath, 'utf8')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 2)
        .filter((line) => !/^[A-Z\s-]+$/.test(line))
        .filter((line) => line.includes(' ') || line.includes('-'));

    return birdLexiconCache;
}

export function scoreTranscript(transcript: string, expectedTranscript: string, expectedBirdTerms: string[]): ScoreResult {
    const expectedWords = normalizeText(expectedTranscript).split(' ').filter(Boolean);
    const actualWords = normalizeText(transcript).split(' ').filter(Boolean);
    const distance = expectedWords.length > 0 ? levenshtein(expectedWords, actualWords) : 0;
    const wordErrorRate = expectedWords.length > 0 ? distance / expectedWords.length : null;

    const uniqueExpectedBirds = Array.from(new Set(expectedBirdTerms.map((term) => term.trim()).filter(Boolean)));
    const matchedBirds = uniqueExpectedBirds.filter((term) => containsTerm(transcript, term));
    const missedBirds = uniqueExpectedBirds.filter((term) => !matchedBirds.includes(term));

    const lexiconMatches = loadBirdLexicon()
        .filter((term) => containsTerm(transcript, term))
        .filter((term) => !uniqueExpectedBirds.some((expected) => normalizeText(expected) === normalizeText(term)));

    const falsePositiveBirds = Array.from(new Set(lexiconMatches)).slice(0, 25);
    const birdRecall = uniqueExpectedBirds.length > 0 ? matchedBirds.length / uniqueExpectedBirds.length : null;
    const denominator = matchedBirds.length + falsePositiveBirds.length;
    const birdPrecision = denominator > 0 ? matchedBirds.length / denominator : null;

    return {
        wordErrorRate,
        birdRecall,
        birdPrecision,
        exactBirdMatches: matchedBirds.length,
        matchedBirds,
        missedBirds,
        falsePositiveBirds,
    };
}
