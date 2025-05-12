import React, { useState, useEffect } from 'react';

const Chatbot = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('http://localhost:8001/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Chatbot</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập câu hỏi của bạn..."
          style={{ flex: '1', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Đang xử lý...' : 'Gửi'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

      {response && (
        <div style={{ marginTop: '20px' }}>
          <h3>Kết quả:</h3>
          <p><strong>Câu hỏi:</strong> {response.query}</p>
          <p><strong>Trả lời:</strong> {response.answer}</p>
          <h4>Tài liệu truy xuất:</h4>
          <ul>
            {response.retrieved_docs.map((doc, index) => (
              <li key={index}>
                <strong>Tài liệu:</strong> {doc.text} <br />
                <strong>Khoảng cách:</strong> {doc.distance.toFixed(4)}
              </li>
            ))}
          </ul>
          <p><strong>Ngữ cảnh:</strong> {response.context}</p>
        </div>
      )}
    </div>
  );
};

export default Chatbot;