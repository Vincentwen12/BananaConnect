import { create } from "zustand";

const MAX_ENTRIES = 2000;

let seq = 0;

interface LogState {
  entries: import("../types").LogEntry[];
  add: (entry: import("../types").LogEntry) => void;
  clear: () => void;
}

export const useLogStore = create<LogState>((set) => ({
  entries: [],
  add: (entry) =>
    set((state) => {
      // id 由 store 统一分配，避免热更新或多实例时出现重复 key。
      const next = { ...entry, id: ++seq };
      if (state.entries.length >= MAX_ENTRIES) {
        return { entries: [...state.entries.slice(state.entries.length - MAX_ENTRIES + 1), next] };
      }
      return { entries: [...state.entries, next] };
    }),
  clear: () => set({ entries: [] }),
}));
