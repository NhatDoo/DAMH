import React, { useState } from 'react';
import * as apiService from '../../services/apiService';
<apiService />

const AlternativeMatrix = ({
  alternativesList,
  alternativeMatrix,
  setAlternativeMatrix,
  setRankedResults,
  setShowAlternativeInput,
}) => {
  const [tempAlternativeValue, setTempAlternativeValue] = useState({ rowIdx: -1, colIdx: -1, value: '' });

  const parseFraction = (value) => {
    if (value.includes('/')) {
      const [numerator, denominator] = value.split('/').map(num => parseFloat(num.trim()));
      if (denominator === 0 || isNaN(numerator) || isNaN(denominator)) {
        alert('Phân số không hợp lệ. Vui lòng nhập tử số và mẫu số là số, mẫu số khác 0.');
        return null;
      }
      return numerator / denominator;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      alert('Giá trị không hợp lệ. Vui lòng nhập số hoặc phân số (ví dụ: 1/2).');
      return null;
    }
    return numValue;
  };

  const handleAlternativeMatrixChange = (rowIdx, colIdx, value) => {
    setTempAlternativeValue({ rowIdx, colIdx, value });
  };

  const handleAlternativeBlur = () => {
    const { rowIdx, colIdx, value } = tempAlternativeValue;
    if (rowIdx === -1 || colIdx === -1) return;

    if (value === '') {
      const newMatrix = alternativeMatrix.map(row => [...row]);
      newMatrix[rowIdx][colIdx] = '';
      newMatrix[colIdx][rowIdx] = '';
      setAlternativeMatrix(newMatrix);
      setTempAlternativeValue({ rowIdx: -1, colIdx: -1, value: '' });
      return;
    }

    const newValue = parseFraction(value);
    if (newValue === null || newValue < 0.111 || newValue > 9) {
      setTempAlternativeValue({ rowIdx: -1, colIdx: -1, value: '' });
      return;
    }

    const newMatrix = alternativeMatrix.map(row => [...row]);
    newMatrix[rowIdx][colIdx] = newValue;
    if (newValue === '') {
      newMatrix[colIdx][rowIdx] = '';
    } else {
      newMatrix[colIdx][rowIdx] = 1 / newValue;
    }

    setAlternativeMatrix(newMatrix);
    setTempAlternativeValue({ rowIdx: -1, colIdx: -1, value: '' });
  };

  const handleAlternativeKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAlternativeBlur();
    }
  };

  const handleRankAlternatives = async () => {
    const size = alternativesList.length;
    if (size < 2) {
      alert('Vui lòng thêm ít nhất 2 phương án để xếp hạng.');
      return;
    }

    const isValidMatrix = alternativeMatrix.every(row =>
      row.every(val => typeof val === 'number' && val >= 0.111 && val <= 9)
    );

    if (!isValidMatrix) {
      alert('Ma trận chứa giá trị không hợp lệ hoặc rỗng. Giá trị phải từ 0.111 đến 9.');
      return;
    }

    try {
      const flatMatrix = alternativeMatrix.flat();
      const data = {
        alternatives_list: alternativesList,
        pairwise_matrix: flatMatrix,
      };
      const response = await apiService.rankAlternativesDirect(data);

      const rankedAlternatives = response.ranked_alternatives;
      const consistencyRatio = response.consistency_ratio;

      if (consistencyRatio > 0.1) {
        alert(`Consistency Ratio (CR = ${consistencyRatio.toFixed(2)}) vượt quá 0.1. Vui lòng nhập lại ma trận để đảm bảo nhất quán.`);
        return;
      }

      setRankedResults({
        alternatives: rankedAlternatives,
        consistencyRatio,
      });
      setShowAlternativeInput(false);
    } catch (error) {
      console.error('Error ranking alternatives:', error);
      alert(`Có lỗi khi xếp hạng: ${error.message}`);
    }
  };

  return (
    <div className="alternative-matrix">
      <h5>Ma trận so sánh đôi (Phương án):</h5>
      <table>
        <thead>
          <tr>
            <th></th>
            {alternativesList.map((alt, idx) => (
              <th key={idx}>{alt}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {alternativeMatrix.map((row, rowIdx) => (
            <tr key={rowIdx}>
              <th>{alternativesList[rowIdx]}</th>
              {row.map((value, colIdx) => (
                <td key={colIdx} className={typeof value === 'number' && value > 1 ? 'highlight' : ''}>
                  {rowIdx < colIdx ? (
                    <input
                      type="text"
                      value={tempAlternativeValue.rowIdx === rowIdx && tempAlternativeValue.colIdx === colIdx ? tempAlternativeValue.value : (value === '' ? '' : value)}
                      onChange={(e) => handleAlternativeMatrixChange(rowIdx, colIdx, e.target.value)}
                      onBlur={handleAlternativeBlur}
                      onKeyPress={handleAlternativeKeyPress}
                      style={{ width: '80px', padding: '5px', border: '1px solid #ccc', fontSize: '14px' }}
                      placeholder="0.111 - 9 hoặc 1/3"
                    />
                  ) : (
                    (typeof value === 'number' ? value.toFixed(2) : value || '1.00')
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={handleRankAlternatives}
        style={{ marginTop: '10px', padding: '5px 10px' }}
      >
        Xếp hạng
      </button>
    </div>
  );
};

export default AlternativeMatrix;