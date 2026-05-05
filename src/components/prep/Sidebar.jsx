import { useState, useRef } from 'react';
import { useQAStore } from '../../store/useQAStore.js';
import { CATEGORY_LIST } from '../../utils/categories.js';
import { exportData, validateImportedData, importData } from '../../utils/importExport.js';

export default function Sidebar() {
  const entries = useQAStore((s) => s.entries);
  const activeCategoryFilter = useQAStore((s) => s.ui.activeCategoryFilter);
  const setActiveCategoryFilter = useQAStore((s) => s.setActiveCategoryFilter);

  const [exportBanner, setExportBanner] = useState(null);
  const [importBanner, setImportBanner] = useState(null);
  const fileInputRef = useRef(null);

  const countByCategory = CATEGORY_LIST.reduce((acc, cat) => {
    acc[cat] = entries.filter((e) => e.category === cat).length;
    return acc;
  }, {});

  function handleExport() {
    try {
      const state = useQAStore.getState();
      const result = exportData({
        schemaVersion: state.schemaVersion,
        entries: state.entries,
        sessions: state.sessions,
        ui: state.ui,
      });
      setExportBanner({ type: 'success', message: `Exported ${result.entryCount} entries` });
      setTimeout(() => setExportBanner(null), 5000);
    } catch (err) {
      setExportBanner({ type: 'error', message: `Export failed: ${err.message}` });
    }
  }

  function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setImportBanner({ type: 'error', message: 'File exceeds the 10 MB size limit' });
      fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let parsed;
        try {
          parsed = JSON.parse(e.target.result);
        } catch {
          throw new Error('File is not valid JSON and cannot be read.');
        }

        const { data: validated, warnings: validationWarnings } = validateImportedData(parsed, file.size);

        const state = useQAStore.getState();
        const currentAppData = {
          schemaVersion: state.schemaVersion,
          entries: state.entries,
          sessions: state.sessions,
          ui: state.ui,
        };

        const { mergedData, entryCount, warnings: importWarnings } = importData(validated, currentAppData);

        state.importEntries(mergedData);

        const allWarnings = [...validationWarnings, ...importWarnings];
        let message = `Imported ${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}`;
        if (allWarnings.length > 0) {
          message += `. ${allWarnings.join('. ')}`;
        }
        setImportBanner({ type: 'success', message });
        setTimeout(() => setImportBanner(null), 5000);
      } catch (err) {
        setImportBanner({ type: 'error', message: err.message });
      }
      fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  }

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: '#f3f4f6',
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Category list */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {/* All entries option */}
        <button
          onClick={() => setActiveCategoryFilter(null)}
          style={{
            width: '100%', textAlign: 'left',
            padding: '10px 16px', fontSize: 14, fontWeight: activeCategoryFilter === null ? 700 : 400,
            background: activeCategoryFilter === null ? '#dcfce7' : 'transparent',
            borderLeft: activeCategoryFilter === null ? '2px solid #16A34A' : '2px solid transparent',
            border: 'none', borderRadius: 0, cursor: 'pointer', color: '#1a1a1a',
            minHeight: 44,
          }}
        >
          All ({entries.length})
        </button>

        {CATEGORY_LIST.map((cat) => {
          const isActive = activeCategoryFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategoryFilter(cat)}
              style={{
                width: '100%', textAlign: 'left',
                padding: '10px 16px', fontSize: 14,
                fontWeight: isActive ? 700 : 400,
                background: isActive ? '#dcfce7' : 'transparent',
                borderLeft: isActive ? '2px solid #16A34A' : '2px solid transparent',
                border: 'none', borderRadius: 0, cursor: 'pointer', color: '#1a1a1a',
                minHeight: 44,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <span style={{
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
              }}>
                {cat}
              </span>
              <span style={{ fontSize: 12, color: '#6b7280', flexShrink: 0, marginLeft: 4 }}>
                {countByCategory[cat]}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Export / Import controls */}
      <div style={{ padding: 12, borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {exportBanner && (
          <div style={{
            padding: '6px 8px', borderRadius: 4, fontSize: 12,
            background: exportBanner.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: exportBanner.type === 'success' ? '#16A34A' : '#dc2626',
          }}>
            {exportBanner.message}
          </div>
        )}
        {importBanner && (
          <div style={{
            padding: '6px 8px', borderRadius: 4, fontSize: 12,
            background: importBanner.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: importBanner.type === 'success' ? '#16A34A' : '#dc2626',
          }}>
            {importBanner.message}
          </div>
        )}
        <button
          onClick={handleExport}
          style={{
            width: '100%', height: 40, fontSize: 13, fontWeight: 500,
            background: '#fff', color: '#1a1a1a', border: '1px solid #e5e7eb',
            borderRadius: 4, cursor: 'pointer',
          }}
        >
          Export deck
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%', height: 40, fontSize: 13, fontWeight: 500,
            background: '#fff', color: '#1a1a1a', border: '1px solid #e5e7eb',
            borderRadius: 4, cursor: 'pointer',
          }}
        >
          Import deck
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          aria-label="Import deck"
          style={{ display: 'none' }}
        />
      </div>
    </aside>
  );
}
