import { create } from 'zustand';
import type { PushSyncEventBody } from '@passtore/core';

export interface SyncConflictEntry {
  /** Stable id — matches `outboxRowId` so each pending row has at most one conflict entry */
  id: string;
  outboxRowId: string;
  itemKey: string;
  serverRowVersion: number;
  payload: PushSyncEventBody;
}

interface ConflictState {
  conflicts: SyncConflictEntry[];
  addConflict: (input: Omit<SyncConflictEntry, 'id'>) => void;
  removeConflict: (id: string) => void;
  clearConflicts: () => void;
}

export const useConflictStore = create<ConflictState>((set) => ({
  conflicts: [],
  addConflict: (input) =>
    set((s) => {
      const without = s.conflicts.filter(
        (c) => c.outboxRowId !== input.outboxRowId,
      );
      return {
        conflicts: [
          ...without,
          { ...input, id: input.outboxRowId },
        ],
      };
    }),
  removeConflict: (id) =>
    set((s) => ({
      conflicts: s.conflicts.filter((c) => c.id !== id),
    })),
  clearConflicts: () => set({ conflicts: [] }),
}));
