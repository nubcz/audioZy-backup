export type SourceOption = 'IMPORT_AUDIO' | 'RECORD_MANUALLY' | 'BLANK_PROJECT';

export interface Clip {
  id: string;
  trackId: string;
  name: string;
  sourceFileUri?: string | null;
  audioBuffer?: AudioBuffer;
  startTimeMs: number;
  durationMs: number;
  trimStartMs: number;
  trimEndMs: number;
  fadeInMs: number;
  fadeOutMs: number;
  isMuted: boolean;
  peaks: number[];
  isLoading?: boolean;
}

export function getEffectiveDurationMs(clip: Clip): number {
  return Math.max(100, clip.durationMs - (clip.trimStartMs || 0) - (clip.trimEndMs || 0));
}

export function getEndTimeMs(clip: Clip): number {
  return clip.startTimeMs + getEffectiveDurationMs(clip);
}

export interface Track {
  id: string;
  name: string;
  color: string;
  isMuted: boolean;
  isSolo: boolean;
  clips: Clip[];
}

export interface Project {
  id: string;
  name: string;
  bpm: number;
  timeSignature: string;
  sampleRate: string;
  bitDepth: string;
  tracks: Track[];
  lastModified: number;
}

export function getTotalDurationMs(project: Project): number {
  let maxEnd = 0;
  for (const track of project.tracks) {
    for (const clip of track.clips) {
      const end = getEndTimeMs(clip);
      if (end > maxEnd) {
        maxEnd = end;
      }
    }
  }
  const bpm = Math.max(1, project.bpm || 120);
  const beatDurationMs = 60000 / bpm;
  const minFourBarsMs = beatDurationMs * 16;
  return Math.max(maxEnd + 2000, minFourBarsMs);
}

export type ScreenState = 
  | { type: 'ProjectList' }
  | { type: 'CreateProject' }
  | { type: 'Timeline'; initialAction?: InitialTimelineAction };

export type InitialTimelineAction = 'OPEN_FILE_PICKER' | 'ARM_RECORD' | 'NONE';

export const TrackPalette = [
  '#3B82F6', // Blue - Track 1
  '#FB7185', // Coral - Track 2
  '#FBBF24', // Yellow - Track 3
  '#FFFFFF', // White - Track 4
  '#A855F7', // Purple - Track 5
  '#34D399', // Green - Track 6
  '#06B6D4', // Cyan - Track 7
  '#FB923C', // Orange - Track 8
];
