import type { RunRecord } from '../types';

export function formatPercent(value: number | null): string {
  return value === null ? '-' : `${Math.round(value * 100)}%`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export function bestScore(run: RunRecord, key: 'wordErrorRate' | 'birdRecall'): number | null {
  const values = (run.results || [])
    .map((result) => result.scores?.[key] ?? null)
    .filter((value): value is number => value !== null);

  if (values.length === 0) {
    return null;
  }

  return key === 'wordErrorRate' ? Math.min(...values) : Math.max(...values);
}
