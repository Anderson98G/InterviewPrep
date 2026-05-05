import { useState } from 'react';

export default function StorageWarningBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
      background: '#fef3c7', borderBottom: '1px solid #D97706',
      padding: '8px 16px', fontSize: 14, fontWeight: 500, color: '#92400e',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span>⚠️ Storage nearly full — export a backup to free space.</span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss storage warning"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 18, color: '#92400e', padding: '0 4px', lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
