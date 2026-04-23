# UI Specification
## PM Interview Prep

**Version:** 1.0
**Date:** 2026-04-21
**Status:** Design Reference

---

## 1. Color System

### 1.1 Prep Mode
Prep Mode uses a green accent system to signal the preparation phase.

| Element | Color | Hex | Usage |
|---|---|---|---|
| Primary Accent | Green | `#16A34A` | Mode toggle active state, primary buttons, active card borders, focus rings |
| Highlight Accent | Light Green | `#4ADE80` | Interactive element highlights, hover states |
| Background | White | `#ffffff` | Main working area background |
| Text | Dark Gray | `#1a1a1a` | Primary text |
| Border | Light Gray | `#e5e7eb` | Card borders, dividers |
| Hover Background | Light Green | `#dcfce7` | Card and row hover tint |
| Success Banner | Light Green | `#dcfce7` | Import/export success feedback |

**Rule:** All interactive elements in Prep Mode use green tones. No amber appears in Prep Mode.

### 1.2 Live Mode
Live Mode uses an amber accent system to signal the performance phase.

| Element | Color | Hex | Usage |
|---|---|---|---|
| Primary Accent | Amber | `#D97706` | Mode toggle active state, category headers, interactive borders, focus rings |
| Highlight Accent | Light Amber | `#F59E0B` | Interactive element highlights, hover states |
| Background | Dark Gray | `#1a1a1a` | Overlay background — fully opaque |
| Text | Off-white | `#e8e8e8` | Primary text — minimum 14px questions, 15px answers |
| Header Background | Near-black | `#0f0f0f` | Overlay header and subtle hover backgrounds |
| Border | Dark Gray | `#4b5563` | Category pill borders, dividers |

**Rule:** All interactive elements in Live Mode use amber tones. No green appears in Live Mode.

**Contrast:** Off-white (`#e8e8e8`) on dark (`#1a1a1a`) = 16:1 — exceeds WCAG AAA.

### 1.3 Debrief Screen
The post-interview debrief uses a distinct background that signals the mode transition.

| Element | Color | Hex | Usage |
|---|---|---|---|
| Background | Transitional Gray | `#252525` | Full-screen background |
| Focus Rings & Accents | Amber | `#D97706` | Interactive elements |
| Text | Off-white | `#e8e8e8` | Primary text |
| Note Field Background | Dark Gray | `#1a1a1a` | Textarea background |
| Note Field Border | Dark Gray | `#404040` | Default textarea border |

### 1.4 Semantic Colors (All Modes)

**Note:** These colors are mode-agnostic semantic overrides. They supersede the Prep/Live mode color rules and appear in both modes regardless of the active mode accent color. Do not change `WARNING_BG` to green in Prep Mode or to amber in Live Mode — it is always amber-family as a warning signal.

| Purpose | Color | Hex |
|---|---|---|
| Error | Red | `#dc2626` |
| Error Background | Light Red | `#fee2e2` |
| Warning Background | Light Amber | `#fef3c7` |
| Success Background | Light Green | `#dcfce7` |
| Disabled Text | Gray | `#9ca3af` |

---

## 2. Typography

### 2.1 Prep Mode

| Element | Size | Weight | Line Height |
|---|---|---|---|
| Question title | 16px | 600 | 1.5 |
| Answer body | 15px | 400 | 1.6 |
| Anchor field text | 14px | 400 | 1.5 |
| Button text | 14px | 500 | 1.4 |
| Card labels ("Last Edited", category) | 13px | 500 | 1.4 |
| Character / word counters | 12px | 400 | 1.4 |

### 2.2 Live Mode

| Element | Size | Weight | Line Height |
|---|---|---|---|
| Question rows | ≥14px | 500 | 1.5 |
| Answer body | 15px | 400 | 1.6 |
| Anchor outline | 14px | 600 | 1.5 |
| Category group headers | 13px | 600 | 1.4 |
| Category jump strip pills | 11px | 500 | 1.4 |
| Timestamps | 12px | 400 | 1.4 |

### 2.3 Debrief Screen

| Element | Size | Weight | Line Height |
|---|---|---|---|
| "Interview Debrief" title | 18px | 600 | 1.4 |
| Visited question text | 15px | 500 | 1.5 |
| Note field placeholder | 14px | 400 | 1.4 |
| Note field input text | 14px | 400 | 1.4 |
| Button labels | 14px | 500 | 1.4 |

### 2.4 Font Stack
All text: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

---

## 3. Spacing System

8px base grid. All spacing values are multiples of 4px.

| Token | Value | Usage |
|---|---|---|
| `SPACE_XS` | 4px | Icon gaps, tight element spacing |
| `SPACE_SM` | 8px | Button gaps, list item padding |
| `SPACE_MD` | 12px | Card internal padding, field margins |
| `SPACE_LG` | 16px | Section padding, container edges |
| `SPACE_XL` | 20px | Overlay screen-edge margin |
| `SPACE_2XL` | 24px | Major section gaps |
| `SPACE_3XL` | 32px | Debrief column gap |

---

## 4. Component Specifications

### 4.1 Prep Mode Layout

#### Overall Structure
- Left sidebar: 200–250px wide, scrollable category list, fixed position
- Main content area: flexible, fills remaining width
- Mode toggle: fixed top-right, always visible above content

#### Question Cards
- Width: 100% of content area
- Internal padding: 12px
- Border: 1px `#e5e7eb`, border-radius 4px
- Hover: background `#dcfce7`, border brightens to `#4ADE80`
- Active/selected: 2px border `#16A34A`, white background
- Inline editor active state: textarea expands to ≥200px height, Save/Discard buttons appear below

#### Category Sidebar
- Width: 200–250px
- Background: `#f3f4f6`
- Item height: 44px, padding 12px vertical / 16px horizontal
- Active item: background `#dcfce7`, bold text, green left border 2px
- Font: 14px
- Scrollable: yes

#### Import/Export Controls
- Position: bottom of sidebar
- Button height: 40px, full sidebar width
- Font: 13px
- Gap between buttons: 8px
- Success banner: green background `#dcfce7`, green text `#16A34A`, auto-dismisses after 5 seconds

### 4.1.1 Add Question Form

#### Trigger
- "Add Question" button at the bottom of the main content area, full width of the content column, 44px tall, green `#16A34A` background, white text, 14px 500 weight, border-radius 4px
- Also serves as the "Create First Question" CTA in the §6.1 empty state
- Button is hidden while the form is open — one instance at a time

#### Layout
- Renders inline at the bottom of the question card list, below all existing cards
- Not a modal — sidebar and existing cards remain fully visible and scrollable
- Background: `#ffffff`; border: 1px `#e5e7eb`; border-radius: 4px; padding: 16px
- Width: 100% of content area (matches QuestionCard width)
- Scrolls into view automatically on open (200ms smooth)

#### Field Order
1. Question (required)
2. Category (required)
3. Answer (optional)
4. Anchor phrases (optional)

#### Required Field Indicators
- Red asterisk (`*`) in `#dc2626` follows the field label inline, 13px
- Labels: "Question *", "Category *", "Answer", "Anchor phrases"
- Label font: 13px, 500 weight, `#1a1a1a`, margin-bottom 4px
- Vertical gap between fields: 16px

#### Field Specifications
- **Question:** per §9.1 — single-line expandable, character counter below
- **Category:** per §9.4 — dropdown, default option "Select a category" (disabled, not selectable), 7 predefined options in §4.3 order
- **Answer:** per §9.2 — textarea, min 200px, word count below
- **Anchor phrases:** per §9.3 — textarea, min 120px

#### Button Placement and Behavior
- Right-aligned below Anchor phrases field, horizontal row, gap 8px
- Order (left to right): "Discard" → "Add Question"
- **"Add Question":** green `#16A34A`, white text, 14px 500 weight, min 44px height; disabled (50% opacity, `cursor: not-allowed`) until Question and Category are non-empty; hover `#4ADE80`; pressed `#15803d`
- **"Discard":** `#e5e7eb` background, `#1a1a1a` text, same sizing; always enabled; Esc triggers Discard from anywhere in the form
- Keyboard: Ctrl+S / Cmd+S submits the form

#### Error States
- Validation fires on "Add Question" click only — no live validation while typing
- Error message renders inline, directly below the offending field; `#dc2626`, 13px, 500 weight
- Persists until corrected; clears on next valid submit attempt

| Field | Condition | Message |
|---|---|---|
| Question | Empty on submit | "Question is required" |
| Category | None selected on submit | "Select a category" |

#### Post-Submit Behavior
- Form closes; content area scrolls to new card in its category group (200ms smooth); card fades in (150ms)
- New card appended to bottom of its category group; `order` = last entry in that category + 1.0
- On Discard (button or Esc): form closes immediately, no confirmation, no scroll change

---

### 4.2 Live Mode Overlay

#### Container
- Library: `react-rnd` (combined drag + resize)
- Default position: bottom-right, 20px from screen edges
- Default dimensions: 600px wide × 400px tall
- Minimum size: none (user may resize to any dimensions)
- Z-order: managed by the user — position the browser window above the video call application at the OS level
- Position clamping: on every Live Mode open, saved `overlayPosition` is validated against `window.innerWidth` / `window.innerHeight`; if fully outside the viewport, position resets to default
- Background: `#1a1a1a` (fully opaque)
- Border: 1px `#D97706`
- Border-radius: 8px

#### Overlay Header Bar
- Height: 44px
- Background: `#0f0f0f`
- Cursor: grab (drag affordance)
- Left: mode toggle (80px wide — full §7 component)
- Center: app name, 13px bold, off-white
- Right: minimize button, 32×32px touch target

#### Minimize Pill
- Dimensions: 200×28px (visual); touch target ≥32px centered on restore icon
- Background: `#1a1a1a`, border 1px `#D97706`
- Content: app name (left) + restore chevron icon (right)
- Position: same as last full-overlay position
- Transition: ≤80ms

#### Category Jump Strip (see §4.3)
- Position: directly below header, sticky
- Height: 36px
- Border-bottom: 1px `#D97706`

#### Question Index
- Fills remaining overlay height, vertically scrollable
- Padding: 12px
- Scroll position preserved when entering/leaving Answer View

#### Visited State
- A question is automatically marked visited when the user opens its Answer View
- Visited state is session-scoped: resets at the start of each new Live Mode session
- No manual toggle — no UI element required on the question row

#### Category Group Headers (Live Mode collapse affordance)
- Each category section in the Question Index has a sticky header row
- Height: 28px; background: `#0f0f0f`; font: 11px, 600 weight, uppercase, `#9ca3af`
- Right side: chevron icon (›) — rotated 90° (pointing down) when expanded, 0° (pointing right) when collapsed
- Clicking anywhere on the header row toggles collapsed/expanded state for that category
- Collapsed state: header row remains visible; entry rows are hidden (height 0, no scroll space occupied)
- When a category group is collapsed and its jump strip pill is clicked, the group auto-expands before scrolling
- Collapsed state is persisted in `ui.collapsedCategories` (Live Mode only — Prep Mode has no collapse affordance)
- All categories start expanded on first launch; collapse state persists across sessions

### 4.3 Category Jump Strip

#### 7 Pill Buttons

| Full Name | Pill Label |
|---|---|
| Product sense | Prod |
| Leadership | Lead |
| Strategy | Strat |
| Estimation | Est |
| Execution | Exec |
| Hiring | Hire |
| Team management | Team |

#### Pill Styling
- Width: ~50px (flexible), height: 28px
- Padding: 8px horizontal, 4px vertical
- Font: 11px, 500 weight, uppercase
- Default: transparent background, 1px `#4b5563` border, off-white text
- Hover: amber border, `#0f0f0f` background tint
- Active (section in view): `#D97706` border and text, `#0f0f0f` background
- Disabled (category has no entries): opacity 40%, `pointer-events: none` — no hover, no click response; pill shape and position in the strip are preserved so the layout never shifts
- On click: instant scroll to category group; if target group is collapsed, auto-expand before scrolling
- Does not collapse/expand categories — scroll only
- Disabled state is derived live from the entry count per category in the store — activates automatically when the first entry is added to an empty category

### 4.4 Answer View (Live Mode)

#### Container
- Full overlay dimensions, same background as question list
- Internal padding: 12px

#### Header
- Height: 40px
- Left: "← Back" button (amber, 14px, ≥32×32px touch target)
- Center: question text (≥14px, 500 weight, truncated if needed)

#### Anchor Outline Section
- Shown only if the active version has an `anchor` value
- Background: `#0f0f0f`, padding 12px, margin-bottom 12px
- Font: 14px, 600 weight, amber `#D97706`
- Each phrase on its own line
- Max height: 120px; overflow-y: scroll beyond that

#### Answer Body
- Font: 15px, 400 weight, `#e8e8e8`, line-height 1.6
- Padding: 12px
- Vertically scrollable
- Full-width word wrap, no horizontal scroll

#### Back Button Behavior
- Returns to exact pixel scroll position in question list (stored on entry to Answer View)

### 4.5 Debrief Screen

#### Full-Screen Container
- Fills 100vw × 100vh
- Background: `#252525`
- Z-order: above all content

#### Header (64px)
- Left: "← Back" button — 14px, `#e8e8e8`, transparent background; hover `#3a3a3a`; focus ring amber 2px
  - If any note field has text: shows confirmation dialog before returning to Live Mode
  - Confirmation: "You have unsaved notes. Return to Live Mode?" → Keep editing / Discard notes
- Center: "Interview Debrief" — 18px, 600 weight, `#e8e8e8`
- Right: "Skip" button — 14px, `#e8e8e8`, transparent; hover `#3a3a3a`
  - Silently ends session, sets `session.endedAt`, navigates to Prep Mode
- Bottom border: 1px `#3a3a3a`

#### Body (scrollable, fills between header and footer)
- Padding: 32px
- Two-column flex layout:
  - Left (35%): visited questions, 15px / 500 weight, ordered by first `visitedAt`
  - Right (65%): one note textarea per question
  - Column gap: 32px
- Both columns scroll as a single unit

#### Note Textarea
- Background: `#1a1a1a`, border 1px `#404040`, border-radius 4px, padding 12px
- Focus border: amber `#D97706`, 2px
- Font: 14px, `#e8e8e8`, line-height 1.5
- Min height: 64px, max height: 200px (internal scroll beyond that)
- Placeholder: "Add a reflection (optional)" in gray
- No character limit enforced; no auto-save
- Margin below each textarea: 24px

#### Empty State (no questions visited)
- Per S-06, debrief screen is not shown — toggle silently to Prep Mode

#### Footer (64px)
- Background: `#2a2a2a`, top border 1px `#3a3a3a`
- "Save & End Session" button centered
  - Dimensions: 200px wide × 40px tall
  - Background: amber `#D97706`, text `#1a1a1a` (dark on amber), 14px 600 weight
  - Hover: `#F59E0B`; active: `#B45309`; focus ring: 2px `#e8e8e8`
  - **Disabled** (grayed, `cursor: not-allowed`) until ≥1 note field contains text
  - On click: creates Note objects for non-empty fields only, sets `session.endedAt`, writes localStorage, navigates to Prep Mode

---

## 5. Interaction States

### 5.1 Focus Rings
- Style: 2px solid outline, 2px offset
- Prep Mode: `#16A34A`
- Live Mode: `#D97706`
- Debrief: `#D97706`
- Always visible — never `outline: none`
- Border-radius matches element + 2px

**Implementation note (v4.1):** Tailwind v4.1 resolves previous Safari and Firefox rendering inconsistencies with `ring` utilities. Use `ring-2 ring-offset-2 ring-[#16A34A]` (Prep) and `ring-2 ring-offset-2 ring-[#D97706]` (Live) — these are now safe across all target browsers (Chrome, Safari, Firefox, current macOS versions).

### 5.2 Hover States

**Prep Mode:**
- Cards / rows: background tint `#dcfce7`
- Buttons: brighten to `#4ADE80`

**Live Mode:**
- Question rows / category headers: background tint `#0f0f0f`
- Category pills: amber border + `#0f0f0f` background
- Buttons: brighten to `#F59E0B`

### 5.3 Active / Pressed States

**Prep Mode:**
- Active card: 2px `#16A34A` border, white background
- Active sidebar category: `#dcfce7` background, bold text
- Button pressed: darken to `#15803d`

**Live Mode:**
- Question row being viewed: 2px amber left border
- Active pill: amber border + text + `#0f0f0f` background
- Button pressed: darken to `#b45309`

### 5.4 Disabled States
- Opacity: 50%
- Text color: `#9ca3af`
- Cursor: `not-allowed`
- Applies to: Save button (inline editor when no changes), "Save & End Session" (before first note), file import button (during import)

### 5.5 Drag States (Prep Mode Reorder)
- Dragged item: 60% opacity, box-shadow `0 10px 20px rgba(0,0,0,0.2)` (use `shadow-xl` or a custom `@theme --shadow-*` token in v4.1), z-index raised
- Drop zone: 2px dashed `#16A34A` border, `#dcfce7` background tint
- Settle animation: 100ms
- Drag is constrained to within-category only; dragging across a category boundary snaps the card back to its origin position with no visual feedback for the invalid drop zone

### 5.6 Inline Editor (Prep Mode)
- Inactive: card in read-only display mode
- Active: textarea expands (≥200px), Save + Discard buttons visible below
- Esc: discard, return to display mode
- Ctrl+S / Cmd+S: save (same as Save button)
- Save button disabled if no changes from last saved value

### 5.7 Transition Timing
| Transition | Duration |
|---|---|
| Fade in/out | 150ms |
| Scroll to position | 200ms smooth |
| Modal open/close | 200ms |
| Minimize / restore overlay | ≤80ms |
| Button press color | 100ms |
| Drag settle | 100ms |

---

## 6. Empty States

### 6.1 Prep Mode — No Entries
- Icon: clipboard or similar, 48px
- Heading: "No questions prepared yet" (18px bold)
- Subtext: "Create your first Q&A entry to get started" (14px gray)
- CTA button: "Create First Question" (green primary button)

### 6.2 Live Mode — No Entries
- Shown inside overlay body
- Message: "No questions prepared" (16px, centered)
- Subtext: "Switch to Prep Mode to add questions" (14px gray)
- Category jump strip: still visible at top
- Button: "Go to Prep Mode" (amber)

### 6.3 Prep Mode — Category Filter Has No Entries
- Text: "No entries in [Category Name]" (14px)
- Button: "Show All" (green secondary button) — resets `activeCategoryFilter` to null
- Filter stays active until the user explicitly clicks "Show All" — never auto-resets

### 6.4 Version History — No Prior Versions
- Text: "Only the current version exists" (13px gray)
- Hint: "Save changes to create a new version" (12px)

---

## 7. Mode Toggle Component

- Position: fixed top-right, always visible in both modes
- Dimensions: 80px wide × 36px tall
- Style: pill-shaped, two labeled segments ("Prep" | "Live")
- Active segment: solid background (green in Prep, amber in Live), white text, 12px 500 weight
- Inactive segment: light gray background, dark gray text
- Role: `role="switch"` with `aria-checked`
- Disabled while debrief screen is open

---

### 7.1 Mode Transition Behavior

| Transition | Behavior |
|---|---|
| Prep → Live | Overlay appears at saved position and size (or default if none saved); new Session object is created; visited state is clean |
| Live → Prep (0 visits) | Toggle completes silently; no Session record is written |
| Live → Prep (≥1 visit) | Debrief screen interposes before completing the transition; mode toggle is disabled while Debrief is open |

---

## 8. Version History Panel

### 8.0 Trigger
- "History" icon button positioned at the top-right of each question card
- Touch target: 32×32px; icon size: 20×20px centered
- `aria-label`: "View version history"
- Panel slides in from the right, overlapping the card list — card list width does not contract


- Width: 300–350px
- Background: `#f3f4f6`
- Left border: 2px `#16A34A`
- Header: "Version History" (16px bold) + close (X) button right-aligned
- List: reverse chronological, newest first, scrollable

#### Version Entry
- Timestamp: "Apr 20, 2026 at 3:42 PM" (12px gray)
- Preview: first 40 characters of prose, truncated with "…" (13px)
- Label: "Version" tag — small, green background
- Restore button: appears on hover, green, ≥32px wide
- On restore: confirmation dialog → "Restore this version?" → Yes / Cancel
- If the version has a `restoredFrom` field: show a plain-text annotation below the preview (no link)
  - Source version still in history → `"Restored from version created [date]"` (12px gray)
  - Source version was pruned → `"Restored from a prior version (no longer in history)"` (12px gray)

#### Note Entry
- Timestamp: same format as version
- Text: full note or truncated at 100 characters
- Label: "Note" tag — small, `#f3f4f6` background, `#6b7280` text (visually distinct from green Version tag)
- No restore button — read-only

#### Diff View (V-04, Should Have)
- Two-column: left = prior version prose, right = current active prose
- Additions: green background highlight
- Deletions: red strikethrough

---

## 9. Input Fields

### 9.1 Question Field (Prep Mode)
- Type: single-line text input, expandable
- Height: 36px
- Padding: 8px
- Border: 1px `#e5e7eb`; focus: green `#16A34A`
- Font: 14px
- Placeholder: "Enter question"
- Character counter: 12px gray, right-aligned below field

### 9.2 Answer Field (Prep Mode)
- Type: textarea
- Min height: 200px, vertically resizable
- Padding: 8px
- Border: 1px `#e5e7eb`; focus: green `#16A34A`
- Font: 15px, 400 weight
- Placeholder: "Enter answer"
- Word count: 12px gray, right-aligned below field, updates on every keystroke; no color coding

### 9.3 Anchor Field (Prep Mode)
- Type: textarea
- Min height: 120px, vertically resizable
- Padding: 8px
- Border: 1px `#e5e7eb`; focus: green `#16A34A`
- Font: 14px
- Placeholder: "Enter anchor phrases, one per line"
- Format: newline-separated; each line = one anchor phrase
- Guidance: intended for 3–7 short phrases; long blocks will be clipped to 120px in Live Mode Answer View

### 9.4 Category Selector (Prep Mode)
- Type: dropdown
- Height: 36px, full width
- Options: 7 predefined categories only (no free-form)
- Border: 1px `#e5e7eb`; focus: green `#16A34A`
- Font: 14px

### 9.5 File Input (Import)
- Accepts: `.json` only
- Custom button ("Import deck") triggers hidden native file input
- Height: 44px
- Validation fires immediately on file select
- Error shown inline below input in red `#dc2626`

### 9.6 Save / Discard Buttons (Inline Editor)
- Height: 36px, font 13px 500 weight, gap 8px
- Save: green `#16A34A` background, white text; disabled if no changes; hover `#4ADE80`
- Discard: `#e5e7eb` background, dark text; always enabled; hover darkens; Esc triggers discard

### 9.7 Note Textarea (Debrief)
- Background: `#1a1a1a`, border 1px `#404040`, border-radius 4px, padding 12px
- Focus border: amber `#D97706`, 2px
- Font: 14px, `#e8e8e8`
- Min height: 64px, max height: 200px (internal scroll beyond)
- Placeholder: "Add a reflection (optional)" in gray
- No character limit; no auto-save

---

## 10. Buttons

### 10.1 Primary — Prep Mode
- Background: `#16A34A`; hover `#4ADE80`; pressed `#15803d`
- Text: white, 14px, 500 weight
- Padding: 10px horizontal, 8px vertical; min height 44px
- Border: none; border-radius: 4px

### 10.2 Primary — Live Mode
- Background: `#D97706`; hover `#F59E0B`; pressed `#b45309`
- Text: white, 14px, 500 weight
- Same sizing as above

### 10.3 Secondary (All Modes)
- Background: transparent or light gray
- Border: 1px matching text color
- Text: 14px, 500 weight (dark in Prep, off-white in Live)
- Examples: Discard, Cancel, Skip

### 10.4 Icon Buttons
- Touch target: min 32×32px
- Icon size: 20×20px centered
- Background: transparent; hover tint
- Color: green in Prep, amber in Live

### 10.5 Category Jump Strip Pills — see §4.3

---

## 11. Accessibility

### Focus Management
- Tab order: left-to-right, top-to-bottom logical order
- Dialogs: focus trapped within dialog while open
- On dialog close: focus returns to trigger element
- Focus always visible — no `outline: none`

### ARIA
- Mode toggle: `role="switch"`, `aria-checked`
- Live Mode category group headers (collapsible per PRD L-04): `aria-expanded`
- Dialogs: `role="dialog"`, `aria-labelledby`, `aria-describedby`
- Icon-only buttons: `aria-label`
- All inputs: associated `<label>` or `aria-label`

### Keyboard Shortcuts
| Key | Action |
|---|---|
| Esc | Discard inline edit / close panel / close dialog |
| Ctrl+S / Cmd+S | Save inline edit |
| Tab / Shift+Tab | Navigate focusable elements |
| Enter | Activate focused button |

### Color Contrast
| Pair | Ratio | WCAG |
|---|---|---|
| `#e8e8e8` on `#1a1a1a` | 16:1 | AAA ✓ |
| `#16A34A` on `#ffffff` | 4.5:1 | AA ✓ |
| `#1a1a1a` on `#D97706` | 8.3:1 | AA ✓ |

---

## 12. Validation & Error Messages

### Field Validation (Prep Mode)

| Field | Rule | Error |
|---|---|---|
| Question | Required | "Question is required" |
| Category | Required, predefined list | "Select a category" |
| Answer | Optional | — |
| Anchors | Optional | — |

### Import Errors (P-08)

| Error | Message |
|---|---|
| Not JSON | "File is not valid JSON and cannot be read" |
| Wrong schema | "File does not appear to be a PM Interview Prep export" |
| Missing required field | "Missing required field: [field] on entry [n]" |
| Unknown category | "Unknown category '[value]' on entry [n]; must be one of: Product sense, Leadership, Strategy, Estimation, Execution, Hiring, Team management" |
| No active version | "Entry [n] has no active answer version" |
| File too large | "File exceeds 10MB and cannot be imported" |
| Duplicate import | "This file has already been imported. No new entries were found." |

### Error Display
- Position: inline below triggering field, or in a banner at top of panel
- Color: `#dc2626` (text), `#fee2e2` (background for banners)
- Font: 13px, 500 weight
- Persists until corrected (no auto-dismiss for field errors)
- Import errors: dismissible banner, auto-dismiss after 5 seconds if not blocking

---

## 13. Storage Warning Banner (NF-07)

- Trigger: localStorage usage ≥ ~80% of browser limit
- Position: fixed, top of viewport, below header
- Background: `#fef3c7`; border: 1px `#D97706`
- Text: "Storage nearly full — export a backup to free space." — 14px, 500 weight, dark text
- Icon: exclamation, left-aligned
- Dismiss button: right-aligned (X); re-appears next session if condition persists
- New entries and saves remain allowed
- **Note:** Uses `WARNING_BG` (`#fef3c7`) and amber border — these are semantic overrides (§1.4) that appear in both Prep and Live Mode. Do not change to mode accent colors.

---

## 14. Design Tokens Reference

### Implementation Note
In Tailwind CSS v4.1, design tokens are declared as CSS custom properties inside an `@theme` block in the main CSS entry point (`src/index.css`). No `tailwind.config.js` is needed. Tailwind auto-generates utilities from these tokens — e.g., `bg-prep-primary`, `text-live-text`, `border-live-border`. The block below is the authoritative token declaration — copy it verbatim into your CSS file.

```css
@theme {
  /* Prep Mode */
  --color-prep-primary:    #16A34A;
  --color-prep-highlight:  #4ADE80;
  --color-prep-bg:         #ffffff;
  --color-prep-hover-bg:   #dcfce7;
  --color-prep-text:       #1a1a1a;
  --color-prep-border:     #e5e7eb;

  /* Live Mode */
  --color-live-primary:    #D97706;
  --color-live-highlight:  #F59E0B;
  --color-live-bg:         #1a1a1a;
  --color-live-header-bg:  #0f0f0f;
  --color-live-text:       #e8e8e8;
  --color-live-border:     #4b5563;

  /* Debrief */
  --color-debrief-bg:      #252525;
  --color-debrief-footer:  #2a2a2a;
  --color-debrief-divider: #3a3a3a;

  /* Semantic */
  --color-error:           #dc2626;
  --color-error-bg:        #fee2e2;
  --color-warning-bg:      #fef3c7;
  --color-success-bg:      #dcfce7;
  --color-disabled-text:   #9ca3af;

  /* Spacing */
  --spacing-xs:   4px;
  --spacing-sm:   8px;
  --spacing-md:   12px;
  --spacing-lg:   16px;
  --spacing-xl:   20px;
  --spacing-2xl:  24px;
  --spacing-3xl:  32px;

  /* Overlay */
  --overlay-default-width:   600px;
  --overlay-default-height:  400px;
  --overlay-margin:          20px;
  --overlay-border-radius:   8px;

  /* Sizing */
  --touch-target-min:    32px;
  --touch-target-ideal:  44px;
  --pill-height:         28px;
  --header-height:            44px;
  --answer-view-header-height: 40px;
  --debrief-header-h:         64px;
  --debrief-footer-h:         64px;

  /* Typography */
  --font-size-xs:       11px;
  --font-size-sm:       12px;
  --font-size-base:     14px;
  --font-size-md:       15px;
  --font-size-lg:       16px;
  --font-size-xl:       18px;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semi:   600;
  --leading-tight:      1.4;
  --leading-normal:     1.5;
  --leading-relaxed:    1.6;
}
```

> **Note on oklch:** Tailwind v4.1's built-in design system expresses colors in oklch for perceptual uniformity. The tokens above use hex values — these are the design source of truth and take precedence over any Tailwind defaults. If you later need to interpolate between two theme colors (e.g., for a gradient), converting them to oklch will yield more visually consistent midpoints than hex interpolation. Approximate oklch equivalents for the two primary accents: `#16A34A` ≈ `oklch(51% 0.17 145)`, `#D97706` ≈ `oklch(60% 0.17 55)`. These are informational only.
