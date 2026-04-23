# Product Requirements Document
## PM Interview Prep

**Version:** 1.1
**Date:** 2026-04-20
**Status:** Draft — Pending Review

---

## 1. Overview

### Problem Statement
Director of Product candidates preparing for leadership interviews face a specific challenge: PM interviews span a wide range of topics — product craft, strategy, metrics, estimation, team management, hiring, and leadership. Under interview pressure even well-prepared candidates experience mental blanks, lose answer structure mid-response, or struggle to recall the right example at the right moment.

Top pain points identified:
1. Even if they recall the right example, structuring their response in the most impactful way is impossible in the interview context without pre-interview prep.
2. Answers evolve over time — through mock interviews, coaching, and self-reflection — but candidates have no easy way to review or restore older versions.

### Target User
Director of Product or Principal Product Manager candidates preparing for PM leadership interviews at technology companies. These candidates typically conduct interviews via video call (Zoom, Google Meet) on macOS with a single or dual-monitor setup. They have structured answers prepared in advance and need to retrieve them discreetly — without visible tabbing or obvious reference behavior — while maintaining eye contact with the camera. They have no need for AI-generated content; the tool's value is fast retrieval and answer structure. Privacy is a first-order concern: no data leaves the device.

### Solution
A two-mode web application:
1. **Prep Mode** — A full-featured editor used before the interview to author, organize, and iterate on Q&A pairs, with version history per answer
2. **Live Mode** — A compact, discreet floating overlay used during the interview to quickly scan prepared questions and retrieve answers via click and scroll. At the end of the Live session, user can make notes on the Q&A browsed. 

---

## 2. Goals

| Goal | Metric |
|---|---|
| Fast answer retrieval under pressure | User locates the right question and opens its answer in under 5 seconds for a bank of ≤40 entries |
| Discreet tool presence | Overlay is small enough to remain open during a video call without being obviously visible |
| Data safety before an interview | All data persists locally without requiring a network connection or login |
| Answer evolution support | Candidate can review and restore any prior version of an answer, with at least 20 versions retained per Q&A entry, accessible without interrupting the edit flow |

---

## 3. Constraints and Assumptions

- **Storage:** localStorage is the sole persistence mechanism. At 20 versions per answer and 40 Q&A entries (~500 words each), estimated footprint is ~2–3 MB — must be validated against the browser's ~5 MB cap before finalizing versioning storage design.
- **Platform:** macOS only for v1.0. Overlay z-order and focus behavior on Windows/Linux is explicitly untested and unsupported.
- **Delivery:** Browser-based SPA. If z-order requirements for the overlay cannot be reliably met in a browser context, an Electron wrapper must be evaluated before Live Mode development begins.
- **No backend:** No user accounts, no server-side storage, no network requests after initial load.

---

## 4. User Workflows

### Workflow 1: Pre-Interview Preparation

1. User opens the app in their browser. Default mode is Live mode. User toggles to Prep mode.
2. User selects a category (Product sense, Leadership, Strategy, Estimation, Execution, Hiring, Team management)
3. User creates a Q&A entry with: a full question text, their prepared answer (optional), and optional structural anchors
4. Word count indicator shows the user how long their answer is 
5. User repeats until their full answer bank is populated (typically 15–40 entries across all categories)
6. User reorders entries within a category to prioritize the most likely questions
7. User exports the full set as a JSON file (including version history) as a backup before the interview

### Workflow 2: During the Interview

1. User opens the app in their browser alongside their video call — app opens directly in Live Mode
2. User can resize the window and the text displayed is adaptive and responsive to the screen size
3. Interviewer asks a question
4. User browses the question list and clicks the matching prepared question
5. User selects the question — the full prepared answer fills the panel, with structural anchors shown prominently at the top
6. User clicks "Back" to return to the questions list, ready for the next question
7. Process repeats for each interview question

### Workflow 3: Post-Interview Reflection

1. Upon exiting Live Mode (with ≥1 question visited), the overlay is replaced by the full-screen Debrief screen
2. Header shows "← Back" (return to Live Mode), "Interview Debrief" title, and "Skip" (end session without notes)
3. User reviews the two-column layout: left column lists all visited questions; right column has a note input per question
4. User optionally types a short reflection next to any question (e.g., "felt weak on outcome — revisit")
5. Once at least one note is written, "Save & End Session" becomes active; user clicks it to save notes, end the session, and enter Prep Mode
6. If user has no reflections to add, they click "Skip" to end the session and go to Prep Mode immediately
7. Notes are saved alongside the answer entry and visible in the version history panel in Prep Mode

### Workflow 4: Cross-Session Continuity

1. User exports their full deck (including version history and notes) to a JSON file after a prep session
2. User transfers the file to another machine or browser profile
3. User imports the file; entries are merged into the existing deck with any ID conflicts resolved automatically
4. All Q&A entries, version history, and session notes are restored intact

---

## 5. Functional Requirements

### 5.1 Prep Mode

| ID | Requirement | Acceptance Criterion | Priority |
|---|---|---|---|
| P-01 | User can create a new Q&A entry with:  full question (required), full answer (optional), category, and optional structural anchors | Entry appears in the question list immediately; all fields persist on refresh | Must Have |
| P-02 | User can edit any field of an existing entry inline without navigating away; the inline editor shows explicit Save and Discard buttons while open | Clicking a field activates an inline editor; changes are only committed to localStorage on explicit Save; clicking Discard or pressing Esc reverts to the last saved value without modifying localStorage | Must Have |
| P-03 | User can delete an entry with a confirmation step | Deleted entry is removed from list and localStorage; accidental click on delete does not immediately remove | Must Have |
| P-04 | User can reorder entries within a category via drag-and-drop; drag is constrained to within-category only | New order persists after page refresh; dragging across a category boundary snaps the card back to its origin position | Must Have |
| P-05 | User can filter the card list by category using a sidebar | Only entries matching the selected category are shown; "All" shows every entry | Must Have |
| P-06 | User can export all entries (including version history) as a JSON file | File downloads immediately; a success banner confirms the filename and entry count | Must Have |
| P-07 | User can import entries from a previously exported JSON file; imported entries are merged into the existing deck | If an imported entry's ID conflicts with an existing entry, the imported entry is assigned a new UUID automatically; no data is lost and no user intervention is required | Must Have |
| P-08 | Import rejects malformed or schema-invalid files with a human-readable error; existing data is not modified | Error messages cover: (1) "File is not valid JSON and cannot be read" (2) "File does not appear to be a PM Interview Prep export" (3) "Missing required field: [field] on entry [n]" (4) "Unknown category '[value]' on entry [n]; must be one of: Product sense, Leadership, Strategy, Estimation, Execution, Hiring, Team management" (5) "Entry [n] has no active answer version" (6) "File exceeds 10MB and cannot be imported" (7) If an imported entry has more than 20 version snapshots, the oldest non-active versions are silently trimmed to 20 on import — the active version is always preserved; a warning note is appended to the import success banner: "N entries had version history trimmed to the 20-version limit."; no data is modified on any hard error | Must Have |
| P-09 | Structural changes persist to localStorage immediately on every mutation; inline text edits (answer body, question text, anchors) persist only on explicit Save per P-02 | Reorder, category filter, collapse state, and session visits survive a hard browser refresh; unsaved inline text edits are discarded on refresh | Must Have |
| P-10 | The question field accepts text input and has a visible character counter — visual spec: UI_SPEC.md §9.1 | Mandatory field | Must Have |
| P-11 | The answer field shows a live word count — visual spec: UI_SPEC.md §9.2 | Word count updates on every keystroke; displayed as a plain number with no color coding | Must Have |
| P-12 | Each Q&A entry has a dedicated "Anchors" field beneath the answer body where the user enters anchor phrases one per line — visual spec: UI_SPEC.md §9.3 | Anchor phrases are stored separately from the answer prose; they render as a compact bold outline at the top of the Answer View in Live Mode; the field is optional and can be left empty | Must Have |
| P-13 | Each card displays a "Last Edited" timestamp showing when the answer was most recently saved — visual spec: UI_SPEC.md §4.1 | Timestamp is derived from the answer's most recent version snapshot in localStorage; format: "Last edited Apr 20, 2026 at 3:42 PM"; updates immediately after each save | Must Have |
| P-14 | Prep Mode uses a green accent color system for all interactive elements and mode indication — visual spec: UI_SPEC.md §1.1 | All interactive elements in Prep Mode use green; no amber tones appear in Prep Mode | Must Have |
| P-15 | A persistent mode toggle is displayed prominently at the top of the UI at all times — visual spec: UI_SPEC.md §7; toggling switches bidirectionally between Prep Mode and Live Mode | Toggle is visible and accessible in both modes; switching to Live Mode disables editing; switching back to Prep Mode from Live Mode triggers the debrief screen before completing the transition | Must Have |

### 5.2 Version History

| ID | Requirement | Acceptance Criterion | Priority |
|---|---|---|---|
| V-01 | Every Save (whether prose, anchors, or both changed) auto-creates a timestamped snapshot stored alongside the active record | After editing and saving any combination of answer prose and/or anchors, the previous version is accessible in history with an ISO 8601 timestamp | Must Have |
| V-02 | Each Q&A card surfaces a "History" affordance; clicking it opens a side panel listing up to 20 prior versions — visual spec: UI_SPEC.md §8 | History panel opens without leaving Prep Mode; all saved versions are listed in reverse chronological order | Must Have |
| V-03 | Any prior version can be restored as the active answer with a single click; the current answer is pushed to history before replacement | After restore, the restored text is active; the previously active version appears at the top of history | Must Have |
| V-04 | The history panel shows a two-column diff view when comparing any version to the current active answer | Changed lines are highlighted; additions and deletions are visually distinct | Deferred to v1.1 |
| V-05 | Version history is included in JSON export and re-imported intact | Exporting and re-importing a deck preserves all version snapshots with their original timestamps | Should Have |
| V-06 | History is capped at 20 versions per entry; the oldest snapshot is discarded when the cap is reached | After 21 saves, only the 20 most recent versions are retained | Must Have |

### 5.3 Live Mode

| ID | Requirement | Acceptance Criterion | Priority |
|---|---|---|---|
| L-01 | Live Mode renders as a floating overlay panel — visual spec: UI_SPEC.md §4.2; implemented using `react-rnd` | Overlay appears at the default position (bottom-right, 20px margin) and default size (600×400px) if no position is saved | Must Have |
| L-02 | The overlay is draggable by its header bar and resizable from its edges and corners; position and dimensions persist to localStorage on every drag end or resize end | On next Live Mode open, overlay appears at the same position (`overlayPosition`) and size (`overlaySize`); both fields are written on every drag end and resize end | Must Have |
| L-03 | The overlay shows all Q&A entries grouped by category, displaying only the questions per entry, in the same order defined in Prep Mode | All questions are visible in the list; no answer is shown at this level; entry order matches the drag-and-drop order set in Prep Mode | Must Have |
| L-03b | A horizontal category jump strip of 7 abbreviated pill buttons is permanently visible at the top of the overlay — visual spec: UI_SPEC.md §4.3 | Clicking a pill instantly scrolls the question list to that category group; if the target group is collapsed, it is automatically expanded before scrolling; strip is always visible regardless of scroll position | Must Have |
| L-04 | Category groups are collapsible; collapsed state persists to localStorage | Collapsing a group hides its questions; the group header shows the entry count; state survives minimize/restore | Must Have |
| L-05 | Clicking a question opens the Answer View showing: the question in the title, structural anchors as a compact outline at the top, and the full answer text below — visual spec: UI_SPEC.md §4.4 | Anchors render prominently (bold, larger text) above the answer body; scrolling reveals the full answer | Must Have |
| L-06 | Answer View has a "Back" button; clicking "Back" returns to the exact scroll position in the question list | Back button returns to the exact scroll position in the question list before entering the Answer view | Must Have |
| L-07 | A question is automatically marked as visited when the user opens its Answer View; visited state is scoped to the current session | Opening an answer records a SessionVisit entry; no manual toggle required | Must Have |
| L-08 | The overlay can be minimized to a pill showing only the app name and a restore icon — visual spec: UI_SPEC.md §4.2 | Restore returns to the last state (answer view or question list); transition is instant (≤80ms) | Must Have |
| L-09 | The minimize target has a ≥32×32px click/tap area | Target is reliably clickable without precision while maintaining eye contact with camera | Must Have |
| L-10 | Exiting Live Mode (when ≥1 question was visited) replaces the overlay with a full-screen Debrief screen for post-interview reflection — visual spec: UI_SPEC.md §4.5. User reviews visited questions and optionally adds notes; "Save & End Session" saves notes and navigates to Prep Mode. Notes are not auto-saved; they persist only on explicit Save. If no questions were visited, debrief is skipped entirely per S-06. | Debrief screen appears on Live→Prep toggle when ≥1 question was visited; Back returns to Live Mode (with confirmation dialog if note fields contain text); Skip ends session silently; Save writes notes, ends session, and switches to Prep Mode; Save button is disabled until at least one note field has content | Must Have |
| L-11 | The overlay uses a dark color and typography system — visual spec: UI_SPEC.md §1.2 & §2.2 | Text passes WCAG AA contrast (4.5:1) at default settings; minimum 14px question font, 15px answer font | Must Have |
| L-12 | Live Mode uses an amber accent color system for all interactive elements and mode indication — visual spec: UI_SPEC.md §1.2 | All interactive elements in Live Mode use amber; no green tones appear in Live Mode | Must Have |


### 5.4 Session Tracking & Notes

| ID | Requirement | Acceptance Criterion | Priority |
|---|---|---|---|
| S-01 | Visited toggle state is scoped to the current Live Mode session and resets automatically when a new Live Mode session begins | Visiting a question in Session 1 does not mark it as visited when Live Mode is reopened for Session 2 | Must Have |
| S-02 | A "new session" is defined as any time the user enters Live Mode after having exited it (via the Debrief screen). `endedAt` is written only when the user exits the Debrief screen via "Save & End Session" or "Skip" — not at the moment of the Live→Prep toggle. While `endedAt` is unset the session is considered active. If the user returns to Live Mode via the Debrief "Back" button and then exits again with ≥1 visit, the Debrief screen re-appears for the same session (cumulative visits). If a session with no `endedAt` exists when the app loads (e.g., browser was closed during Live Mode), it is treated as abandoned: `endedAt` is set to the current timestamp on app boot, no debrief is triggered, and visited state resets for the next session. | Re-entering Live Mode without a page reload correctly resets visited state; orphaned sessions are closed silently on app load; `endedAt` is written only on Debrief exit | Must Have |
| S-06 | The debrief screen only triggers when exiting Live Mode if at least one question was visited in that session; if no questions were visited, toggling back to Prep Mode completes silently with no interception | Toggling from Live to Prep with zero visited questions skips the debrief screen entirely | Must Have |
| S-03 | Each Q&A entry has an optional notes field; notes added via the debrief screen are stored alongside the entry | Notes persist to localStorage and survive page refresh | Must Have |
| S-04 | Notes appear in the version history panel (V-02) as a distinct entry type, visually differentiated from answer snapshots | A note entry shows timestamp, the note text, and a "Note" label — not a diff | Must Have |
| S-05 | Notes are included in JSON export and re-imported intact | Exporting and re-importing preserves all notes with their original timestamps | Should Have |

### 5.6 Data & Storage

| ID | Requirement | Acceptance Criterion | Priority |
|---|---|---|---|
| D-01 | All data is stored locally in the browser (localStorage) — no network requests, no backend | Network tab shows zero outbound requests during normal use | Must Have |
| D-02 | Data persists across browser sessions and page refreshes | All Q&A entries, version history, overlay position, and collapse state survive a hard refresh | Must Have |
| D-03 | Exported JSON is human-readable and re-importable | File can be opened in a text editor and manually edited; re-importing restores all data correctly | Must Have |
| D-04 | App ships with one seed Q&A example so the UI is not empty on first launch | On first launch: seed entry is pre-loaded, app opens in Live Mode, the mode toggle is the only path to Prep Mode, and no Debrief is triggered on the first Prep toggle since no session has occurred. Seed data can be deleted by the user. | Should Have |

---

## 6. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NF-02 | The overlay should render above the video call window in z-order on macOS. This is managed by the user positioning the browser window on top of the video call application — the app does not enforce z-order at the OS level. |
| NF-03 | The app must function with no internet connection after initial load |
| NF-04 | The app must load and be interactive in under 2 seconds on a modern laptop |
| NF-05 | The full question list for a ≤40-entry bank must be scannable in under 5 seconds |
| NF-06 | The app must work in the current version of Google Chrome on macOS. Safari and Firefox are out of scope for v1.0. |
| NF-07 | When localStorage usage exceeds ~80% of the browser's storage limit, a persistent warning banner is shown — visual spec: UI_SPEC.md §13. New entries and saves remain allowed. |
| NF-08 | If a localStorage write throws a `QuotaExceededError` (storage full), the app catches the error, blocks the failed write, preserves the last successfully saved state in memory, and displays a blocking error message: "Save failed: storage is full." The user must export their deck to free space before saving again. |
| NF-09 | While in Live Mode with ≥1 question visited, the app intercepts the browser's `beforeunload` event to show a native "Leave site?" confirmation dialog, preventing accidental tab close without going through the Debrief screen. If no questions have been visited in the current session, tab close proceeds silently. |
| NF-10 | If the app is open in multiple browser tabs simultaneously, a write in one tab is automatically reflected in all other open tabs — no user action required and no data is silently overwritten by a tab holding stale state. |

---

## 7. Out of Scope (v1.0)

| Feature | Note |
|---|---|
| Multiple named interview decks | Deferred to v1.1 |
| Category answer templates ("Use template" dropdown) | Deferred to v1.1 |
| Markdown / rich text in answers | Deferred to v1.1 |
| Cloud sync or cross-device access | Deferred to v1.2 |
| AI-generated answer suggestions | Out of scope indefinitely per user intent |
| Mobile or tablet support | Deferred to v1.2 |
| Practice / flashcard mode | Deferred to v1.1 |
| Version history diff view (V-04) | Deferred to v1.1 |
| Pre-interview readiness check (deck completeness summary, overlay position test) | Deferred to v1.1 |
| Usage analytics | Out of scope indefinitely |

---

## 8. Success Criteria

The MVP is considered successful if:
1. A user can complete the full Prep → Live workflow without encountering data loss or UI errors
2. The Live Mode overlay scan-to-answer retrieval takes under 5 seconds for a typical Q&A bank (≤40 entries)
3. The overlay does not visually dominate the screen during a video call on a standard 13" or 15" laptop
4. All data (including version history) survives a browser refresh and can be exported and re-imported successfully
5. A user can open version history for any answer and restore a prior version in under 10 seconds without leaving Prep Mode
6. After 5 consecutive saves to the same answer, all 5 versions are retrievable with correct timestamps
7. The overlay does not produce any audible or visible signal to the interviewer during Live Mode use
