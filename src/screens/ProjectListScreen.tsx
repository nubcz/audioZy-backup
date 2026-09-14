import React from 'react';
import { Plus, Music2, Clock, Trash2, Sliders, ChevronRight } from 'lucide-react';
import { Project } from '../types';

interface ProjectListScreenProps {
  projects: Project[];
  onOpenProject: (projectId: string) => void;
  onCreateNewProject: () => void;
  onDeleteProject: (projectId: string, e: React.MouseEvent) => void;
}

export const ProjectListScreen: React.FC<ProjectListScreenProps> = ({
  projects,
  onOpenProject,
  onCreateNewProject,
  onDeleteProject,
}) => {
  const formatDate = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0A0A0E] text-white select-none overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-[#181822] bg-[#0E0E14]/90 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black font-bold shadow-md">
            <Music2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Audiozy</h1>
            <p className="text-[11px] font-medium text-neutral-400">Multi-track Studio</p>
          </div>
        </div>

        <button
          id="btn-new-project-header"
          type="button"
          onClick={onCreateNewProject}
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-200 active:scale-95 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>New Project</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-8 py-6 max-w-4xl mx-auto w-full">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-300">Your Projects ({projects.length})</h2>
        </div>

        {projects.length === 0 ? (
          <div
            id="empty-projects-state"
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#262634] p-12 text-center my-8"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#161720] text-neutral-400 mb-4">
              <Music2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No projects yet</h3>
            <p className="text-sm text-neutral-400 max-w-xs mb-6">
              Create your first multi-track project with audio recording, custom tempos, and mixing clips.
            </p>
            <button
              id="btn-create-first-project"
              type="button"
              onClick={onCreateNewProject}
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-neutral-200 transition-colors shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2">
            {projects.map((project) => {
              const totalClips = project.tracks.reduce((acc, t) => acc + t.clips.length, 0);

              return (
                <div
                  key={project.id}
                  id={`project-card-${project.id}`}
                  onClick={() => onOpenProject(project.id)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[#1E1F2A] bg-[#12131A] p-5 hover:border-[#383A4E] hover:bg-[#161822] cursor-pointer transition-all shadow-sm hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1C1D28] text-white group-hover:bg-[#252636] transition-colors">
                          <Music2 className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                            {project.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                            <span>{project.tracks.length} tracks</span>
                            <span>•</span>
                            <span>{totalClips} clips</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        id={`btn-delete-project-${project.id}`}
                        onClick={(e) => onDeleteProject(project.id, e)}
                        title="Delete project"
                        aria-label="Delete project"
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[#1C1D26] pt-3 text-xs text-neutral-400">
                    <div className="flex items-center gap-3 font-mono">
                      <span className="flex items-center gap-1">
                        <Sliders className="h-3 w-3 text-neutral-500" />
                        {project.bpm} BPM
                      </span>
                      <span>{project.timeSignature}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-neutral-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(project.lastModified)}</span>
                      <ChevronRight className="h-4 w-4 ml-1 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
