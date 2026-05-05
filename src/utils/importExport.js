import { CATEGORY_LIST } from './categories.js';
import { enforceVersionCap } from './versionUtils.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_SESSIONS = 50;

export function exportData(data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `interview-prep-export-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return { entryCount: data.entries.length };
}

export function validateImportedData(parsed, fileSize) {
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error('File exceeds the 10 MB size limit');
  }

  if (
    typeof parsed.schemaVersion !== 'number' ||
    !Array.isArray(parsed.entries) ||
    !Array.isArray(parsed.sessions) ||
    parsed.ui === null ||
    typeof parsed.ui !== 'object'
  ) {
    throw new Error('Invalid file structure: missing required top-level fields');
  }

  const requiredEntryFields = ['id', 'question', 'category', 'order', 'versions', 'notes', 'createdAt', 'lastEditedAt'];

  for (let i = 0; i < parsed.entries.length; i++) {
    const entry = parsed.entries[i];
    for (const field of requiredEntryFields) {
      if (field === 'versions' || field === 'notes') {
        if (!Array.isArray(entry[field])) {
          throw new Error(`Entry at index ${i} is missing required field: ${field}`);
        }
      } else if (entry[field] === undefined || entry[field] === null) {
        throw new Error(`Entry at index ${i} is missing required field: ${field}`);
      }
    }

    if (!CATEGORY_LIST.includes(entry.category)) {
      throw new Error(`Entry "${entry.question}" has unknown category: ${entry.category}`);
    }

    const hasActive = entry.versions.some((v) => v.isActive === true);
    if (!hasActive) {
      throw new Error(`Entry "${entry.question}" has no active version`);
    }
  }

  const warnings = [];
  const trimmedEntries = parsed.entries.filter((e) => e.versions.length > 20);
  if (trimmedEntries.length > 0) {
    warnings.push(`${trimmedEntries.length} ${trimmedEntries.length === 1 ? 'entry' : 'entries'} had version history trimmed to 20`);
  }

  return { data: parsed, warnings };
}

export function enforceImportVersionCap(entries) {
  let trimmed = false;
  const capped = entries.map((entry) => {
    let versions = entry.versions;
    while (versions.length > 20) {
      versions = enforceVersionCap(versions);
      trimmed = true;
    }
    return versions === entry.versions ? entry : { ...entry, versions };
  });
  return { entries: capped, trimmed };
}

export function importData(validated, currentAppData) {
  const importedEntries = validated.entries;
  const importedSessions = validated.sessions;

  const existingEntryIds = new Set(currentAppData.entries.map((e) => e.id));
  const existingSessionIds = new Set(currentAppData.sessions.map((s) => s.id));

  const allAlreadyExist = importedEntries.length > 0 &&
    importedEntries.every((e) => existingEntryIds.has(e.id));
  if (allAlreadyExist) {
    throw new Error('All entries in this file already exist in your deck');
  }

  const entryRemap = new Map();
  for (const entry of importedEntries) {
    if (existingEntryIds.has(entry.id)) {
      entryRemap.set(entry.id, crypto.randomUUID());
    }
  }

  const sessionRemap = new Map();
  for (const session of importedSessions) {
    if (existingSessionIds.has(session.id)) {
      sessionRemap.set(session.id, crypto.randomUUID());
    }
  }

  const remappedEntries = importedEntries.map((entry) => {
    const newId = entryRemap.get(entry.id) ?? entry.id;
    const notes = entry.notes.map((note) => {
      const newSessionId = sessionRemap.get(note.sessionId) ?? note.sessionId;
      return newSessionId !== note.sessionId ? { ...note, sessionId: newSessionId } : note;
    });
    if (newId === entry.id && notes === entry.notes) return entry;
    return { ...entry, id: newId, notes };
  });

  const remappedSessions = importedSessions.map((session) => {
    const newId = sessionRemap.get(session.id) ?? session.id;
    const visits = session.visits.map((v) => {
      const newEntryId = entryRemap.get(v.entryId) ?? v.entryId;
      return newEntryId !== v.entryId ? { ...v, entryId: newEntryId } : v;
    });
    if (newId === session.id && visits === session.visits) return session;
    return { ...session, id: newId, visits };
  });

  const { entries: cappedEntries, trimmed } = enforceImportVersionCap(remappedEntries);

  const mergedEntries = [...currentAppData.entries, ...cappedEntries];
  const mergedSessions = [...currentAppData.sessions, ...remappedSessions]
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
    .slice(0, MAX_SESSIONS);

  const warnings = [];
  if (trimmed) {
    warnings.push('Some entries had version history trimmed to 20');
  }

  return {
    mergedData: {
      schemaVersion: currentAppData.schemaVersion,
      entries: mergedEntries,
      sessions: mergedSessions,
      ui: currentAppData.ui,
    },
    entryCount: cappedEntries.length,
    warnings,
  };
}
