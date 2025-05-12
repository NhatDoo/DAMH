import React from 'react';
import './CriteriaMatrix.css'; // Tùy chọn: File CSS để tùy chỉnh giao diện

const CriteriaMatrix = ({ scoresData, onScoreClick, editingCriterion, editingValue, setEditingValue, onScoreSave }) => {
    // Lấy danh sách các tiêu chí từ scoresData
    const criteria = Object.keys(scoresData);
  
    return (
      <div className="criteria-only-matrix">
        <h3>Điểm số theo từng tiêu chí</h3>
        <table>
          <thead>
            <tr>
              {criteria.map((criterion, index) => (
                <th key={index}>{criterion}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {criteria.map((criterion, index) => (
                <td
                  key={index}
                  onClick={() => onScoreClick(criterion, scoresData[criterion][0])} // Sử dụng scoresData[criterion][0] vì đây là điểm số đầu tiên
                  className="score-cell"
                >
                  {editingCriterion === criterion && editingValue !== '' ? (
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => onScoreSave(criteria[0], false, null)} // Giả sử chỉnh sửa điểm số cho phương án đầu tiên
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          onScoreSave(criteria[0], false, null);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    scoresData[criterion][0] // Hiển thị điểm số đầu tiên cho tiêu chí
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

export default CriteriaMatrix;