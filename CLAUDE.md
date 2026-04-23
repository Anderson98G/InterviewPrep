# PM Interview Prep — Project Context

## What This Is
A personal web app for a Director of Product candidate to use during live Zoom interviews. It has two modes:
- **Prep Mode** — Full-page editor to author and organize Q&A entries before an interview
- **Live Mode** — Compact floating overlay used during the interview to browse prepared questions and retrieve answers discreetly

The user browses and clicks only in Live Mode — no typing (keyboard sounds are audible on Zoom calls).

---

## Key Documents
All planning artifacts are in the project root. Read these before making any changes:

| File | Purpose |
|---|---|
| `PRD.md` | Full product requirements — source of truth for features, workflows, and acceptance criteria |
| `DATA_MODEL.md` | Complete object schema, TypeScript type definitions, relationships, and a concrete JSON example |
| `UI_SPEC.md` | Full UI specification — colors, typography, spacing, component specs, interaction states |
| `SYSTEM_DESIGN.md` | Architecture, boot sequence, state management, algorithms, and component contracts |

---

## Current Status
- PRD: approved
- Data model: approved
- UI spec: approved
- System design: **in review** (pending approval)
- **Next step:** Get system design approved, then begin implementation

---

## Tech Stack
- **Framework:** React 18
- **State management:** Zustand
- **Styling:** Tailwind CSS v4.1 — CSS-first config via `@theme` block; uses `@tailwindcss/vite` plugin (no `tailwind.config.js` or `postcss.config.js`)
- **Build tool:** Vite
- **Drag-and-drop:** `@dnd-kit/sortable` + `@dnd-kit/core` — within-category reorder in Prep Mode only
- **Overlay:** `react-rnd` — draggable + resizable Live Mode overlay
- **Storage:** localStorage only — no backend, no auth, no network requests
- **Platform:** macOS only for v1.0
- **UUIDs:** `crypto.randomUUID()` — never use `Math.random()`-based UUIDs

> Tailwind v4.1 uses CSS-first configuration — no `tailwind.config.js`. Design tokens are declared as CSS custom properties in an `@theme` block in `src/index.css`. See `UI_SPEC.md §14` for the full token block.

---

## Product Principles
These guide every implementation decision. Details in `PRD.md §1`.

1. **Speed over completeness** — answer retrieval in Live Mode must take under 5 seconds
2. **Browse, don't type** — no keyboard input in Live Mode; click and scroll only
3. **Discretion is non-negotiable** — no animations, no sounds, dark compact overlay
4. **Retrieval, not generation** — surfaces what the user wrote; never generates content
5. **Answers evolve — history is a feature** — version history is first-class, not just undo
6. **Mode separation is semantic** — Prep Mode and Live Mode are distinct phases of the user's experience (preparing vs. performing). Never blur the boundary between modes. Editing the entries is disabled in Live Mode without exception.
7. **Simplicity at the data layer** — prefer plain strings and floats over structured objects
8. **Personal tool — no collaboration** — single user, single device, no sync
9. **Never lose user data that matters** — active version always preserved; quota errors block the write and surface a message

---

## Data Model Summary
Everything stored under `localStorage["interviewprep_data"]` as a single JSON blob.

```
AppData
  ├── schemaVersion: number
  ├── entries: Entry[]          ← core unit; one question + its history
  │     ├── versions: AnswerVersion[]   (max 20; oldest non-active discarded)
  │     │     └── anchor?: string       (optional newline-separated phrases)
  │     └── notes: Note[]               (unbounded; post-interview reflections)
  ├── sessions: Session[]        ← one Live Mode entry→exit cycle
  │     └── visits: SessionVisit[]
  └── ui: UIState                ← persisted overlay position, collapsed categories, mode
```

See `DATA_MODEL.md` for full type definitions and a concrete JSON example.

---

## Critical Design Decisions

**Modes:** Default on open is Live Mode. A persistent toggle switches bidirectionally. Toggling Live→Prep with ≥1 visited question intercepts with a Debrief screen before completing.

**Color system:** Prep Mode = green accents. Live Mode = amber accents. These are the primary visual signal for which mode the user is in — do not use green or amber for any other purpose. See `UI_SPEC.md §1` for exact values.

**Live Mode is a floating overlay** — fixed position, draggable by header, resizable via `react-rnd`. Editing is disabled in Live Mode without exception.

**Categories (7):** Product sense, Leadership, Strategy, Estimation, Execution, Hiring, Team management

**Anchors** — `anchor?: string` on each `AnswerVersion` (newline-separated phrases). Versioned with the answer. Rendered prominently at the top of Answer View in Live Mode.

**Inline editing** — Prep Mode only. Explicit Save/Discard buttons; changes committed to localStorage only on explicit Save. Esc reverts.

**Version history** — Capped at 20 per entry; oldest non-active version discarded. Notes are separate from versions and are not subject to the cap.

**Session tracking** — Visited state resets on each new Live Mode session. Orphaned sessions (no `endedAt`) are closed silently on boot.

**Import** — Always merges, never replaces. ID conflicts resolved by assigning a new UUID automatically.

**order field is a float** — Enables O(1) drag-to-reorder. Normalized when gap between adjacent entries falls below 0.001.

---

## File Structure
```
interview-prep/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── store/
    │   ├── useQAStore.js              ← Zustand store: all state + localStorage sync
    │   ├── useSessionManager.js       ← session lifecycle + beforeunload handler
    │   └── defaultData.js             ← seed Q&A entry
    ├── components/
    │   ├── prep/
    │   │   ├── PrepMode.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── QuestionList.jsx
    │   │   ├── QuestionCard.jsx
    │   │   └── AddQuestionForm.jsx
    │   ├── live/
    │   │   ├── LiveOverlay.jsx
    │   │   ├── CategoryJumpStrip.jsx
    │   │   ├── QuestionIndex.jsx
    │   │   ├── CategoryGroup.jsx
    │   │   ├── QuestionRow.jsx
    │   │   ├── AnswerView.jsx
    │   │   └── DebriefScreen.jsx
    │   └── shared/
    │       └── ConfirmDialog.jsx
    └── utils/
        ├── storage.js                 ← getFromStorage(), saveToStorage(), quota check
        ├── migrations.js              ← schema migration runner
        ├── categories.js              ← CATEGORY_LIST constant
        ├── versionUtils.js            ← version cap, restore logic, order normalization
        └── importExport.js            ← JSON serialization + UUID conflict resolution
```

---

## Out of Scope for v1.0
Search/filter in Live Mode, multiple decks, rich text, cloud sync, AI suggestions, mobile support, flashcard mode, version diff view.
