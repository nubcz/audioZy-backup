import { extractPeaksFromAudioBuffer } from './WaveformExtractor';

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;
  private isRecording = false;

  async startRecording(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.audioChunks = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100);
      this.isRecording = true;
    } catch (e) {
      console.error('Failed to access microphone', e);
      throw e;
    }
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  async stopRecording(): Promise<{ blob: Blob; audioBuffer: AudioBuffer; peaks: number[]; durationMs: number } | null> {
    if (!this.isRecording || !this.mediaRecorder) return null;

    return new Promise((resolve, reject) => {
      const recorder = this.mediaRecorder!;

      recorder.onstop = async () => {
        this.isRecording = false;
        try {
          const blob = new Blob(this.audioChunks, { type: recorder.mimeType || 'audio/webm' });

          // Stop all audio tracks
          if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((track) => track.stop());
            this.mediaStream = null;
          }

          // Decode into AudioBuffer
          const arrayBuffer = await blob.arrayBuffer();
          const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const tempCtx = new AudioCtxClass();
          const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
          const durationMs = Math.round(audioBuffer.duration * 1000);
          const peaks = extractPeaksFromAudioBuffer(audioBuffer, Math.max(40, Math.min(400, Math.round(durationMs / 100))));

          resolve({ blob, audioBuffer, peaks, durationMs });
        } catch (err) {
          console.error('Error processing recorded audio', err);
          reject(err);
        } finally {
          this.mediaRecorder = null;
        }
      };

      recorder.stop();
    });
  }

  cancelRecording() {
    if (this.mediaRecorder && this.isRecording) {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}
