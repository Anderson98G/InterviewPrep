// Formats an ISO timestamp to "Apr 20, 2026 at 3:42 PM"
export function formatTimestamp(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).replace(',', '').replace(/(\d{4}),/, '$1 at');
}

// Formats to "Apr 20, 2026"
export function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
