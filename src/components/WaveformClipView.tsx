import React, { useRef, useEffect, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { Clip, getEffectiveDurationMs } from '../types';

interface WaveformClipViewProps {
  clip: Clip;
  isSelected: boolean;
  zoomPxPerSecond: number;
  scrollOffsetPx: number;
  onSelect: () => void;
  onMove: (newStartTimeMs: LongOrNumber) => void;
  onTrim: (trimStartDeltaMs: number, trimEndDeltaMs: number) => void;
  onOpenMenu: () => void;
}

type LongOrNumber = number;

export const WaveformClipView: React.FC<WaveformClipViewProps> = ({
  clip,
  isSelected,
  zoomPxPerSecond,
  scrollOffsetPx,
  onSelect,
  onMove,
  onTrim,
  onOpenMenu,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingMove, setIsDraggingMove] = useState(false);
  const dragStartXRef = useRef(0);
  const initialStartTimeRef = useRef(0);

  const effectiveDuration = getEffectiveDurationMs(clip);
  const startX = (clip.startTimeMs / 1000) * zoomPxPerSecond - scrollOffsetPx;
  const clipWidthPx = Math.max(30, (effectiveDuration / 1000) * zoomPxPerSecond);

  // Draw waveform bars
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const centerY = height / 2;
    const barSpacing = 4;
    const barWidth = 2;
    const totalBars = Math.max(1, Math.floor(width / barSpacing));

    const baseColor = clip.isMuted ? '#6B7280' : '#FFFFFF';
    ctx.fillStyle = baseColor;

    const peaks = clip.peaks;

    if (peaks && peaks.length > 0) {
      const clipDuration = Math.max(1, clip.durationMs);
      const trimStartRatio = Math.max(0, Math.min(1, (clip.trimStartMs || 0) / clipDuration));
      const trimEndRatio = Math.max(trimStartRatio, Math.min(1, 1 - (clip.trimEndMs || 0) / clipDuration));
      const activeSpan = Math.max(0.001, trimEndRatio - trimStartRatio);

      for (let i = 0; i < totalBars; i++) {
        const barRatio = i / totalBars;
        const peakRatio = trimStartRatio + barRatio * activeSpan;
        const peakIndex = Math.min(peaks.length - 1, Math.max(0, Math.floor(peakRatio * peaks.length)));
        const amplitude = peaks[peakIndex] || 0.3;

        const barHeight = Math.max(3, amplitude * (height * 0.8));
        const x = i * barSpacing + 2;

        ctx.beginPath();
        ctx.roundRect(x, centerY - barHeight / 2, barWidth, barHeight, 1);
        ctx.fill();
      }
    } else {
      // Loading or flat line
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < totalBars; i++) {
        const x = i * barSpacing + 2;
        ctx.fillRect(x, centerY - 1, barWidth, 2);
      }
    }
  }, [clip, clipWidthPx]);

  // Update canvas resolution on width change
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = Math.round(clipWidthPx);
      canvasRef.current.height = 58;
    }
  }, [clipWidthPx]);

  // Moving clip drag handling
  const handleClipPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.trim-handle') || (e.target as HTMLElement).closest('.menu-btn')) {
      return;
    }
    onSelect();
    setIsDraggingMove(true);
    dragStartXRef.current = e.clientX;
    initialStartTimeRef.current = clip.startTimeMs;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleClipPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingMove) return;
    const deltaPx = e.clientX - dragStartXRef.current;
    const deltaMs = Math.round((deltaPx / zoomPxPerSecond) * 1000);
    const newStart = Math.max(0, initialStartTimeRef.current + deltaMs);
    onMove(newStart);
  };

  const handleClipPointerUp = (e: React.PointerEvent) => {
    if (!isDraggingMove) return;
    setIsDraggingMove(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  // Trimming handles
  const handleTrimLeft = (e: React.PointerEvent) => {
    e.stopPropagation();
    const startXVal = e.clientX;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const onMoveTrim = (moveEvent: PointerEvent) => {
      const deltaPx = moveEvent.clientX - startXVal;
      const deltaMs = Math.round((deltaPx / zoomPxPerSecond) * 1000);
      onTrim(deltaMs, 0);
    };

    const onUpTrim = () => {
      window.removeEventListener('pointermove', onMoveTrim);
      window.removeEventListener('pointerup', onUpTrim);
    };

    window.addEventListener('pointermove', onMoveTrim);
    window.addEventListener('pointerup', onUpTrim);
  };

  const handleTrimRight = (e: React.PointerEvent) => {
    e.stopPropagation();
    const startXVal = e.clientX;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const onMoveTrim = (moveEvent: PointerEvent) => {
      const deltaPx = -(moveEvent.clientX - startXVal);
      const deltaMs = Math.round((deltaPx / zoomPxPerSecond) * 1000);
      onTrim(0, deltaMs);
    };

    const onUpTrim = () => {
      window.removeEventListener('pointermove', onMoveTrim);
      window.removeEventListener('pointerup', onUpTrim);
    };

    window.addEventListener('pointermove', onMoveTrim);
    window.addEventListener('pointerup', onUpTrim);
  };

  // Fade widths
  const fadeInPx = (clip.fadeInMs / 1000) * zoomPxPerSecond;
  const fadeOutPx = (clip.fadeOutMs / 1000) * zoomPxPerSecond;

  return (
    <div
      ref={containerRef}
      id={`clip-${clip.id}`}
      onPointerDown={handleClipPointerDown}
      onPointerMove={handleClipPointerMove}
      onPointerUp={handleClipPointerUp}
      onPointerCancel={handleClipPointerUp}
      onContextMenu={(e) => {
        e.preventDefault();
        onOpenMenu();
      }}
      style={{
        left: `${startX}px`,
        width: `${clipWidthPx}px`,
        touchAction: 'none',
      }}
      className={`absolute top-1.5 bottom-1.5 select-none rounded-[14px] cursor-grab active:cursor-grabbing transition-shadow ${
        isSelected
          ? 'bg-[#1D1F28] ring-2 ring-white shadow-lg z-20'
          : 'bg-[#15161D] border border-[#2B2D38] hover:border-[#3E4150] z-10'
      }`}
    >
      {/* Clip Name Label */}
      <div className="absolute top-1 left-2.5 right-6 flex items-center justify-between pointer-events-none z-10">
        <span className="text-[11px] font-medium tracking-tight text-white/90 truncate drop-shadow-sm">
          {clip.name}
        </span>
      </div>

      {/* Clip Options Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenMenu();
        }}
        aria-label="Clip options"
        className="menu-btn absolute top-1 right-1 h-5 w-5 rounded flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 z-30"
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>

      {/* Waveform Canvas */}
      <div className="relative h-full w-full px-2 py-2 overflow-hidden rounded-[13px]">
        <canvas ref={canvasRef} className="h-full w-full pointer-events-none" />

        {/* Fade In Gradient Overlay */}
        {clip.fadeInMs > 0 && (
          <div
            style={{ width: `${Math.min(clipWidthPx / 2, fadeInPx)}px` }}
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-black/70 to-transparent pointer-events-none"
          />
        )}

        {/* Fade Out Gradient Overlay */}
        {clip.fadeOutMs > 0 && (
          <div
            style={{ width: `${Math.min(clipWidthPx / 2, fadeOutPx)}px` }}
            className="absolute top-0 bottom-0 right-0 bg-gradient-to-l from-black/70 to-transparent pointer-events-none"
          />
        )}
      </div>

      {/* Trimming Handles when selected */}
      {isSelected && (
        <>
          {/* Left Trim Handle */}
          <div
            onPointerDown={handleTrimLeft}
            title="Drag to trim start"
            className="trim-handle absolute top-0 bottom-0 left-0 w-3.5 flex items-center justify-center cursor-ew-resize z-30 hover:bg-white/10 rounded-l-[14px]"
          >
            <div className="h-5 w-1 bg-white rounded-full shadow" />
          </div>

          {/* Right Trim Handle */}
          <div
            onPointerDown={handleTrimRight}
            title="Drag to trim end"
            className="trim-handle absolute top-0 bottom-0 right-0 w-3.5 flex items-center justify-center cursor-ew-resize z-30 hover:bg-white/10 rounded-r-[14px]"
          >
            <div className="h-5 w-1 bg-white rounded-full shadow" />
          </div>
        </>
      )}
    </div>
  );
};
