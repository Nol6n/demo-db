import React, { useEffect, useState } from 'react';
function App() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // API Routes called from the app.py
  // Fetch feedback from backend
  const fetchFeedback = () => {
    fetch('http://localhost:5000/api/feedback')
      .then(res => res.json())
      .then(data => setFeedbackList(data))
      .catch(() => setError('Failed to load feedback'));
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  // Submit new feedback
  const submitFeedback = () => {
    if (!name.trim() || !message.trim()) {
      setError('Name and message are required');
      return;
    }
    setLoading(true);
    setError('');
    fetch('http://localhost:5000/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, message }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Submit failed');
        return res.json();
      })
      .then(() => {
        setName('');
        setMessage('');
        fetchFeedback();
      })
      .catch(() => setError('Failed to submit feedback'))
      .finally(() => setLoading(false));
  };
  // End of API calls

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20, fontFamily: 'Arial' }}>
      <h1>Feedback Board</h1>

      {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={loading}
          style={{ width: '100%', padding: 8, marginBottom: 10, boxSizing: 'border-box' }}
        />
        <textarea
          placeholder="Your feedback"
          value={message}
          onChange={e => setMessage(e.target.value)}
          disabled={loading}
          style={{ width: '100%', padding: 8, height: 80, boxSizing: 'border-box' }}
        />
        <button
          onClick={submitFeedback}
          disabled={loading}
          style={{ marginTop: 10, padding: '10px 20px', cursor: 'pointer' }}
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>

      <h2>All Feedback</h2>
      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        {feedbackList.length === 0 && <li>No feedback yet.</li>}
        {feedbackList.map(f => (
          <li key={f.id} style={{ marginBottom: 15, borderBottom: '1px solid #ddd', paddingBottom: 10 }}>
            <strong>{f.name}</strong> <em>({f.timestamp})</em>
            <p style={{ marginTop: 5 }}>{f.message}</p>
            {f.sentiment_label && (
              <div style={{ fontSize: '0.9em', color: '#666' }}>
                Sentiment: <strong>{f.sentiment_label}</strong> (score: {f.sentiment_score?.toFixed(2)})
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;