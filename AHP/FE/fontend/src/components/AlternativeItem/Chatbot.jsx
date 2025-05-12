import React, { useState } from 'react';

const Chatbot = () => {
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    setChatLoading(true);
    setChatError(null);
    setChatResponse(null);

    try {
      const res = await fetch('http://localhost:8001/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: chatQuery }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setChatResponse(data);
    } catch (error) {
      setChatError(error.message);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="chatbot-section" style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '4px' }}>
      <h3>Chatbot</h3>
      <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={chatQuery}
          onChange={(e) => setChatQuery(e.target.value)}
          placeholder="Nhập câu hỏi của bạn..."
          style={{ flex: '1', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button
          type="submit"
          disabled={chatLoading}
          style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {chatLoading ? 'Đang xử lý...' : 'Gửi'}
        </button>
      </form>

      {chatError && <p style={{ color: 'red' }}>Lỗi: {chatError}</p>}

      {chatResponse && (
        <div>
          <h4>Kết quả:</h4>
          <p><strong>Câu hỏi:</strong> {chatResponse.query}</p>
          <p><strong>Trả lời:</strong> {chatResponse.answer}</p>
        </div>
      )}
    </div>
  );
};

export default Chatbot;