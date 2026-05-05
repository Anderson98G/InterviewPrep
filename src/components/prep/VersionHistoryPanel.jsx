import { useEffect, useRef, useState } from 'react';
import { useQAStore } from '../../store/useQAStore.js';
import { getSortedHistory } from '../../utils/versionUtils.js';
import { formatTimestamp } from '../../utils/formatDate.js';
import ConfirmDialog from '../shared/ConfirmDialog.jsx';

function RestoredFromAnnotation({ version, allVersions }) {
  if (!version.restoredFrom) return null;
  const source = allVersions.find((v) => v.id === version.restoredFrom);
  const text = source
    ? `Restored from version created ${formatTimestamp(source.createdAt)}`
    : 'Restored from a prior version (no longer in history)';
  return (
    <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0', fontStyle: 'italic' }}>
      {text}
    </p>
  );
}

function VersionItem({ item, allVersions, onRestore, isActive }) {
  const [hovered, setHovered] = useState(false);
  const preview = item.prose.length > 40 ? item.prose.slice(0, 40) + '…' : item.prose;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '10px 12px',
        borderBottom: '1px solid #e5e7eb',
        background: hovered ? '#f9fafb' : '#fff',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>{formatTimestamp(item.createdAt)}</span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 10,
          background: isActive ? '#16A34A' : '#dcfce7',
          color: isActive ? '#fff' : '#16A34A',
        }}>
          {isActive ? 'Current' : 'Version'}
        </span>
      </div>
      <p style={{ fontSize: 13, color: '#374151', margin: '0 0 4px', lineHeight: 1.4 }}>{preview}</p>
      <RestoredFromAnnotation version={item} allVersions={allVersions} />
      {!isActive && hovered && (
        <button
          onClick={() => onRestore(item)}
          style={{
            marginTop: 6, padding: '4px 10px', fontSize: 12, fontWeight: 500,
            background: '#16A34A', color: '#fff', border: 'none',
            borderRadius: 4, cursor: 'pointer', minWidth: 32,
          }}
        >
          Restore
        </button>
      )}
    </div>
  );
}

function NoteItem({ item }) {
  const text = item.text.length > 100 ? item.text.slice(0, 100) + '…' : item.text;
  return (
    <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>{formatTimestamp(item.createdAt)}</span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 10,
          background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb',
        }}>
          Note
        </span>
      </div>
      <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.4 }}>{text}</p>
    </div>
  );
}

export default function VersionHistoryPanel({ entry, isOpen, onClose }) {
  const restoreEntryVersion = useQAStore((s) => s.restoreEntryVersion);
  const closeBtnRef = useRef(null);
  const triggerRef = useRef(null);

  const [confirmVersion, setConfirmVersion] = useState(null);

  // Capture trigger and focus close button when panel opens; return focus on close.
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
      closeBtnRef.current?.focus();
    } else if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [isOpen]);

  // Close on Esc.
  useEffect(() => {
    function handler(e) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const history = entry ? getSortedHistory(entry) : [];
  const activeVersionId = entry?.versions.find((v) => v.isActive)?.id;
  // "Empty" = only the active version, no prior inactive versions and no notes.
  const onlyActiveExists = entry
    ? entry.versions.length === 1 && entry.notes.length === 0
    : true;

  return (
    <>
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 320,
          background: '#f3f4f6', borderLeft: '2px solid #16A34A',
          zIndex: 200, display: 'flex', flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 150ms ease',
          boxShadow: isOpen ? '-4px 0 20px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', borderBottom: '1px solid #e5e7eb', flexShrink: 0,
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Version History</span>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close history panel"
            style={{
              width: 32, height: 32, background: 'transparent', border: 'none',
              cursor: 'pointer', fontSize: 18, color: '#6b7280', borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {onlyActiveExists ? (
            <div style={{ padding: 20, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
                Only the current version exists
              </p>
              <p style={{ fontSize: 12, color: '#9ca3af' }}>
                Save changes to create a new version
              </p>
            </div>
          ) : (
            history.map((item) => {
              if (item.type === 'version') {
                return (
                  <VersionItem
                    key={item.id}
                    item={item}
                    allVersions={entry.versions}
                    onRestore={(v) => setConfirmVersion(v)}
                    isActive={item.id === activeVersionId}
                  />
                );
              }
              return <NoteItem key={item.id} item={item} />;
            })
          )}
        </div>
      </div>

      {confirmVersion && (
        <ConfirmDialog
          title="Restore this version?"
          message={`"${confirmVersion.prose.slice(0, 60)}${confirmVersion.prose.length > 60 ? '…' : ''}"`}
          confirmLabel="Restore"
          onConfirm={() => {
            restoreEntryVersion(entry.id, confirmVersion.id);
            setConfirmVersion(null);
            onClose();
          }}
          onCancel={() => setConfirmVersion(null)}
        />
      )}
    </>
  );
}
