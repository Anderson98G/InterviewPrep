# System Design Document
## PM Interview Prep

**Version:** 1.0
**Date:** 2026-04-22
**Status:** In Review

---

## 1. Tech Stack

| Package | Version | Purpose |
|---|---|---|
| `react` | `^18.x` | UI framework |
| `react-dom` | `^18.x` | DOM rendering |
| `vite` | `^5.x` | Build tool and dev server |
| `tailwindcss` | `^4.1.x` | Utility-first CSS — CSS-first config, no tailwind.config.js |
| `@tailwindcss/vite` | `^4.1.x` | Vite plugin for Tailwind v4 (replaces PostCSS setup) |
| `@dnd-kit/core` | `^6.x` | DnD primitives (required by sortable) |
| `@dnd-kit/sortable` | `^7.x` | Within-category drag-to-reorder in Prep Mode |
| `react-rnd` | `^10.x` | Draggable + resizable Live Mode overlay |

**Why `@dnd-kit/sortable` not just `@dnd-kit/core`:** The sortable preset handles the sort algorithm, keyboard accessibility, and sensor configuration out of the box. Using `@dnd-kit/core` alone requires reimplementing all of this. One `SortableContext` per category group; a single parent `DndContext` wrapping all groups with cross-context dragging explicitly disabled.

**Why `react-rnd`:** Combines drag (positional) and resize in a single component with a clean callback API (`onDragStop`, `onResizeStop`) for persisting position and size to localStorage.

**Why Tailwind v4.1:** CSS-first configuration is cleaner for this project — design tokens from UI_SPEC.md map directly to CSS custom properties in a `@theme` block. No `tailwind.config.js` or `postcss.config.js` needed.

---

## 2. Deployment

**Method:** Static build served from a local `file://` URL in Google Chrome.

**Build command:** `npm run build` — outputs to `dist/`

**Launch:** Place the `dist/` folder in a permanent location (e.g., `~/Documents/interview-prep/dist/`). Bookmark `dist/index.html` in Chrome. Open the bookmark to launch the app.

**Why this approach:**
- No server process required — no terminal to keep open, no process that can crash during a live interview
- Fully offline from day one — the entire app is on disk with no network dependency at any point; no service worker or hosting setup needed
- Chrome allows localStorage on `file://` origins without restriction, so the full storage contract (quota checks, atomic blob writes) works exactly as designed

**localStorage origin note:** Chrome computes the `file://` origin from the full file path. Keep the `dist/` folder at its original location — moving it changes the origin and makes existing localStorage data inaccessible from the new path.

**Updating the app:** Run `npm run build` after any code change. The bookmark URL remains valid as long as the `dist/` folder location does not change.

**Target browser:** Google Chrome (macOS, current version). Safari and Firefox are out of scope for v1.0.

---

## 3. Boot Sequence

Executed synchronously before React renders any UI:

1. `getFromStorage()` — read and parse the localStorage blob
2. `runMigrations(data)` — upgrade `schemaVersion` if needed
3. `closeOrphanedSessions()` — set `endedAt = now` on any session with no `endedAt`
4. `applySeedIfFirstLaunch()` — if `entries.length === 0`, insert the `defaultData` seed entry
5. `setInitialState(data)` — populate the Zustand store
6. `render()` — React takes over

Steps 1–5 run in `main.jsx` before `ReactDOM.createRoot(...).render(...)`. If step 1 or 2 throws an unrecoverable error, render a blocking full-screen error:

> "Your data could not be loaded. If this persists, open the browser console and run `localStorage.removeItem('interviewprep_data')` to reset. Export a backup first if possible."

---

## 4. Schema Migration Strategy

**Location:** `src/utils/migrations.js`

The current schema version is defined as a constant (`CURRENT_SCHEMA_VERSION`). Individual migration functions are stored in a registry keyed by the version number they produce — for example, the function that upgrades data from v0 to v1 is registered at key `1`.

`runMigrations` receives the parsed `AppData` object. It first checks whether the data's `schemaVersion` exceeds `CURRENT_SCHEMA_VERSION` — if so, the data was written by a newer version of the app and the function throws immediately with a message telling the user to update the app. Otherwise, it iterates from the data's current schema version up to `CURRENT_SCHEMA_VERSION`, applying each registered migration function in sequence. After each migration function runs, `schemaVersion` is incremented by one. The fully migrated object is returned. If no migrations are needed (schema version is already current), the data is returned unchanged.

After `runMigrations` completes successfully, `saveToStorage()` is called once to persist the upgraded schema to localStorage.

**Rules:**
- Migrations are forward-only — no rollback
- Each migration function receives the full `AppData` object and returns a new one
- A data file from a newer schema version throws immediately — do not attempt to read it

**Adding a v1→v2 migration:**
1. Increment `CURRENT_SCHEMA_VERSION` to `2`
2. Register a new migration function at key `2` that transforms the v1 data shape into v2 and returns the updated object

---

## 5. localStorage Read/Write Contract

**Location:** `src/utils/storage.js`

**Single key:** `"interviewprep_data"`

### Reading: `getFromStorage()`

Reads the raw value at key `"interviewprep_data"` from localStorage. If the key is absent, returns `null`. Otherwise, parses the raw string as JSON and passes the result to `runMigrations` to apply any pending schema upgrades. The migrated object is returned. Any parse error or migration error is caught and re-thrown with a descriptive prefix so the boot sequence can surface it as a blocking UI error.

### Writing: `saveToStorage(data)`

Serializes the provided `AppData` object to a JSON string and writes it to localStorage under `"interviewprep_data"`. Returns `{ ok: true }` on success. If the write throws a `QuotaExceededError`, returns `{ ok: false, error: 'Save failed: storage is full.' }`. Any other error returns `{ ok: false, error: 'Save failed: [message]' }`. The store never swallows a `{ ok: false }` result — it surfaces the error message immediately in the UI.

### Quota check: `getStorageUsageKB(data)`

Serializes the provided `AppData` object to a JSON string, multiplies the character count by 2 to approximate UTF-16 byte usage, divides by 1024, and returns the result rounded to the nearest integer as a KB value. The quota warning threshold is **4096 KB** (approximately 80% of the conservative 5120 KB browser cap).

### Cross-Tab Synchronization

The app registers a `storage` event listener on initialization. When the app is open in multiple tabs and one tab writes to `"interviewprep_data"`, Chrome fires a `storage` event on all other open tabs. Each receiving tab rehydrates its Zustand store from the updated localStorage value, ensuring it is current before its next write — preventing stale-state overwrites.

**Implementation requirements:**
- Filter on `event.key === 'interviewprep_data'` before acting — ignore all other storage changes
- Delegate to `getFromStorage()` in the handler (not `event.newValue` directly) so schema migrations run correctly on the received value
- Wrap the handler in `try/catch` — an uncaught exception in a `storage` event handler propagates as an unhandled error and can crash the React render
- Guard against `event.newValue === null` (fired when the key is deleted) — ignore silently or surface an error
- Register the listener after `setInitialState()` completes in the boot sequence to avoid the handler firing on an uninitialized store
- The `storage` event does not fire on the writing tab — no self-triggering loop to guard against

**Inline editor safety:** Rehydration updates Zustand only. Inline editor dirty values live in `QuestionCard` component state, which is untouched by store rehydration — an unsaved draft is never discarded due to a cross-tab sync.

---

## 6. State Management

**Store:** `src/store/useQAStore.js` — Zustand

### What lives in the store

| State | Location |
|---|---|
| `entries: Entry[]` | Store |
| `sessions: Session[]` | Store |
| `ui: UIState` | Store |
| `schemaVersion: number` | Store |
| `storageWarning: boolean` | Store (derived after every save) |
| `storageError: string \| null` | Store (set on QuotaExceededError) |
| `activeSessionId: string \| null` | Store (derived from sessions) |

### What lives in component state

| State | Component |
|---|---|
| Inline editor dirty values (prose, anchor, question) | `QuestionCard` |
| Version history panel open/closed | `QuestionCard` |
| Scroll position before entering Answer View | `QuestionIndex` |
| Add Question Form open/closed | `PrepMode` or `QuestionList` |
| Confirm dialog open/closed + props | Caller component |
| Debrief unsaved note text (per entry) | `DebriefScreen` |

### Mutation pattern

Every store action follows the same pattern. The target entry is located in the current entries array and transformed by the provided updater function, producing a new entries array. The full next state is assembled from the current state with the new entries substituted in. `saveToStorage` is called with the next state. If the save fails — for example due to a `QuotaExceededError` — the store rolls back to the previous state and sets `storageError` to the error message, leaving in-memory state unchanged from the last successful save. If the save succeeds, the next state is applied to the store, `storageError` is cleared, and `storageWarning` is recomputed based on whether current usage has crossed the 4096 KB threshold.

---

## 7. Session Lifecycle

**Location:** `src/store/useSessionManager.js`

### States

```
IDLE     → no active session (all sessions have endedAt, or sessions array is empty)
ACTIVE   → user is in Live Mode; current session has no endedAt
DEBRIEF  → user toggled to Prep with ≥1 visit; session has no endedAt; debrief screen showing
ABANDONED→ detected on boot; session has no endedAt → immediately set endedAt, move to IDLE
```

### Transitions

| From | To | Trigger | Data mutation |
|---|---|---|---|
| IDLE | ACTIVE | User toggles to Live Mode | Create new `Session` with `startedAt = now`, append to sessions (prune to 50) |
| ACTIVE | DEBRIEF | User toggles to Prep AND `visits.length >= 1` | None — session stays open |
| ACTIVE | IDLE | User toggles to Prep AND `visits.length === 0` | No session record written |
| DEBRIEF | ACTIVE | User clicks "Back" in Debrief | None — session stays open, visited state preserved |
| DEBRIEF | IDLE | User clicks "Save & End Session" | Write notes to entries, set `session.endedAt = now`, save |
| DEBRIEF | IDLE | User clicks "Skip" | Set `session.endedAt = now`, save |
| ABANDONED | IDLE | Detected on boot (step 3) | Set `session.endedAt = now` for all open sessions |

### Visited state

A `SessionVisit` is appended to `session.visits` when `AnswerView` mounts for a given entry. Guard: only append if `entryId` is not already in `visits` for the current session (idempotent).

### `beforeunload` handler

The handler is registered via `useEffect` whenever session state or the current session's visit count changes. When the session is `ACTIVE` and the current session has at least one visit, the handler intercepts the browser's tab-close or navigation event by calling `preventDefault` and setting `returnValue` to an empty string, which triggers Chrome's native "Leave site?" confirmation dialog. When neither condition is met, the handler is registered but does nothing — tab close proceeds silently. The `useEffect` cleanup removes the event listener so the handler always reflects the latest session state.

---

## 8. Version History Logic

**Location:** `src/utils/versionUtils.js`

### Creating a version: `createVersion(entry, prose, anchor)`

Builds a new `AnswerVersion` object with a fresh UUID, the provided prose and anchor values, the current ISO timestamp as `createdAt`, and `isActive: true`. The existing active version in the entry's versions array is then deactivated by setting its `isActive` to `false`. The new version is prepended to the front of the array (making it the most recent). The combined array is passed to `enforceVersionCap` to discard the oldest inactive version if the total exceeds 20. The entry is returned with the updated versions array and `lastEditedAt` set to the new version's timestamp.

### Restoring a version: `restoreVersion(entry, versionId)`

Locates the target version by ID and throws if not found. Creates a copy of that version as a new `AnswerVersion` with a fresh UUID, the current timestamp as `createdAt`, `isActive: true`, and `restoredFrom` set to the original version's ID to preserve the audit trail. The currently active version is deactivated. The restored version is prepended to the array, which is then passed through `enforceVersionCap`. The entry is returned with updated versions and `lastEditedAt`.

### Enforcing the cap: `enforceVersionCap(versions)`

If the versions array has 20 or fewer entries, it is returned unchanged. Otherwise, the function finds the oldest inactive version by reversing the array and locating the first entry whose `isActive` is `false`, then translates that reversed index back to the original position. That entry is removed and the resulting array is returned. The active version is never a candidate for removal.

### Helpers

`getActiveVersion(entry)` finds and returns the single version in the entry's versions array where `isActive` is `true`.

`getSortedHistory(entry)` combines the entry's `versions` and `notes` arrays into one array and sorts it in reverse chronological order by `createdAt` timestamp. The result is used by the version history panel to render a unified time-ordered history of answer snapshots and post-interview notes.

---

## 9. Import/Export Algorithm

**Location:** `src/utils/importExport.js`

### Export: `exportData(data)`

Serializes the full `AppData` object to a pretty-printed JSON string (2-space indent). Constructs a filename in the format `interview-prep-export-YYYY-MM-DD.json` using the current date. Creates a `Blob` from the JSON string with MIME type `application/json`. Creates a temporary object URL from the blob and assigns it to a programmatically created anchor element with the `download` attribute set to the filename. Triggers a click on that anchor to initiate the browser's native file download. Revokes the object URL immediately after to release memory.

### Import — two-pass algorithm

**Pass 1: Validate**

Check in order (stop at first error):
1. Is it valid JSON? → "File is not valid JSON and cannot be read"
2. Does it have `schemaVersion` and `entries`? → "File does not appear to be a PM Interview Prep export"
3. For each entry: required fields present? → "Missing required field: [field] on entry [n]"
4. For each entry: valid category? → "Unknown category '[value]' on entry [n]..."
5. For each entry: exactly one `isActive: true` version? → "Entry [n] has no active answer version"
6. File size > 10MB? → "File exceeds 10MB and cannot be imported"

No data is modified if any validation error is thrown.

**Pass 2: Merge**

The merge proceeds in four steps. First, the IDs of all existing entries and sessions are collected into sets for O(1) lookup. Second, a remap table is built for any imported session whose ID collides with an existing session ID — each conflicting session is mapped to a new UUID. Third, each imported entry is processed: if its ID collides with an existing entry ID it receives a new UUID; each of its notes has its `sessionId` rewritten using the remap table if that session was remapped; and its versions are passed through `enforceImportVersionCap` to trim to 20 if needed. Imported sessions with conflicting IDs are assigned their remapped IDs. Fourth, the remapped entries and sessions are appended to the existing arrays. The combined sessions array is pruned to the 50 most recent entries.

**Version cap on import: `enforceImportVersionCap(versions)`**

If the versions array has 20 or fewer entries, it is returned unchanged. Otherwise, the active version is extracted and preserved unconditionally. The inactive versions are sorted in reverse chronological order by `createdAt` and the 19 most recent are kept. The result — one active version plus 19 inactive versions — totals 20.

Success banner: "Imported N entries." If any entries were trimmed: "N entries had version history trimmed to the 20-version limit."

---

## 10. Float Order Normalization

**Location:** `src/utils/versionUtils.js` or inline in store's `reorderEntry` action

### Trigger check: `needsNormalization(entriesInCategory)`

Sorts the provided entries by their `order` field in ascending order. Iterates through each adjacent pair in the sorted result. If any two consecutive entries have an `order` difference smaller than 0.001, returns `true` immediately. If no such pair exists after all comparisons, returns `false`.

### Normalization: `normalizeOrderForCategory(entries)`

Sorts the provided entries by their `order` field in ascending order. Reassigns each entry a clean integer `order` value starting at `1.0`, incrementing by `1.0` per entry in sorted position. Returns the updated array. The relative order of entries is preserved; only the numeric values are reset.

**Integration point:** Called inside the `reorderEntry` store action, after computing the new midpoint order value, before writing to localStorage. Does not create a new version history entry — it is a structural mutation only.

---

## 11. Overlay Position Clamping

**Location:** `src/components/live/LiveOverlay.jsx` — called on mount

### `clampOverlayPosition(position, size, viewport)`

First checks whether the overlay is entirely outside the viewport — specifically whether its right edge is left of the viewport's left edge, its left edge is right of the viewport's right edge, its bottom edge is above the viewport's top, or its top edge is below the viewport's bottom. If any of those conditions are true, the overlay is fully off-screen (typically because the user disconnected a monitor) and its position is reset to the bottom-right corner with a 20px margin. Otherwise, the position is clamped so the overlay stays within the viewport with a 20px margin on all sides: `x` is constrained between `margin` and `innerWidth - width - margin`, and `y` is constrained between `margin` and `innerHeight - height - margin`.

On mount, `LiveOverlay` calls `clampOverlayPosition` with the saved position and size (defaulting to the defined defaults if none are saved) and the current `window` dimensions. The clamped result is used as the initial position for the `react-rnd` component.

---

## 12. Active Pill State (IntersectionObserver)

**Location:** `src/components/live/CategoryJumpStrip.jsx`

On mount (and whenever the overlay transitions from minimized back to visible), the component creates an `IntersectionObserver` scoped to the scrollable `QuestionIndex` container rather than the document viewport. The observer watches each element that carries the `data-category-header` attribute — one per `CategoryGroup`. When a category header enters the scroll container's visible area at a 30% intersection threshold, the observer fires and `activeCategory` state is updated to that header's `data-category` value, which highlights the corresponding pill button in the jump strip. The observer is disconnected in the cleanup function when the component unmounts or the effect re-runs. `isMinimized` is listed as a dependency so the observer disconnects when the overlay is minimized (no headers are visible) and reconnects when the overlay is restored.

**Requirements for `CategoryGroup.jsx`:**
- The group header element must have `data-category-header` and `data-category="[Category Name]"` attributes
- The scroll container ref must be passed down from `LiveOverlay` to `QuestionIndex` to `CategoryJumpStrip`

---

## 13. UUID Generation

All UUID generation uses `crypto.randomUUID()`. See CLAUDE.md for why `Math.random()`-based generation is not used.

**Call sites:**
- `Entry.id` — on `addEntry()`
- `AnswerVersion.id` — in `createVersion()` and `restoreVersion()`
- `Note.id` — on `addNote()` in Debrief
- `Session.id` — in `useSessionManager` on Live Mode enter
- Import remap — in `importData()` for conflicting IDs

---

## 14. Component Architecture

### Connected vs. Pure

**Connected (reads from useQAStore):**

| Component | Store data used |
|---|---|
| `App.jsx` | `ui.mode`, session state |
| `PrepMode.jsx` | `entries`, `ui.activeCategoryFilter` |
| `Sidebar.jsx` | `entries`, `ui.activeCategoryFilter` |
| `QuestionList.jsx` | `entries` (filtered) |
| `QuestionCard.jsx` | single `entry` |
| `LiveOverlay.jsx` | `ui.overlayPosition`, `ui.overlaySize`, `ui.collapsedCategories` |
| `QuestionIndex.jsx` | `entries`, `ui.collapsedCategories`, `activeSessionId` |
| `AnswerView.jsx` | single `entry`, active version |
| `DebriefScreen.jsx` | current session, visited entries |

**Pure (props only):**

| Component | Key props |
|---|---|
| `CategoryJumpStrip` | `categories`, `activeCategory`, `onPillClick`, `scrollContainerRef` |
| `CategoryGroup` | `category`, `entries`, `isCollapsed`, `onToggle`, `onEntryClick` |
| `QuestionRow` | `entry`, `isVisited`, `onClick` |
| `AddQuestionForm` | `onSubmit`, `onDiscard` |
| `ConfirmDialog` | `title`, `message`, `confirmLabel`, `onConfirm`, `onCancel` |
| `StorageWarningBanner` | `onDismiss` |

### Component Tree

```
App
├── ModeToggle
├── PrepMode
│   ├── Sidebar (category filter, import/export)
│   ├── QuestionList
│   │   ├── DndContext (one per app, sensors configured)
│   │   └── [per category] SortableContext
│   │       └── QuestionCard (inline edit + version history panel)
│   └── AddQuestionForm
├── LiveOverlay (react-rnd wrapper)
│   ├── Overlay Header (mode toggle + minimize)
│   ├── CategoryJumpStrip
│   ├── QuestionIndex (scrollable)
│   │   └── CategoryGroup[]
│   │       └── QuestionRow[]
│   └── AnswerView (conditional — replaces QuestionIndex)
├── DebriefScreen (full-screen, conditional)
├── ConfirmDialog (portal, conditional)
└── StorageWarningBanner (conditional)
```

---

## 15. Deferred Decisions

These were intentionally left to implementation time. A concrete recommendation is provided for each.

| # | Decision | Recommendation |
|---|---|---|
| 1 | Inline category editing on QuestionCard | Allow editing via the existing inline editor (dropdown field alongside question text). No separate flow needed. |
| 2 | Drag handle affordance in Prep Mode | Show a `⠿` grip icon on the left of each card, visible on hover only. `useSortable`'s `listeners` attached to this handle element. |
| 3 | Word count algorithm | Count whitespace-separated tokens: `prose.trim().split(/\s+/).filter(Boolean).length`. Consistent with user expectations. |
| 4 | Scroll restoration for L-06 (Back button) | Store scroll position in `QuestionIndex` component state on `AnswerView` mount. Use `display: none` on `QuestionIndex` rather than unmounting it — preserves DOM scroll position without storing a pixel value. |
| 5 | Visited Set derivation | Derive `visitedEntryIds: Set<string>` from `currentSession.visits` in the store selector. Pass as prop to `QuestionIndex` → `CategoryGroup` → `QuestionRow`. |
| 6 | Debrief note persistence across Back→re-entry | Store debrief note text in `DebriefScreen` component state. On "Back", keep the component mounted but hidden (CSS `display: none`) so state is preserved. Unmount only on "Save & End Session" or "Skip". |
| 7 | Minimize/restore animation | No animation per discretion principle. Toggle a CSS class that sets `height: 28px; overflow: hidden` on the overlay container. ≤80ms per spec. |
| 8 | `activeCategoryFilter` in Sidebar | Keep filter active when category is emptied. Show "No entries in [Category]" with a "Show All" button that sets `activeCategoryFilter = null`. |
| 9 | `@dnd-kit` sensor configuration | Use `PointerSensor` with a `activationConstraint: { distance: 8 }` to prevent accidental drag on click. |
| 10 | `react-rnd` minimum dimensions | Set `minWidth={280}` and `minHeight={160}` to ensure category jump strip and at least 2 question rows remain visible at minimum resize. |
