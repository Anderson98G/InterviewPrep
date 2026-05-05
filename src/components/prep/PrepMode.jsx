import { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import QuestionList from './QuestionList.jsx';
import AddQuestionForm from './AddQuestionForm.jsx';

export default function PrepMode() {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div style={{
      display: 'flex', height: '100vh', background: '#fff', overflow: 'hidden',
    }}>
      <Sidebar />

      <main style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 80px' }}>
        <QuestionList onAddClick={() => setShowAddForm(true)} />

        {showAddForm && (
          <AddQuestionForm onClose={() => setShowAddForm(false)} />
        )}

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            aria-label="Add a new question"
            style={{
              display: 'block', width: '100%', marginTop: 16,
              height: 44, fontSize: 14, fontWeight: 500, borderRadius: 4,
              background: '#16A34A', color: '#fff', border: 'none', cursor: 'pointer',
            }}
          >
            + Add Question
          </button>
        )}
      </main>
    </div>
  );
}
