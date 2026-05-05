import { useState, useEffect } from 'react';
import { useQAStore } from './useQAStore.js';

export function useSessionManager() {
  const sessions = useQAStore((s) => s.sessions);
  const mode = useQAStore((s) => s.ui.mode);
  const addSession = useQAStore((s) => s.addSession);
  const updateSession = useQAStore((s) => s.updateSession);
  const removeSession = useQAStore((s) => s.removeSession);
  const addSessionVisit = useQAStore((s) => s.addSessionVisit);
  const addNoteToEntry = useQAStore((s) => s.addNoteToEntry);

  const [isDebrief, setIsDebrief] = useState(false);

  const activeSession = sessions.find((s) => !s.endedAt) ?? null;
  const sessionState = isDebrief ? 'DEBRIEF' : activeSession ? 'ACTIVE' : 'IDLE';
  const visitedEntryIds = new Set(activeSession?.visits.map((v) => v.entryId) ?? []);

  // Auto-start a session on mount when the app boots in Live Mode.
  useEffect(() => {
    if (mode === 'live' && !activeSession) {
      _startSession();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the beforeunload handler current with the latest session state.
  useEffect(() => {
    function handler(e) {
      if (sessionState === 'ACTIVE' && visitedEntryIds.size > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [sessionState, visitedEntryIds.size]);

  function _startSession() {
    addSession({
      id: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      visits: [],
    });
    setIsDebrief(false);
  }

  function startSession() {
    _startSession();
  }

  // Cancels the session without persisting it (used for Live→Prep with 0 visits).
  function cancelSession() {
    if (activeSession) removeSession(activeSession.id);
    setIsDebrief(false);
  }

  // Idempotent — safe to call multiple times for the same entry.
  function recordVisit(entryId) {
    if (!activeSession) return;
    addSessionVisit(activeSession.id, entryId);
  }

  // Transitions ACTIVE → DEBRIEF (called by mode toggle handler in App).
  function enterDebrief() {
    setIsDebrief(true);
  }

  // Transitions DEBRIEF → ACTIVE (Back button in Debrief screen).
  function exitDebrief() {
    setIsDebrief(false);
  }

  // Saves notes and closes the session. notesMap is Map<entryId, string>.
  function endSession(notesMap) {
    if (activeSession) {
      const now = new Date().toISOString();
      notesMap.forEach((text, entryId) => {
        if (!text.trim()) return;
        addNoteToEntry(entryId, {
          id: crypto.randomUUID(),
          type: 'note',
          text: text.trim(),
          sessionId: activeSession.id,
          createdAt: now,
        });
      });
      updateSession(activeSession.id, (s) => ({ ...s, endedAt: now }));
    }
    setIsDebrief(false);
  }

  // Closes the session without saving any notes.
  function skipSession() {
    if (activeSession) {
      updateSession(activeSession.id, (s) => ({ ...s, endedAt: new Date().toISOString() }));
    }
    setIsDebrief(false);
  }

  return {
    sessionState,
    visitedEntryIds,
    activeSessionId: activeSession?.id ?? null,
    startSession,
    cancelSession,
    recordVisit,
    enterDebrief,
    exitDebrief,
    endSession,
    skipSession,
  };
}
