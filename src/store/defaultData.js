const now = '2026-04-23T12:00:00.000Z';

const seedEntry = {
  id: crypto.randomUUID(),
  question: 'Tell me about a time you had to kill a feature your team loved.',
  category: 'Leadership',
  order: 1.0,
  createdAt: now,
  lastEditedAt: now,
  versions: [
    {
      id: crypto.randomUUID(),
      type: 'version',
      prose:
        'At Acme, my team had spent 6 weeks building a collaborative whiteboard. Beta telemetry showed median session length under 40 seconds — a clear signal of no real collaboration. I called a team meeting, walked through the data without editorializing, and named the decision explicitly: we\'re killing it. We redirected to async commenting. Within two quarters it was our #2 retention driver. The lesson I took: protecting team morale means being honest early, not protecting the feature.',
      anchor: 'Data signal (40s median session)\nNamed the decision explicitly\nOutcome: #2 retention driver',
      createdAt: now,
      isActive: true,
    },
  ],
  notes: [],
};

export const defaultData = {
  schemaVersion: 1,
  entries: [seedEntry],
  sessions: [],
  ui: {
    mode: 'live',
    overlayPosition: null,
    overlaySize: null,
    activeCategoryFilter: null,
    collapsedCategories: [],
  },
};
