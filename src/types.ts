export type ProviderMethodKind = 'baseline' | 'prompt' | 'adaptation' | 'grammar';

export interface ProviderModel {
  id: string;
  name: string;
}

export interface ProviderMethod {
  id: string;
  name: string;
  kind: ProviderMethodKind;
  description: string;
  models: string[];
  requiresBirdTerms: boolean;
}

export interface ProviderInfo {
  id: string;
  name: string;
  requiredEnv: string[];
  supportedAudioFormats: string[];
  models: ProviderModel[];
  methods: ProviderMethod[];
  available: boolean;
  missingEnv: string[];
}

export interface RunTarget {
  providerId: string;
  modelId: string;
  methodId: string;
}

export interface ScoreResult {
  wordErrorRate: number | null;
  birdRecall: number | null;
  birdPrecision: number | null;
  exactBirdMatches: number;
  matchedBirds: string[];
  missedBirds: string[];
  falsePositiveBirds: string[];
}

export interface TestCaseRecord {
  id: string;
  createdAt: number;
  audioPath: string;
  mimeType: string;
  expectedTranscript: string;
  birdTerms: string[];
  notes: string;
  tags: string[];
}

export interface ResultRecord {
  id: string;
  runId: string;
  providerId: string;
  providerName: string;
  modelId: string;
  methodId: string;
  methodName: string;
  status: string;
  transcript: string;
  error: string;
  latencyMs: number;
  scores: ScoreResult | null;
  matchedBirds: string[];
  missedBirds: string[];
  falsePositiveBirds: string[];
  costEstimate: string;
  manualGrade: number | null;
  manualNotes: string;
  acceptedTranscript: string;
  reviewedAt: number | null;
}

export interface RunRecord {
  id: string;
  testCaseId: string;
  mode: string;
  createdAt: number;
  status: string;
  testCase?: TestCaseRecord;
  results?: ResultRecord[];
}
