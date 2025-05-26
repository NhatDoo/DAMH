// import React, { useState } from 'react';
// import * as apiService from '../../services/apiService';
// <apiService />

// const AlternativeMatrix = ({
//   alternativesList,
//   alternativeMatrix,
//   setAlternativeMatrix,
//   setRankedResults,
//   setShowAlternativeInput,
// }) => {
//   const [tempAlternativeValue, setTempAlternativeValue] = useState({ rowIdx: -1, colIdx: -1, value: '' });

//   const parseFraction = (value) => {
//     if (value.includes('/')) {
//       const [numerator, denominator] = value.split('/').map(num => parseFloat(num.trim()));
//       if (denominator === 0 || isNaN(numerator) || isNaN(denominator)) {
//         alert('Phân số không hợp lệ. Vui lòng nhập tử số và mẫu số là số, mẫu số khác 0.');
//         return null;
//       }
//       return numerator / denominator;
//     }
//     const numValue = parseFloat(value);
//     if (isNaN(numValue)) {
//       alert('Giá trị không hợp lệ. Vui lòng nhập số hoặc phân số (ví dụ: 1/2).');
//       return null;
//     }
//     return numValue;
//   };

//   const handleAlternativeMatrixChange = (rowIdx, colIdx, value) => {
//     setTempAlternativeValue({ rowIdx, colIdx, value });
//   };

//   const handleAlternativeBlur = () => {
//     const { rowIdx, colIdx, value } = tempAlternativeValue;
//     if (rowIdx === -1 || colIdx === -1) return;

//     if (value === '') {
//       const newMatrix = alternativeMatrix.map(row => [...row]);
//       newMatrix[rowIdx][colIdx] = '';
//       newMatrix[colIdx][rowIdx] = '';
//       setAlternativeMatrix(newMatrix);
//       setTempAlternativeValue({ rowIdx: -1, colIdx: -1, value: '' });
//       return;
//     }

//     const newValue = parseFraction(value);
//     if (newValue === null || newValue < 0.111 || newValue > 9) {
//       setTempAlternativeValue({ rowIdx: -1, colIdx: -1, value: '' });
//       return;
//     }

//     const newMatrix = alternativeMatrix.map(row => [...row]);
//     newMatrix[rowIdx][colIdx] = newValue;
//     if (newValue === '') {
//       newMatrix[colIdx][rowIdx] = '';
//     } else {
//       newMatrix[colIdx][rowIdx] = 1 / newValue;
//     }

//     setAlternativeMatrix(newMatrix);
//     setTempAlternativeValue({ rowIdx: -1, colIdx: -1, value: '' });
//   };

//   const handleAlternativeKeyPress = (e) => {
//     if (e.key === 'Enter') {
//       handleAlternativeBlur();
//     }
//   };

//   const handleRankAlternatives = async () => {
//     const size = alternativesList.length;
//     if (size < 2) {
//       alert('Vui lòng thêm ít nhất 2 phương án để xếp hạng.');
//       return;
//     }

//     const isValidMatrix = alternativeMatrix.every(row =>
//       row.every(val => typeof val === 'number' && val >= 0.111 && val <= 9)
//     );

//     if (!isValidMatrix) {
//       alert('Ma trận chứa giá trị không hợp lệ hoặc rỗng. Giá trị phải từ 0.111 đến 9.');
//       return;
//     }

//     try {
//       const flatMatrix = alternativeMatrix.flat();
//       const data = {
//         alternatives_list: alternativesList,
//         pairwise_matrix: flatMatrix,
//       };
//       const response = await apiService.rankAlternativesDirect(data);

//       const rankedAlternatives = response.ranked_alternatives;
//       const consistencyRatio = response.consistency_ratio;

//       if (consistencyRatio > 0.1) {
//         alert(`Consistency Ratio (CR = ${consistencyRatio.toFixed(2)}) vượt quá 0.1. Vui lòng nhập lại ma trận để đảm bảo nhất quán.`);
//         return;
//       }

//       setRankedResults({
//         alternatives: rankedAlternatives,
//         consistencyRatio,
//       });
//       setShowAlternativeInput(false);
//     } catch (error) {
//       console.error('Error ranking alternatives:', error);
//       alert(`Có lỗi khi xếp hạng: ${error.message}`);
//     }
//   };

//   return (
//     <div className="alternative-matrix">
//       <h5>Ma trận so sánh đôi (Phương án):</h5>
//       <table>
//         <thead>
//           <tr>
//             <th></th>
//             {alternativesList.map((alt, idx) => (
//               <th key={idx}>{alt}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {alternativeMatrix.map((row, rowIdx) => (
//             <tr key={rowIdx}>
//               <th>{alternativesList[rowIdx]}</th>
//               {row.map((value, colIdx) => (
//                 <td key={colIdx} className={typeof value === 'number' && value > 1 ? 'highlight' : ''}>
//                   {rowIdx < colIdx ? (
//                     <input
//                       type="text"
//                       value={tempAlternativeValue.rowIdx === rowIdx && tempAlternativeValue.colIdx === colIdx ? tempAlternativeValue.value : (value === '' ? '' : value)}
//                       onChange={(e) => handleAlternativeMatrixChange(rowIdx, colIdx, e.target.value)}
//                       onBlur={handleAlternativeBlur}
//                       onKeyPress={handleAlternativeKeyPress}
//                       style={{ width: '80px', padding: '5px', border: '1px solid #ccc', fontSize: '14px' }}
//                       placeholder="0.111 - 9 hoặc 1/3"
//                     />
//                   ) : (
//                     (typeof value === 'number' ? value.toFixed(2) : value || '1.00')
//                   )}
//                 </td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//       <button
//         onClick={handleRankAlternatives}
//         style={{ marginTop: '10px', padding: '5px 10px' }}
//       >
//         Xếp hạng
//       </button>
//     </div>
//   );
// };

// export default AlternativeMatrix;
























// import React, { useState, useEffect } from 'react';
// import * as apiService from '../../services/apiService';

// const AlternativeMatrix = ({
//   alternativesList = [],
//   setRankedResults,
//   setShowAlternativeInput,
//   criteriaList = [],
//   setCriteriaList,
//   criteriaMatrix = [],
//   setCriteriaMatrix,
// }) => {
//   const [tempAlternativeValue, setTempAlternativeValue] = useState({ rowIdx: -1, colIdx: -1, value: '', criterionIdx: -1 });
//   const [tempCriterionValue, setTempCriterionValue] = useState('');
//   const [tempCriteriaMatrixValue, setTempCriteriaMatrixValue] = useState({ rowIdx: -1, colIdx: -1, value: '' });
//   const [alternativeMatrices, setAlternativeMatrices] = useState([]);

//   useEffect(() => {
//     const size = alternativesList.length;
//     const newMatrices = criteriaList.map(() =>
//       Array(size).fill().map(() => Array(size).fill(1.0))
//     );
//     setAlternativeMatrices(newMatrices);
//   }, [alternativesList, criteriaList]);

//   useEffect(() => {
//     const size = criteriaList.length;
//     const newMatrix = Array(size).fill().map(() => Array(size).fill(1.0));
//     setCriteriaMatrix(newMatrix);
//   }, [criteriaList, setCriteriaMatrix]);

//   const parseFraction = (value) => {
//     if (value.includes('/')) {
//       const [numerator, denominator] = value.split('/').map(num => parseFloat(num.trim()));
//       if (denominator === 0 || isNaN(numerator) || isNaN(denominator)) {
//         alert('Phân số không hợp lệ. Vui lòng nhập tử số và mẫu số là số, mẫu số khác 0.');
//         return null;
//       }
//       return numerator / denominator;
//     }
//     const numValue = parseFloat(value);
//     if (isNaN(numValue)) {
//       alert('Giá trị không hợp lệ. Vui lòng nhập số hoặc phân số (ví dụ: 1/2).');
//       return null;
//     }
//     return numValue;
//   };

//   const handleAddCriterion = () => {
//     if (!tempCriterionValue.trim()) {
//       alert('Vui lòng nhập tên tiêu chí.');
//       return;
//     }
//     if (criteriaList.includes(tempCriterionValue.trim())) {
//       alert('Tiêu chí này đã tồn tại.');
//       return;
//     }
//     setCriteriaList([...criteriaList, tempCriterionValue.trim()]);
//     setTempCriterionValue('');
//   };

//   const handleCriteriaMatrixChange = (rowIdx, colIdx, value) => {
//     setTempCriteriaMatrixValue({ rowIdx, colIdx, value });
//   };

//   const handleCriteriaMatrixBlur = () => {
//     const { rowIdx, colIdx, value } = tempCriteriaMatrixValue;
//     if (rowIdx === -1 || colIdx === -1) return;

//     if (value === '') {
//       const newMatrix = criteriaMatrix.map(row => [...row]);
//       newMatrix[rowIdx][colIdx] = '';
//       newMatrix[colIdx][rowIdx] = '';
//       setCriteriaMatrix(newMatrix);
//       setTempCriteriaMatrixValue({ rowIdx: -1, colIdx: -1, value: '' });
//       return;
//     }

//     const newValue = parseFraction(value);
//     if (newValue === null || newValue < 0.111 || newValue > 9) {
//       setTempCriteriaMatrixValue({ rowIdx: -1, colIdx: -1, value: '' });
//       return;
//     }

//     const newMatrix = criteriaMatrix.map(row => [...row]);
//     newMatrix[rowIdx][colIdx] = newValue;
//     if (newValue === '') {
//       newMatrix[colIdx][rowIdx] = '';
//     } else {
//       newMatrix[colIdx][rowIdx] = 1 / newValue;
//     }

//     setCriteriaMatrix(newMatrix);
//     setTempCriteriaMatrixValue({ rowIdx: -1, colIdx: -1, value: '' });
//   };

//   const handleCriteriaMatrixKeyPress = (e) => {
//     if (e.key === 'Enter') {
//       handleCriteriaMatrixBlur();
//     }
//   };

//   const handleAlternativeMatrixChange = (criterionIdx, rowIdx, colIdx, value) => {
//     setTempAlternativeValue({ criterionIdx, rowIdx, colIdx, value });
//   };

//   const handleAlternativeBlur = () => {
//     const { criterionIdx, rowIdx, colIdx, value } = tempAlternativeValue;
//     if (criterionIdx === -1 || rowIdx === -1 || colIdx === -1) return;

//     if (value === '') {
//       const newMatrices = alternativeMatrices.map((matrix, idx) =>
//         idx === criterionIdx ? matrix.map(row => [...row]) : matrix
//       );
//       newMatrices[criterionIdx][rowIdx][colIdx] = '';
//       newMatrices[criterionIdx][colIdx][rowIdx] = '';
//       setAlternativeMatrices(newMatrices);
//       setTempAlternativeValue({ criterionIdx: -1, rowIdx: -1, colIdx: -1, value: '' });
//       return;
//     }

//     const newValue = parseFraction(value);
//     if (newValue === null || newValue < 0.111 || newValue > 9) {
//       setTempAlternativeValue({ criterionIdx: -1, rowIdx: -1, colIdx: -1, value: '' });
//       return;
//     }

//     const newMatrices = alternativeMatrices.map((matrix, idx) =>
//       idx === criterionIdx ? matrix.map(row => [...row]) : matrix
//     );
//     newMatrices[criterionIdx][rowIdx][colIdx] = newValue;
//     if (newValue === '') {
//       newMatrices[criterionIdx][colIdx][rowIdx] = '';
//     } else {
//       newMatrices[criterionIdx][colIdx][rowIdx] = 1 / newValue;
//     }

//     setAlternativeMatrices(newMatrices);
//     setTempAlternativeValue({ criterionIdx: -1, rowIdx: -1, colIdx: -1, value: '' });
//   };

//   const handleAlternativeKeyPress = (e) => {
//     if (e.key === 'Enter') {
//       handleAlternativeBlur();
//     }
//   };

//   const handleRankAlternatives = async () => {
//     const sizeAlternatives = alternativesList.length;
//     const sizeCriteria = criteriaList.length;

//     if (sizeAlternatives < 2) {
//       alert('Vui lòng thêm ít nhất 2 phương án để xếp hạng.');
//       return;
//     }
//     if (sizeCriteria < 1) {
//       alert('Vui lòng cung cấp ít nhất 1 tiêu chí.');
//       return;
//     }

//     const expectedCriteriaMatrixSize = sizeCriteria * sizeCriteria;
//     if (criteriaMatrix.length !== sizeCriteria || !criteriaMatrix.every(row => row.length === sizeCriteria)) {
//       alert(`Ma trận tiêu chí không hợp lệ. Kích thước mong đợi: ${sizeCriteria}x${sizeCriteria}.`);
//       return;
//     }

//     const expectedAltMatrixSize = sizeAlternatives * sizeAlternatives;
//     if (alternativeMatrices.length !== sizeCriteria || alternativeMatrices.some(matrix => matrix.length !== sizeAlternatives || matrix.some(row => row.length !== sizeAlternatives))) {
//       alert(`Ma trận phương án không hợp lệ. Kích thước mong đợi: ${sizeAlternatives}x${sizeAlternatives} cho mỗi tiêu chí.`);
//       return;
//     }

//     const isValidCriteriaMatrix = criteriaMatrix.every(row =>
//       row.every(val => typeof val === 'number' && val >= 0.111 && val <= 9)
//     );
//     const isValidAlternativeMatrices = alternativeMatrices.every(matrix =>
//       matrix.every(row => row.every(val => typeof val === 'number' && val >= 0.111 && val <= 9))
//     );

//     if (!isValidCriteriaMatrix) {
//       alert('Ma trận tiêu chí chứa giá trị không hợp lệ. Giá trị phải từ 0.111 đến 9.');
//       return;
//     }
//     if (!isValidAlternativeMatrices) {
//       alert('Một hoặc nhiều ma trận phương án chứa giá trị không hợp lệ hoặc rỗng. Giá trị phải từ 0.111 đến 9.');
//       return;
//     }

//     try {
//       const flatCriteriaMatrix = criteriaMatrix.flat();
//       const flatAlternativeMatrices = alternativeMatrices.map(matrix => matrix.flat());
//       const data = {
//         alternatives_list: alternativesList,
//         criteria_list: criteriaList,
//         criteria_matrix: flatCriteriaMatrix,
//         alternative_matrices: flatAlternativeMatrices,
//       };
//       console.log('Sending data to rankAlternativesDirect:', data);
//       const response = await apiService.rankAlternativesDirect(data);

//       const rankedAlternatives = response.ranked_alternatives;
//       const consistencyRatioCriteria = response.criteria_consistency_ratio;
//       const consistencyRatiosAlternatives = response.alternative_consistency_ratios;

//       if (consistencyRatioCriteria > 0.1) {
//         alert(`Consistency Ratio của ma trận tiêu chí (CR = ${consistencyRatioCriteria.toFixed(2)}) vượt quá 0.1. Vui lòng nhập lại ma trận tiêu chí để đảm bảo nhất quán.`);
//         return;
//       }
//       if (consistencyRatiosAlternatives.some(cr => cr > 0.1)) {
//         alert(`Consistency Ratio của một hoặc nhiều ma trận phương án vượt quá 0.1. Vui lòng kiểm tra lại:\n${consistencyRatiosAlternatives.map((cr, idx) => `Tiêu chí ${criteriaList[idx]}: CR = ${cr.toFixed(2)}`).join('\n')}`);
//         return;
//       }

//       setRankedResults({
//         alternatives: rankedAlternatives,
//         consistencyRatio: consistencyRatioCriteria, // Sử dụng consistencyRatioCriteria làm consistencyRatio
//         consistencyRatiosAlternatives: consistencyRatiosAlternatives,
//       });
//       setShowAlternativeInput(false);
//     } catch (error) {
//       console.error('Error ranking alternatives:', error);
//       alert(`Có lỗi khi xếp hạng: ${error.message}`);
//     }
//   };

//   return (
//     <div className="alternative-matrix">
//       <div style={{ marginBottom: '20px' }}>
//         <h5>Thêm tiêu chí</h5>
//         <input
//           type="text"
//           value={tempCriterionValue}
//           onChange={(e) => setTempCriterionValue(e.target.value)}
//           placeholder="Nhập tên tiêu chí"
//           style={{ width: '200px', padding: '5px', marginRight: '10px' }}
//         />
//         <button
//           onClick={handleAddCriterion}
//           style={{ padding: '5px 10px' }}
//         >
//           Thêm
//         </button>
//       </div>

//       {criteriaList.length > 0 && (
//         <div style={{ marginBottom: '20px' }}>
//           <h5>Danh sách tiêu chí:</h5>
//           <ul>
//             {criteriaList.map((criterion, idx) => (
//               <li key={idx}>{criterion}</li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {criteriaList.length > 1 && (
//         <div style={{ marginBottom: '20px' }}>
//           <h5>Ma trận so sánh đôi (Tiêu chí):</h5>
//           <table>
//             <thead>
//               <tr>
//                 <th></th>
//                 {criteriaList.map((crit, idx) => (
//                   <th key={idx}>{crit}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {criteriaMatrix.map((row, rowIdx) => (
//                 <tr key={rowIdx}>
//                   <th>{criteriaList[rowIdx]}</th>
//                   {row.map((value, colIdx) => (
//                     <td key={colIdx} className={typeof value === 'number' && value > 1 ? 'highlight' : ''}>
//                       {rowIdx < colIdx ? (
//                         <input
//                           type="text"
//                           value={
//                             tempCriteriaMatrixValue.rowIdx === rowIdx && tempCriteriaMatrixValue.colIdx === colIdx
//                               ? tempCriteriaMatrixValue.value
//                               : (value === '' ? '' : value.toFixed(2))
//                           }
//                           onChange={(e) => handleCriteriaMatrixChange(rowIdx, colIdx, e.target.value)}
//                           onBlur={handleCriteriaMatrixBlur}
//                           onKeyPress={handleCriteriaMatrixKeyPress}
//                           style={{ width: '80px', padding: '5px', border: '1px solid #ccc', fontSize: '14px' }}
//                           placeholder="0.111 - 9 hoặc 1/3"
//                         />
//                       ) : (
//                         (typeof value === 'number' ? value.toFixed(2) : value || '1.00')
//                       )}
//                     </td>
//                   ))}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {criteriaList.length > 0 && alternativesList.length > 0 && alternativeMatrices.map((matrix, criterionIdx) => (
//         <div key={criterionIdx} style={{ marginBottom: '20px' }}>
//           <h5>Ma trận so sánh đôi (Phương án) - Tiêu chí: {criteriaList[criterionIdx]}</h5>
//           <table>
//             <thead>
//               <tr>
//                 <th></th>
//                 {alternativesList.map((alt, idx) => (
//                   <th key={idx}>{alt}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {matrix.map((row, rowIdx) => (
//                 <tr key={rowIdx}>
//                   <th>{alternativesList[rowIdx]}</th>
//                   {row.map((value, colIdx) => (
//                     <td key={colIdx} className={typeof value === 'number' && value > 1 ? 'highlight' : ''}>
//                       {rowIdx < colIdx ? (
//                         <input
//                           type="text"
//                           value={
//                             tempAlternativeValue.criterionIdx === criterionIdx &&
//                             tempAlternativeValue.rowIdx === rowIdx &&
//                             tempAlternativeValue.colIdx === colIdx
//                               ? tempAlternativeValue.value
//                               : (value === '' ? '' : value.toFixed(2))
//                           }
//                           onChange={(e) => handleAlternativeMatrixChange(criterionIdx, rowIdx, colIdx, e.target.value)}
//                           onBlur={handleAlternativeBlur}
//                           onKeyPress={handleAlternativeKeyPress}
//                           style={{ width: '80px', padding: '5px', border: '1px solid #ccc', fontSize: '14px' }}
//                           placeholder="0.111 - 9 hoặc 1/3"
//                         />
//                       ) : (
//                         (typeof value === 'number' ? value.toFixed(2) : value || '1.00')
//                       )}
//                     </td>
//                   ))}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       ))}

//       {criteriaList.length > 0 && alternativesList.length > 0 && (
//         <button
//           onClick={handleRankAlternatives}
//           style={{ marginTop: '10px', padding: '5px 10px' }}
//         >
//           Xếp hạng
//         </button>
//       )}
//     </div>
//   );
// };

// export default AlternativeMatrix;
















import React, { useState, useEffect } from 'react';
import * as apiService from '../../services/apiService';

const AlternativeMatrix = ({
  alternativesList = [],
  setRankedResults,
  setShowAlternativeInput,
  criteriaList = [],
  setCriteriaList,
  criteriaMatrix = [],
  setCriteriaMatrix,
}) => {
  const [tempAlternativeValue, setTempAlternativeValue] = useState({ rowIdx: -1, colIdx: -1, value: '', criterionIdx: -1 });
  const [tempCriterionValue, setTempCriterionValue] = useState('');
  const [alternativeMatrices, setAlternativeMatrices] = useState([]);

  useEffect(() => {
    const size = alternativesList.length;
    const newMatrices = criteriaList.map(() =>
      Array(size).fill().map(() => Array(size).fill(1.0))
    );
    setAlternativeMatrices(newMatrices);
  }, [alternativesList, criteriaList]);

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

  const handleAddCriterion = () => {
    if (!tempCriterionValue.trim()) {
      alert('Vui lòng nhập tên tiêu chí.');
      return;
    }
    if (criteriaList.includes(tempCriterionValue.trim())) {
      alert('Tiêu chí này đã tồn tại.');
      return;
    }
    const newCriteriaList = [...criteriaList, tempCriterionValue.trim()];
    setCriteriaList(newCriteriaList);

    // Cập nhật criteriaMatrix khi thêm tiêu chí mới
    const newSize = newCriteriaList.length;
    const newMatrix = Array(newSize)
      .fill()
      .map(() => Array(newSize).fill(1.0));
    for (let i = 0; i < criteriaMatrix.length; i++) {
      for (let j = 0; j < criteriaMatrix[i].length; j++) {
        newMatrix[i][j] = criteriaMatrix[i][j];
      }
    }
    setCriteriaMatrix(newMatrix);

    setTempCriterionValue('');
  };

  const handleAlternativeMatrixChange = (criterionIdx, rowIdx, colIdx, value) => {
    setTempAlternativeValue({ criterionIdx, rowIdx, colIdx, value });
  };

  const handleAlternativeBlur = () => {
    const { criterionIdx, rowIdx, colIdx, value } = tempAlternativeValue;
    if (criterionIdx === -1 || rowIdx === -1 || colIdx === -1) return;

    if (value === '') {
      const newMatrices = alternativeMatrices.map((matrix, idx) =>
        idx === criterionIdx ? matrix.map(row => [...row]) : matrix
      );
      newMatrices[criterionIdx][rowIdx][colIdx] = '';
      newMatrices[criterionIdx][colIdx][rowIdx] = '';
      setAlternativeMatrices(newMatrices);
      setTempAlternativeValue({ criterionIdx: -1, rowIdx: -1, colIdx: -1, value: '' });
      return;
    }

    const newValue = parseFraction(value);
    if (newValue === null || newValue < 0.111 || newValue > 9) {
      setTempAlternativeValue({ criterionIdx: -1, rowIdx: -1, colIdx: -1, value: '' });
      return;
    }

    const newMatrices = alternativeMatrices.map((matrix, idx) =>
      idx === criterionIdx ? matrix.map(row => [...row]) : matrix
    );
    newMatrices[criterionIdx][rowIdx][colIdx] = newValue;
    if (newValue === '') {
      newMatrices[criterionIdx][colIdx][rowIdx] = '';
    } else {
      newMatrices[criterionIdx][colIdx][rowIdx] = 1 / newValue;
    }

    setAlternativeMatrices(newMatrices);
    setTempAlternativeValue({ criterionIdx: -1, rowIdx: -1, colIdx: -1, value: '' });
  };

  const handleAlternativeKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAlternativeBlur();
    }
  };

  const handleRankAlternatives = async () => {
    const sizeAlternatives = alternativesList.length;
    const sizeCriteria = criteriaList.length;

    if (sizeAlternatives < 2) {
      alert('Vui lòng thêm ít nhất 2 phương án để xếp hạng.');
      return;
    }
    if (sizeCriteria < 1) {
      alert('Vui lòng cung cấp ít nhất 1 tiêu chí.');
      return;
    }

    const expectedCriteriaMatrixSize = sizeCriteria * sizeCriteria;
    if (criteriaMatrix.length !== sizeCriteria || !criteriaMatrix.every(row => row.length === sizeCriteria)) {
      alert(`Ma trận tiêu chí không hợp lệ. Kích thước mong đợi: ${sizeCriteria}x${sizeCriteria}.`);
      return;
    }

    const expectedAltMatrixSize = sizeAlternatives * sizeAlternatives;
    if (alternativeMatrices.length !== sizeCriteria || alternativeMatrices.some(matrix => matrix.length !== sizeAlternatives || matrix.some(row => row.length !== sizeAlternatives))) {
      alert(`Ma trận phương án không hợp lệ. Kích thước mong đợi: ${sizeAlternatives}x${sizeAlternatives} cho mỗi tiêu chí.`);
      return;
    }

    const isValidCriteriaMatrix = criteriaMatrix.every(row =>
      row.every(val => typeof val === 'number' && val >= 0.111 && val <= 9)
    );
    const isValidAlternativeMatrices = alternativeMatrices.every(matrix =>
      matrix.every(row => row.every(val => typeof val === 'number' && val >= 0.111 && val <= 9))
    );

    if (!isValidCriteriaMatrix) {
      alert('Ma trận tiêu chí chứa giá trị không hợp lệ. Giá trị phải từ 0.111 đến 9.');
      return;
    }
    if (!isValidAlternativeMatrices) {
      alert('Một hoặc nhiều ma trận phương án chứa giá trị không hợp lệ hoặc rỗng. Giá trị phải từ 0.111 đến 9.');
      return;
    }

    try {
      const flatCriteriaMatrix = criteriaMatrix.flat();
      const flatAlternativeMatrices = alternativeMatrices.map(matrix => matrix.flat());
      const data = {
        alternatives_list: alternativesList,
        criteria_list: criteriaList,
        criteria_matrix: flatCriteriaMatrix,
        alternative_matrices: flatAlternativeMatrices,
      };
      console.log('Sending data to rankAlternativesDirect:', data);
      const response = await apiService.rankAlternativesDirect(data);

      const rankedAlternatives = response.ranked_alternatives;
      const consistencyRatioCriteria = response.criteria_consistency_ratio;
      const consistencyRatiosAlternatives = response.alternative_consistency_ratios;

      if (consistencyRatioCriteria > 0.1) {
        alert(`Consistency Ratio của ma trận tiêu chí (CR = ${consistencyRatioCriteria.toFixed(2)}) vượt quá 0.1. Ma trận tiêu chí từ API không nhất quán.`);
        return;
      }
      if (consistencyRatiosAlternatives.some(cr => cr > 0.1)) {
        alert(`Consistency Ratio của một hoặc nhiều ma trận phương án vượt quá 0.1. Vui lòng kiểm tra lại:\n${consistencyRatiosAlternatives.map((cr, idx) => `Tiêu chí ${criteriaList[idx]}: CR = ${cr.toFixed(2)}`).join('\n')}`);
        return;
      }

      setRankedResults({
        alternatives: rankedAlternatives,
        consistencyRatio: consistencyRatioCriteria,
        consistencyRatiosAlternatives: consistencyRatiosAlternatives,
      });
      setShowAlternativeInput(false);
    } catch (error) {
      console.error('Error ranking alternatives:', error);
      alert(`Có lỗi khi xếp hạng: ${error.message}`);
    }
  };

  return (
    <div className="alternative-matrix">
      {criteriaList.length > 0 && alternativesList.length > 0 && alternativeMatrices.map((matrix, criterionIdx) => (
        <div key={criterionIdx} style={{ marginBottom: '20px' }}>
          <h5>Ma trận so sánh đôi (Phương án) - Tiêu chí: {criteriaList[criterionIdx]}</h5>
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
              {matrix.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <th>{alternativesList[rowIdx]}</th>
                  {row.map((value, colIdx) => (
                    <td key={colIdx} className={typeof value === 'number' && value > 1 ? 'highlight' : ''}>
                      {rowIdx < colIdx ? (
                        <input
                          type="text"
                          value={
                            tempAlternativeValue.criterionIdx === criterionIdx &&
                            tempAlternativeValue.rowIdx === rowIdx &&
                            tempAlternativeValue.colIdx === colIdx
                              ? tempAlternativeValue.value
                              : (value === '' ? '' : value.toFixed(2))
                          }
                          onChange={(e) => handleAlternativeMatrixChange(criterionIdx, rowIdx, colIdx, e.target.value)}
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
        </div>
      ))}

      {criteriaList.length > 0 && alternativesList.length > 0 && (
        <button
          onClick={handleRankAlternatives}
          style={{ marginTop: '10px', padding: '5px 10px' }}
        >
          Xếp hạng
        </button>
      )}
    </div>
  );
};

export default AlternativeMatrix;