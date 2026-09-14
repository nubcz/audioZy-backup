/**
 * Waveform extraction utilities for Audiozy.
 * Matches the realistic synthetic peak generator from Android Audiozy,
 * as well as real extraction from decoded Web Audio buffers.
 */

// Simple pseudo-random number generator for reproducible seed-based demo waveforms
function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateRealisticPeaks(numBars: number = 100, seed: number = 42): number[] {
  const rand = seededRandom(seed);
  const peaks: number[] = [];
  let envelope = 0.4;

  for (let i = 0; i < numBars; i++) {
    const progress = i / numBars;
    const beatFactor = Math.sin(progress * Math.PI * 8) * 0.5 + 0.5;
    const subBeat = Math.sin(progress * Math.PI * 32) * 0.3 + 0.3;
    const randomJitter = rand() * 0.35;

    envelope = envelope * 0.85 + (beatFactor * 0.5 + subBeat * 0.3 + randomJitter) * 0.15;
    const finalHeight = Math.min(0.98, Math.max(0.12, envelope + randomJitter * 0.4));
    peaks.push(parseFloat(finalHeight.toFixed(3)));
  }

  return peaks;
}

export function extractPeaksFromAudioBuffer(audioBuffer: AudioBuffer, targetBars: number = 300): number[] {
  const rawData = audioBuffer.getChannelData(0); // primary channel
  const totalSamples = rawData.length;
  const blockSize = Math.floor(totalSamples / targetBars);
  const peaks: number[] = [];

  for (let i = 0; i < targetBars; i++) {
    const start = i * blockSize;
    let sum = 0;
    let max = 0;
    const end = Math.min(start + blockSize, totalSamples);

    for (let j = start; j < end; j++) {
      const val = Math.abs(rawData[j]);
      if (val > max) max = val;
      sum += val * val;
    }

    // RMS blended with peak
    const rms = Math.sqrt(sum / Math.max(1, end - start));
    const normalized = Math.min(0.98, Math.max(0.12, max * 0.7 + rms * 0.5));
    peaks.push(parseFloat(normalized.toFixed(3)));
  }

  return peaks;
}
