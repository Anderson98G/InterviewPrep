# Function Contracts
## PM Interview Prep

**Version:** 1.0
**Date:** 2026-04-22

This document defines the contract for every named utility function in the codebase. Each contract specifies inputs, outputs, preconditions, and invariants. It is the authoritative reference for engineers implementing these functions.

---

## `src/utils/storage.js`

---

### `getFromStorage()`

**Purpose:** Read and return the persisted `AppData` from localStorage, applying any pending schema migrations.

| Parameter | Type | Description |
|---|---|---|
| — | — | No parameters |

**Returns:** `AppData | null` — the fully migrated app data, or `null` if no data has been saved yet.

**Preconditions:**
- `runMigrations` must be importable and functional
- localStorage must be accessible (will throw if not)

**Postconditions / Invariants:**
- If the key is absent, returns `null` — does not throw
- The returned object has a `schemaVersion` equal to `CURRENT_SCHEMA_VERSION`
- Any parse or migration error is re-thrown with the prefix `"[getFromStorage]"` (e.g. `"[getFromStorage] Failed to parse data: ..."`) for the boot sequence to catch and display
- Does not write to the main data key (`"interviewprep_data"`); migration snapshot keys may be written by `runMigrations` as part of the migration process

---

### `saveToStorage(data)`

**Purpose:** Serialize and persist the full `AppData` blob to localStorage atomically.

| Parameter | Type | Description |
|---|---|---|
| `data` | `AppData` | The complete app state to persist |

**Returns:** `{ ok: true }` on success, or `{ ok: false, error: string }` on failure.

**Preconditions:**
- `data` is a valid `AppData` object (callers are responsible for validation before calling)

**Postconditions / Invariants:**
- On success, localStorage key `"interviewprep_data"` contains the JSON-serialized `data`
- On `QuotaExceededError`, returns `{ ok: false, error: 'Save failed: storage is full.' }` — does not throw
- On any other error, returns `{ ok: false, error: 'Save failed: [message]' }` — does not throw
- Never modifies in-memory state — callers decide what to do with the result
- The entire blob is written in a single `setItem` call — there are no partial writes

---

### `getStorageUsageKB(data)`

**Purpose:** Estimate the current localStorage usage in kilobytes for the given data.

| Parameter | Type | Description |
|---|---|---|
| `data` | `AppData` | The app state to measure |

**Returns:** `number` — estimated storage usage in KB, rounded to the nearest integer.

**Preconditions:**
- `data` must be JSON-serializable

**Postconditions / Invariants:**
- Result is `Math.round(JSON.stringify(data).length * 2 / 1024)`
- The `* 2` factor approximates UTF-16 byte encoding used by browsers internally
- Compare result against `STORAGE_WARN_KB` (4096) to determine whether to show the warning banner
- Compare result against `STORAGE_MAX_KB` (5120) for quota proximity checks

---

## `src/utils/migrations.js`

---

### `runMigrations(data)`

**Purpose:** Upgrade a parsed `AppData` object from its stored schema version to the current schema version by applying migration functions in sequence.

| Parameter | Type | Description |
|---|---|---|
| `data` | `AppData` | Parsed app data as read from localStorage |

**Returns:** `AppData` — the migrated data object with `schemaVersion` equal to `CURRENT_SCHEMA_VERSION`.

**Preconditions:**
- `data` has a numeric `schemaVersion` field
- `data.schemaVersion` must be ≤ `CURRENT_SCHEMA_VERSION`; if greater, the function checks for a rollback snapshot before throwing

**Postconditions / Invariants:**
- If `data.schemaVersion === CURRENT_SCHEMA_VERSION`, the data is returned unchanged and no snapshot is written
- If `data.schemaVersion > CURRENT_SCHEMA_VERSION` and a snapshot key exists, the snapshot is restored and returned; the main key and snapshot key are both updated accordingly
- If `data.schemaVersion > CURRENT_SCHEMA_VERSION` and no snapshot exists, throws with a message instructing the user to update the app
- `CURRENT_SCHEMA_VERSION` is `1` at initial launch; it is incremented in `migrations.js` each time a breaking schema change is introduced
- Before applying any migration, current data size is checked via `getStorageUsageKB(data)`; if the result exceeds `STORAGE_WARN_KB / 2` (2048 KB), throws with a user-facing message: `"Migration cannot proceed: insufficient storage space. Free up space and reload."` — the app remains on the old schema, no data is modified
- If the size check passes, the raw pre-migration blob is saved to `interviewprep_data_v{N}_snapshot`, where `{N}` is `data.schemaVersion` (the old version before migration); migrating from v1→v2 writes to `interviewprep_data_v1_snapshot`
- Each migration function is applied in strict version order with no skipping
- After each migration step, `schemaVersion` is incremented by exactly 1
- The returned object's `schemaVersion` equals `CURRENT_SCHEMA_VERSION`
- The input `data` object is not mutated — each migration returns a new object

---

## `src/utils/versionUtils.js`

---

### `createVersion(entry, prose, anchor)`

**Purpose:** Save the current answer by creating a new active `AnswerVersion` on the entry, deactivating the previous active version, and enforcing the 20-version cap.

| Parameter | Type | Description |
|---|---|---|
| `entry` | `Entry` | The entry being saved |
| `prose` | `string` | The answer body text to save |
| `anchor` | `string \| undefined` | The anchor phrases to save; omit or pass empty string for no anchor |

**Returns:** `Entry` — a new entry object with the updated versions array and `lastEditedAt` timestamp.

**Preconditions:**
- `entry.versions` contains exactly one version with `isActive: true`
- `entry` is not mutated — the function returns a new object

**Postconditions / Invariants:**
- The returned entry has exactly one version with `isActive: true` — the newly created version
- The previously active version now has `isActive: false`
- The new version is at index 0 of the versions array (newest first)
- `entry.versions.length` is at most 20 after the call
- `entry.lastEditedAt` equals the new version's `createdAt`
- If `anchor?.trim()` is empty or falsy, the new version has no `anchor` field (stored as `undefined`, not an empty string) — this covers `undefined`, `null`, `""`, and whitespace-only strings like `"   \n   "`

---

### `restoreVersion(entry, versionId)`

**Purpose:** Promote a prior version to active by creating a copy of it as the new active version, preserving the audit trail via `restoredFrom`.

| Parameter | Type | Description |
|---|---|---|
| `entry` | `Entry` | The entry whose version history is being restored |
| `versionId` | `string` | The UUID of the version to restore |

**Returns:** `Entry` — a new entry object with the restored version active and the previous active version deactivated.

**Preconditions:**
- A version with `id === versionId` exists in `entry.versions`; throws `'Version not found'` if not
- `entry.versions` contains exactly one version with `isActive: true`

**Postconditions / Invariants:**
- The returned entry has exactly one version with `isActive: true` — the newly created restore copy
- The restored version is a new object with a new UUID and current `createdAt` timestamp
- `restoredFrom` on the new version is set to `versionId`
- The previously active version now has `isActive: false`
- The original version at `versionId` remains in history unchanged
- `entry.versions.length` is at most 20 after the call
- `entry.lastEditedAt` equals the restored version's new `createdAt`

---

### `enforceVersionCap(versions)`

**Purpose:** Ensure the versions array never exceeds 20 entries by removing the oldest inactive version when the cap is exceeded.

| Parameter | Type | Description |
|---|---|---|
| `versions` | `AnswerVersion[]` | The full versions array for an entry |

**Returns:** `AnswerVersion[]` — the versions array with at most 20 entries.

**Preconditions:**
- Exactly one version in the array has `isActive: true`

**Postconditions / Invariants:**
- If `versions.length ≤ 20`, the input array is returned unchanged
- If `versions.length > 20`, exactly one entry is removed: the oldest inactive version (last in reverse chronological order among those with `isActive: false`)
- The active version is never removed
- The relative order of all remaining versions is preserved

---

### `getActiveVersion(entry)`

**Purpose:** Retrieve the currently active answer version for an entry.

| Parameter | Type | Description |
|---|---|---|
| `entry` | `Entry` | Any entry with a populated versions array |

**Returns:** `AnswerVersion` — the version where `isActive` is `true`.

**Preconditions:**
- `entry.versions` contains exactly one version with `isActive: true`

**Postconditions / Invariants:**
- Returns the single active version; does not mutate state
- Returns `undefined` if no active version exists (indicates a data integrity violation)

---

### `getSortedHistory(entry)`

**Purpose:** Produce a unified, reverse-chronological history list combining answer versions and post-interview notes for display in the version history panel.

| Parameter | Type | Description |
|---|---|---|
| `entry` | `Entry` | Any entry with versions and/or notes |

**Returns:** `(AnswerVersion | Note)[]` — combined array sorted by `createdAt` descending (newest first).

**Preconditions:**
- None — an entry with empty arrays returns an empty array

**Postconditions / Invariants:**
- All items from `entry.versions` and `entry.notes` appear in the result
- Items are sorted by `createdAt` in descending order
- The original arrays are not mutated
- Items retain their `type` discriminant (`"version"` or `"note"`) for rendering

---

### `needsNormalization(entriesInCategory)`

**Purpose:** Detect whether the `order` values within a category have degraded to the point where floating-point precision is insufficient for further drag-to-reorder operations.

| Parameter | Type | Description |
|---|---|---|
| `entriesInCategory` | `Entry[]` | All entries belonging to a single category |

**Returns:** `boolean` — `true` if any two adjacent entries (by order) have a gap smaller than 0.001.

**Preconditions:**
- All entries belong to the same category
- Each entry has a numeric `order` field

**Postconditions / Invariants:**
- Does not mutate any entry
- Returns `false` for arrays of 0 or 1 entry (no adjacent pair to compare)

---

### `normalizeOrderForCategory(entries)`

**Purpose:** Reset the `order` values for a category's entries to clean integers (1.0, 2.0, 3.0, …), preserving relative sort order.

| Parameter | Type | Description |
|---|---|---|
| `entries` | `Entry[]` | All entries belonging to a single category |

**Returns:** `Entry[]` — a new array of entry objects with reassigned `order` values.

**Preconditions:**
- All entries belong to the same category

**Postconditions / Invariants:**
- Input entries are sorted by their current `order` value (ascending) before reassignment — this is the sort key
- Returned entries have `order` values `1.0, 2.0, 3.0, …` in that sorted order
- The relative order of entries is unchanged
- Input entries are not mutated — new objects are returned
- This is a structural mutation only; it does not create a new `AnswerVersion`

---

## `src/utils/importExport.js`

---

### `exportData(data)`

**Purpose:** Trigger a browser file download of the full app data as a human-readable JSON file.

| Parameter | Type | Description |
|---|---|---|
| `data` | `AppData` | The complete app state to export |

**Returns:** `void`

**Preconditions:**
- `data` is JSON-serializable
- Called in a browser context with access to `document`, `URL`, and `Blob`

**Postconditions / Invariants:**
- A file download is initiated with filename `interview-prep-export-YYYY-MM-DD.json`
- The file contains the full `AppData` serialized as pretty-printed JSON (2-space indent)
- The object URL is revoked immediately after the download is triggered
- No data is modified; no localStorage write occurs

---

### `validateImportedData(parsed, fileSizeBytes)`

**Purpose:** Validate a parsed import candidate against all structural and semantic rules before any merge is attempted. This is Pass 1 of the two-pass import algorithm.

| Parameter | Type | Description |
|---|---|---|
| `parsed` | `unknown` | The result of `JSON.parse()` on the imported file content |
| `fileSizeBytes` | `number` | The byte size of the raw file, used for the size guard |

**Returns:** `void` — throws on the first validation error encountered.

**Preconditions:**
- `parsed` is the direct output of `JSON.parse()`; the caller is responsible for catching JSON syntax errors and converting them to the standard error message before calling this function
- `fileSizeBytes` is a non-negative integer

**Postconditions / Invariants:**
- If all checks pass, returns `void` and no data is modified
- Checks are evaluated in strict order; the function throws on the first failure:
  1. `fileSizeBytes > 10_485_760` (10 MB) → throws `"File exceeds 10MB and cannot be imported"`
  2. `parsed` is missing `schemaVersion` or `entries` → throws `"File does not appear to be a PM Interview Prep export"`
  3. Any entry is missing a required field (`id`, `question`, `category`, `order`, `versions`, `createdAt`, `lastEditedAt`) → throws `"Missing required field: [field] on entry [n]"`
  4. Any entry has a `category` value not in `CATEGORY_LIST` → throws `"Unknown category '[value]' on entry [n]"`
  5. Any entry has zero or more than one version with `isActive: true` → throws `"Entry [n] has no active answer version"` or `"Entry [n] has multiple active versions"`
- Does not mutate `parsed`
- Does not read from or write to localStorage

---

### `importData(imported, existing)`

**Purpose:** Merge an imported deck into the existing app data using a two-pass validate-then-merge algorithm that never overwrites existing data and auto-resolves ID conflicts.

| Parameter | Type | Description |
|---|---|---|
| `imported` | `AppData` | The parsed data from the imported JSON file |
| `existing` | `AppData` | The current app state in localStorage |

**Returns:** `AppData` — the merged app data, ready to pass to `saveToStorage`.

**Preconditions:**
- Pass 1 validation must complete without errors before this function is called (callers are responsible for running validation first)
- `imported` has `schemaVersion` and `entries` fields
- Every entry in `imported.entries` has exactly one `isActive: true` version

**Postconditions / Invariants:**
- If every entry ID in `imported.entries` already exists in `existing.entries`, throws `"This file has already been imported. No new entries were found."` — no data is modified; this check uses the same O(1) Set built for Pass 2 and is evaluated before any mutation
- All existing entries and sessions are preserved unchanged
- All imported entries appear in the result; none are dropped
- No two entries in the result share the same `id` — conflicts are resolved by assigning a new UUID to the imported entry
- No two sessions in the result share the same `id` — conflicts are resolved by assigning a new UUID to the imported session, and corresponding `Note.sessionId` references within imported entries are updated to match
- All version arrays in the result have at most 20 entries; imported entries with more than 20 versions are trimmed (active version preserved, oldest inactive versions removed)
- The combined sessions array is pruned to the 50 most recent entries
- `existing` is not mutated

---

### `enforceImportVersionCap(versions)`

**Purpose:** Trim an imported entry's version history to 20 entries, always preserving the active version.

| Parameter | Type | Description |
|---|---|---|
| `versions` | `AnswerVersion[]` | The version array from an imported entry |

**Returns:** `AnswerVersion[]` — array of at most 20 versions.

**Preconditions:**
- Exactly one version has `isActive: true`

**Postconditions / Invariants:**
- If `versions.length ≤ 20`, the input array is returned unchanged
- If `versions.length > 20`, the result contains the active version plus the 19 most recent inactive versions (sorted by `createdAt` descending)
- The active version is always present in the result
- Older inactive versions beyond the 19 most recent are discarded

---

## `src/store/useQAStore.js`

---

### `addEntry(question, category, prose, anchor)`

**Purpose:** Create a new Q&A entry with its initial answer version and append it to the entries array.

| Parameter | Type | Description |
|---|---|---|
| `question` | `string` | The question text |
| `category` | `Category` | One of the 7 predefined category values |
| `prose` | `string` | The initial answer body text |
| `anchor` | `string \| undefined` | Optional anchor phrases; omit or pass empty string for no anchor |

**Returns:** `void` — mutates Zustand store state and persists to localStorage via `saveToStorage`.

**Preconditions:**
- `question` is a non-empty string after trimming
- `category` is a valid value from `CATEGORY_LIST`

**Postconditions / Invariants:**
- A new `Entry` is appended to `state.entries` with a UUID from `crypto.randomUUID()`
- The entry's `versions` array contains exactly one `AnswerVersion` with `isActive: true` — this is version 1, created at entry creation time, not by a subsequent Save
- `version.createdAt` equals `entry.createdAt` equals `entry.lastEditedAt` — all set to the same `Date.now()` ISO timestamp
- If `anchor?.trim()` is empty or falsy, the version has no `anchor` field (`undefined`)
- The new entry's `order` value is set to `max(existing orders in category) + 1.0`, placing it at the bottom of its category
- `saveToStorage` is called; on `{ ok: false }`, the store surfaces the error and does not add the entry

---

## `src/store/useSessionManager.js`

---

### `startSession()`

**Purpose:** Create a new `Session` and transition the app from IDLE to ACTIVE state when the user enters Live Mode.

| Parameter | Type | Description |
|---|---|---|
| — | — | No parameters |

**Returns:** `void` — mutates Zustand store state and persists to localStorage via `saveToStorage`.

**Preconditions:**
- Current session state is IDLE (no session in `state.sessions` has an absent `endedAt`)
- Called on the `IDLE → ACTIVE` transition, which fires in two cases: (1) the user clicks the mode toggle to enter Live Mode, or (2) the app boots with `ui.mode === 'live'` (the default)

**Postconditions / Invariants:**
- A new `Session` is created with:
  - `id`: `crypto.randomUUID()`
  - `startedAt`: current timestamp as ISO 8601 string
  - `endedAt`: absent (`undefined`)
  - `visits`: `[]`
- The new session is appended to `state.sessions`
- If `state.sessions.length` exceeds 50 after the append, the oldest session (by `startedAt`) is removed before saving
- `state.activeSessionId` is set to the new session's `id`
- `saveToStorage` is called with the updated state; on `{ ok: false }`, the error is surfaced but the session is still held in memory for the duration of the Live Mode visit

---

### `cancelSession()`

**Purpose:** Roll back a zero-visit session when the user toggles from Live Mode to Prep Mode without having visited any entries. Called on the `ACTIVE → IDLE` transition when `visits.length === 0`.

| Parameter | Type | Description |
|---|---|---|
| — | — | No parameters |

**Returns:** `void` — mutates Zustand store state and persists to localStorage via `saveToStorage`.

**Preconditions:**
- Current session state is ACTIVE
- The active session's `visits` array is empty

**Postconditions / Invariants:**
- The active session record is removed from `state.sessions` (the record appended by `startSession()` is deleted)
- `state.activeSessionId` is set to `null`
- `saveToStorage` is called with the updated state
- The session cap pruning applied during `startSession()` is not reversed — if an old session was pruned when this session was created, it remains pruned

---

## `src/components/live/LiveOverlay.jsx`

---

### `clampOverlayPosition(position, size, viewport)`

**Purpose:** Ensure the overlay is within the visible viewport on mount, correcting for disconnected monitors or stale saved positions.

| Parameter | Type | Description |
|---|---|---|
| `position` | `{ x: number, y: number }` | The saved or default overlay position |
| `size` | `{ width: number, height: number }` | The saved or default overlay dimensions |
| `viewport` | `{ innerWidth: number, innerHeight: number }` | The current window dimensions |

**Returns:** `{ x: number, y: number }` — a position guaranteed to keep the overlay within the viewport.

**Preconditions:**
- All numeric fields are finite numbers
- `size.width` and `size.height` are positive

**Postconditions / Invariants:**
- If the overlay is fully outside the viewport (all four edges beyond bounds), the returned position places the overlay at the bottom-right corner with a 20px margin
- Otherwise, `x` is clamped to `[20, viewport.innerWidth - size.width - 20]` and `y` is clamped to `[20, viewport.innerHeight - size.height - 20]`
- The returned position always keeps at least part of the overlay visible
- The overlay's `size` is not modified — only position is clamped
