import { useQAStore } from './store/useQAStore.js';
import { useSessionManager } from './store/useSessionManager.js';
import PrepMode from './components/prep/PrepMode.jsx';
import LiveOverlay from './components/live/LiveOverlay.jsx';
import DebriefScreen from './components/live/DebriefScreen.jsx';
import StorageWarningBanner from './components/shared/StorageWarningBanner.jsx';

// ---------------------------------------------------------------------------
// Mode Toggle — pill-shaped, always fixed top-right
// ---------------------------------------------------------------------------
function ModeToggle({ mode, onToggle, disabled }) {
  return (
    <button
      role="switch"
      aria-checked={mode === 'prep'}
      aria-label="Toggle between Prep and Live mode"
      onClick={disabled ? undefined : onToggle}
      style={{
        position: 'fixed', top: 12, right: 16, zIndex: 1000,
        display: 'flex', width: 80, height: 36, borderRadius: 18,
        overflow: 'hidden', border: 'none', padding: 0, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
      }}
    >
      <span style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 500,
        background: mode === 'prep' ? '#16A34A' : '#e5e7eb',
        color: mode === 'prep' ? '#fff' : '#6b7280',
      }}>
        Prep
      </span>
      <span style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 500,
        background: mode === 'live' ? '#D97706' : '#e5e7eb',
        color: mode === 'live' ? '#fff' : '#6b7280',
      }}>
        Live
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
  const mode = useQAStore((s) => s.ui.mode);
  const setMode = useQAStore((s) => s.setMode);
  const storageError = useQAStore((s) => s.storageError);
  const storageWarning = useQAStore((s) => s.storageWarning);

  const {
    sessionState,
    visitedEntryIds,
    startSession,
    cancelSession,
    enterDebrief,
    exitDebrief,
    endSession,
    skipSession,
  } = useSessionManager();

  function handleModeToggle() {
    if (sessionState === 'DEBRIEF') return;
    if (mode === 'live') {
      if (visitedEntryIds.size >= 1) {
        enterDebrief();
      } else {
        cancelSession();
        setMode('prep');
      }
    } else {
      setMode('live');
      startSession();
    }
  }

  return (
    <>
      {mode === 'prep' && (
        <ModeToggle
          mode={mode}
          onToggle={handleModeToggle}
          disabled={sessionState === 'DEBRIEF'}
        />
      )}

      {storageWarning && <StorageWarningBanner />}

      {storageError && (
        <div style={{
          position: 'fixed', top: storageWarning ? 40 : 0, left: 0, right: 0, zIndex: 998,
          background: '#fee2e2', borderBottom: '1px solid #dc2626',
          padding: '8px 16px', fontSize: 14, fontWeight: 500, color: '#dc2626',
        }}>
          {storageError}
        </div>
      )}

      {mode === 'prep' ? (
        <PrepMode />
      ) : (
        <LiveOverlay onModeToggle={handleModeToggle} />
      )}

      {sessionState === 'DEBRIEF' && (
        <DebriefScreen
          visitedEntryIds={visitedEntryIds}
          endSession={endSession}
          exitDebrief={exitDebrief}
          skipSession={skipSession}
          setMode={setMode}
        />
      )}
    </>
  );
}
