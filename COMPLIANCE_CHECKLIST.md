# PM Interview Prep — Spec Compliance Checklist

Use this checklist to validate the completed app against the four source spec documents. Each item is a concrete manual test performable in the browser. The **Testable After** column tells you the earliest phase at which the test can be meaningfully run — run each test as soon as its phase is complete, not just at the end.

---

## PRD.md

| # | Requirement | Source | Testable After | Manual Test |
|---|---|---|---|---|
| PRD-01 | App always opens in Live Mode | PRD §4 Workflow 2, step 1 | Phase 2 | Close the app while in Prep Mode. Reopen it. Verify it opens in Live Mode regardless of what was persisted in `ui.mode`. |
| PRD-02 | Live→Prep toggle intercepts with Debrief when ≥1 answer was visited | PRD §4 Workflow 3, step 1 | Phase 6 | Enter Live Mode, click one question to open its Answer View, then click the mode toggle. Verify Debrief screen appears — mode does NOT switch immediately. |
| PRD-03 | Debrief is skipped when 0 answers were visited | PRD §5.4 S-06 | Phase 6 | Enter Live Mode, do NOT click any question, click the mode toggle. Verify mode switches to Prep silently with no Debrief screen and no session written to localStorage. |
| PRD-04 | Session visits are scoped to the current session | PRD §5.4 S-01 | Phase 6 | Visit 3 answers in a session. Complete Debrief (Save or Skip). Enter Live Mode again. Verify all questions show as unvisited in the new session. |
| PRD-05 | Orphaned sessions are closed on boot | PRD §5.4 S-02 | Phase 2 | Manually write a session without an `endedAt` field to `localStorage['interviewprep_data']`. Reload. Verify the session now has `endedAt` set and Debrief is NOT triggered. |
| PRD-06 | Version cap at 20; active version always preserved | PRD §5.2 V-06 | Phase 4 | Make 21 saves to one entry. Open the version history panel. Verify exactly 20 entries are shown and the active (most recent) version is present. |
| PRD-07 | Import merges; UUID conflicts get a new UUID | PRD §5.1 P-07 | Phase 7 | Export the deck. Add a new entry locally. Import the original export. Verify: original entries are present, locally added entry is NOT overwritten, and re-imported entries without ID conflicts are identical. |
| PRD-08 | Import error order: JSON parse is checked first | PRD §5.1 P-08 | Phase 7 | Attempt to import a file whose content is not parseable JSON (e.g., plain text). Verify "File is not valid JSON and cannot be read" appears — not a schema error. |
| PRD-09 | Imported entries with >20 versions are trimmed; banner notes this | PRD §5.1 P-08 | Phase 7 | Craft or generate an export JSON with one entry containing 25 versions. Import it. Verify the success banner mentions trimming and the entry has exactly 20 versions in its history panel. |
| PRD-10 | No data leaves the device | PRD §3 Constraints | Phase 3 | Open the Network tab in devtools. Use the app for 5 minutes: add entries, edit, save, switch modes. Verify zero POST/PUT/PATCH requests. The only allowed request is the Google Fonts GET on initial load. |
| PRD-11 | Discard (or Esc) reverts without writing to localStorage | PRD §5.1 P-02 | Phase 3 | Note the current `lastEditedAt` value in localStorage for an entry. Open its inline editor and type new text. Press Esc. Check localStorage — `lastEditedAt` is unchanged. |
| PRD-12 | Debrief notes persist and appear in the version history panel | PRD §5.4 S-03, S-04 | Phase 6 | Write a note in Debrief and save. Switch to Prep Mode. Open the history panel for the noted entry. Verify the note appears with a "Note" label, correct timestamp, and the text you entered. |

---

## UI_SPEC.md

| # | Requirement | Source | Testable After | Manual Test |
|---|---|---|---|---|
| UI-01 | No amber in Prep Mode; no green in Live Mode | UI_SPEC §1 | Phase 5 | Toggle between modes. Use Chrome DevTools color picker on interactive elements (buttons, toggles, borders, focus rings). Prep Mode must show only green tones (`#16A34A`, `#4ADE80`, `#dcfce7`). Live Mode must show only amber tones (`#D97706`, `#F59E0B`). |
| UI-02 | Storage warning banner uses amber in both modes | UI_SPEC §1.4, §13 | Phase 7 | Trigger the storage warning (fill localStorage to ~80%). Verify the banner's background is `#fef3c7` in Prep Mode AND in Live Mode — it must NOT turn green in Prep Mode. |
| UI-03 | Overlay default position and size; off-screen position is clamped on mount | UI_SPEC §4.2 | Phase 5 | Clear localStorage. Open Live Mode. Verify the overlay is at the bottom-right corner with 20px margins and 600×400px size. Then set `overlayPosition: { x: 9999, y: 9999 }` in localStorage and reload — verify the overlay resets to the default position. |
| UI-04 | Empty category pills are dimmed and non-interactive | UI_SPEC §4.3 | Phase 5 | Delete all entries in one category (e.g., "Estimation"). Verify the corresponding jump strip pill is at 40% opacity and clicking it does nothing. Add an entry back — pill becomes interactive. |
| UI-05 | Anchor section renders only when an anchor exists | UI_SPEC §4.4 | Phase 5 | Click a question whose active version has no anchor. Verify no anchor section appears in Answer View. Click a question that has anchor text — verify each phrase appears on its own line in bold amber. |
| UI-06 | Back button restores exact scroll position in the question list | UI_SPEC §4.4, PRD L-06 | Phase 5 | Scroll halfway through the question list. Click a question near the bottom of the visible area. Click Back. Verify the scroll position is identical to before clicking. |
| UI-07 | Mode toggle is disabled while Debrief is open | UI_SPEC §7 | Phase 6 | Trigger the Debrief screen. Verify the mode toggle is visually disabled (50% opacity) and clicking it has no effect. |
| UI-08 | Focus rings always visible; green in Prep, amber in Live | UI_SPEC §5.1 | Phase 8 | Tab through interactive elements in Prep Mode — verify 2px solid green focus rings on every element. Tab in Live Mode — verify 2px solid amber focus rings. Confirm `outline: none` does not appear on any focusable element. |
| UI-09 | Drag handle visible on hover only; cross-category drag snaps back | UI_SPEC §5.5, SYSTEM_DESIGN §15 decision 2 | Phase 4 | Hover a card in Prep Mode — the `⠿` drag handle appears. Drag the card within its category — reorder succeeds. Drag toward a different category — card snaps back with no change. |
| UI-10 | Save button disabled in inline editor when there are no changes | UI_SPEC §5.6, §9.6 | Phase 3 | Open the inline editor on a card. Without making any changes, verify the Save button is disabled (50% opacity, `cursor: not-allowed`). Type one character — Save button enables. |
| UI-11 | "Save & End Session" disabled until at least one note is entered | UI_SPEC §4.5 | Phase 6 | Open the Debrief screen. Verify "Save & End Session" is disabled. Type one character in any note field — button enables. Clear the field — button disables again. |
| UI-12 | "Restored from…" annotation reflects whether the source version still exists | UI_SPEC §8 | Phase 4 | Restore a version. Save enough times to prune the restored-from source version (if at cap). Open the history panel — verify the restored version shows "Restored from a prior version (no longer in history)" if the source was pruned, or the source version's date if it still exists. |

---

## DATA_MODEL.md

| # | Requirement | Source | Testable After | Manual Test |
|---|---|---|---|---|
| DATA-01 | `anchor` is absent (not an empty string) when the anchor field is empty | DATA_MODEL §Design Decisions | Phase 3 | Create an entry with an empty anchor field. In localStorage, find the entry's active version and verify it has no `anchor` key — not `"anchor": ""`. |
| DATA-02 | `lastEditedAt` equals `createdAt` for new entries; updates on each save | DATA_MODEL §Design Decisions | Phase 3 | Inspect the seed entry in localStorage — `createdAt` and `lastEditedAt` must be equal. Make a save on an entry — `lastEditedAt` must update to the new version's `createdAt`, while `entry.createdAt` remains unchanged. |
| DATA-03 | Sessions array capped at 50 most recent | DATA_MODEL §Design Decisions | Phase 6 | Create 51 Live Mode sessions (enter and exit Live Mode 51 times, completing or skipping Debrief each time). Check localStorage — `sessions.length` must be 50 and the oldest session must be absent. |
| DATA-04 | `order` is a float; gap below 0.001 triggers normalization | DATA_MODEL §Design Decisions | Phase 4 | Perform many reorders within one category (20+). Inspect `order` values in localStorage after each reorder. After a normalization event, verify the orders are reset to clean integers (1.0, 2.0, 3.0…). |
| DATA-05 | `schemaVersion: 1` is preserved across all operations | DATA_MODEL §Structure | Phase 2 | After any writes (add, edit, delete), confirm `localStorage['interviewprep_data']` has `schemaVersion: 1`. In the console, run `runMigrations` on the current data — it must return unchanged. |

---

## SYSTEM_DESIGN.md

| # | Requirement | Source | Testable After | Manual Test |
|---|---|---|---|---|
| SYS-01 | Cross-tab sync: write in one tab reflects in the other | SYSTEM_DESIGN §5 | Phase 2 | Open the app in two tabs. In Tab 1, add an entry via the console. Within ~1 second, check `useQAStore.getState().entries` in Tab 2's console — the new entry must appear. |
| SYS-02 | Cross-tab sync does not clear an open inline editor | SYSTEM_DESIGN §5 | Phase 3 | Open two tabs. In Tab 1, open an inline editor and type unsaved text. In Tab 2, add a new entry (triggers a storage event). Verify Tab 1's dirty editor text is unchanged. |
| SYS-03 | `QuotaExceededError` rolls back in-memory state and shows an error | SYSTEM_DESIGN §5, PRD NF-08 | Phase 7 | Fill localStorage to near capacity. Attempt a save that would exceed the cap. Verify: `storageError` is set in the store, a "Save failed" message is displayed, and the entry in the store matches the last successful save (no partial mutation). |
| SYS-04 | Boot sequence step order matches spec exactly | SYSTEM_DESIGN §3 | Phase 2 | Code review: verify in `main.jsx` that the six calls occur in order — `getFromStorage`, `runMigrations`, `closeOrphanedSessions`, `applySeedIfFirstLaunch`, `data.ui.mode = 'live'`, `setInitialState` — before `ReactDOM.createRoot(...).render(...)`. |
| SYS-05 | Production build works from a `file://` URL | SYSTEM_DESIGN §2 | Phase 8 | Run `npm run build`. Open `dist/index.html` directly in Chrome via a `file://` bookmark. Verify full functionality including localStorage read/write, drag-to-reorder, and the overlay. |
| SYS-06 | `storage` event listener is registered after `setInitialState` completes | SYSTEM_DESIGN §5 | Phase 2 | Code review: confirm in `main.jsx` that the `window.addEventListener('storage', ...)` call comes after `setInitialState(data)`. Verify by adding a temporary `console.log` to the listener and confirming it does not fire during boot. |

---

## Tests by Phase (Quick Reference)

| Phase | Run these tests when complete |
|---|---|
| Phase 2 | PRD-01, PRD-05, DATA-05, SYS-01, SYS-04, SYS-06 |
| Phase 3 | PRD-10, PRD-11, DATA-01, DATA-02, UI-10, SYS-02 |
| Phase 4 | PRD-06, UI-09, UI-12, DATA-04 |
| Phase 5 | UI-01, UI-03, UI-04, UI-05, UI-06 |
| Phase 6 | PRD-02, PRD-03, PRD-04, PRD-12, UI-07, UI-11, DATA-03 |
| Phase 7 | PRD-07, PRD-08, PRD-09, UI-02, SYS-03 |
| Phase 8 | UI-08, SYS-05 |
