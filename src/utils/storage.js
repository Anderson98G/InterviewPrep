const STORAGE_KEY = 'interviewprep_data';

export const STORAGE_WARN_KB = 4096;

export function getFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  return JSON.parse(raw);
}

export function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { ok: true };
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      return { ok: false, error: 'Save failed: storage is full.' };
    }
    return { ok: false, error: `Save failed: ${err.message}` };
  }
}

export function getStorageUsageKB(data) {
  const json = JSON.stringify(data);
  return Math.round((json.length * 2) / 1024);
}

export function saveSnapshot(schemaVersion, data) {
  const key = `interviewprep_data_v${schemaVersion}_snapshot`;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export function deleteSnapshot(schemaVersion) {
  localStorage.removeItem(`interviewprep_data_v${schemaVersion}_snapshot`);
}

export function getSnapshot(schemaVersion) {
  const raw = localStorage.getItem(`interviewprep_data_v${schemaVersion}_snapshot`);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
