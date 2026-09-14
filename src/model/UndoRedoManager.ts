import { Project } from '../types';

export class UndoRedoManager {
  private undoStack: Project[] = [];
  private redoStack: Project[] = [];
  private readonly maxHistory = 50;

  pushState(state: Project) {
    // Deep clone state snapshot
    const snapshot = JSON.parse(JSON.stringify(state));
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo(currentState: Project): Project | null {
    if (!this.canUndo()) return null;
    const previous = this.undoStack.pop()!;
    this.redoStack.push(JSON.parse(JSON.stringify(currentState)));
    return previous;
  }

  redo(currentState: Project): Project | null {
    if (!this.canRedo()) return null;
    const next = this.redoStack.pop()!;
    this.undoStack.push(JSON.parse(JSON.stringify(currentState)));
    return next;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
