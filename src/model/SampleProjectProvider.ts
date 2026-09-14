import { Project, TrackPalette } from '../types';
import { generateRealisticPeaks } from '../audio/WaveformExtractor';

export function createSampleProject(): Project {
  return {
    id: 'sample_project_audiozy',
    name: 'My Project',
    bpm: 120,
    timeSignature: '4/4',
    sampleRate: '44.1kHz',
    bitDepth: '24-bit',
    lastModified: Date.now(),
    tracks: [
      {
        id: 'track_1',
        name: 'Vocals',
        color: TrackPalette[0], // Blue
        isMuted: false,
        isSolo: false,
        clips: [
          {
            id: 'clip_v1',
            trackId: 'track_1',
            name: 'Vocals Take 1',
            startTimeMs: 0,
            durationMs: 18000,
            trimStartMs: 0,
            trimEndMs: 0,
            fadeInMs: 300,
            fadeOutMs: 500,
            isMuted: false,
            peaks: generateRealisticPeaks(120, 101),
            isLoading: false,
          },
          {
            id: 'clip_v2',
            trackId: 'track_1',
            name: 'Vocals Outro',
            startTimeMs: 24000,
            durationMs: 12000,
            trimStartMs: 0,
            trimEndMs: 0,
            fadeInMs: 200,
            fadeOutMs: 400,
            isMuted: false,
            peaks: generateRealisticPeaks(80, 202),
            isLoading: false,
          },
        ],
      },
      {
        id: 'track_2',
        name: 'Guitar',
        color: TrackPalette[1], // Coral
        isMuted: false,
        isSolo: false,
        clips: [
          {
            id: 'clip_g1',
            trackId: 'track_2',
            name: 'Guitar Riff',
            startTimeMs: 4000,
            durationMs: 22000,
            trimStartMs: 0,
            trimEndMs: 0,
            fadeInMs: 150,
            fadeOutMs: 300,
            isMuted: false,
            peaks: generateRealisticPeaks(140, 303),
            isLoading: false,
          },
        ],
      },
      {
        id: 'track_3',
        name: 'Bass',
        color: TrackPalette[2], // Yellow
        isMuted: false,
        isSolo: false,
        clips: [
          {
            id: 'clip_b1',
            trackId: 'track_3',
            name: 'Synth Bass',
            startTimeMs: 0,
            durationMs: 28000,
            trimStartMs: 0,
            trimEndMs: 0,
            fadeInMs: 100,
            fadeOutMs: 200,
            isMuted: false,
            peaks: generateRealisticPeaks(160, 404),
            isLoading: false,
          },
        ],
      },
      {
        id: 'track_4',
        name: 'Beats',
        color: TrackPalette[3], // White
        isMuted: false,
        isSolo: false,
        clips: [
          {
            id: 'clip_d1',
            trackId: 'track_4',
            name: 'Master Beat',
            startTimeMs: 0,
            durationMs: 32000,
            trimStartMs: 0,
            trimEndMs: 0,
            fadeInMs: 50,
            fadeOutMs: 100,
            isMuted: false,
            peaks: generateRealisticPeaks(180, 505),
            isLoading: false,
          },
        ],
      },
      {
        id: 'track_5',
        name: 'Drums',
        color: TrackPalette[4], // Purple
        isMuted: false,
        isSolo: false,
        clips: [
          {
            id: 'clip_l1',
            trackId: 'track_5',
            name: 'Drum Loop',
            startTimeMs: 8000,
            durationMs: 16000,
            trimStartMs: 0,
            trimEndMs: 0,
            fadeInMs: 100,
            fadeOutMs: 150,
            isMuted: false,
            peaks: generateRealisticPeaks(100, 606),
            isLoading: false,
          },
        ],
      },
    ],
  };
}
