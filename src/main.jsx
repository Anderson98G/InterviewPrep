import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { getFromStorage, saveToStorage } from './utils/storage.js';
import { runMigrations, CURRENT_SCHEMA_VERSION } from './utils/migrations.js';
import { defaultData } from './store/defaultData.js';
import { useQAStore } from './store/useQAStore.js';

// ---------------------------------------------------------------------------
// Boot sequence — runs synchronously before React renders any UI.
// Order per SYSTEM_DESIGN §3: getFromStorage → runMigrations →
// closeOrphanedSessions → applySeedIfFirstLaunch → forceMode → setInitialState
// ---------------------------------------------------------------------------

let bootError = null;

try {
  // Step 1: Read and parse localStorage blob.
  let data = getFromStorage();

  // Step 2: Run migrations (no-op at v1; throws on future version mismatch or
  // insufficient storage headroom for the snapshot double-write).
  if (data !== null) {
    data = runMigrations(data);
  } else {
    // First launch — start from a clean slate; seed is applied in step 4.
    data = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      entries: [],
      sessions: [],
      ui: {
        mode: 'live',
        overlayPosition: null,
        overlaySize: null,
        activeCategoryFilter: null,
        collapsedCategories: [],
      },
    };
  }

  // Step 3: Close orphaned sessions (sessions with no endedAt).
  const now = new Date().toISOString();
  data = {
    ...data,
    sessions: data.sessions.map((s) => (s.endedAt ? s : { ...s, endedAt: now })),
  };

  // Step 4: Apply seed if this is the first launch (entries array is empty).
  if (data.entries.length === 0) {
    // Deep-copy the seed so the module constant stays immutable.
    data = {
      ...data,
      entries: JSON.parse(JSON.stringify(defaultData.entries)),
    };
  }

  // Step 5: Force Live Mode — the app always opens in Live Mode regardless of
  // whatever mode was persisted in a previous session.
  data = { ...data, ui: { ...data.ui, mode: 'live' } };

  // Persist the final boot state (covers migration result, orphan fixes, seed,
  // forced mode) in one atomic write before the store is initialised.
  const saveResult = saveToStorage(data);
  if (!saveResult.ok) throw new Error(saveResult.error);

  // Step 6: Populate the Zustand store.
  useQAStore.getState().setInitialState(data);

  // Register cross-tab sync listener AFTER setInitialState so the handler
  // never fires against an uninitialised store.
  window.addEventListener('storage', (event) => {
    try {
      if (event.key !== 'interviewprep_data') return;
      if (event.newValue === null) return; // key was deleted in another tab — ignore
      const fresh = getFromStorage();
      if (fresh) {
        // Re-run migrations on the received value in case the other tab wrote
        // data with a newer schema (future-proofing; no-op at v1).
        const migrated = runMigrations(fresh);
        useQAStore.getState().rehydrate(migrated);
      }
    } catch {
      // Never let a cross-tab sync error crash the React tree.
    }
  });
} catch (err) {
  bootError = err.message || String(err);
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const root = document.getElementById('root');

if (bootError) {
  root.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;
                height:100vh;padding:24px;font-family:Inter,system-ui,sans-serif;">
      <div style="max-width:520px;">
        <h1 style="color:#dc2626;font-size:20px;margin-bottom:12px;">
          Your data could not be loaded
        </h1>
        <p style="color:#374151;margin-bottom:16px;line-height:1.6;">
          ${bootError}
        </p>
        <p style="color:#6b7280;font-size:13px;line-height:1.6;">
          If this persists, open the browser console and run
          <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">
            localStorage.removeItem('interviewprep_data')
          </code>
          to reset. Export a backup first if possible.
        </p>
      </div>
    </div>`;
} else {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
