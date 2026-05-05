import { useState } from 'react';

export default function QuestionRow({ entry, isVisited, onSelect }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => onSelect(entry)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '8px 12px', fontSize: 14, fontWeight: 500,
        background: hovered ? '#0f0f0f' : 'transparent',
        color: '#e8e8e8', border: 'none', borderRadius: 0,
        cursor: 'pointer', lineHeight: 1.5,
        borderLeft: isVisited ? '2px solid #D97706' : '2px solid transparent',
        transition: 'background 80ms',
      }}
    >
      {entry.question}
    </button>
  );
}
