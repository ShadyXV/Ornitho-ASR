import type { SampleRecord } from '../types';

export interface DummySampleRecord extends SampleRecord {
  title: string;
  durationLabel: string;
  habitat: string;
  qualityScore: number;
  toneFrequency: number;
}

const now = Date.now();

export const dummySamples: DummySampleRecord[] = [
  {
    id: 'sample-windy-ridge',
    title: 'Windy ridge dawn pass',
    createdAt: now - 1000 * 60 * 60 * 30,
    updatedAt: now - 1000 * 60 * 42,
    audioPath: '',
    mimeType: 'audio/wav',
    transcript: 'Snow Partridge calls from the upper ridge with light wind and distant footstep noise.',
    birdTerms: ['Snow Partridge', 'Himalayan Monal'],
    notes: 'Dawn recording near the ridge trail. Moderate wind but clear foreground calls.',
    tags: ['wind', 'ridge', 'dawn'],
    sourceProviderId: 'openai',
    sourceModelId: 'gpt-4o-transcribe',
    sourceMethodId: 'baseline',
    transcriptStatus: 'edited',
    durationLabel: '0:18',
    habitat: 'Alpine ridge',
    qualityScore: 92,
    toneFrequency: 440,
  },
  {
    id: 'sample-river-valley',
    title: 'River valley blind pass',
    createdAt: now - 1000 * 60 * 60 * 76,
    updatedAt: now - 1000 * 60 * 60 * 6,
    audioPath: '',
    mimeType: 'audio/wav',
    transcript: 'Water noise under a short call sequence. Possible Laughingthrush phrase after the first rush of water.',
    birdTerms: ['Laughingthrush', 'Blue Whistling Thrush'],
    notes: 'Useful blind-test sample with heavy stream masking.',
    tags: ['river', 'noise', 'blind'],
    sourceProviderId: 'google',
    sourceModelId: 'chirp_3',
    sourceMethodId: 'baseline',
    transcriptStatus: 'generated',
    durationLabel: '0:31',
    habitat: 'River valley',
    qualityScore: 74,
    toneFrequency: 554,
  },
  {
    id: 'sample-forest-canopy',
    title: 'Forest canopy mixed flock',
    createdAt: now - 1000 * 60 * 60 * 120,
    updatedAt: now - 1000 * 60 * 60 * 24,
    audioPath: '',
    mimeType: 'audio/wav',
    transcript: 'Mixed canopy chatter with a clear barbet phrase at the midpoint and soft leaf movement throughout.',
    birdTerms: ['Great Barbet', 'Grey-hooded Warbler'],
    notes: 'Dense overlapping vocalizations. Good for recall checks.',
    tags: ['forest', 'mixed-flock', 'recall'],
    sourceProviderId: 'deepgram',
    sourceModelId: 'nova-3',
    sourceMethodId: 'prompt',
    transcriptStatus: 'reviewed',
    durationLabel: '0:26',
    habitat: 'Broadleaf forest',
    qualityScore: 86,
    toneFrequency: 659,
  },
  {
    id: 'sample-village-edge',
    title: 'Village edge evening',
    createdAt: now - 1000 * 60 * 60 * 9,
    updatedAt: now - 1000 * 60 * 60 * 2,
    audioPath: '',
    mimeType: 'audio/wav',
    transcript: 'Evening ambience with distant human speech and two clear bulbul calls near the end.',
    birdTerms: ['Red-vented Bulbul', 'Oriental Magpie-Robin'],
    notes: 'Background speech makes this useful for false positive checks.',
    tags: ['village', 'evening', 'speech'],
    sourceProviderId: 'openai',
    sourceModelId: 'gpt-4o-mini-transcribe',
    sourceMethodId: 'grammar',
    transcriptStatus: 'manual',
    durationLabel: '0:22',
    habitat: 'Village edge',
    qualityScore: 81,
    toneFrequency: 784,
  },
];
