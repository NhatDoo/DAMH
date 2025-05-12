import React, { useEffect } from 'react';

const RankedResults = ({ rankedResults, setRankedResults, setShowAlternativeInput, saveToNeo4j }) => {
  useEffect(() => {
    if (rankedResults) {
      const canvas = document.getElementById('chartCanvas');
      if (canvas && rankedResults.consistencyRatio <= 0.1) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const alternatives = rankedResults.alternatives;
          const maxScore = Math.max(...alternatives.map(a => a.score * 100));
          const barWidth = canvas.width / alternatives.length - 10;
          const chartHeight = canvas.height - 40;

          ctx.fillStyle = '#f0f0f0';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          alternatives.forEach((item, index) => {
            const x = index * (barWidth + 10) + 5;
            const height = (item.score * 100 / maxScore) * chartHeight;
            const y = chartHeight - height + 20;

            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(x, y, barWidth, height);

            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.alternative, x + barWidth / 2, y - 5);
            ctx.fillText(`${(item.score * 100).toFixed(2)}%`, x + barWidth / 2, y + height + 15);
          });

          ctx.strokeStyle = '#ccc';
          ctx.beginPath();
          ctx.moveTo(0, chartHeight + 20);
          ctx.lineTo(canvas.width, chartHeight + 20);
          ctx.stroke();
        }
      }
    }
  }, [rankedResults]);

  return (
    <div className="ranked-results">
      <h5>Kết quả xếp hạng:</h5>
      <ul>
        {rankedResults.alternatives.map((item, idx) => (
          <li key={idx}>
            {idx + 1}. {item.alternative}: {(item.score * 100).toFixed(2)}%
          </li>
        ))}
      </ul>
      <p>Consistency Ratio (CR): {rankedResults.consistencyRatio.toFixed(2)} {rankedResults.consistencyRatio <= 0.1 ? '(Nhất quán)' : '(Không nhất quán)'}</p>
      {rankedResults.consistencyRatio > 0.1 && (
        <p style={{ color: 'red' }}>Ma trận không nhất quán (CR lớn hơn 0.1). Vui lòng nhập lại ma trận.</p>
      )}
      {rankedResults.consistencyRatio <= 0.1 && (
        <canvas id="chartCanvas" width="600" height="300" style={{ marginTop: '20px' }}></canvas>
      )}
      <button
        onClick={() => saveToNeo4j()}
        style={{ marginTop: '10px', padding: '5px 10px' }}
      >
        Lưu kết quả
      </button>
      <button
        onClick={() => {
          setRankedResults(null);
          setShowAlternativeInput(true);
        }}
        style={{ marginTop: '10px', padding: '5px 10px', marginLeft: '10px' }}
      >
        Đóng
      </button>
    </div>
  );
};

export default RankedResults;