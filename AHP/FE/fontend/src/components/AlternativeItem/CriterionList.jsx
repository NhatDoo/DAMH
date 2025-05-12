import React, { useState, useEffect } from 'react';
import * as apiService from '../../services/apiService';

const CriterionList = ({
  criteriaLabels,
  setCriteriaLabels,
  criterionScores,
  onUpdateCriterionScores,
  onUpdateCriteriaList,
  editableMatrix,
  setEditableMatrix,
  itemId,
}) => {
  const [allCriteria, setAllCriteria] = useState([]); // Tất cả tiêu chí duy nhất
  const [editCriterion, setEditCriterion] = useState(null);
  const [newCriterion, setNewCriterion] = useState('');
  const [selectedCriterion, setSelectedCriterion] = useState(''); // Tiêu chí được chọn
  const [editMode, setEditMode] = useState(false); // Chế độ chỉnh sửa
  const [editValue, setEditValue] = useState(''); // Giá trị sửa
  const [error, setError] = useState(null); // Lỗi
  
  // Lấy danh sách tiêu chí khi component mount
  useEffect(() => {
    fetchAllCriteria();
  }, []);

  const fetchAllCriteria = async () => {
    try {
      const data = await apiService.fetchTchiUserAlternatives();
      const uniqueCriteria = [...new Set(data.flatMap(item => item.criteria_list || []))];
      setAllCriteria(uniqueCriteria);
      console.log('Fetched unique criteria:', uniqueCriteria);

      // Đồng bộ criteriaLabels với backend
      const current = data.find(item => item.id === itemId);
      if (current) {
        setCriteriaLabels(current.criteria_list || []);
        setEditableMatrix(
          current.criteria_comparison_matrix
            ? Array(current.criteria_list.length).fill().map((_, i) =>
                current.criteria_comparison_matrix.slice(i * current.criteria_list.length, (i + 1) * current.criteria_list.length)
              )
            : []
        );
        // Đồng bộ criterionScores
        const updatedScores = {};
        (current.criteria_list || []).forEach(criterion => {
          updatedScores[criterion] = criterionScores[criterion] !== undefined ? criterionScores[criterion] : 0.0;
        });
        if (onUpdateCriterionScores) onUpdateCriterionScores(itemId, updatedScores);
      }
    } catch (error) {
      
      
    }
  };
  const handleAddCriterion = async () => {
    if (!newCriterion.trim()) {
      alert('Vui lòng nhập tên tiêu chí.');
      return;
    }
    if (criteriaLabels.includes(newCriterion.trim())) {
      alert('Tiêu chí này đã tồn tại.');
      return;
    }

    const newCriteriaLabels = [...criteriaLabels, newCriterion.trim()];
    const newSize = newCriteriaLabels.length;
    const newMatrix = Array(newSize)
      .fill()
      .map(() => Array(newSize).fill(1.0));

    // Copy ma trận hiện tại vào ma trận mới
    for (let i = 0; i < editableMatrix.length; i++) {
      for (let j = 0; j < editableMatrix[i].length; j++) {
        newMatrix[i][j] = editableMatrix[i][j];
      }
    }

    try {
      // Cập nhật backend
      await apiService.updateTchiUser(itemId, {
        criteria_list: newCriteriaLabels,
        comparison_matrix: newMatrix.flat(),
      });

      setCriteriaLabels(newCriteriaLabels);
      setEditableMatrix(newMatrix);
      if (onUpdateCriteriaList) {
        onUpdateCriteriaList(newCriteriaLabels);
      }
      if (onUpdateCriterionScores) {
        onUpdateCriterionScores(itemId, {
          ...criterionScores,
          [newCriterion.trim()]: 0.0,
        });
      }
      setNewCriterion('');
      alert(`Tiêu chí "${newCriterion.trim()}" đã được thêm.`);
    } catch (error) {
      console.error('Error adding criterion:', error);
      alert('Lỗi khi thêm tiêu chí: ' + error.message);
    }
  };
  
  const fetchCurrentData = async () => {
    try {
      const data = await apiService.fetchTchiUserAlternatives();
      const item = data.find(item => item.id === itemId);
      if (!item) {
        throw new Error(`Không tìm thấy phương án với ID ${itemId}`);
      }
      return item;
    } catch (error) {
      console.error('Error fetching current data:', error);
      throw error;
    }
  };

  const calculateCR = async (matrix, criteriaList) => {
    try {
      const flatMatrix = matrix.flat().map(val => parseFloat(val) || 1.0);
      const crData = await apiService.calculateCR({
        criteria_list: criteriaList,
        pairwise_matrix: flatMatrix,
      });
      return crData.consistency_ratio || 0.01;
    } catch (error) {
      console.error('Error calculating CR:', error);
      return 0.01;
    }
  };

  const handleDeleteCriterion = async () => {
    if (!selectedCriterion) {
      alert('Vui lòng chọn một tiêu chí.');
      return;
    }
    if (!window.confirm(`Bạn có chắc muốn xóa tiêu chí "${selectedCriterion}"?`)) return;

    try {
      // Lấy dữ liệu hiện tại từ backend
      const currentData = await fetchCurrentData();
      const currentCriteriaList = currentData.criteria_list || [];

      // Kiểm tra nếu criteria_list rỗng
      if (!currentCriteriaList.length) {
        setError('Danh sách tiêu chí hiện tại rỗng. Không thể xóa.');
        setCriteriaLabels([]);
        setEditableMatrix([]);
        if (onUpdateCriteriaList) onUpdateCriteriaList([]);
        if (onUpdateCriterionScores) onUpdateCriterionScores(itemId, {});
        setSelectedCriterion('');
        return;
      }

      // Kiểm tra đồng bộ
      if (currentCriteriaList.length !== criteriaLabels.length ||
          !currentCriteriaList.every(criterion => criteriaLabels.includes(criterion))) {
        setError('Danh sách tiêu chí không đồng bộ với backend. Vui lòng làm mới trang.');
        return;
      }

      // Kiểm tra tiêu chí có tồn tại không
      if (!currentCriteriaList.includes(selectedCriterion)) {
        setError(`Tiêu chí "${selectedCriterion}" không tồn tại trong tchi_user hiện tại.`);
        return;
      }

      const newCriteriaLabels = currentCriteriaList.filter(criterion => criterion !== selectedCriterion);
      const newSize = newCriteriaLabels.length;
      const newMatrix = Array(newSize)
        .fill()
        .map(() => Array(newSize).fill(1.0));

      const indexToDelete = currentCriteriaList.indexOf(selectedCriterion);
      for (let i = 0, newI = 0; i < editableMatrix.length; i++) {
        if (i === indexToDelete) continue;
        for (let j = 0, newJ = 0; j < editableMatrix[i].length; j++) {
          if (j === indexToDelete) continue;
          newMatrix[newI][newJ] = editableMatrix[i][j];
          newJ++;
        }
        newI++;
      }

      const updatedCriterionScores = { ...criterionScores };
      delete updatedCriterionScores[selectedCriterion];
      // Đảm bảo criterion_scores khớp với newCriteriaLabels
      const finalCriterionScores = {};
      newCriteriaLabels.forEach(criterion => {
        finalCriterionScores[criterion] = updatedCriterionScores[criterion] !== undefined
          ? updatedCriterionScores[criterion]
          : 0.0;
      });

      const newCR = newSize > 0 ? await calculateCR(newMatrix, newCriteriaLabels) : 0;
      const updateData = {
        criteria_list: newCriteriaLabels,
        comparison_matrix: newMatrix.flat(),
        criterion_scores: finalCriterionScores,
        consistency_ratio: newCR,
        final_score: null,
      };
      console.log('Deleting criterion, sending:', updateData);
      await apiService.updateTchiUser(itemId, updateData);

      setCriteriaLabels(newCriteriaLabels);
      setEditableMatrix(newMatrix);
      if (onUpdateCriteriaList) onUpdateCriteriaList(newCriteriaLabels);
      if (onUpdateCriterionScores) onUpdateCriterionScores(itemId, finalCriterionScores);
      setSelectedCriterion('');
      setError(null);
      alert(`Tiêu chí "${selectedCriterion}" đã được xóa.`);

      // Làm mới danh sách tiêu chí
      await fetchAllCriteria();
    } catch (error) {
      console.error('Error deleting criterion:', error);
      let errorMessage = 'Lỗi khi xóa tiêu chí: ' + error.message;
      if (error.message.includes('400')) {
        errorMessage = 'Tiêu chí không khớp hoặc dữ liệu không hợp lệ. Vui lòng làm mới trang và thử lại.';
      }
      setError(errorMessage);
    }
  };

  const handleEditCriterion = () => {
    if (!selectedCriterion) {
      alert('Vui lòng chọn một tiêu chí.');
      return;
    }
    setEditMode(true);
    setEditValue(selectedCriterion);
  };

  const handleSaveEditCriterion = async () => {
    if (!editValue.trim()) {
      alert('Tên tiêu chí không được để trống.');
      return;
    }
    if (editValue.trim() === selectedCriterion) {
      setEditMode(false);
      setEditValue('');
      return;
    }
    if (criteriaLabels.includes(editValue.trim())) {
      alert('Tên tiêu chí này đã tồn tại.');
      return;
    }

    try {
      // Lấy dữ liệu hiện tại từ backend
      const currentData = await fetchCurrentData();
      const currentCriteriaList = currentData.criteria_list || [];

      // Kiểm tra nếu criteria_list rỗng
      if (!currentCriteriaList.length) {
        setError('Danh sách tiêu chí hiện tại rỗng. Không thể chỉnh sửa.');
        return;
      }

      // Kiểm tra đồng bộ
      if (currentCriteriaList.length !== criteriaLabels.length ||
          !currentCriteriaList.every(criterion => criteriaLabels.includes(criterion))) {
        setError('Danh sách tiêu chí không đồng bộ với backend. Vui lòng làm mới trang.');
        return;
      }

      // Kiểm tra tiêu chí có tồn tại không
      if (!currentCriteriaList.includes(selectedCriterion)) {
        setError(`Tiêu chí "${selectedCriterion}" không tồn tại trong tchi_user hiện tại.`);
        return;
      }

      const newCriteriaLabels = currentCriteriaList.map(criterion =>
        criterion === selectedCriterion ? editValue.trim() : criterion
      );
      const updatedCriterionScores = { ...criterionScores };
      if (updatedCriterionScores[selectedCriterion] !== undefined) {
        updatedCriterionScores[editValue.trim()] = updatedCriterionScores[selectedCriterion];
        delete updatedCriterionScores[selectedCriterion];
      }

      // Đảm bảo criterion_scores khớp với newCriteriaLabels
      const finalCriterionScores = {};
      newCriteriaLabels.forEach(criterion => {
        finalCriterionScores[criterion] = updatedCriterionScores[criterion] !== undefined
          ? updatedCriterionScores[criterion]
          : 0.0;
      });

      const newCR = await calculateCR(editableMatrix, newCriteriaLabels);
      const updateData = {
        criteria_list: newCriteriaLabels,
        comparison_matrix: editableMatrix.flat(),
        criterion_scores: finalCriterionScores,
        consistency_ratio: newCR,
        final_score: null,
      };
      console.log('Editing criterion, sending:', updateData);
      await apiService.updateTchiUser(itemId, updateData);

      setCriteriaLabels(newCriteriaLabels);
      if (onUpdateCriteriaList) onUpdateCriteriaList(newCriteriaLabels);
      if (onUpdateCriterionScores) onUpdateCriterionScores(itemId, finalCriterionScores);
      setSelectedCriterion(editValue.trim());
      setEditMode(false);
      setEditValue('');
      setError(null);
      alert(`Tiêu chí "${selectedCriterion}" đã được đổi thành "${editValue.trim()}".`);

      // Làm mới danh sách tiêu chí
      await fetchAllCriteria();
    } catch (error) {
      console.error('Error editing criterion:', error);
      let errorMessage = 'Lỗi khi chỉnh sửa tiêu chí: ' + error.message;
      if (error.message.includes('400')) {
        errorMessage = 'Tiêu chí không khớp hoặc dữ liệu không hợp lệ. Vui lòng làm mới trang và thử lại.';
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="criteria-list" style={{ marginTop: '20px' }}>
      <h5>Danh sách tiêu chí:</h5>
      {error && (
        <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>
      )}
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          value={newCriterion}
          onChange={(e) => setNewCriterion(e.target.value)}
          placeholder="Nhập tiêu chí mới"
          style={{ padding: '5px', border: '1px solid #ccc', width: '200px' }}
        />
        <button
          onClick={handleAddCriterion}
          style={{ padding: '5px 10px', width: 'fit-content' }}
        >
          Thêm tiêu chí
        </button>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <select
          value={selectedCriterion}
          onChange={(e) => setSelectedCriterion(e.target.value)}
          style={{ padding: '5px', marginRight: '10px', width: '200px' }}
        >
          <option value="">Chọn tiêu chí</option>
          {allCriteria.map((criterion, index) => (
            <option key={index} value={criterion}>
              {criterion}
            </option>
          ))}
        </select>
        {selectedCriterion && (
          <>
            <button
              onClick={handleDeleteCriterion}
              style={{ padding: '5px 10px', marginRight: '5px', color: 'red' }}
            >
              Xóa
            </button>
            <button
              onClick={handleEditCriterion}
              style={{ padding: '5px 10px' }}
            >
              Sửa
            </button>
          </>
        )}
  
      </div>
      {editMode && selectedCriterion && (
        <div style={{ marginTop: '20px' }}>
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            style={{ padding: '5px', marginRight: '10px', border: '1px solid #ccc' }}
          />
          <button
            onClick={handleSaveEditCriterion}
            style={{ padding: '5px 10px', marginRight: '5px' }}
          >
            Lưu
          </button>
          <button
            onClick={() => {
              setEditMode(false);
              setEditValue('');
            }}
            style={{ padding: '5px 10px' }}
          >
            Hủy
          </button>
        </div>
      )}
    </div>
  );
};

export default CriterionList;
