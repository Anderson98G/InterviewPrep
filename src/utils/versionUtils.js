const VERSION_CAP = 20;
const ORDER_NORMALIZATION_THRESHOLD = 0.001;

export function createVersion({ prose, anchor }) {
  const version = {
    id: crypto.randomUUID(),
    type: 'version',
    prose,
    createdAt: new Date().toISOString(),
    isActive: true,
  };
  if (anchor && anchor.trim() !== '') {
    version.anchor = anchor;
  }
  return version;
}

export function getActiveVersion(entry) {
  return entry.versions.find((v) => v.isActive) ?? entry.versions[entry.versions.length - 1];
}

export function getSortedHistory(entry) {
  const items = [...entry.versions, ...entry.notes];
  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Discards oldest inactive version if at cap. Active version is always preserved.
export function enforceVersionCap(versions) {
  if (versions.length <= VERSION_CAP) return versions;

  // Find oldest inactive version to discard
  const inactiveByAge = versions
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => !v.isActive)
    .sort((a, b) => new Date(a.v.createdAt) - new Date(b.v.createdAt));

  if (inactiveByAge.length === 0) return versions; // All active? Shouldn't happen, but guard.

  const idxToRemove = inactiveByAge[0].i;
  return versions.filter((_, i) => i !== idxToRemove);
}

// Applies an explicit Save in the inline editor: deactivates the current active
// version, prepends a new one, enforces the cap, and updates lastEditedAt.
// Returns the updated entry — does NOT mutate the input.
export function applyVersionSave(entry, prose, anchor) {
  const newVersion = createVersion({ prose, anchor });
  const deactivated = entry.versions.map((v) => ({ ...v, isActive: false }));
  const capped = enforceVersionCap([newVersion, ...deactivated]);
  return { ...entry, versions: capped, lastEditedAt: newVersion.createdAt };
}

// Applies a restore in the store: deactivates current active, prepends the
// restored version, enforces the cap, and updates lastEditedAt.
// Returns the updated entry — does NOT mutate the input.
export function applyVersionRestore(entry, versionId) {
  const source = entry.versions.find((v) => v.id === versionId);
  if (!source) throw new Error(`Version ${versionId} not found in entry ${entry.id}`);
  const newVersion = restoreVersion(source);
  const deactivated = entry.versions.map((v) => ({ ...v, isActive: false }));
  const capped = enforceVersionCap([newVersion, ...deactivated]);
  return { ...entry, versions: capped, lastEditedAt: newVersion.createdAt };
}

// Creates a new active version from an existing one (restore flow).
// Sets restoredFrom to the source version's id.
export function restoreVersion(sourceVersion) {
  const restored = {
    id: crypto.randomUUID(),
    type: 'version',
    prose: sourceVersion.prose,
    createdAt: new Date().toISOString(),
    isActive: true,
    restoredFrom: sourceVersion.id,
  };
  if (sourceVersion.anchor) {
    restored.anchor = sourceVersion.anchor;
  }
  return restored;
}

// entries = array of Entry objects sorted by order within a category
export function needsNormalization(entries) {
  if (entries.length < 2) return false;
  const sorted = [...entries].sort((a, b) => a.order - b.order);
  for (let i = 1; i < sorted.length; i++) {
    if (Math.abs(sorted[i].order - sorted[i - 1].order) < ORDER_NORMALIZATION_THRESHOLD) {
      return true;
    }
  }
  return false;
}

// Returns entries for a single category sorted by order, with order reset to 1.0, 2.0, 3.0...
export function normalizeOrderForCategory(entries) {
  const sorted = [...entries].sort((a, b) => a.order - b.order);
  return sorted.map((entry, i) => ({ ...entry, order: i + 1.0 }));
}
