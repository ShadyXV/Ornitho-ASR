import { formatDate } from './formatters';
import type { RunRecord } from '../types';

export function runsToCsv(runs: RunRecord[]): string {
  const rows = runs.flatMap((run) => (run.results || []).map((result) => [
    run.id,
    run.mode,
    formatDate(run.createdAt),
    result.providerName,
    result.modelId,
    result.methodName,
    result.status,
    result.latencyMs,
    result.scores?.wordErrorRate ?? '',
    result.scores?.birdRecall ?? '',
    result.scores?.birdPrecision ?? '',
    result.matchedBirds.join('; '),
    result.missedBirds.join('; '),
    result.falsePositiveBirds.join('; '),
    result.manualGrade ?? '',
    result.manualNotes,
    result.transcript,
    result.error,
  ]));

  const header = [
    'run_id',
    'mode',
    'created_at',
    'provider',
    'model',
    'method',
    'status',
    'latency_ms',
    'wer',
    'bird_recall',
    'bird_precision',
    'matched_birds',
    'missed_birds',
    'false_positive_birds',
    'manual_grade',
    'manual_notes',
    'transcript',
    'error',
  ];

  return [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

export function exportFile(name: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
