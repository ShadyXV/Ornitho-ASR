import type { ResultRecord, RunRecord } from '../types';

export interface ResultRowRecord {
  run: RunRecord;
  result: ResultRecord;
}

export type ResultSortKey = 'date' | 'model' | 'provider' | 'wer' | 'recall' | 'precision' | 'latency';

export function flattenRunResults(runs: RunRecord[]): ResultRowRecord[] {
  return runs.flatMap((run) => (run.results || []).map((result) => ({ run, result })));
}

export function uniqueResultValues(rows: ResultRowRecord[], key: 'providerName' | 'modelId' | 'status'): string[] {
  return [...new Set(rows.map((row) => String(row.result[key] || '')).filter(Boolean))].sort();
}

export function sortResultRows(rows: ResultRowRecord[], sortKey: ResultSortKey): ResultRowRecord[] {
  return [...rows].sort((a, b) => {
    if (sortKey === 'date') {
      return b.run.createdAt - a.run.createdAt;
    }
    if (sortKey === 'model') {
      return a.result.modelId.localeCompare(b.result.modelId);
    }
    if (sortKey === 'provider') {
      return a.result.providerName.localeCompare(b.result.providerName);
    }
    if (sortKey === 'latency') {
      return a.result.latencyMs - b.result.latencyMs;
    }

    const aValue = a.result.scores?.[metricKey(sortKey)] ?? Number.POSITIVE_INFINITY;
    const bValue = b.result.scores?.[metricKey(sortKey)] ?? Number.POSITIVE_INFINITY;

    if (sortKey === 'recall' || sortKey === 'precision') {
      return bValue - aValue;
    }
    return aValue - bValue;
  });
}

function metricKey(sortKey: ResultSortKey): 'wordErrorRate' | 'birdRecall' | 'birdPrecision' {
  if (sortKey === 'recall') {
    return 'birdRecall';
  }
  if (sortKey === 'precision') {
    return 'birdPrecision';
  }
  return 'wordErrorRate';
}
