import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Project, Clip, Track, TrackPalette, getEffectiveDurationMs, getTotalDurationMs, InitialTimelineAction } from '../types';
import { AudioEngine } from '../audio/AudioEngine';
import { AudioRecorder } from '../audio/AudioRecorder';
import { UndoRedoManager } from '../model/UndoRedoManager';
import { ProjectStorage } from '../model/ProjectStorage';
import { TopBar } from '../components/TopBar';
import { TimelineHeader } from '../components/TimelineHeader';
import { TrackRow } from '../components/TrackRow';
import { AddTrackRow } from '../components/AddTrackRow';
import { TransportBar } from '../components/TransportBar';
import {
  TrackQuickMenuModal,
  ClipActionMenuModal,
  FadeDialog,
  RenameProjectDialog,
  UnsavedChangesDialog,
  ShareSheet,
  AddTrackSheet,
} from '../components/TrackActionDialogs';

interface TimelineScreenProps {
  initialProject: Project;
  initialAction?: InitialTimelineAction;
  onNavigateBack: () => void;
}

export const TimelineScreen: React.FC<TimelineScreenProps> = ({
  initialProject,
  initialAction = 'NONE',
  onNavigateBack,
}) => {
  const [project, setProject] = useState<Project>(initialProject);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  // Viewport & Zoom
  const [zoomPxPerSecond, setZoomPxPerSecond] = useState(60);
  const [scrollOffsetPx, setScrollOffsetPx] = useState(0);

  // Playback & Audio
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadMs, setPlayheadMs] = useState(0);
  const [isRecordArmed, setIsRecordArmed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Modal dialog states
  const [activeTrackMenu, setActiveTrackMenu] = useState<Track | null>(null);
  const [activeClipMenu, setActiveClipMenu] = useState<Clip | null>(null);
  const [activeFadeClip, setActiveFadeClip] = useState<Clip | null>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isUnsavedDialogOpen, setIsUnsavedDialogOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAddTrackOpen, setIsAddTrackOpen] = useState(false);
  const [targetTimeForImport, setTargetTimeForImport] = useState<number | null>(null);

  // Undo/Redo
  const undoManager = useRef(new UndoRedoManager());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Audio Engine & Recorder
  const audioEngine = useRef(new AudioEngine());
  const audioRecorder = useRef(new AudioRecorder());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const tracksScrollContainerRef = useRef<HTMLDivElement | null>(null);

  const headerLeftWidth = 60;

  // Initialize and register callbacks
  useEffect(() => {
    const engine = audioEngine.current;
    engine.setOnTimeUpdate((timeMs) => {
      setPlayheadMs(timeMs);
    });
    engine.setOnPlaybackStateChange((playing) => {
      setIsPlaying(playing);
    });

    return () => {
      engine.pause();
    };
  }, []);

  // Update undo/redo availability
  const updateUndoRedo = () => {
    setCanUndo(undoManager.current.canUndo());
    setCanRedo(undoManager.current.canRedo());
  };

  // Helper to commit state with history
  const commitProjectChange = useCallback((newProject: Project) => {
    undoManager.current.pushState(project);
    setProject(newProject);
    setHasUnsavedChanges(true);
    updateUndoRedo();
  }, [project]);

  // Initial Action Handlers
  useEffect(() => {
    if (initialAction === 'ARM_RECORD') {
      setIsRecordArmed(true);
    } else if (initialAction === 'OPEN_FILE_PICKER') {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  }, [initialAction]);

  // Auto-scroll timeline when playhead reaches edge
  useEffect(() => {
    if (!isPlaying) return;
    const container = tracksScrollContainerRef.current;
    if (!container) return;

    const viewportWidth = container.clientWidth - headerLeftWidth;
    const playheadPx = (playheadMs / 1000) * zoomPxPerSecond;
    const currentScroll = scrollOffsetPx;

    if (playheadPx > currentScroll + viewportWidth * 0.8) {
      const newScroll = playheadPx - viewportWidth * 0.2;
      setScrollOffsetPx(Math.max(0, newScroll));
      container.scrollLeft = newScroll;
    } else if (playheadPx < currentScroll) {
      setScrollOffsetPx(Math.max(0, playheadPx - 20));
      container.scrollLeft = Math.max(0, playheadPx - 20);
    }
  }, [playheadMs, isPlaying, zoomPxPerSecond, scrollOffsetPx]);

  // Keyboard shortcuts (Space = Play/Pause, Ctrl+Z = Undo, Ctrl+Y = Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, isPlaying]);

  // Handle Play/Pause
  const handleTogglePlay = () => {
    if (isRecording) {
      handleStopRecording();
      return;
    }
    audioEngine.current.togglePlay(project);
  };

  // Handle Rewind
  const handleRewindTap = () => {
    audioEngine.current.jumpToStart(project);
  };

  const handleRewindPressStart = () => {
    audioEngine.current.startFastRewind(project);
  };

  const handleRewindPressEnd = () => {
    audioEngine.current.stopFastRewind();
  };

  // Handle Recording Flow
  const handleRecordClick = async () => {
    if (isRecording) {
      await handleStopRecording();
    } else if (!isRecordArmed) {
      setIsRecordArmed(true);
    } else {
      // Start recording
      try {
        await audioRecorder.current.startRecording();
        setIsRecording(true);
        audioEngine.current.play(project);
      } catch (err) {
        console.error('Failed to start recording', err);
        setIsRecordArmed(false);
      }
    }
  };

  const handleStopRecording = async () => {
    audioEngine.current.pause();
    setIsRecording(false);
    setIsRecordArmed(false);

    try {
      const recResult = await audioRecorder.current.stopRecording();
      if (recResult && recResult.durationMs > 200) {
        // Create new recorded clip on active track or create new track
        const targetTrack = project.tracks[0] || {
          id: 'track_rec_' + Date.now(),
          name: 'Recorded',
          color: TrackPalette[1],
          isMuted: false,
          isSolo: false,
          clips: [],
        };

        const newClip: Clip = {
          id: 'clip_rec_' + Date.now(),
          trackId: targetTrack.id,
          name: 'Take ' + (targetTrack.clips.length + 1),
          startTimeMs: playheadMs,
          durationMs: recResult.durationMs,
          trimStartMs: 0,
          trimEndMs: 0,
          fadeInMs: 50,
          fadeOutMs: 100,
          isMuted: false,
          audioBuffer: recResult.audioBuffer,
          peaks: recResult.peaks,
          isLoading: false,
        };

        let updatedTracks = project.tracks.map((t) => {
          if (t.id === targetTrack.id) {
            return { ...t, clips: [...t.clips, newClip] };
          }
          return t;
        });

        if (!project.tracks.some((t) => t.id === targetTrack.id)) {
          updatedTracks = [...updatedTracks, { ...targetTrack, clips: [newClip] }];
        }

        commitProjectChange({ ...project, tracks: updatedTracks });
        setSelectedClipId(newClip.id);
      }
    } catch (e) {
      console.error('Error stopping recording', e);
    }
  };

  // Seek
  const handleSeek = (timeMs: number) => {
    audioEngine.current.seekTo(timeMs, project);
  };

  const handleSeekFinished = (timeMs: number) => {
    // Snap to nearest beat or bar
    const bpm = Math.max(1, project.bpm);
    const beatsPerBar = parseInt(project.timeSignature.split('/')[0], 10) || 4;
    const beatMs = 60000 / bpm;
    const barMs = beatMs * beatsPerBar;
    const nearestBar = Math.round(timeMs / barMs) * barMs;
    const snapThreshold = barMs * 0.15;

    const finalTime = Math.abs(timeMs - nearestBar) < snapThreshold ? nearestBar : timeMs;
    audioEngine.current.seekTo(finalTime, project);
  };

  // Undo / Redo
  const handleUndo = () => {
    const prevState = undoManager.current.undo(project);
    if (prevState) {
      setProject(prevState);
      updateUndoRedo();
      setHasUnsavedChanges(true);
    }
  };

  const handleRedo = () => {
    const nextState = undoManager.current.redo(project);
    if (nextState) {
      setProject(nextState);
      updateUndoRedo();
      setHasUnsavedChanges(true);
    }
  };

  // Back Navigation & Unsaved Dialog
  const handleBack = () => {
    if (hasUnsavedChanges) {
      setIsUnsavedDialogOpen(true);
    } else {
      audioEngine.current.pause();
      onNavigateBack();
    }
  };

  const handleSaveAndExit = () => {
    ProjectStorage.saveProject(project);
    setHasUnsavedChanges(false);
    setIsUnsavedDialogOpen(false);
    audioEngine.current.pause();
    onNavigateBack();
  };

  const handleDiscardAndExit = () => {
    setIsUnsavedDialogOpen(false);
    audioEngine.current.pause();
    onNavigateBack();
  };

  // Clip Operations
  const handleClipMove = (clipId: string, newStartMs: number) => {
    const updatedTracks = project.tracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) => {
        if (clip.id === clipId) {
          return { ...clip, startTimeMs: newStartMs };
        }
        return clip;
      }),
    }));
    commitProjectChange({ ...project, tracks: updatedTracks });
  };

  const handleClipTrim = (clipId: string, deltaStartMs: number, deltaEndMs: number) => {
    const updatedTracks = project.tracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) => {
        if (clip.id === clipId) {
          const maxTrimStart = Math.max(0, clip.durationMs - clip.trimEndMs - 100);
          const maxTrimEnd = Math.max(0, clip.durationMs - clip.trimStartMs - 100);
          const newTrimStart = Math.max(0, Math.min(maxTrimStart, clip.trimStartMs + deltaStartMs));
          const newTrimEnd = Math.max(0, Math.min(maxTrimEnd, clip.trimEndMs + deltaEndMs));
          return {
            ...clip,
            trimStartMs: newTrimStart,
            trimEndMs: newTrimEnd,
          };
        }
        return clip;
      }),
    }));
    commitProjectChange({ ...project, tracks: updatedTracks });
  };

  const handleSplitClipAtPlayhead = (clip: Clip) => {
    const effectiveDur = getEffectiveDurationMs(clip);
    const clipEnd = clip.startTimeMs + effectiveDur;

    if (playheadMs <= clip.startTimeMs + 100 || playheadMs >= clipEnd - 100) {
      return;
    }

    const splitOffsetMs = playheadMs - clip.startTimeMs;

    // Piece 1
    const piece1: Clip = {
      ...clip,
      id: 'clip_' + Date.now() + '_1',
      name: clip.name + ' (Part 1)',
      trimEndMs: (clip.trimEndMs || 0) + (effectiveDur - splitOffsetMs),
    };

    // Piece 2
    const piece2: Clip = {
      ...clip,
      id: 'clip_' + Date.now() + '_2',
      name: clip.name + ' (Part 2)',
      startTimeMs: playheadMs,
      trimStartMs: (clip.trimStartMs || 0) + splitOffsetMs,
    };

    const updatedTracks = project.tracks.map((t) => {
      if (t.id === clip.trackId) {
        const filtered = t.clips.filter((c) => c.id !== clip.id);
        return { ...t, clips: [...filtered, piece1, piece2] };
      }
      return t;
    });

    commitProjectChange({ ...project, tracks: updatedTracks });
    setSelectedClipId(piece2.id);
  };

  const handleDuplicateClip = (clip: Clip) => {
    const effectiveDur = getEffectiveDurationMs(clip);
    const duplicate: Clip = {
      ...clip,
      id: 'clip_' + Date.now() + '_dup',
      name: clip.name + ' (Copy)',
      startTimeMs: clip.startTimeMs + effectiveDur + 500,
    };

    const updatedTracks = project.tracks.map((t) => {
      if (t.id === clip.trackId) {
        return { ...t, clips: [...t.clips, duplicate] };
      }
      return t;
    });

    commitProjectChange({ ...project, tracks: updatedTracks });
    setSelectedClipId(duplicate.id);
  };

  const handleDeleteClip = (clipId: string) => {
    const updatedTracks = project.tracks.map((t) => ({
      ...t,
      clips: t.clips.filter((c) => c.id !== clipId),
    }));
    commitProjectChange({ ...project, tracks: updatedTracks });
    setSelectedClipId(null);
  };

  const handleToggleMuteClip = (clip: Clip) => {
    const updatedTracks = project.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id === clip.id) {
          return { ...c, isMuted: !c.isMuted };
        }
        return c;
      }),
    }));
    commitProjectChange({ ...project, tracks: updatedTracks });
  };

  const handleApplyFades = (fadeInMs: number, fadeOutMs: number) => {
    if (!activeFadeClip) return;
    const updatedTracks = project.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id === activeFadeClip.id) {
          return { ...c, fadeInMs, fadeOutMs };
        }
        return c;
      }),
    }));
    commitProjectChange({ ...project, tracks: updatedTracks });
    setActiveFadeClip(null);
  };

  // Track Operations
  const handleToggleMuteTrack = (trackId: string) => {
    const updatedTracks = project.tracks.map((t) => {
      if (t.id === trackId) {
        return { ...t, isMuted: !t.isMuted };
      }
      return t;
    });
    commitProjectChange({ ...project, tracks: updatedTracks });
  };

  const handleToggleSoloTrack = (trackId: string) => {
    const updatedTracks = project.tracks.map((t) => {
      if (t.id === trackId) {
        return { ...t, isSolo: !t.isSolo };
      }
      return t;
    });
    commitProjectChange({ ...project, tracks: updatedTracks });
  };

  const handleChangeTrackColor = (trackId: string, color: string) => {
    const updatedTracks = project.tracks.map((t) => {
      if (t.id === trackId) {
        return { ...t, color };
      }
      return t;
    });
    commitProjectChange({ ...project, tracks: updatedTracks });
  };

  const handleDeleteTrack = (trackId: string) => {
    const updatedTracks = project.tracks.filter((t) => t.id !== trackId);
    commitProjectChange({ ...project, tracks: updatedTracks });
  };

  const handleAddBlankTrack = () => {
    const newIndex = project.tracks.length + 1;
    const color = TrackPalette[(newIndex - 1) % TrackPalette.length];
    const newTrack: Track = {
      id: 'track_' + Date.now(),
      name: `Track ${newIndex}`,
      color,
      isMuted: false,
      isSolo: false,
      clips: [],
    };
    commitProjectChange({ ...project, tracks: [...project.tracks, newTrack] });
  };

  // Audio Import handler
  const handleAudioFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const arrayBuffer = await file.arrayBuffer();

    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const tempCtx = new AudioCtxClass();
    const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
    const durationMs = Math.round(audioBuffer.duration * 1000);

    const { extractPeaksFromAudioBuffer } = await import('../audio/WaveformExtractor');
    const peaks = extractPeaksFromAudioBuffer(audioBuffer, Math.max(40, Math.min(300, Math.round(durationMs / 100))));

    const startTimeMs = targetTimeForImport !== null ? targetTimeForImport : playheadMs;
    setTargetTimeForImport(null);

    const newIndex = project.tracks.length + 1;
    const color = TrackPalette[(newIndex - 1) % TrackPalette.length];
    const cleanClipName = file.name.replace(/\.[^/.]+$/, '');

    const newClip: Clip = {
      id: 'clip_imported_' + Date.now(),
      trackId: 'track_' + Date.now(),
      name: cleanClipName,
      startTimeMs,
      durationMs,
      trimStartMs: 0,
      trimEndMs: 0,
      fadeInMs: 50,
      fadeOutMs: 100,
      isMuted: false,
      audioBuffer,
      peaks,
      isLoading: false,
    };

    const newTrack: Track = {
      id: newClip.trackId,
      name: cleanClipName.substring(0, 10),
      color,
      isMuted: false,
      isSolo: false,
      clips: [newClip],
    };

    commitProjectChange({ ...project, tracks: [...project.tracks, newTrack] });
    setSelectedClipId(newClip.id);
  };

  // Export Audio (.wav)
  const handleExportWav = async () => {
    try {
      const blob = await audioEngine.current.exportToWav(project);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, '_')}_mixdown.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export audio', e);
    }
  };

  // Save project config to device (.json)
  const handleSaveToDevice = () => {
    const cleanProject = {
      ...project,
      tracks: project.tracks.map((t) => ({
        ...t,
        clips: t.clips.map(({ audioBuffer, ...rest }) => rest),
      })),
    };
    const jsonStr = JSON.stringify(cleanProject, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}.audiozy.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // System Share
  const handleShareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: project.name,
          text: `Check out my multi-track project "${project.name}" on Audiozy!`,
          url: window.location.href,
        });
      } catch (e) {}
    } else {
      handleSaveToDevice();
    }
  };

  const totalDurationMs = getTotalDurationMs(project);
  const timeDisplayString = AudioEngine.formatTime(playheadMs);
  const playheadPx = (playheadMs / 1000) * zoomPxPerSecond - scrollOffsetPx;

  return (
    <div className="flex h-full w-full flex-col bg-[#0A0A0E] text-white select-none overflow-hidden">
      {/* Hidden File Input for Audio Imports */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleAudioFileInput}
        className="hidden"
      />

      {/* Top Bar */}
      <TopBar
        projectName={project.name}
        onBackClick={handleBack}
        onTitleClick={() => setIsRenameOpen(true)}
        onShareClick={() => setIsShareOpen(true)}
      />

      {/* Timeline Ruler Header */}
      <TimelineHeader
        timeDisplayString={timeDisplayString}
        scrollOffsetPx={scrollOffsetPx}
        zoomPxPerSecond={zoomPxPerSecond}
        bpm={project.bpm}
        timeSignature={project.timeSignature}
        totalDurationMs={totalDurationMs}
        playheadMs={playheadMs}
        onSeek={handleSeek}
        onSeekFinished={handleSeekFinished}
        onZoomChange={setZoomPxPerSecond}
        headerLeftWidth={headerLeftWidth}
      />

      {/* Tracks Scrollable Workspace */}
      <div
        ref={tracksScrollContainerRef}
        id="timeline-tracks-container"
        onScroll={(e) => {
          setScrollOffsetPx(e.currentTarget.scrollLeft);
        }}
        className="relative flex-1 w-full overflow-y-auto overflow-x-auto bg-[#0A0A0E]"
      >
        {/* Full-height vertical playhead line running across all tracks */}
        {playheadPx >= 0 && playheadPx <= 4000 && (
          <div
            id="playhead-vertical-line"
            style={{
              left: `${playheadPx + headerLeftWidth}px`,
            }}
            className="absolute top-0 bottom-0 w-[1.5px] bg-white pointer-events-none z-30 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          />
        )}

        {/* Tracks List */}
        <div className="min-w-full inline-block">
          {project.tracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              selectedClipId={selectedClipId}
              zoomPxPerSecond={zoomPxPerSecond}
              scrollOffsetPx={scrollOffsetPx}
              bpm={project.bpm}
              timeSignature={project.timeSignature}
              totalDurationMs={totalDurationMs}
              onClipSelect={(id) => setSelectedClipId(id)}
              onClipMove={handleClipMove}
              onClipTrim={handleClipTrim}
              onClipOpenMenu={(clip) => setActiveClipMenu(clip)}
              onTrackDotClick={(t) => setActiveTrackMenu(t)}
              onEmptySpaceTap={(timeMs) => {
                setTargetTimeForImport(timeMs);
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
              headerLeftWidth={headerLeftWidth}
            />
          ))}

          {/* Add Track Row */}
          <AddTrackRow
            onAddTrackClick={() => setIsAddTrackOpen(true)}
            headerLeftWidth={headerLeftWidth}
          />
        </div>
      </div>

      {/* Bottom Transport Bar */}
      <TransportBar
        isPlaying={isPlaying}
        isRecording={isRecording}
        isRecordArmed={isRecordArmed}
        canUndo={canUndo}
        canRedo={canRedo}
        onPlayPauseClick={handleTogglePlay}
        onRewindTap={handleRewindTap}
        onRewindPressStart={handleRewindPressStart}
        onRewindPressEnd={handleRewindPressEnd}
        onRecordClick={handleRecordClick}
        onUndoClick={handleUndo}
        onRedoClick={handleRedo}
      />

      {/* Modals and Action Sheets */}
      {activeTrackMenu && (
        <TrackQuickMenuModal
          track={activeTrackMenu}
          isOpen={!!activeTrackMenu}
          onClose={() => setActiveTrackMenu(null)}
          onToggleMute={() => handleToggleMuteTrack(activeTrackMenu.id)}
          onToggleSolo={() => handleToggleSoloTrack(activeTrackMenu.id)}
          onChangeColor={(color) => handleChangeTrackColor(activeTrackMenu.id, color)}
          onDeleteTrack={() => handleDeleteTrack(activeTrackMenu.id)}
        />
      )}

      {activeClipMenu && (
        <ClipActionMenuModal
          clip={activeClipMenu}
          isOpen={!!activeClipMenu}
          onClose={() => setActiveClipMenu(null)}
          onSplit={() => handleSplitClipAtPlayhead(activeClipMenu)}
          onDuplicate={() => handleDuplicateClip(activeClipMenu)}
          onDelete={() => handleDeleteClip(activeClipMenu.id)}
          onFadeClick={() => {
            setActiveFadeClip(activeClipMenu);
          }}
          onToggleMute={() => handleToggleMuteClip(activeClipMenu)}
        />
      )}

      {activeFadeClip && (
        <FadeDialog
          clip={activeFadeClip}
          isOpen={!!activeFadeClip}
          onClose={() => setActiveFadeClip(null)}
          onApply={handleApplyFades}
        />
      )}

      <RenameProjectDialog
        currentName={project.name}
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        onRename={(newName) => {
          commitProjectChange({ ...project, name: newName });
        }}
      />

      <UnsavedChangesDialog
        isOpen={isUnsavedDialogOpen}
        onClose={() => setIsUnsavedDialogOpen(false)}
        onSave={handleSaveAndExit}
        onDiscard={handleDiscardAndExit}
      />

      <ShareSheet
        projectName={project.name}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        onExportAudio={handleExportWav}
        onShareApp={handleShareApp}
        onSaveDevice={handleSaveToDevice}
      />

      <AddTrackSheet
        isOpen={isAddTrackOpen}
        onClose={() => setIsAddTrackOpen(false)}
        onImportAudio={() => {
          if (fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
        onRecordNewTrack={() => {
          handleAddBlankTrack();
          setIsRecordArmed(true);
        }}
        onBlankTrack={handleAddBlankTrack}
      />
    </div>
  );
};
