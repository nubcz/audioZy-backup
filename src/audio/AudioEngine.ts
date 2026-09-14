import { Project, Clip, getEffectiveDurationMs, getTotalDurationMs } from '../types';

export class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private isPlaying = false;
  private isFastRewinding = false;
  private currentPlayheadMs = 0;
  private playbackStartTime = 0;
  private playheadAtStart = 0;
  private animationFrameId: number | null = null;
  private activeNodes: { source: AudioNode; gain: GainNode }[] = [];
  private currentProject: Project | null = null;
  private onTimeUpdateCallback: ((timeMs: number) => void) | null = null;
  private onPlaybackStateChangeCallback: ((isPlaying: boolean) => void) | null = null;

  constructor() {
    // Lazy AudioContext creation on first user interaction
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  setOnTimeUpdate(cb: (timeMs: number) => void) {
    this.onTimeUpdateCallback = cb;
  }

  setOnPlaybackStateChange(cb: (isPlaying: boolean) => void) {
    this.onPlaybackStateChangeCallback = cb;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentPlayheadMs(): number {
    return this.currentPlayheadMs;
  }

  seekTo(timeMs: number, project?: Project) {
    const proj = project || this.currentProject;
    const maxDuration = proj ? getTotalDurationMs(proj) : 60000;
    this.currentPlayheadMs = Math.max(0, Math.min(timeMs, maxDuration));

    if (this.isPlaying) {
      this.stopActiveNodes();
      this.playbackStartTime = this.getAudioContext().currentTime;
      this.playheadAtStart = this.currentPlayheadMs;
      if (proj) {
        this.scheduleAudio(proj, this.currentPlayheadMs);
      }
    }

    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(this.currentPlayheadMs);
    }
  }

  jumpToStart(project?: Project) {
    this.seekTo(0, project);
  }

  startFastRewind(project?: Project) {
    this.isFastRewinding = true;
    const rewindStep = () => {
      if (!this.isFastRewinding) return;
      this.seekTo(Math.max(0, this.currentPlayheadMs - 400), project);
      setTimeout(rewindStep, 50);
    };
    rewindStep();
  }

  stopFastRewind() {
    this.isFastRewinding = false;
  }

  play(project: Project) {
    if (this.isPlaying) return;
    const ctx = this.getAudioContext();
    this.currentProject = project;

    const totalDuration = getTotalDurationMs(project);
    if (this.currentPlayheadMs >= totalDuration) {
      this.currentPlayheadMs = 0;
    }

    this.isPlaying = true;
    this.playbackStartTime = ctx.currentTime;
    this.playheadAtStart = this.currentPlayheadMs;

    this.scheduleAudio(project, this.currentPlayheadMs);
    this.startTracking();

    if (this.onPlaybackStateChangeCallback) {
      this.onPlaybackStateChangeCallback(true);
    }
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.stopActiveNodes();
    this.stopTracking();

    if (this.onPlaybackStateChangeCallback) {
      this.onPlaybackStateChangeCallback(false);
    }
  }

  togglePlay(project: Project) {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play(project);
    }
  }

  private stopActiveNodes() {
    for (const node of this.activeNodes) {
      try {
        if ('stop' in node.source && typeof (node.source as AudioBufferSourceNode).stop === 'function') {
          (node.source as AudioBufferSourceNode).stop();
        }
        node.gain.disconnect();
      } catch (e) {
        // Node might have already finished
      }
    }
    this.activeNodes = [];
  }

  private scheduleAudio(project: Project, startFromMs: number) {
    const ctx = this.getAudioContext();
    const ctxNow = ctx.currentTime;
    this.stopActiveNodes();

    const anySolo = project.tracks.some((t) => t.isSolo);

    project.tracks.forEach((track, trackIndex) => {
      // Check track mute/solo
      const isAudible = anySolo ? track.isSolo : !track.isMuted;
      if (!isAudible) return;

      track.clips.forEach((clip) => {
        if (clip.isMuted) return;

        const effectiveDuration = getEffectiveDurationMs(clip);
        const clipStartMs = clip.startTimeMs;
        const clipEndMs = clipStartMs + effectiveDuration;

        // Check if clip is in range of playback
        if (clipEndMs <= startFromMs) return;

        const delayMs = Math.max(0, clipStartMs - startFromMs);
        const offsetIntoClipMs = Math.max(0, startFromMs - clipStartMs) + (clip.trimStartMs || 0);
        const durationToPlayMs = effectiveDuration - Math.max(0, startFromMs - clipStartMs);

        if (durationToPlayMs <= 0) return;

        const scheduleTime = ctxNow + delayMs / 1000;
        const durationSec = durationToPlayMs / 1000;
        const offsetSec = offsetIntoClipMs / 1000;

        // Create Track/Clip Gain for fades
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(1, scheduleTime);

        // Fade in
        if (clip.fadeInMs > 0 && offsetIntoClipMs < clip.fadeInMs) {
          const remainingFadeInSec = (clip.fadeInMs - offsetIntoClipMs) / 1000;
          gainNode.gain.setValueAtTime(0, scheduleTime);
          gainNode.gain.linearRampToValueAtTime(1, scheduleTime + remainingFadeInSec);
        }

        // Fade out
        if (clip.fadeOutMs > 0) {
          const fadeOutStartMs = effectiveDuration - clip.fadeOutMs;
          if (offsetIntoClipMs + durationToPlayMs >= fadeOutStartMs) {
            const timeUntilFadeStart = Math.max(0, fadeOutStartMs - offsetIntoClipMs) / 1000;
            const fadeOutDurationSec = clip.fadeOutMs / 1000;
            gainNode.gain.setValueAtTime(1, scheduleTime + timeUntilFadeStart);
            gainNode.gain.linearRampToValueAtTime(0, scheduleTime + timeUntilFadeStart + fadeOutDurationSec);
          }
        }

        gainNode.connect(ctx.destination);

        if (clip.audioBuffer) {
          // Play decoded AudioBuffer
          const bufferSource = ctx.createBufferSource();
          bufferSource.buffer = clip.audioBuffer;
          bufferSource.connect(gainNode);
          bufferSource.start(scheduleTime, offsetSec, durationSec);
          this.activeNodes.push({ source: bufferSource, gain: gainNode });
        } else {
          // Synthesize harmonic stem tone matching Android synthetic tone per track index
          const osc = ctx.createOscillator();
          const frequencies = [261.63, 329.63, 130.81, 174.61, 196.0]; // C4, E4, C3, F3, G3
          const freq = frequencies[trackIndex % frequencies.length];
          osc.type = trackIndex === 2 ? 'sawtooth' : trackIndex === 4 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, scheduleTime);

          // Rhythmic pulse envelope for stem feel
          const stemGain = ctx.createGain();
          const bpm = project.bpm || 120;
          const beatDurationSec = 60 / bpm;
          stemGain.gain.setValueAtTime(0.18, scheduleTime);

          osc.connect(stemGain);
          stemGain.connect(gainNode);

          osc.start(scheduleTime);
          osc.stop(scheduleTime + durationSec);
          this.activeNodes.push({ source: osc, gain: gainNode });
        }
      });
    });
  }

  private startTracking() {
    const update = () => {
      if (!this.isPlaying) return;
      const ctx = this.getAudioContext();
      const elapsedMs = (ctx.currentTime - this.playbackStartTime) * 1000;
      this.currentPlayheadMs = this.playheadAtStart + elapsedMs;

      const totalDuration = this.currentProject ? getTotalDurationMs(this.currentProject) : 60000;
      if (this.currentPlayheadMs >= totalDuration) {
        this.currentPlayheadMs = totalDuration;
        this.pause();
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(this.currentPlayheadMs);
        }
        return;
      }

      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.currentPlayheadMs);
      }

      this.animationFrameId = requestAnimationFrame(update);
    };
    this.animationFrameId = requestAnimationFrame(update);
  }

  private stopTracking() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  async exportToWav(project: Project): Promise<Blob> {
    const totalDurationMs = getTotalDurationMs(project);
    const durationSec = Math.max(1, totalDurationMs / 1000);
    const sampleRate = 44100;
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(durationSec * sampleRate), sampleRate);

    const anySolo = project.tracks.some((t) => t.isSolo);

    project.tracks.forEach((track, trackIndex) => {
      const isAudible = anySolo ? track.isSolo : !track.isMuted;
      if (!isAudible) return;

      track.clips.forEach((clip) => {
        if (clip.isMuted) return;
        const effectiveDuration = getEffectiveDurationMs(clip);
        const scheduleTime = clip.startTimeMs / 1000;
        const durationSec = effectiveDuration / 1000;

        const gainNode = offlineCtx.createGain();
        gainNode.gain.setValueAtTime(1, scheduleTime);

        if (clip.fadeInMs > 0) {
          gainNode.gain.setValueAtTime(0, scheduleTime);
          gainNode.gain.linearRampToValueAtTime(1, scheduleTime + clip.fadeInMs / 1000);
        }
        if (clip.fadeOutMs > 0) {
          const fadeStart = scheduleTime + durationSec - clip.fadeOutMs / 1000;
          gainNode.gain.setValueAtTime(1, fadeStart);
          gainNode.gain.linearRampToValueAtTime(0, scheduleTime + durationSec);
        }

        gainNode.connect(offlineCtx.destination);

        if (clip.audioBuffer) {
          const bufferSource = offlineCtx.createBufferSource();
          bufferSource.buffer = clip.audioBuffer;
          bufferSource.connect(gainNode);
          bufferSource.start(scheduleTime, (clip.trimStartMs || 0) / 1000, durationSec);
        } else {
          const osc = offlineCtx.createOscillator();
          const frequencies = [261.63, 329.63, 130.81, 174.61, 196.0];
          osc.frequency.setValueAtTime(frequencies[trackIndex % frequencies.length], scheduleTime);
          const stemGain = offlineCtx.createGain();
          stemGain.gain.setValueAtTime(0.2, scheduleTime);
          osc.connect(stemGain);
          stemGain.connect(gainNode);
          osc.start(scheduleTime);
          osc.stop(scheduleTime + durationSec);
        }
      });
    });

    const renderedBuffer = await offlineCtx.startRendering();
    return audioBufferToWavBlob(renderedBuffer);
  }

  static formatTime(ms: number): string {
    const totalSeconds = Math.max(0, ms) / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const hundredths = Math.floor((totalSeconds % 1) * 100);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(hundredths)}`;
  }
}

// Convert AudioBuffer to WAV Blob
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length;
  const bufferLength = 44 + length * blockAlign;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * blockAlign, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, length * blockAlign, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}
