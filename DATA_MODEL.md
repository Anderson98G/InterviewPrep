# Data Model
## PM Interview Prep

**Version:** 1.0
**Date:** 2026-04-21
**Status:** Approved

---

## Core Types

```typescript
type Category =
  | "Product sense"
  | "Leadership"
  | "Strategy"
  | "Estimation"
  | "Execution"
  | "Hiring"
  | "Team management";

type HistoryItemType = "version" | "note";
```

---

## Object Definitions

```typescript
type AnswerVersion = {
  id: string;
  type: "version";          // Discriminant for unified history panel rendering
  prose: string;            // Full answer text
  anchor?: string;          // Optional — newline-separated anchor phrases; absent if not set
  createdAt: string;        // ISO 8601 — when this version was saved
  isActive: boolean;        // Exactly one version per entry is true at any time
  restoredFrom?: string;    // UUID of the source version if created via restore
};

type Note = {
  id: string;
  type: "note";         // Discriminant for unified history panel rendering
  text: string;         // Free-form reflection text
  sessionId: string;    // Links note to the debrief session that created it
  createdAt: string;    // ISO 8601
};

type Entry = {
  id: string;
  question: string;           // Required — full question text
  category: Category;
  order: number;              // Float — sort position within category; allows cheap reorder
  versions: AnswerVersion[];  // Max 20; oldest non-active version discarded at cap
  notes: Note[];              // Unbounded; not subject to version cap
  createdAt: string;          // ISO 8601
  lastEditedAt: string;       // Cached on every version save; shown as "Last Edited" on card
};

type SessionVisit = {
  entryId: string;    // FK → Entry.id
  visitedAt: string;  // ISO 8601 — first click timestamp within session
};

type Session = {
  id: string;
  startedAt: string;      // ISO 8601 — when Live Mode was entered
  endedAt?: string;       // ISO 8601 — set on exit; absent means session is active
  visits: SessionVisit[]; // Ordered list of visited entries
};

type UIState = {
  mode: "prep" | "live";
  overlayPosition: { x: number; y: number } | null;
  overlaySize: { width: number; height: number } | null; // Default: { width: 600, height: 400 }
  collapsedCategories: Category[];      // Categories collapsed in Live Mode
  activeCategoryFilter: Category | null; // Prep Mode sidebar selection
};

type AppData = {
  schemaVersion: number;  // Integer — enables future migrations
  entries: Entry[];
  sessions: Session[];
  ui: UIState;
};
```

---

## localStorage Structure

```
localStorage["interviewprep_data"] = AppData (JSON-serialized)
```

Single key, single root object. All reads and writes operate on the full blob.

---

## Relationships

```
AppData
  └── entries: Entry[]
        ├── versions: AnswerVersion[]   (1:many, max 20)
        │     └── anchor: string        (1:1, plain text owned by version)
        └── notes: Note[]               (1:many, unbounded)
              └── sessionId → Session.id

AppData
  └── sessions: Session[]
        └── visits: SessionVisit[]
              └── entryId → Entry.id
```

Notes reference sessions by ID; sessions reference entries by ID. No bidirectional pointers — joins are done in application logic.

---

## Concrete Example

A single entry with 2 answer versions, 3 anchors on the active version, and 1 post-interview note, inside a completed session.

```json
{
  "schemaVersion": 1,
  "entries": [
    {
      "id": "e1a2b3c4-0001-0001-0001-000000000001",
      "question": "Tell me about a time you had to kill a feature your team loved.",
      "category": "Leadership",
      "order": 1.0,
      "createdAt": "2026-04-10T09:00:00.000Z",
      "lastEditedAt": "2026-04-18T14:32:00.000Z",
      "versions": [
        {
          "id": "v1a2b3c4-0001-0001-0001-000000000001",
          "type": "version",
          "prose": "At Acme, my team had spent 6 weeks on a collaborative whiteboard feature. Usage data from beta showed median session length under 40 seconds — nobody was actually collaborating. I brought the data to the team, acknowledged the sunk cost openly, and we sunset it. Redirected the eng capacity to async commenting, which became our #2 retention driver.",
          "createdAt": "2026-04-10T09:00:00.000Z",
          "isActive": false
        },
        {
          "id": "v1a2b3c4-0002-0002-0002-000000000002",
          "type": "version",
          "prose": "At Acme, my team had spent 6 weeks building a collaborative whiteboard. Beta telemetry showed median session length under 40 seconds — a clear signal of no real collaboration. I called a team meeting, walked through the data without editorializing, and named the decision explicitly: we're killing it. We redirected to async commenting. Within two quarters it was our #2 retention driver. The lesson I took: protecting team morale means being honest early, not protecting the feature.",
          "anchor": "Data signal (40s median session)\nNamed the decision explicitly\nOutcome: #2 retention driver",
          "createdAt": "2026-04-18T14:32:00.000Z",
          "isActive": true
        }
      ],
      "notes": [
        {
          "id": "n1a2b3c4-0001-0001-0001-000000000001",
          "type": "note",
          "text": "Interviewer pushed back on 'how did the team take it' — I fumbled. Next time: add a sentence about the engineer who led the feature and how I gave him ownership of the replacement.",
          "sessionId": "s1a2b3c4-0001-0001-0001-000000000001",
          "createdAt": "2026-04-19T11:05:00.000Z"
        }
      ]
    }
  ],
  "sessions": [
    {
      "id": "s1a2b3c4-0001-0001-0001-000000000001",
      "startedAt": "2026-04-19T10:30:00.000Z",
      "endedAt": "2026-04-19T11:00:00.000Z",
      "visits": [
        {
          "entryId": "e1a2b3c4-0001-0001-0001-000000000001",
          "visitedAt": "2026-04-19T10:34:17.000Z"
        }
      ]
    }
  ],
  "ui": {
    "mode": "prep",
    "overlayPosition": { "x": 1420, "y": 80 },
    "overlaySize": { "width": 600, "height": 400 },
    "collapsedCategories": ["Estimation", "Hiring"],
    "activeCategoryFilter": "Leadership"
  }
}
```

---

## Design Decisions and Tradeoffs

**`anchor` is an optional plain string on `AnswerVersion`, not a separate object or array**
Anchors are not required — the field is absent on versions where the user left the Anchors field empty. When present, it is a newline-separated string of phrases. Restoring an old version restores both the prose and its anchor text together as one coherent snapshot. Keeping it as a plain string avoids unnecessary object complexity for what is essentially a short text block. Every explicit Save creates a new version regardless of whether prose, anchors, or both changed — anchor edits are versioned with the same weight as prose edits.

**`lastEditedAt` is cached on `Entry`, not derived at read time**
Live Mode renders up to 40 cards simultaneously. Computing `max(versions.map(v => v.createdAt))` on every render is unnecessary churn. Write it on save, read it cheaply.

**`order` is a float, not an integer**
Drag-to-reorder with integers requires renumbering the full list on every move. Floats (e.g., insert between 1.0 and 2.0 → 1.5) allow O(1) single-item updates. Renormalize to integers only if precision loss becomes an issue after many operations.

**Version cap discards oldest non-active version**
The active version is always preserved. Silently discarding the user's current answer to enforce the 20-cap would be a data loss bug. The cap applies only to inactive history entries.

**Notes and AnswerVersions share a `type` discriminant but live in separate arrays**
The history panel renders a single sorted `(AnswerVersion | Note)[]` array without branching on structural shape. Keeping them in separate arrays on `Entry` ensures notes are never caught by the version cap logic.

**Sessions are capped at 50 and append-only**
The `sessions` array retains only the 50 most recent sessions. When a new session is created and the array already contains 50 entries, the oldest session is silently pruned before the new one is appended. Export includes all sessions at time of export. On import, sessions receive the same UUID-conflict resolution as entries (new UUID assigned). This preserves the integrity of `Note.sessionId → Session.id` linkages post-import.

**`activeCategoryFilter` stays active when its category is emptied**
When the user deletes the last entry in the currently filtered category, the filter remains active and the Prep Mode sidebar shows an empty state: "No entries in [Category]" with a single "Show All" button. The filter only resets to `null` when the user explicitly clicks "Show All." This preserves predictability — UI state only changes when the user changes it.

**Single top-level localStorage key**
Granular keys (one per entry) would allow partial writes but complicate atomic reads and export. At the estimated 2–3 MB ceiling, a single serialized blob stays within browser limits and keeps the read/write contract simple. The `schemaVersion` field enables a future migration to IndexedDB without changing the schema shape.
