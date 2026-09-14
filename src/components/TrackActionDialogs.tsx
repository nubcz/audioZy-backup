import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Headphones,
  Scissors,
  Copy,
  Sliders,
  Trash2,
  Download,
  Share2,
  Mic,
  Plus,
  FileAudio,
  X,
} from 'lucide-react';
import { Track, Clip, TrackPalette, getEffectiveDurationMs } from '../types';

// 1. Track Quick Menu Modal / Sheet
interface TrackQuickMenuProps {
  track: Track;
  isOpen: boolean;
  onClose: () => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onChangeColor: (color: string) => void;
  onDeleteTrack: () => void;
}

export const TrackQuickMenuModal: React.FC<TrackQuickMenuProps> = ({
  track,
  isOpen,
  onClose,
  onToggleMute,
  onToggleSolo,
  onChangeColor,
  onDeleteTrack,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div
        id="track-quick-menu-modal"
        className="w-full sm:max-w-md bg-[#16171E] border border-[#2B2D3A] rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-200"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#232430]">
          <div className="flex items-center gap-2.5">
            <div style={{ backgroundColor: track.color }} className="h-3.5 w-3.5 rounded-full" />
            <h3 className="text-lg font-semibold text-white">{track.name} Options</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mute and Solo options */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button
            type="button"
            id="btn-track-mute"
            onClick={() => {
              onToggleMute();
              onClose();
            }}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
              track.isMuted
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                : 'bg-[#22232E] text-white hover:bg-[#2B2C3A]'
            }`}
          >
            {track.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {track.isMuted ? 'Unmute' : 'Mute'}
          </button>

          <button
            type="button"
            id="btn-track-solo"
            onClick={() => {
              onToggleSolo();
              onClose();
            }}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
              track.isSolo
                ? 'bg-amber-500 text-black font-semibold shadow-lg shadow-amber-500/20'
                : 'bg-[#22232E] text-white hover:bg-[#2B2C3A]'
            }`}
          >
            <Headphones className="h-4 w-4" />
            {track.isSolo ? 'Solo (Active)' : 'Solo'}
          </button>
        </div>

        {/* Color Palette Picker */}
        <div className="mt-6">
          <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider block mb-3">
            Track Color
          </label>
          <div className="flex items-center justify-between gap-2">
            {TrackPalette.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChangeColor(color);
                  onClose();
                }}
                style={{ backgroundColor: color }}
                className={`h-8 w-8 rounded-full transition-transform hover:scale-110 active:scale-95 ${
                  track.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#16171E]' : ''
                }`}
              />
            ))}
          </div>
        </div>

        {/* Delete Track */}
        <div className="mt-8 pt-4 border-t border-[#232430]">
          <button
            type="button"
            id="btn-delete-track"
            onClick={() => {
              onDeleteTrack();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 active:scale-[0.99] font-medium text-sm transition-all"
          >
            <Trash2 className="h-4 w-4" />
            Delete Track
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. Clip Action Menu Modal / Sheet
interface ClipActionMenuProps {
  clip: Clip;
  isOpen: boolean;
  onClose: () => void;
  onSplit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onFadeClick: () => void;
  onToggleMute: () => void;
}

export const ClipActionMenuModal: React.FC<ClipActionMenuProps> = ({
  clip,
  isOpen,
  onClose,
  onSplit,
  onDuplicate,
  onDelete,
  onFadeClick,
  onToggleMute,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div
        id="clip-action-menu-modal"
        className="w-full sm:max-w-md bg-[#16171E] border border-[#2B2D3A] rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-200"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#232430]">
          <div className="min-w-0 pr-3">
            <span className="text-xs text-neutral-400 uppercase tracking-wider block">Clip Actions</span>
            <h3 className="text-lg font-semibold text-white truncate">{clip.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-1 mt-4">
          <button
            id="btn-clip-split"
            onClick={() => {
              onSplit();
              onClose();
            }}
            className="flex items-center gap-3.5 py-3 px-3.5 rounded-xl text-left text-neutral-200 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            <Scissors className="h-5 w-5 text-neutral-400" />
            <span className="text-sm font-medium">Split at Playhead</span>
          </button>

          <button
            id="btn-clip-duplicate"
            onClick={() => {
              onDuplicate();
              onClose();
            }}
            className="flex items-center gap-3.5 py-3 px-3.5 rounded-xl text-left text-neutral-200 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            <Copy className="h-5 w-5 text-neutral-400" />
            <span className="text-sm font-medium">Duplicate Clip</span>
          </button>

          <button
            id="btn-clip-fades"
            onClick={() => {
              onFadeClick();
              onClose();
            }}
            className="flex items-center gap-3.5 py-3 px-3.5 rounded-xl text-left text-neutral-200 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            <Sliders className="h-5 w-5 text-neutral-400" />
            <span className="text-sm font-medium">Fade In / Fade Out...</span>
          </button>

          <button
            id="btn-clip-mute"
            onClick={() => {
              onToggleMute();
              onClose();
            }}
            className="flex items-center gap-3.5 py-3 px-3.5 rounded-xl text-left text-neutral-200 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            {clip.isMuted ? (
              <Volume2 className="h-5 w-5 text-neutral-400" />
            ) : (
              <VolumeX className="h-5 w-5 text-neutral-400" />
            )}
            <span className="text-sm font-medium">{clip.isMuted ? 'Unmute Clip' : 'Mute Clip'}</span>
          </button>

          <div className="my-1 border-t border-[#232430]" />

          <button
            id="btn-clip-delete"
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="flex items-center gap-3.5 py-3 px-3.5 rounded-xl text-left text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 active:bg-rose-500/20 transition-colors"
          >
            <Trash2 className="h-5 w-5 text-rose-400" />
            <span className="text-sm font-medium">Delete Clip</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. Fade In / Out Dialog
interface FadeDialogProps {
  clip: Clip;
  isOpen: boolean;
  onClose: () => void;
  onApply: (fadeInMs: number, fadeOutMs: number) => void;
}

export const FadeDialog: React.FC<FadeDialogProps> = ({ clip, isOpen, onClose, onApply }) => {
  const [fadeIn, setFadeIn] = useState(clip.fadeInMs || 0);
  const [fadeOut, setFadeOut] = useState(clip.fadeOutMs || 0);

  if (!isOpen) return null;

  const maxFade = Math.max(100, Math.floor(getEffectiveDurationMs(clip) / 2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div
        id="fade-dialog"
        className="w-full max-w-sm bg-[#16171E] border border-[#2B2D3A] rounded-2xl p-6 shadow-2xl animate-in fade-in duration-150"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Clip Fades</h3>

        <div className="space-y-5">
          <div>
            <div className="flex justify-between text-xs font-medium text-neutral-300 mb-1.5">
              <span>Fade In</span>
              <span className="font-mono">{(fadeIn / 1000).toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min={0}
              max={maxFade}
              step={50}
              value={fadeIn}
              onChange={(e) => setFadeIn(parseInt(e.target.value, 10))}
              className="w-full accent-white h-2 bg-[#282935] rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-neutral-300 mb-1.5">
              <span>Fade Out</span>
              <span className="font-mono">{(fadeOut / 1000).toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min={0}
              max={maxFade}
              step={50}
              value={fadeOut}
              onChange={(e) => setFadeOut(parseInt(e.target.value, 10))}
              className="w-full accent-white h-2 bg-[#282935] rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#232430]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-apply-fades"
            onClick={() => {
              onApply(fadeIn, fadeOut);
              onClose();
            }}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-white text-black hover:bg-neutral-200 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

// 4. Rename Project Dialog
interface RenameProjectDialogProps {
  currentName: string;
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => void;
}

export const RenameProjectDialog: React.FC<RenameProjectDialogProps> = ({
  currentName,
  isOpen,
  onClose,
  onRename,
}) => {
  const [name, setName] = useState(currentName);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div
        id="rename-project-dialog"
        className="w-full max-w-sm bg-[#16171E] border border-[#2B2D3A] rounded-2xl p-6 shadow-2xl animate-in fade-in duration-150"
      >
        <h3 className="text-lg font-semibold text-white mb-3">Rename Project</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          autoFocus
          className="w-full rounded-xl bg-[#0F1015] border border-[#2E3040] px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white transition-colors"
        />

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-save-project-rename"
            onClick={() => {
              if (name.trim()) {
                onRename(name.trim());
                onClose();
              }
            }}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-white text-black hover:bg-neutral-200 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// 5. Unsaved Changes Dialog
interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDiscard: () => void;
}

export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  onDiscard,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div
        id="unsaved-changes-dialog"
        className="w-full max-w-sm bg-[#16171E] border border-[#2B2D3A] rounded-2xl p-6 shadow-2xl animate-in fade-in duration-150"
      >
        <h3 className="text-lg font-semibold text-white mb-2">Unsaved Changes</h3>
        <p className="text-sm text-neutral-400 leading-relaxed mb-6">
          Do you want to save your changes before returning to the project list?
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            id="btn-dialog-save"
            onClick={onSave}
            className="w-full py-2.5 px-4 text-sm font-semibold rounded-xl bg-white text-black hover:bg-neutral-200 transition-colors"
          >
            Save Changes
          </button>

          <button
            type="button"
            id="btn-dialog-discard"
            onClick={onDiscard}
            className="w-full py-2.5 px-4 text-sm font-medium rounded-xl text-rose-400 hover:bg-rose-500/15 transition-colors"
          >
            Discard
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// 6. Share Bottom Sheet
interface ShareSheetProps {
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  onExportAudio: () => void;
  onShareApp: () => void;
  onSaveDevice: () => void;
}

export const ShareSheet: React.FC<ShareSheetProps> = ({
  projectName,
  isOpen,
  onClose,
  onExportAudio,
  onShareApp,
  onSaveDevice,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div
        id="share-sheet-modal"
        className="w-full sm:max-w-md bg-[#16171E] border border-[#2B2D3A] rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-200"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#232430]">
          <div>
            <span className="text-xs text-neutral-400 uppercase tracking-wider block">Export & Share</span>
            <h3 className="text-lg font-semibold text-white">{projectName}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-1 mt-4">
          <button
            type="button"
            id="btn-export-audio-wav"
            onClick={() => {
              onExportAudio();
              onClose();
            }}
            className="flex items-center gap-3.5 py-3.5 px-3.5 rounded-xl text-left text-neutral-200 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            <FileAudio className="h-5 w-5 text-neutral-300" />
            <div>
              <div className="text-sm font-medium">Export as audio file (.wav)</div>
              <div className="text-xs text-neutral-500">Renders and downloads full project mixdown</div>
            </div>
          </button>

          <button
            type="button"
            id="btn-share-to-app"
            onClick={() => {
              onShareApp();
              onClose();
            }}
            className="flex items-center gap-3.5 py-3.5 px-3.5 rounded-xl text-left text-neutral-200 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            <Share2 className="h-5 w-5 text-neutral-300" />
            <div>
              <div className="text-sm font-medium">Share to app</div>
              <div className="text-xs text-neutral-500">Open system share dialog with project file</div>
            </div>
          </button>

          <button
            type="button"
            id="btn-save-to-device"
            onClick={() => {
              onSaveDevice();
              onClose();
            }}
            className="flex items-center gap-3.5 py-3.5 px-3.5 rounded-xl text-left text-neutral-200 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            <Download className="h-5 w-5 text-neutral-300" />
            <div>
              <div className="text-sm font-medium">Save to device</div>
              <div className="text-xs text-neutral-500">Download project JSON configuration snapshot</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

// 7. Add Track Bottom Sheet
interface AddTrackSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onImportAudio: () => void;
  onRecordNewTrack: () => void;
  onBlankTrack: () => void;
}

export const AddTrackSheet: React.FC<AddTrackSheetProps> = ({
  isOpen,
  onClose,
  onImportAudio,
  onRecordNewTrack,
  onBlankTrack,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div
        id="add-track-sheet-modal"
        className="w-full sm:max-w-md bg-[#16171E] border border-[#2B2D3A] rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-200"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#232430]">
          <h3 className="text-lg font-semibold text-white">Add Track</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <button
            type="button"
            id="btn-sheet-import-audio"
            onClick={() => {
              onImportAudio();
              onClose();
            }}
            className="flex items-center gap-3.5 py-3.5 px-3.5 rounded-xl text-left text-neutral-200 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            <Download className="h-5 w-5 text-neutral-300" />
            <div>
              <div className="text-sm font-medium">Import Audio File</div>
              <div className="text-xs text-neutral-500">Add MP3, WAV, M4A, or OGG file as new track</div>
            </div>
          </button>

          <button
            type="button"
            id="btn-sheet-record-track"
            onClick={() => {
              onRecordNewTrack();
              onClose();
            }}
            className="flex items-center gap-3.5 py-3.5 px-3.5 rounded-xl text-left text-neutral-200 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            <Mic className="h-5 w-5 text-rose-400" />
            <div>
              <div className="text-sm font-medium">Record New Track</div>
              <div className="text-xs text-neutral-500">Arm microphone to record directly to a new track</div>
            </div>
          </button>

          <button
            type="button"
            id="btn-sheet-blank-track"
            onClick={() => {
              onBlankTrack();
              onClose();
            }}
            className="flex items-center gap-3.5 py-3.5 px-3.5 rounded-xl text-left text-neutral-200 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            <Plus className="h-5 w-5 text-neutral-300" />
            <div>
              <div className="text-sm font-medium">Blank Track</div>
              <div className="text-xs text-neutral-500">Add an empty track ready for clips</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
