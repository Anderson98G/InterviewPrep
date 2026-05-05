import { create } from 'zustand';
import { saveToStorage, getStorageUsageKB, STORAGE_WARN_KB } from '../utils/storage.js';
import { applyVersionRestore } from '../utils/versionUtils.js';

const MAX_SESSIONS = 50;

function deriveActiveSessionId(sessions) {
  return sessions.find((s) => !s.endedAt)?.id ?? null;
}

function isStorageWarning(appData) {
  return getStorageUsageKB(appData) >= STORAGE_WARN_KB;
}

// Extracts only the AppData fields that get persisted.
function toAppData(state) {
  return {
    schemaVersion: state.schemaVersion,
    entries: state.entries,
    sessions: state.sessions,
    ui: state.ui,
  };
}

export const useQAStore = create((set, get) => {
  // Standard mutation pattern: compute next state → save → apply or rollback.
  function persist(nextAppData) {
    const result = saveToStorage(nextAppData);
    if (!result.ok) {
      set({ storageError: result.error });
      return false;
    }
    set({
      ...nextAppData,
      storageError: null,
      storageWarning: isStorageWarning(nextAppData),
      activeSessionId: deriveActiveSessionId(nextAppData.sessions),
    });
    return true;
  }

  return {
    // AppData fields
    schemaVersion: 1,
    entries: [],
    sessions: [],
    ui: {
      mode: 'live',
      overlayPosition: null,
      overlaySize: null,
      activeCategoryFilter: null,
      collapsedCategories: [],
    },

    // Derived store fields (not persisted)
    storageWarning: false,
    storageError: null,
    activeSessionId: null,

    // Called once during boot, before React renders.
    setInitialState(data) {
      set({
        ...data,
        storageWarning: isStorageWarning(data),
        storageError: null,
        activeSessionId: deriveActiveSessionId(data.sessions),
      });
    },

    // Called by the cross-tab storage event handler.
    rehydrate(data) {
      set({
        ...data,
        storageWarning: isStorageWarning(data),
        storageError: null,
        activeSessionId: deriveActiveSessionId(data.sessions),
      });
    },

    clearStorageError() {
      set({ storageError: null });
    },

    // --- UI actions ---

    setMode(mode) {
      const state = get();
      persist({ ...toAppData(state), ui: { ...state.ui, mode } });
    },

    setOverlayPosition(position) {
      const state = get();
      persist({ ...toAppData(state), ui: { ...state.ui, overlayPosition: position } });
    },

    setOverlaySize(size) {
      const state = get();
      persist({ ...toAppData(state), ui: { ...state.ui, overlaySize: size } });
    },

    setActiveCategoryFilter(category) {
      const state = get();
      persist({ ...toAppData(state), ui: { ...state.ui, activeCategoryFilter: category } });
    },

    toggleCategoryCollapse(category) {
      const state = get();
      const collapsed = state.ui.collapsedCategories;
      const next = collapsed.includes(category)
        ? collapsed.filter((c) => c !== category)
        : [...collapsed, category];
      persist({ ...toAppData(state), ui: { ...state.ui, collapsedCategories: next } });
    },

    // --- Entry actions ---

    addEntry(entry) {
      const state = get();
      persist({ ...toAppData(state), entries: [...state.entries, entry] });
    },

    updateEntry(id, updater) {
      const state = get();
      const entries = state.entries.map((e) => (e.id === id ? updater(e) : e));
      persist({ ...toAppData(state), entries });
    },

    updateEntryQuestion(id, question) {
      const state = get();
      const entries = state.entries.map((e) => (e.id === id ? { ...e, question } : e));
      persist({ ...toAppData(state), entries });
    },

    deleteEntry(id) {
      const state = get();
      persist({ ...toAppData(state), entries: state.entries.filter((e) => e.id !== id) });
    },

    reorderEntry(id, newOrder) {
      const state = get();
      const entries = state.entries.map((e) => (e.id === id ? { ...e, order: newOrder } : e));
      persist({ ...toAppData(state), entries });
    },

    // Batch reorder used after normalization (replaces multiple entries at once).
    reorderBatch(updatedEntries) {
      const state = get();
      const updatedMap = new Map(updatedEntries.map((e) => [e.id, e]));
      const entries = state.entries.map((e) => updatedMap.get(e.id) ?? e);
      persist({ ...toAppData(state), entries });
    },

    restoreEntryVersion(entryId, versionId) {
      const state = get();
      const entries = state.entries.map((e) =>
        e.id === entryId ? applyVersionRestore(e, versionId) : e
      );
      persist({ ...toAppData(state), entries });
    },

    addNoteToEntry(entryId, note) {
      const state = get();
      const entries = state.entries.map((e) =>
        e.id === entryId ? { ...e, notes: [...e.notes, note] } : e
      );
      persist({ ...toAppData(state), entries });
    },

    // Full replace used by import (Phase 7).
    importEntries(mergedAppData) {
      persist(mergedAppData);
    },

    // --- Session actions ---

    addSession(session) {
      const state = get();
      const sessions = [...state.sessions, session].slice(-MAX_SESSIONS);
      persist({ ...toAppData(state), sessions });
    },

    updateSession(sessionId, updater) {
      const state = get();
      const sessions = state.sessions.map((s) => (s.id === sessionId ? updater(s) : s));
      persist({ ...toAppData(state), sessions });
    },

    removeSession(sessionId) {
      const state = get();
      persist({ ...toAppData(state), sessions: state.sessions.filter((s) => s.id !== sessionId) });
    },

    addSessionVisit(sessionId, entryId) {
      const state = get();
      const now = new Date().toISOString();
      const sessions = state.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        if (s.visits.some((v) => v.entryId === entryId)) return s; // idempotent
        return { ...s, visits: [...s.visits, { entryId, visitedAt: now }] };
      });
      persist({ ...toAppData(state), sessions });
    },
  };
});
