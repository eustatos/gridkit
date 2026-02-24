import { SnapshotRestorer } from "../snapshot";
import { HistoryManager } from "./HistoryManager";

export class HistoryNavigator {
  constructor(
    private historyManager: HistoryManager,
    private snapshotRestorer: SnapshotRestorer,
  ) {}

  undo(): boolean {
    if (!this.historyManager.canUndo()) return false;

    const snapshot = this.historyManager.undo();
    if (snapshot) {
      this.snapshotRestorer.restore(snapshot);
      return true;
    }
    return false;
  }

  redo(): boolean {
    if (!this.historyManager.canRedo()) return false;

    const snapshot = this.historyManager.redo();
    if (snapshot) {
      this.snapshotRestorer.restore(snapshot);
      return true;
    }
    return false;
  }

  jumpTo(index: number): boolean {
    const snapshot = this.historyManager.jumpTo(index);
    if (snapshot) {
      this.snapshotRestorer.restore(snapshot);
      return true;
    }
    return false;
  }
}
