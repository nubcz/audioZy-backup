import React, { useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';

interface TimelineHeaderProps {
  timeDisplayString: string;
  scrollOffsetPx: number;
  zoomPxPerSecond: number;
  bpm: number;
  timeSignature: string;
  totalDurationMs: number;
  playheadMs: number;
  onSeek: (timeMs: number) => void;
  onSeekFinished: (timeMs: number) => void;
  onZoomChange: (newZoom: number) => void;
  headerLeftWidth?: number;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  timeDisplayString,
  scrollOffsetPx,
  zoomPxPerSecond,
  bpm,
  timeSignature,
  totalDurationMs,
  playheadMs,
  onSeek,
  onSeekFinished,
  onZoomChange,
  headerLeftWidth = 60,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);

  const beatsPerBar = parseInt(timeSignature.split('/')[0], 10) || 4;
  const beatMs = 60000 / Math.max(1, bpm);
  const barMs = beatMs * beatsPerBar;
  const pxPerBar = (barMs / 1000) * zoomPxPerSecond;
  const pxPerBeat = pxPerBar / beatsPerBar;

  const playheadPx = (playheadMs / 1000) * zoomPxPerSecond - scrollOffsetPx;

  // Draw ruler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Baseline ruler line
    ctx.strokeStyle = '#282830';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height - 0.5);
    ctx.lineTo(width, height - 0.5);
    ctx.stroke();

    // Bar numbers & ticks
    const numBars = Math.ceil(totalDurationMs / barMs) + 6;
    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    for (let bar = 0; bar < numBars; bar++) {
      const barStartPx = bar * pxPerBar - scrollOffsetPx;
      if (barStartPx >= -40 && barStartPx <= width + 40) {
        // Major bar tick
        ctx.strokeStyle = '#5E5E6E';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(barStartPx, height - 10);
        ctx.lineTo(barStartPx, height);
        ctx.stroke();

        // Bar number label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.fillText((bar + 1).toString(), barStartPx, height - 13);

        // Beat sub-ticks
        ctx.strokeStyle = '#32323C';
        ctx.lineWidth = 1;
        for (let b = 1; b < beatsPerBar; b++) {
          const beatPx = barStartPx + b * pxPerBeat;
          if (beatPx >= 0 && beatPx <= width) {
            ctx.beginPath();
            ctx.moveTo(beatPx, height - 5);
            ctx.lineTo(beatPx, height);
            ctx.stroke();
          }
        }
      }
    }
  }, [scrollOffsetPx, zoomPxPerSecond, bpm, timeSignature, totalDurationMs, barMs, pxPerBar, pxPerBeat, beatsPerBar]);

  // Resize canvas to container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const rect = containerRef.current.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const timeMs = Math.max(0, Math.min(totalDurationMs, ((touchX + scrollOffsetPx) / zoomPxPerSecond) * 1000));
    onSeek(timeMs);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const timeMs = Math.max(0, Math.min(totalDurationMs, ((touchX + scrollOffsetPx) / zoomPxPerSecond) * 1000));
    onSeek(timeMs);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
    onSeekFinished(playheadMs);
  };

  return (
    <div
      id="timeline-header"
      className="flex h-9 w-full bg-[#0A0A0E] select-none border-b border-[#1A1A22] z-10"
      style={{ minHeight: '36px' }}
    >
      {/* Left column spacer matching track label column width with zoom controls */}
      <div
        style={{ width: `${headerLeftWidth}px` }}
        className="flex items-center justify-center gap-0.5 border-r border-[#1C1C26] bg-[#0E0E14] px-1"
      >
        <button
          id="btn-zoom-out"
          onClick={() => onZoomChange(Math.max(30, zoomPxPerSecond - 15))}
          title="Zoom Out"
          className="p-0.5 text-neutral-400 hover:text-white transition-colors"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button
          id="btn-zoom-in"
          onClick={() => onZoomChange(Math.min(260, zoomPxPerSecond + 15))}
          title="Zoom In"
          className="p-0.5 text-neutral-400 hover:text-white transition-colors"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Ruler Canvas Area with Seek Gestures */}
      <div
        ref={containerRef}
        id="timeline-ruler-track"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative flex-1 h-full cursor-pointer overflow-hidden"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />

        {/* Playhead handle on ruler */}
        {playheadPx >= -20 && playheadPx <= 4000 && (
          <div
            id="playhead-ruler-handle"
            style={{
              left: `${playheadPx}px`,
              transform: 'translateX(-50%)',
            }}
            className="absolute top-0 z-30 flex flex-col items-center pointer-events-none"
          >
            {/* Playhead flag handle */}
            <div className="h-3.5 w-3.5 bg-white rounded-b-sm shadow-sm" />

            {/* Time readout floating pill */}
            <div
              id="playhead_time_badge"
              className="absolute -top-7 rounded bg-[#181822]/95 px-1.5 py-0.5 text-[10.5px] font-mono font-medium text-white/95 border border-[#303040] shadow whitespace-nowrap"
            >
              {timeDisplayString}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
