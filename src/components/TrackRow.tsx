import React, { useRef, useEffect } from 'react';
import { Track, Clip } from '../types';
import { WaveformClipView } from './WaveformClipView';

interface TrackRowProps {
  track: Track;
  selectedClipId: string | null;
  zoomPxPerSecond: number;
  scrollOffsetPx: number;
  bpm: number;
  timeSignature: string;
  totalDurationMs: number;
  onClipSelect: (clipId: string) => void;
  onClipMove: (clipId: string, newStartMs: number) => void;
  onClipTrim: (clipId: string, deltaStartMs: number, deltaEndMs: number) => void;
  onClipOpenMenu: (clip: Clip) => void;
  onTrackDotClick: (track: Track) => void;
  onEmptySpaceTap: (timeMs: number) => void;
  headerLeftWidth?: number;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  selectedClipId,
  zoomPxPerSecond,
  scrollOffsetPx,
  bpm,
  timeSignature,
  totalDurationMs,
  onClipSelect,
  onClipMove,
  onClipTrim,
  onClipOpenMenu,
  onTrackDotClick,
  onEmptySpaceTap,
  headerLeftWidth = 60,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trackAreaRef = useRef<HTMLDivElement | null>(null);

  const beatsPerBar = parseInt(timeSignature.split('/')[0], 10) || 4;
  const beatMs = 60000 / Math.max(1, bpm);
  const barMs = beatMs * beatsPerBar;
  const pxPerBar = (barMs / 1000) * zoomPxPerSecond;

  // Background grid lines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Bottom horizontal divider
    ctx.strokeStyle = '#1A1A22';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height - 0.5);
    ctx.lineTo(width, height - 0.5);
    ctx.stroke();

    // Vertical bar guides
    const numBars = Math.ceil(totalDurationMs / barMs) + 6;
    ctx.strokeStyle = '#14141A';
    ctx.lineWidth = 1;

    for (let bar = 0; bar < numBars; bar++) {
      const barStartPx = bar * pxPerBar - scrollOffsetPx;
      if (barStartPx >= 0 && barStartPx <= width) {
        ctx.beginPath();
        ctx.moveTo(barStartPx, 0);
        ctx.lineTo(barStartPx, height);
        ctx.stroke();
      }
    }
  }, [scrollOffsetPx, zoomPxPerSecond, bpm, timeSignature, totalDurationMs, barMs, pxPerBar]);

  // Resize canvas to container
  useEffect(() => {
    const updateSize = () => {
      if (trackAreaRef.current && canvasRef.current) {
        const rect = trackAreaRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleEmptyTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[id^="clip-"]')) return;
    if (!trackAreaRef.current) return;
    const rect = trackAreaRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const timeMs = Math.max(0, Math.round(((clickX + scrollOffsetPx) / zoomPxPerSecond) * 1000));
    onEmptySpaceTap(timeMs);
  };

  return (
    <div
      id={`track-row-${track.id}`}
      className="flex h-[74px] w-full bg-[#0A0A0E] select-none border-b border-[#14141A]"
    >
      {/* Track Left Column (Vertical Label + Color Dot) */}
      <div
        style={{ width: `${headerLeftWidth}px` }}
        className="flex h-full items-center justify-between border-r border-[#1C1C26] bg-[#0C0C12] px-1 py-1"
      >
        {/* Rotated Vertical Track Name */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <span
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            className={`text-[11px] font-medium tracking-wide truncate max-h-[66px] ${
              track.isMuted ? 'text-[#6B7280]' : 'text-[#E5E5E5]'
            }`}
          >
            {track.name}
          </span>
        </div>

        {/* Track Color Dot & Status */}
        <button
          type="button"
          id={`btn-track-dot-${track.id}`}
          onClick={() => onTrackDotClick(track)}
          title={`Track options for ${track.name}`}
          className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-transform"
        >
          <div
            style={{ backgroundColor: track.color }}
            className={`h-3 w-3 rounded-full ring-1 ring-black/40 ${
              track.isSolo ? 'ring-2 ring-amber-400' : ''
            }`}
          />
        </button>
      </div>

      {/* Timeline Track Content Area */}
      <div
        ref={trackAreaRef}
        onClick={handleEmptyTrackClick}
        className="relative flex-1 h-full overflow-hidden cursor-pointer"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />

        {/* Clips inside this track */}
        {track.clips.map((clip) => (
          <WaveformClipView
            key={clip.id}
            clip={clip}
            isSelected={clip.id === selectedClipId}
            zoomPxPerSecond={zoomPxPerSecond}
            scrollOffsetPx={scrollOffsetPx}
            onSelect={() => onClipSelect(clip.id)}
            onMove={(newStart) => onClipMove(clip.id, newStart)}
            onTrim={(deltaStart, deltaEnd) => onClipTrim(clip.id, deltaStart, deltaEnd)}
            onOpenMenu={() => onClipOpenMenu(clip)}
          />
        ))}
      </div>
    </div>
  );
};
