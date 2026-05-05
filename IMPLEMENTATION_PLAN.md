# PM Interview Prep — Implementation Plan

## Dependency Graph

```
Phase 1 (Scaffold + Utils)
  └── Phase 2 (Store + Boot)
        └── Phase 3 (Prep Mode Shell + CRUD)
              └── Phase 4 (Version History + DnD Reorder)
                    └── Phase 5 (Live Mode Overlay)
                          └── Phase 6 (Session + Debrief)
                                └── Phase 7 (Import/Export + Storage Guardrails)
                                      └── Phase 8 (Polish, A11y, NF requirements)
```

Each phase produces a runnable app. No phase can begin until the prior phase is functionally complete.

---

## Phase 1 — Project Scaffold, Configuration, and Utility Layer

### Files Created
- `package.json`
- `vite.config.js`
- `index.html`
- `src/main.jsx` (stub — renders "App loading…")
- `src/App.jsx` (stub — returns null)
- `src/index.css` (full `@theme` block from `UI_SPEC.md §14` + Tailwind directives)
- `src/utils/categories.js`
- `src/utils/storage.js`
- `src/utils/migrations.js`
- `src/utils/versionUtils.js`
- `src/utils/importExport.js` (export function only; import stubs)
- `src/store/defaultData.js`

### Implementation Notes
- **`vite.config.js`**: Use `@tailwindcss/vite` as a Vite plugin. No `tailwind.config.js` or `postcss.config.js` — Tailwind v4.1 is CSS-first.
- **`src/index.css`**: `@import "tailwindcss"` must appear before the `@theme` block. Copy the full token block from `UI_SPEC.md §14` verbatim.
- **`categories.js`**: Exports `CATEGORY_LIST` — a single array of the 7 category strings in canonical order. This is the source of truth for dropdowns, validation, and the jump strip.
- **`storage.js`**: Implements `getFromStorage()`, `saveToStorage(data)`, `getStorageUsageKB(data)`. `getFromStorage` does NOT call `runMigrations` — that happens in `main.jsx` after it returns.
- **`migrations.js`**: `CURRENT_SCHEMA_VERSION = 1`. No migrations needed at v1, but the runner, registry structure, storage-headroom guard (check before snapshot write), and pre-migration snapshot logic must be fully implemented now so adding a v2 migration later is trivial.
- **`versionUtils.js`**: Pure functions with no React dependencies — `createVersion`, `restoreVersion`, `enforceVersionCap`, `getActiveVersion`, `getSortedHistory`, `needsNormalization`, `normalizeOrderForCategory`.
- **`defaultData.js`**: Seed entry in "Leadership" category, `schemaVersion: 1`, `ui.mode: "live"`, `order: 1.0`, `createdAt === lastEditedAt`.
- **`importExport.js`**: Implement `exportData(data)` now. Stub `validateImportedData` and `importData` to avoid missing-module errors (full implementation in Phase 7).

### Manual Test Steps
1. `npm install` — no peer dependency warnings.
2. `npm run dev` — Vite starts on `localhost:5173`; stub renders "App loading…" text.
3. Devtools Console — zero errors, zero warnings.
4. In the browser console, directly invoke utility functions:
   - `enforceVersionCap` with a 21-item versions array → result has 20 items, active version preserved.
   - `saveToStorage` after filling storage with `localStorage.setItem('bomb', 'x'.repeat(5*1024*1024))` → returns `{ ok: false }` without throwing.
   - `runMigrations({ schemaVersion: 99, entries: [], sessions: [], ui: {} })` → throws "update the app".
5. `localStorage` should be empty (store not yet initialized).

### Key Edge Cases
- `saveToStorage` must catch `QuotaExceededError` and return `{ ok: false }` — must not throw.
- `enforceVersionCap` must discard the oldest *inactive* version, never the active one.
- `createVersion` with empty/whitespace anchor → stored version has no `anchor` key (not `anchor: ""`).

---

## Phase 2 — Zustand Store + Boot Sequence

### Files Created / Modified
- **Created**: `src/store/useQAStore.js`, `src/store/useSessionManager.js`
- **Modified**: `src/main.jsx` (full boot sequence), `src/App.jsx` (mode-driven stub render)

### Implementation Notes
- **Boot sequence in `main.jsx`** runs synchronously before `ReactDOM.createRoot(...).render(...)`. Order per `SYSTEM_DESIGN.md §3`:
  1. `getFromStorage()`
  2. `runMigrations(data)`
  3. `closeOrphanedSessions(data)`
  4. `applySeedIfFirstLaunch(data)`
  5. `data.ui.mode = 'live'` (inline — not a utility function)
  6. `setInitialState(data)`
  7. React render

  Wrap steps 1–2 in try/catch. On failure, render a blocking full-screen error `<div>` — do NOT call `createRoot` with the normal app tree.

- **`useQAStore.js`**: Store holds full `AppData` shape plus `storageWarning: boolean` and `storageError: string | null`. Every write action follows the same pattern: compute next state → `saveToStorage` → on `{ ok: false }` set `storageError` and abort → on `{ ok: true }` apply next state, clear `storageError`, recompute `storageWarning`. Implement in this phase: `addEntry`, `updateEntry`, `deleteEntry`, `setMode`, `setActiveCategoryFilter`, `setCollapsedCategories`, `reorderEntry`, `setOverlayPosition`, `setOverlaySize`, `setInitialState`.

- **`useSessionManager.js`**: Custom hook (not a store). Derives `sessionState` ('IDLE' | 'ACTIVE' | 'DEBRIEF') and `visitedEntryIds: Set<string>` via `useMemo`. Implements `startSession()`, `cancelSession()`, `recordVisit(entryId)`, `endSession(notes)`, `skipSession()`. Registers `beforeunload` handler in `useEffect` with `[sessionState, activeSessionVisitCount]` as dependencies.

- **Cross-tab sync**: Register `storage` event listener after step 6 in `main.jsx`. Filter on `event.key === 'interviewprep_data'`, guard against `event.newValue === null`, rehydrate via `setInitialState(getFromStorage())`. Wrap in try/catch.

### Manual Test Steps
1. App opens in Live Mode — confirms `forceMode` (step 5) ran.
2. `localStorage['interviewprep_data']` exists with seed entry, `schemaVersion: 1`, `ui.mode: "live"`.
3. Hard-refresh — seed does not duplicate (seed only on `entries.length === 0`).
4. Manually set `ui.mode: "prep"` in localStorage → hard-refresh → still opens in Live Mode.
5. Two-tab test: call `useQAStore.getState().addEntry(...)` in Tab 1 console → entry appears in Tab 2's store within ~1s.
6. Write a session without `endedAt` to localStorage → reload → session now has `endedAt`.

### Key Edge Cases
- Boot with corrupted JSON in localStorage → blocking error renders, app does not crash.
- `addEntry` that triggers `QuotaExceededError` → `storageError` set in store, entry NOT in `state.entries`.
- Tab close with ACTIVE session + ≥1 visit → Chrome "Leave site?" dialog appears.
- Tab close with ACTIVE session + 0 visits → no dialog, tab closes cleanly.

---

## Phase 3 — Prep Mode Shell, CRUD, and Inline Editor

### Files Created
- `src/components/prep/PrepMode.jsx`
- `src/components/prep/Sidebar.jsx`
- `src/components/prep/QuestionList.jsx`
- `src/components/prep/QuestionCard.jsx`
- `src/components/prep/AddQuestionForm.jsx`
- `src/components/shared/ConfirmDialog.jsx`
- **Modified**: `src/App.jsx` (render PrepMode or LiveOverlay stub based on `ui.mode`; add stub ModeToggle)

### Implementation Notes
- **`QuestionCard`** is the most complex component. Key sub-behaviors:
  - Clicking question text or answer text opens the inline editor. Both fields share one edit context.
  - `isDirty` (current textarea value ≠ last saved value) gates the Save button's disabled state.
  - **Save** calls `updateEntry(id, { prose, anchor })` — which internally calls `createVersion`. Does NOT update question text.
  - **Question text edits** use `updateEntryQuestion(id, question)` — a separate action that does not create a version.
  - **Discard**: resets editor to last saved values, does NOT call `saveToStorage`.
  - **Esc**: triggers discard.
  - **Cmd+S / Ctrl+S**: triggers save.
  - **History button**: placeholder text in this phase; full panel in Phase 4.
  - **Delete button**: shows `ConfirmDialog` before calling `deleteEntry(id)`.
  - **Word count**: `prose.trim().split(/\s+/).filter(Boolean).length`. Updates live during edit.
  - **Character count**: `value.length`. Renders below question field.

- **`ConfirmDialog`**: React portal into `document.body`. Focus-trapped (Tab cycles only within the two buttons). Esc = cancel. Accepts `{ title, message, confirmLabel, onConfirm, onCancel }`.

- **`AddQuestionForm`**: Validates on submit only (not live). Calls `scrollIntoView({ behavior: 'smooth', block: 'end' })` on open. Calls `scrollIntoView` on the new card after successful submit.

- **`Sidebar`**: Export wired (`exportData` from Phase 1). Import is a stub button. Category filter: `activeCategoryFilter` persists even when the filtered category empties — only resets on explicit "Show All" click.

- **`App.jsx` ModeToggle stub**: Simple `<button>` that calls `setMode`. The Debrief interception (Phase 6) and full pill styling (Phase 5) come later.

### Manual Test Steps
1. Toggle to Prep Mode → sidebar + card list (or empty state) renders.
2. Add an entry via form → card appears in correct category. Hard-refresh → persists.
3. Inline edit → Save → `versions` has 2 entries in localStorage, `lastEditedAt` updated.
4. Esc discards → `lastEditedAt` unchanged in localStorage.
5. Delete with confirm → entry removed from localStorage.
6. Export → valid JSON file downloads matching `AppData` shape.
7. Category filter → only that category shown. Delete all entries in filtered category → empty state + "Show All" button appears (no auto-reset to "All").

### Key Edge Cases
- Save with empty anchor → stored version has no `anchor` key (not `"anchor": ""`).
- Inline editor open in Tab 1 + storage event from Tab 2 → Tab 1 dirty text is unchanged (store rehydration must not blow away component state).
- Save button disabled when textarea value matches the last saved value exactly.
- Delete the only entry in an active category filter → filter stays active, empty state renders.

---

## Phase 4 — Version History Panel + Drag-to-Reorder

### Files Modified
- `src/components/prep/QuestionCard.jsx` (version history panel)
- `src/components/prep/QuestionList.jsx` (DnD wiring)

### Implementation Notes
- **Version history panel**: 300–350px wide, slides in from right via `transform: translateX()` with 150ms transition. Renders `getSortedHistory(entry)` — merged reverse-chronological array of versions and notes.
  - **Version item**: timestamp, 40-char prose preview with `…`, green "Version" tag, Restore button (hover only). If `restoredFrom` is set, check whether the source version still exists — render dated annotation if yes, "Restored from a prior version (no longer in history)" if no.
  - **Note item**: timestamp, text truncated at 100 chars, gray "Note" tag, no restore button.
  - **Empty state**: if only the active version exists, render §6.4 copy ("Only the current version exists…").

- **Restore flow**: `ConfirmDialog` → on confirm call `restoreVersion(entryId, versionId)` store action → `versionUtils.restoreVersion(entry, versionId)` → persist.

- **DnD in `QuestionList`**: Single `DndContext` wrapping all category groups. `SortableContext` per category with entry IDs. `PointerSensor` with `activationConstraint: { distance: 8 }`. Each `QuestionCard` uses `useSortable`; `listeners` attached to the drag handle element only (not the whole card — prevents accidental drag on click). Drag handle: `⠿` icon, hover-only, on left side of card.

- **Cross-category drag constraint**: In `onDragEnd`, if `active.data.current.category !== over.data.current.category` → do nothing (snap back, no visual feedback).

- **`reorderEntry` store action**: Compute new `order` as midpoint between adjacent entries. Check `needsNormalization(entriesInCategory)` — if true, call `normalizeOrderForCategory` and batch all order changes into one `saveToStorage` call.

### Manual Test Steps
1. History panel opens on History icon click, slides in without collapsing the card list.
2. Entries sorted newest-first with timestamps in "Apr 20, 2026 at 3:42 PM" format.
3. Restore: ConfirmDialog → confirm → card answer updates, `restoredFrom` set in localStorage.
4. 21 saves on one entry → panel shows exactly 20 entries.
5. Drag within category → reordered visually + persists on hard-refresh.
6. Drag across category boundary → card snaps back to original position.

### Key Edge Cases
- Drag to top of category → `order = first.order / 2`.
- Drag to bottom of category → `order = last.order + 1.0`.
- 20 versions + restore → triggers cap → exactly 20 versions remain.
- Pruned `restoredFrom` source → "Restored from a prior version (no longer in history)" annotation shown.
- History panel on entry with only initial version → §6.4 empty state, not an empty list.

---

## Phase 5 — Live Mode Overlay

### Files Created
- `src/components/live/LiveOverlay.jsx`
- `src/components/live/CategoryJumpStrip.jsx`
- `src/components/live/QuestionIndex.jsx`
- `src/components/live/CategoryGroup.jsx`
- `src/components/live/QuestionRow.jsx`
- `src/components/live/AnswerView.jsx`
- **Modified**: `src/App.jsx` (render `<LiveOverlay />` for `ui.mode === 'live'`; upgrade ModeToggle to full styled pill per `UI_SPEC.md §7`)

### Implementation Notes
- **`LiveOverlay` with `react-rnd`**: On mount, call `clampOverlayPosition(saved, window.innerWidth, window.innerHeight)` inside `useLayoutEffect`. Pass the clamped result as the `default` position. `dragHandleClassName` restricts dragging to the header. `minWidth={280}`, `minHeight={160}`. `onDragStop`/`onResizeStop` → `setOverlayPosition`/`setOverlaySize` store actions.

- **Minimize**: Component-local `isMinimized` state. When true, render only the 200×28px pill (app name + restore icon). No animation — instant CSS class toggle per "no animations" principle. Minimize state is transient (not persisted to localStorage).

- **`QuestionIndex`**: Use `display: none` (not unmount) when AnswerView is active — preserves DOM scroll position without needing to store a pixel value. Holds `scrollRef` passed to `CategoryJumpStrip`.

- **`CategoryJumpStrip`**: Pure component. `IntersectionObserver` with 30% threshold, scoped to `scrollRef.current`. Watches `[data-category-header]` elements. Disconnects when `isMinimized`. Clicking a collapsed category's pill auto-expands it before scrolling.

- **`AnswerView`**: On mount, calls `recordVisit(entry.id)` (idempotent — guard against duplicate visits). Anchor section rendered only if `getActiveVersion(entry).anchor` is truthy.

- **`CategoryGroup`**: Pure. Sticky header with `data-category-header` attribute. `aria-expanded` on header. Entry list hidden (not unmounted) when collapsed.

- **Color rule**: Every element in Live Mode uses amber tokens only. No green anywhere in any Live Mode component.

### Manual Test Steps
1. App opens in Live Mode with overlay at bottom-right, 600×400px default.
2. Drag + resize → position/size persist on hard-refresh.
3. Set `overlayPosition: { x: 9999, y: 9999 }` in localStorage → reload → overlay is clamped within viewport.
4. Category pill click → scrolls to group, auto-expands if collapsed.
5. Click a question → AnswerView opens. Click Back → exact same scroll position.
6. Minimize → 200×28px pill. Restore → returns to prior state (Answer View or question list).
7. Active pill in jump strip updates as user scrolls through categories.
8. Empty category pill → 40% opacity, non-interactive.

### Key Edge Cases
- No entries: overlay shows §6.2 empty state with "Go to Prep Mode" amber button.
- `clampOverlayPosition` is called on mount only, not on window resize.
- Minimize then switch modes and back → overlay restores (isMinimized is transient).
- `IntersectionObserver` disconnects on minimize, reconnects on restore.

---

## Phase 6 — Session Lifecycle, Debrief Screen, and beforeunload

### Files Created
- `src/components/live/DebriefScreen.jsx`
- **Modified**: `src/App.jsx`, `src/store/useSessionManager.js`, `src/components/live/LiveOverlay.jsx`

### Implementation Notes
- **`App.jsx` render logic**:
  - `ui.mode === 'prep' && sessionState !== 'DEBRIEF'` → `<PrepMode />`
  - `sessionState === 'DEBRIEF'` → `<DebriefScreen />` (full-screen, above all content)
  - `ui.mode === 'live' && sessionState !== 'DEBRIEF'` → `<LiveOverlay />`

- **Mode toggle handler** (in `App.jsx`, not in the toggle component itself):
  - live → prep + visits ≥ 1 → set `sessionState` to `'DEBRIEF'`
  - live → prep + 0 visits → `cancelSession()` then `setMode('prep')`
  - prep → live → `setMode('live')` then `startSession()`
  - Toggle disabled (50% opacity, `pointer-events: none`) when `sessionState === 'DEBRIEF'`

- **`DebriefScreen`**: 100vw × 100vh, `#252525` background, z-index above all. Left column 35% (visited questions ordered by `visitedAt`), right column 65% (one `<textarea>` per question). Note state held in `Map<entryId, string>` in component state. "Save & End Session" disabled until `Array.from(noteMap.values()).some(t => t.trim().length > 0)`. Back button + unsaved notes → `ConfirmDialog`; on discard confirm, clear note state and return to Live Mode. Per SYSTEM_DESIGN decision 6: note fields start empty on every Debrief entry (even re-entry within the same session).

- **Skip**: `skipSession()` → sets `session.endedAt = now`, saves, sets `ui.mode = 'prep'`, sets `sessionState = 'IDLE'`. Does NOT save notes.

- **Save & End Session**: Creates a `Note` object for each non-empty field (`crypto.randomUUID()`, `sessionId`, current timestamp), appends to entry's `notes[]`, calls `endSession(notes)` → sets `session.endedAt`, saves, navigates to Prep.

- **`beforeunload` in `useSessionManager`**: Guard: `sessionState === 'ACTIVE' && activeSessionVisitCount >= 1`. Handler calls `event.preventDefault()` and sets `event.returnValue = ''`.

### Manual Test Steps
1. Live → Prep with 0 visits → no Debrief, silent transition, session removed from localStorage.
2. Live → visit one answer → Prep → Debrief appears with that question listed.
3. Save notes → Prep Mode. Entry's `notes[]` in localStorage contains the note; `session.endedAt` is set. Note appears in the version history panel.
4. Back in Debrief with notes → ConfirmDialog. Confirm discard → Live Mode, same session active. Visit another answer → toggle to Prep → Debrief re-appears, same session, **empty** note fields.
5. Skip → `session.endedAt` set, no notes written, Prep Mode.
6. Tab close during ACTIVE + ≥1 visit → Chrome "Leave site?" dialog.
7. Boot with orphaned session → `endedAt` written, no Debrief triggered.

### Key Edge Cases
- 51 sessions created → `sessions` array capped at 50 (oldest pruned).
- Skip with text typed in note fields → notes are discarded (Skip never saves).
- Back in Debrief with all empty note fields → no ConfirmDialog, direct return to Live Mode.
- Re-enter Debrief after Back + discard → same session ID, cumulative visits shown, empty note fields.

---

## Phase 7 — Import, Storage Guardrails, and StorageWarningBanner

### Files Modified / Created
- **Modified**: `src/utils/importExport.js` (implement `validateImportedData`, `importData`, `enforceImportVersionCap`), `src/components/prep/Sidebar.jsx` (full import flow), `src/store/useQAStore.js` (add `importEntries` action)
- **Created**: `src/components/shared/StorageWarningBanner.jsx`

### Implementation Notes
- **Import validation order** (strict per P-08 — order matters):
  1. JSON parse failure (caught before calling `validateImportedData`)
  2. File size > 10 MB
  3. Schema shape missing or invalid
  4. Missing required field on any entry
  5. Unknown category value on any entry
  6. Entry with no active version
  7. *(Non-blocking warning)*: version history trimmed to 20

- **`importData`**: Builds UUID remap tables for conflicting entry IDs and session IDs. Rewrites `Note.sessionId` fields via session remap. Calls `enforceImportVersionCap` (≤20 versions, active always preserved). Appends to existing entries + sessions. Prunes sessions to 50 most recent. "Already imported" check (all IDs already exist) throws an error before merging.

- **`importEntries` store action**: Takes the fully-merged `AppData` returned by `importData` and replaces store state atomically via the standard save pattern.

- **Import UX**: Hidden `<input type="file" accept=".json">` triggered by styled button. Success banner auto-dismisses after 5 seconds. If trimming occurred, appends trimming note to the success banner.

- **`StorageWarningBanner`**: Fixed position, top of screen, amber background `#fef3c7` in **both** Prep and Live Mode (semantic override — not mode-colored). Dismissible per session (component-local dismissed state). Re-appears on next reload if condition persists. Rendered in `App.jsx`.

- **Storage error** (QuotaExceededError): Blocking modal/banner — user cannot dismiss. Must export and free space. Different from the warning banner — this is a hard block.

### Manual Test Steps
1. Export → re-import → "This file has already been imported. No new entries were found."
2. Modify one entry UUID in the export file → import → merges as new entry; originals unchanged.
3. Import file with unknown category value → inline error below import button, no data changed.
4. Import file with 25 versions on one entry → success banner mentions trimming; entry has exactly 20 versions.
5. Import a `.txt` file → "File is not valid JSON and cannot be read."
6. Import `{"foo": "bar"}` → schema error message.
7. Fill localStorage to ~80% → `StorageWarningBanner` visible in both Prep and Live Mode.
8. Fill localStorage completely → attempt a save → "Save failed: storage is full." shown, localStorage value unchanged.

### Key Edge Cases
- Import where session IDs conflict and notes reference those sessions → `Note.sessionId` rewritten to new session UUID.
- 10.0 MB file → passes. 10.1 MB file → size error (checked before schema validation).
- Export filename format: `interview-prep-export-YYYY-MM-DD.json` with today's date.
- Import with `"entries": []` → passes validation, merges 0 entries, banner says "Imported 0 entries."

---

## Phase 8 — Polish, Accessibility, Empty States, and NF Requirements

### Files Modified
All component files (targeted pass). No new files expected.

### Implementation Notes
- **Empty states** (harden to exact spec copy from `UI_SPEC.md §6`):
  - §6.1 Prep, no entries: clipboard icon 48px, "No questions prepared yet" (18px bold), subtext, "Create First Question" CTA.
  - §6.2 Live, no entries: "No questions prepared" (16px centered) + subtext + "Go to Prep Mode" amber button.
  - §6.3 Prep, category filter empty: "No entries in [Category Name]" + "Show All" button.
  - §6.4 Version history, no prior versions: "Only the current version exists" copy.

- **Focus management**:
  - `ConfirmDialog`: trap Tab within its two buttons; return focus to trigger element on close.
  - `AddQuestionForm`: focus the first field on open.
  - Version history panel: focus close button on open; return focus to History icon button on close.
  - `DebriefScreen`: focus the first note textarea on mount.

- **ARIA audit**: ModeToggle `role="switch"` + `aria-checked`. Category group headers `aria-expanded`. All icon-only buttons have `aria-label`. Import file input has `aria-label="Import deck"`.

- **Keyboard shortcuts audit**: Esc = discard inline edit, close panels, close dialogs, close AddQuestionForm. Cmd+S/Ctrl+S = save inline edit, submit AddQuestionForm. Tab/Shift+Tab = logical order in both modes.

- **Color audit**: In Prep Mode, verify no element uses amber hex values. In Live Mode, verify no element uses green hex values. Use Chrome DevTools color picker.

- **Production build**: `npm run build` → open `dist/index.html` via `file://` URL in Chrome. Full functionality including localStorage persistence.

### Manual Test Steps
1. Tab through all focusable elements in both modes — logical order, no unexpected traps.
2. `ConfirmDialog`: focus trapped within; Esc cancels; focus returns to trigger on close.
3. 40 entries in Live Mode — scroll to answer retrieval under 5 seconds.
4. `npm run build` → open `dist/index.html` via `file://` → full functionality, localStorage persists.
5. Color audit: Prep = only green tones; Live = only amber tones. Warning banner = amber in both modes.
6. Debrief open → ModeToggle is visually disabled (50% opacity, no click response).
7. VoiceOver: mode toggle reads "switch, checked"; category headers read "expanded" / "collapsed".
