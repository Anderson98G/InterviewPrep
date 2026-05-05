import { getStorageUsageKB, saveSnapshot, STORAGE_WARN_KB } from './storage.js';

export const CURRENT_SCHEMA_VERSION = 1;

// Registry: key = version number produced by the migration
// e.g. migrations[2] transforms v1 → v2
const migrations = {};

export function runMigrations(data) {
  const dataVersion = data.schemaVersion ?? 0;

  if (dataVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Data schema version ${dataVersion} is newer than this app supports (${CURRENT_SCHEMA_VERSION}). Please update the app.`
    );
  }

  if (dataVersion === CURRENT_SCHEMA_VERSION) {
    return data;
  }

  // Guard against insufficient storage for double-write (snapshot + migrated data)
  const usageKB = getStorageUsageKB(data);
  if (usageKB > STORAGE_WARN_KB / 2) {
    throw new Error(
      `Migration cannot proceed: storage usage (${usageKB} KB) is too high to safely write the migration snapshot. ` +
      `Please export a backup and delete some entries to free up space, then reload.`
    );
  }

  // Write pre-migration snapshot before any transformations
  const snapshotResult = saveSnapshot(dataVersion, data);
  if (!snapshotResult.ok) {
    throw new Error(`Migration snapshot write failed: ${snapshotResult.error}`);
  }

  let current = data;
  for (let v = dataVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
    if (migrations[v]) {
      current = migrations[v](current);
    }
    current = { ...current, schemaVersion: v };
  }

  return current;
}
