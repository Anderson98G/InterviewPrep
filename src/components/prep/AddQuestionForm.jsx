import { useState, useRef, useEffect } from 'react';
import { useQAStore } from '../../store/useQAStore.js';
import { CATEGORY_LIST } from '../../utils/categories.js';
import { createVersion } from '../../utils/versionUtils.js';

export default function AddQuestionForm({ onClose }) {
  const addEntry = useQAStore((s) => s.addEntry);
  const entries = useQAStore((s) => s.entries);

  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('');
  const [prose, setProse] = useState('');
  const [anchor, setAnchor] = useState('');
  const [errors, setErrors] = useState({});

  const formRef = useRef(null);

  // Scroll form into view on open.
  useEffect(() => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  function wordCount(text) {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }

  function validate() {
    const errs = {};
    if (!question.trim()) errs.question = 'Question is required';
    if (!category) errs.category = 'Select a category';
    return errs;
  }

  function handleSubmit(e) {
    e?.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});

    const now = new Date().toISOString();
    const version = createVersion({ prose, anchor });
    // order = last order in this category + 1.0, or 1.0 if category is empty
    const categoryEntries = entries.filter((en) => en.category === category);
    const maxOrder = categoryEntries.reduce((m, en) => Math.max(m, en.order), 0);

    addEntry({
      id: crypto.randomUUID(),
      question: question.trim(),
      category,
      order: maxOrder + 1.0,
      createdAt: now,
      lastEditedAt: version.createdAt,
      versions: [version],
      notes: [],
    });
    onClose();
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') { onClose(); return; }
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSubmit(); }
  }

  const inputStyle = {
    width: '100%', padding: '8px', fontSize: 14, border: '1px solid #e5e7eb',
    borderRadius: 4, outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box',
  };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginBottom: 4 };
  const errorStyle = { fontSize: 13, fontWeight: 500, color: '#dc2626', marginTop: 4 };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4,
        padding: 16, marginTop: 8,
      }}
    >
      {/* Question */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>
          Question <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <input
          type="text"
          value={question}
          onChange={(e) => { setQuestion(e.target.value); if (errors.question) setErrors((p) => ({ ...p, question: '' })); }}
          placeholder="Enter question"
          style={{ ...inputStyle, height: 36 }}
          autoFocus
        />
        <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'right', marginTop: 2 }}>
          {question.length} chars
        </div>
        {errors.question && <p style={errorStyle}>{errors.question}</p>}
      </div>

      {/* Category */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>
          Category <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); if (errors.category) setErrors((p) => ({ ...p, category: '' })); }}
          style={{ ...inputStyle, height: 36 }}
        >
          <option value="" disabled>Select a category</option>
          {CATEGORY_LIST.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {errors.category && <p style={errorStyle}>{errors.category}</p>}
      </div>

      {/* Answer */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Answer</label>
        <textarea
          value={prose}
          onChange={(e) => setProse(e.target.value)}
          placeholder="Enter answer"
          rows={5}
          style={{ ...inputStyle, minHeight: 200, resize: 'vertical', lineHeight: 1.6, fontSize: 15 }}
        />
        <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'right', marginTop: 2 }}>
          {wordCount(prose)} words
        </div>
      </div>

      {/* Anchor phrases */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Anchor phrases</label>
        <textarea
          value={anchor}
          onChange={(e) => setAnchor(e.target.value)}
          placeholder="Enter anchor phrases, one per line"
          rows={3}
          style={{ ...inputStyle, minHeight: 120, resize: 'vertical', lineHeight: 1.5 }}
        />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '8px 16px', fontSize: 14, fontWeight: 500, borderRadius: 4,
            background: '#e5e7eb', color: '#1a1a1a', border: 'none', cursor: 'pointer',
            minHeight: 44,
          }}
        >
          Discard
        </button>
        <button
          type="submit"
          style={{
            padding: '8px 16px', fontSize: 14, fontWeight: 500, borderRadius: 4,
            background: '#16A34A', color: '#fff', border: 'none', cursor: 'pointer',
            minHeight: 44,
          }}
        >
          Add Question
        </button>
      </div>
    </form>
  );
}
