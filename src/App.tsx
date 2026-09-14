import React, { useState, useEffect } from 'react';
import { ScreenState, Project, SourceOption } from './types';
import { ProjectStorage } from './model/ProjectStorage';
import { ProjectListScreen } from './screens/ProjectListScreen';
import { CreateProjectScreen } from './screens/CreateProjectScreen';
import { TimelineScreen } from './screens/TimelineScreen';

export const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(() => ProjectStorage.getAllProjects());
  const [screenState, setScreenState] = useState<ScreenState>(() => {
    const lastId = ProjectStorage.getLastOpenedProjectId();
    const all = ProjectStorage.getAllProjects();
    const target = all.find((p) => p.id === lastId) || all[0];
    if (target) {
      return { type: 'Timeline' };
    }
    return { type: 'ProjectList' };
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    const lastId = ProjectStorage.getLastOpenedProjectId();
    const all = ProjectStorage.getAllProjects();
    const target = all.find((p) => p.id === lastId) || all[0];
    return target ? target.id : null;
  });

  // Reload projects list from storage
  const refreshProjects = () => {
    const list = ProjectStorage.getAllProjects();
    setProjects(list);
  };

  const handleOpenProject = (id: string) => {
    setActiveProjectId(id);
    ProjectStorage.setLastOpenedProjectId(id);
    setScreenState({ type: 'Timeline' });
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    ProjectStorage.deleteProject(id);
    refreshProjects();
    if (activeProjectId === id) {
      const remaining = ProjectStorage.getAllProjects();
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleCreateProject = async (
    newProject: Project,
    sourceOption: SourceOption,
    importedFile?: File
  ) => {
    let initialAction: 'OPEN_FILE_PICKER' | 'ARM_RECORD' | 'NONE' = 'NONE';

    if (sourceOption === 'RECORD_MANUALLY') {
      initialAction = 'ARM_RECORD';
    } else if (sourceOption === 'IMPORT_AUDIO') {
      if (importedFile) {
        try {
          const arrayBuffer = await importedFile.arrayBuffer();
          const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const tempCtx = new AudioCtxClass();
          const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
          const durationMs = Math.round(audioBuffer.duration * 1000);
          const { extractPeaksFromAudioBuffer } = await import('./audio/WaveformExtractor');
          const peaks = extractPeaksFromAudioBuffer(audioBuffer, Math.max(40, Math.min(300, Math.round(durationMs / 100))));

          newProject.tracks[0].clips = [
            {
              id: 'clip_init_' + Date.now(),
              trackId: newProject.tracks[0].id,
              name: importedFile.name.replace(/\.[^/.]+$/, ''),
              startTimeMs: 0,
              durationMs,
              trimStartMs: 0,
              trimEndMs: 0,
              fadeInMs: 50,
              fadeOutMs: 100,
              isMuted: false,
              audioBuffer,
              peaks,
              isLoading: false,
            },
          ];
        } catch (e) {
          console.error('Failed to decode initial imported audio', e);
        }
      } else {
        initialAction = 'OPEN_FILE_PICKER';
      }
    }

    ProjectStorage.saveProject(newProject);
    refreshProjects();
    setActiveProjectId(newProject.id);
    ProjectStorage.setLastOpenedProjectId(newProject.id);
    setScreenState({ type: 'Timeline', initialAction });
  };

  // Get active project
  const currentProject = activeProjectId ? ProjectStorage.loadProject(activeProjectId) : null;

  return (
    <div className="h-full w-full bg-[#0A0A0E] text-white">
      {screenState.type === 'ProjectList' && (
        <ProjectListScreen
          projects={projects}
          onOpenProject={handleOpenProject}
          onCreateNewProject={() => setScreenState({ type: 'CreateProject' })}
          onDeleteProject={handleDeleteProject}
        />
      )}

      {screenState.type === 'CreateProject' && (
        <CreateProjectScreen
          onBack={() => setScreenState({ type: 'ProjectList' })}
          onCreateProject={handleCreateProject}
        />
      )}

      {screenState.type === 'Timeline' && (
        currentProject ? (
          <TimelineScreen
            key={currentProject.id}
            initialProject={currentProject}
            initialAction={screenState.initialAction}
            onNavigateBack={() => {
              refreshProjects();
              setScreenState({ type: 'ProjectList' });
            }}
          />
        ) : (
          <ProjectListScreen
            projects={projects}
            onOpenProject={handleOpenProject}
            onCreateNewProject={() => setScreenState({ type: 'CreateProject' })}
            onDeleteProject={handleDeleteProject}
          />
        )
      )}
    </div>
  );
};
export default App;
