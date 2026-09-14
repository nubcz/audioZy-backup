import { Project } from '../types';
import { createSampleProject } from './SampleProjectProvider';

const STORAGE_KEY = 'audiozy_projects_v1';
const LAST_OPENED_KEY = 'audiozy_last_opened_id';

export class ProjectStorage {
  static getAllProjects(): Project[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Initialize with default sample project
        const sample = createSampleProject();
        this.saveProject(sample);
        return [sample];
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      const sample = createSampleProject();
      this.saveProject(sample);
      return [sample];
    } catch (e) {
      console.warn('Failed to read projects from storage, returning sample', e);
      return [createSampleProject()];
    }
  }

  static loadProject(id: string): Project | null {
    const all = this.getAllProjects();
    return all.find((p) => p.id === id) || null;
  }

  static saveProject(project: Project): void {
    try {
      const all = this.getAllProjects().filter((p) => p.id !== project.id);
      // Strip AudioBuffer if attached before serializing to localStorage
      const cleanProject: Project = {
        ...project,
        lastModified: Date.now(),
        tracks: project.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) => {
            const { audioBuffer, ...rest } = c;
            return rest;
          }),
        })),
      };
      all.unshift(cleanProject);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to save project', e);
    }
  }

  static deleteProject(id: string): void {
    try {
      const all = this.getAllProjects().filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      if (this.getLastOpenedProjectId() === id) {
        localStorage.removeItem(LAST_OPENED_KEY);
      }
    } catch (e) {
      console.error('Failed to delete project', e);
    }
  }

  static getLastOpenedProjectId(): string | null {
    return localStorage.getItem(LAST_OPENED_KEY);
  }

  static setLastOpenedProjectId(id: string | null): void {
    if (id) {
      localStorage.setItem(LAST_OPENED_KEY, id);
    } else {
      localStorage.removeItem(LAST_OPENED_KEY);
    }
  }
}
