# Audiozy - Multi-track Audio Studio

Audiozy is a modern multi-track digital audio workstation (DAW) rewritten from Android Jetpack Compose to React, TypeScript, and Tailwind CSS using Vite and Web Audio API.

## Core Features Preserved & Rewritten

- **Multi-Track Timeline**:
  - Horizontal timeline with dynamic beat/bar ruler based on BPM (tempo) and Time Signature (4/4, 3/4, 6/8, 2/4).
  - Canvas-based waveform rendering with peak visualization, responsive zooming (pinch & slider), and auto-scrolling playhead tracking.
  - Track-level controls: vertical rotated label, quick menu with Mute, Solo, 8-color studio palette, and track deletion.
- **Audio Clip Editing**:
  - Drag-and-drop horizontal clip positioning with snap-to-beat.
  - Interactive trim handles (trim start / trim end) on selected clips.
  - Split clips at current playhead position.
  - Duplicate clips with automatic offset placement.
  - Fade In & Fade Out parametric sliders with linear audio gain ramps.
  - Clip mute/unmute and deletion.
- **Web Audio Engine & Recording**:
  - High-precision audio scheduling via `AudioContext.currentTime`.
  - Master mixdown and real-time per-clip GainNode mixing.
  - Live microphone recording with peak extraction using MediaRecorder and AudioDecoder.
  - Fast rewind and jump-to-start controls.
- **Projects & File Management**:
  - Project list view with track counts, tempo, and last-modified timestamps.
  - New project creation wizard with starting sources (Import Audio, Record Manually, Blank Canvas).
  - Full project audio mixdown export to `.wav` (32-bit float PCM).
  - Local persistence via `localStorage` with JSON project backups and Web Share integration.
  - Full Undo / Redo history stack (Ctrl+Z / Ctrl+Y).

## Development

```bash
npm install
npm run dev
```

Dev server runs on port 3000 at `http://0.0.0.0:3000`.
