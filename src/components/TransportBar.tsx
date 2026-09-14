import React, { useRef } from 'react';
import { Play, Pause, Rewind, Undo2, Redo2 } from 'lucide-react';

interface TransportBarProps {
  isPlaying: boolean;
  isRecording: boolean;
  isRecordArmed: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onPlayPauseClick: () => void;
  onRewindTap: () => void;
  onRewindPressStart: () => void;
  onRewindPressEnd: () => void;
  onRecordClick: () => void;
  onUndoClick: () => void;
  onRedoClick: () => void;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  isPlaying,
  isRecording,
  isRecordArmed,
  canUndo,
  canRedo,
  onPlayPauseClick,
  onRewindTap,
  onRewindPressStart,
  onRewindPressEnd,
  onRecordClick,
  onUndoClick,
  onRedoClick,
}) => {
  const isPressingRewind = useRef(false);
  const pressTimer = useRef<number | null>(null);

  const handleRewindPointerDown = (e: React.PointerEvent) => {
    isPressingRewind.current = false;
    pressTimer.current = window.setTimeout(() => {
      isPressingRewind.current = true;
      onRewindPressStart();
    }, 250);
  };

  const handleRewindPointerUp = (e: React.PointerEvent) => {
    if (pressTimer.current !== null) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (isPressingRewind.current) {
      isPressingRewind.current = false;
      onRewindPressEnd();
    } else {
      onRewindTap();
    }
  };

  return (
    <div
      id="transport-bar"
      className="flex flex-col items-center justify-center bg-[#0C0C10] border-t border-[#181820] py-3 px-4 select-none z-20"
    >
      {/* Transport Controls Row: Rewind, Play/Pause, Record */}
      <div className="flex items-center justify-center gap-5">
        {/* Rewind Button */}
        <button
          id="btn-transport-rewind"
          type="button"
          onPointerDown={handleRewindPointerDown}
          onPointerUp={handleRewindPointerUp}
          onPointerCancel={handleRewindPointerUp}
          title="Tap to jump to 0, hold to fast rewind"
          aria-label="Rewind"
          className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#1C1D24] text-white hover:bg-[#282932] active:scale-95 transition-all shadow-md"
        >
          <Rewind className="h-6 w-6 fill-white" />
        </button>

        {/* Center Play/Pause Button: Large solid white circle with black icon */}
        <button
          id="btn-transport-play-pause"
          type="button"
          onClick={onPlayPauseClick}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white text-black hover:bg-neutral-100 active:scale-95 transition-all shadow-xl"
        >
          {isPlaying ? (
            <Pause className="h-8 w-8 fill-black" />
          ) : (
            <Play className="h-8 w-8 fill-black translate-x-0.5" />
          )}
        </button>

        {/* Record Button: Charcoal circle with dot inside */}
        <button
          id="btn-transport-record"
          type="button"
          onClick={onRecordClick}
          aria-label={isRecording ? 'Stop Recording' : 'Record'}
          title={isRecording ? 'Stop Recording' : isRecordArmed ? 'Record Armed' : 'Arm / Record'}
          className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#1C1D24] hover:bg-[#282932] active:scale-95 transition-all shadow-md"
        >
          <div
            className={`h-5 w-5 rounded-full transition-all ${
              isRecording
                ? 'bg-rose-600 animate-pulse scale-110 ring-4 ring-rose-500/30'
                : isRecordArmed
                ? 'bg-rose-500 ring-2 ring-rose-400'
                : 'bg-white'
            }`}
          />
        </button>
      </div>

      {/* Undo/Redo Strip Centered Below */}
      <div className="flex items-center justify-center gap-8 mt-2">
        <button
          id="btn-transport-undo"
          type="button"
          onClick={onUndoClick}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
            canUndo
              ? 'text-white hover:bg-white/10 active:scale-95'
              : 'text-neutral-600 cursor-not-allowed opacity-40'
          }`}
        >
          <Undo2 className="h-5 w-5" />
        </button>

        <button
          id="btn-transport-redo"
          type="button"
          onClick={onRedoClick}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
            canRedo
              ? 'text-white hover:bg-white/10 active:scale-95'
              : 'text-neutral-600 cursor-not-allowed opacity-40'
          }`}
        >
          <Redo2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
