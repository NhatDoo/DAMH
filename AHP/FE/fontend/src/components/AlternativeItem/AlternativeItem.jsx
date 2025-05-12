import React, { useState, useEffect } from 'react';
import CriterionList from './CriterionList.jsx';
import ComparisonMatrix from './ComparisonMatrix.jsx';
import AlternativeInput from './AlternativeInput.jsx';
import AlternativeMatrix from './AlternativeMatrix.jsx';
import RankedResults from './RankedResults.jsx';
import useMatrix from './hooks/useMatrix';
import useNeo4j from './hooks/useNeo4j.jsx';
import { addTchiUser, deleteTchiUser } from '../../services/apiService.js';
import Chatbot from './Chatbot'; 

const DEFAULT_CRITERIA_LIST = [
  'Nguồn Vốn',
  'Kỹ năng',
  'Mạng lưới quan hệ',
  'Thời gian',
  'Xu hướng thị trường',
  'Rủi ro',
  'Khu vực',
];

const AlternativeItem = ({
  alternative,
  score,
  criterionScores,
  isSelected,
  onDetailClick,
  onAddClick,
  onDeleteClick,
  onScoreClick,
  onScoreSave,
  editingCriterion,
  editingValue,
  setEditingValue,
  isTchiUser,
  itemId,
  comparisonMatrix,
  consistencyRatio,
  onUpdateCriterionScores,
  initialCriteriaList,
  onUpdateCriteriaList,
  userEmail,
}) => {
  const [criteriaLabels, setCriteriaLabels] = useState(
    initialCriteriaList && initialCriteriaList.length > 0 ? initialCriteriaList : DEFAULT_CRITERIA_LIST
  );
  const [newCriterion, setNewCriterion] = useState('');
  const [newAlternative, setNewAlternative] = useState('');
  const [alternativesList, setAlternativesList] = useState([]);
  const [alternativeMatrix, setAlternativeMatrix] = useState([]);
  const [rankedResults, setRankedResults] = useState(null);
  const [showAlternativeInput, setShowAlternativeInput] = useState(false);

  const { editableMatrix, setEditableMatrix, currentCR, setCurrentCR, initializeMatrix } = useMatrix({
    comparisonMatrix,
    consistencyRatio,
    criteriaLabels,
    isTchiUser,
  });

  const { saveToNeo4j } = useNeo4j({
    criteriaLabels,
    editableMatrix,
    alternativesList,
    alternativeMatrix,
    rankedResults,
    itemId,
  });

  useEffect(() => {
    const size = alternativesList.length;
    const newMatrix = Array(size)
      .fill()
      .map(() => Array(size).fill(1.0));
    setAlternativeMatrix(newMatrix);
  }, [alternativesList]);

  useEffect(() => {
    if (isTchiUser && currentCR <= 0.1 && !rankedResults) {
      setShowAlternativeInput(true);
    } else {
      setShowAlternativeInput(false);
    }
  }, [isTchiUser, currentCR, rankedResults]);

  const handleAddCriterion = (newCriterion) => {
    if (!newCriterion.trim()) {
      alert('Vui lòng nhập tên tiêu chí.');
      return;
    }
    if (criteriaLabels.includes(newCriterion.trim())) {
      alert('Tiêu chí này đã tồn tại.');
      return;
    }

    const newCriteriaLabels = [...criteriaLabels, newCriterion.trim()];
    setCriteriaLabels(newCriteriaLabels);

    if (isTchiUser) {
      const newSize = newCriteriaLabels.length;
      const newMatrix = Array(newSize)
        .fill()
        .map(() => Array(newSize).fill(1.0));

      for (let i = 0; i < editableMatrix.length; i++) {
        for (let j = 0; j < editableMatrix[i].length; j++) {
          newMatrix[i][j] = editableMatrix[i][j];
        }
      }
      setEditableMatrix(newMatrix);
    }

    if (onUpdateCriterionScores) {
      onUpdateCriterionScores(itemId, {
        ...criterionScores,
        [newCriterion.trim()]: 0.0,
      });
    }

    if (onUpdateCriteriaList) {
      onUpdateCriteriaList(newCriteriaLabels);
    }

    setNewCriterion('');
    alert(`Tiêu chí "${newCriterion.trim()}" đã được thêm.`);
  };

  const handleAddAlternative = () => {
    if (!newAlternative.trim()) {
      alert('Vui lòng nhập tên phương án.');
      return;
    }
    if (alternativesList.includes(newAlternative.trim())) {
      alert('Phương án này đã tồn tại.');
      return;
    }

    const newAlternatives = [...alternativesList, newAlternative.trim()];
    setAlternativesList(newAlternatives);
    setNewAlternative('');
    alert(`Phương án "${newAlternative.trim()}" đã được thêm.`);
  };

  const handleAddSuggestedAlternative = async (e, alternative, score, criterionScores) => {
    e.stopPropagation();
    try {
      if (!criterionScores || !Object.keys(criterionScores).length) {
        alert('Vui lòng cung cấp điểm tiêu chí.');
        return;
      }
      if (!criteriaLabels.length) {
        alert('Danh sách tiêu chí không được rỗng.');
        return;
      }
      const scoreKeys = Object.keys(criterionScores);
      if (!scoreKeys.every((key) => criteriaLabels.includes(key))) {
        alert('Điểm tiêu chí không khớp với danh sách tiêu chí.');
        return;
      }
      if (!editableMatrix || editableMatrix.length !== criteriaLabels.length || !editableMatrix.every(row => row.length === criteriaLabels.length)) {
        alert('Ma trận so sánh không hợp lệ.');
        return;
      }

      const data = {
        alternative,
        final_score: score || 0,
        criterion_scores: criterionScores,
        comparison_matrix: editableMatrix,
      };
      console.log('Sending data to addTchiUser:', JSON.stringify(data, null, 2));
      await addTchiUser(data);
      alert(`Phương án gợi ý "${alternative}" đã được thêm vào backend.`);
      onAddClick(alternative, score, criterionScores, criteriaLabels, editableMatrix, consistencyRatio);
    } catch (error) {
      console.error('Failed to add suggested alternative:', error);
      alert(`Lỗi khi thêm phương án gợi ý: ${error.message}`);
    }
  };

  const handleDeleteAlternative = async (e, id) => {
    e.stopPropagation();
    try {
      if (!id) {
        alert('ID phương án không hợp lệ.');
        return;
      }
      const confirmDelete = window.confirm(`Bạn có chắc muốn xóa phương án "${alternative}"?`);
      if (!confirmDelete) {
        return;
      }
      console.log('Deleting tchi_user with ID:', id);
      await deleteTchiUser(id);
      alert(`Phương án "${alternative}" đã được xóa.`);
      onDeleteClick(id);
    } catch (error) {
      console.error('Failed to delete alternative:', error);
      alert(`Lỗi khi xóa phương án: ${error.message}`);
    }
  };

  return (
    <div className="alternative-item">
      <div className="alternative-item-header" onClick={() => onDetailClick(alternative)}>
        <div>
          <h4>{alternative}</h4>
        </div>
        <div className="alternative-item-actions">
          <button className="button-detail">Chi tiết</button>
          {!isTchiUser ? (
            <button
              className="button-add"
              onClick={(e) => handleAddSuggestedAlternative(e, alternative, score || 0, criterionScores)}
            >
              Thêm
            </button>
          ) : (
            <button
              className="button-delete"
              onClick={(e) => handleDeleteAlternative(e, itemId)}
            >
              Xóa
            </button>
          )}
        </div>
      </div>

      {isSelected && (
        <div className="criterion-details">
          {Object.keys(criterionScores || {}).map((criterion) => (
            <p key={criterion}>
              {criterion}:{' '}
              <span onClick={() => onScoreClick(criterion, criterionScores[criterion])}>
                {(criterionScores[criterion] || 0).toFixed(2)}
              </span>
              {editingCriterion === criterion && (
                <>
                  <input
                    type="number"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onScoreSave(alternative, isTchiUser, itemId);
                    }}
                  >
                    Lưu
                  </button>
                </>
              )}
            </p>
          ))}

          {isTchiUser && criteriaLabels.length > 0 && (
            <CriterionList
              criteriaLabels={criteriaLabels}
              setCriteriaLabels={setCriteriaLabels}
              criterionScores={criterionScores}
              onUpdateCriterionScores={onUpdateCriterionScores}
              onUpdateCriteriaList={onUpdateCriteriaList}
              editableMatrix={editableMatrix}
              setEditableMatrix={setEditableMatrix}
              itemId={itemId}
            />
          )}

          {criteriaLabels.length > 0 && editableMatrix && (
            <>
              {isTchiUser ? (
                <ComparisonMatrix
                  criteriaLabels={criteriaLabels}
                  editableMatrix={editableMatrix}
                  setEditableMatrix={setEditableMatrix}
                  currentCR={currentCR}
                  setCurrentCR={setCurrentCR}
                  isTchiUser={isTchiUser}
                  itemId={itemId}
                  comparisonMatrix={comparisonMatrix}
                  consistencyRatio={consistencyRatio}
                  onScoreSave={onScoreSave}
                  alternative={alternative}
                  criterionScores={criterionScores}
                  initializeMatrix={initializeMatrix}
                />
              ) : (
                <div className="matrix-display">
                  <h4>Ma trận so sánh</h4>
                  <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}></th>
                        {criteriaLabels.map((label, index) => (
                          <th key={index} style={{ border: '1px solid #ddd', padding: '8px' }}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {editableMatrix.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                            {criteriaLabels[rowIndex]}
                          </td>
                          {row.map((value, colIndex) => (
                            <td
                              key={colIndex}
                              style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}
                            >
                              {value.toFixed(2)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p>Tỷ lệ nhất quán (CR): {currentCR.toFixed(4)}</p>
                </div>
              )}
            </>
          )}

          {isTchiUser && currentCR > 0.1 && (
            <p style={{ color: 'red', marginTop: '10px' }}>
              Ma trận tiêu chí chưa nhất quán (CR > 0.1). Vui lòng điều chỉnh ma trận trước khi thêm phương án.
            </p>
          )}

          {isTchiUser && showAlternativeInput && currentCR <= 0.1 && !rankedResults && (
            <AlternativeInput
              newAlternative={newAlternative}
              setNewAlternative={setNewAlternative}
              onAddAlternative={handleAddAlternative}
            />
          )}

          {isTchiUser && alternativesList.length >= 1 && currentCR <= 0.1 && !rankedResults && (
            <AlternativeMatrix
              alternativesList={alternativesList}
              alternativeMatrix={alternativeMatrix}
              setAlternativeMatrix={setAlternativeMatrix}
              setRankedResults={setRankedResults}
              setShowAlternativeInput={setShowAlternativeInput}
            />
          )}

          {rankedResults && (
            <RankedResults
              rankedResults={rankedResults}
              setRankedResults={setRankedResults}
              setShowAlternativeInput={setShowAlternativeInput}
              saveToNeo4j={saveToNeo4j}
            />
          )}

          {isTchiUser && <Chatbot />} {/* Thêm Chatbot khi isTchiUser là true */}
        </div>
      )}
    </div>
  );
};

export default AlternativeItem;