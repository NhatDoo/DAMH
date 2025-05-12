// import React, { useState, useEffect } from 'react';
// import * as apiService from '../../services/apiService';

// const ComparisonMatrix = ({ itemId }) => {
//   const [matrix, setMatrix] = useState([]);
//   const [criteriaLabels, setCriteriaLabels] = useState([]);
//   const [currentCR, setCurrentCR] = useState(0.01);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         console.log('Fetching tchi_user data for itemId:', itemId);
//         const data = await apiService.fetchTchiUserAlternatives();
//         console.log('API Response:', data);

//         const item = data.find((item) => item.id === itemId);
//         if (!item) {
//           console.warn('Item not found for itemId:', itemId);
//           setError(`Không tìm thấy phương án với ID ${itemId}.`);
//           setMatrix([]);
//           setCriteriaLabels([]);
//           setCurrentCR(0.01);
//           return;
//         }

//         const { criteria_comparison_matrix, criteria_list, consistency_ratio } = item;
//         const size = criteria_list?.length || 0;

//         console.log('Item Data:', { criteria_comparison_matrix, criteria_list, consistency_ratio, size });

//         if (!criteria_list || criteria_list.length === 0) {
//           console.warn('Empty criteria_list:', criteria_list);
//           setError('Danh sách tiêu chí rỗng.');
//           setMatrix([]);
//           setCriteriaLabels([]);
//           setCurrentCR(0.01);
//           return;
//         }

//         const matrix2D = [];
//         if (
//           criteria_comparison_matrix &&
//           Array.isArray(criteria_comparison_matrix) &&
//           criteria_comparison_matrix.length === size * size
//         ) {
//           for (let i = 0; i < size; i++) {
//             matrix2D.push(criteria_comparison_matrix.slice(i * size, (i + 1) * size));
//           }
//           console.log('Converted matrix2D:', matrix2D);
//         } else {
//           console.warn('Invalid criteria_comparison_matrix:', criteria_comparison_matrix);
//           setError(
//             `Ma trận không hợp lệ. Kích thước mong đợi: ${size * size}, thực tế: ${
//               criteria_comparison_matrix?.length || 0
//             }`
//           );
//           setMatrix([]);
//           setCriteriaLabels(criteria_list);
//           setCurrentCR(consistency_ratio || 0.01);
//           return;
//         }

//         setMatrix(matrix2D);
//         setCriteriaLabels(criteria_list);
//         setCurrentCR(consistency_ratio || 0.01);
//       } catch (err) {
//         console.error('Error fetching tchi_user data:', err);
//         setError('Không thể tải dữ liệu ma trận từ API: ' + err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [itemId]);

//   const handleMatrixChange = (rowIndex, colIndex, value) => {
//     console.log(`handleMatrixChange: row=${rowIndex}, col=${colIndex}, value=${value}`);

//     // Cho phép ô rỗng tạm thời
//     if (value === '') {
//       const newMatrix = matrix.map((row, rIdx) =>
//         row.map((cell, cIdx) => {
//           if (rIdx === rowIndex && cIdx === colIndex) {
//             return '';
//           }
//           if (rIdx === colIndex && cIdx === rowIndex) {
//             return '';
//           }
//           return cell;
//         })
//       );
//       setMatrix(newMatrix);
//       return;
//     }

//     // Kiểm tra giá trị hợp lệ
//     const num = parseFloat(value);
//     if (isNaN(num) || num <= 0 || num > 9) {
//       alert('Giá trị phải từ 0.1 đến 9.');
//       return;
//     }

//     // Cập nhật ma trận
//     const newMatrix = matrix.map((row, rIdx) =>
//       row.map((cell, cIdx) => {
//         if (rIdx === rowIndex && cIdx === colIndex) {
//           return num;
//         }
//         if (rIdx === colIndex && cIdx === rowIndex) {
//           return 1 / num; // Đảm bảo ma trận đối xứng
//         }
//         return cell;
//       })
//     );

//     setMatrix(newMatrix);
//   };

//   const handleSaveMatrix = async () => {
//     try {
//       // Kiểm tra giá trị không hợp lệ
//       const hasInvalidValue = matrix.flat().some((val) => val === '' || isNaN(parseFloat(val)));
//       if (hasInvalidValue) {
//         alert('Vui lòng điền đầy đủ các giá trị hợp lệ (từ 0.1 đến 9) trước khi lưu.');
//         return;
//       }

//       // Chuyển ma trận thành mảng 1 chiều
//       const flatMatrix = matrix.flat().map((val) => parseFloat(val));
//       // Kiểm tra giá trị 0 hoặc âm
//       if (flatMatrix.some((val) => val <= 0)) {
//         alert('Ma trận chứa giá trị không hợp lệ (phải lớn hơn 0).');
//         return;
//       }

//       console.log('Sending to calculateCR:', { criteria_list: criteriaLabels, pairwise_matrix: flatMatrix });

//       // Tính CR qua API
//       const crData = await apiService.calculateCR({ criteria_list: criteriaLabels, pairwise_matrix: flatMatrix });
//       console.log('Calculated CR:', crData);
//       const newCR = crData.consistency_ratio || 0.01;
//       setCurrentCR(newCR);

//       // Lưu ma trận và CR
//       const updateData = {
//         comparison_matrix: flatMatrix,
//         consistency_ratio: newCR,
//       };

//       await apiService.updateTchiUser(itemId, updateData);
//       alert('Ma trận đã được cập nhật thành công!');
//       setIsEditing(false);
//     } catch (err) {
//       console.error('Error saving matrix or calculating CR:', err);
//       let errorMessage = 'Lỗi khi lưu ma trận hoặc tính CR: ' + err.message;
//       if (err.message.includes('422')) {
//         errorMessage = 'Dữ liệu gửi không hợp lệ. Vui lòng kiểm tra ma trận và tiêu chí.';
//       }
//       alert(errorMessage);
//     }
//   };

//   return (
//     <div className="comparison-matrix">
//       <h5>Ma trận so sánh đôi (Tiêu chí):</h5>
//       <button
//         onClick={() => setIsEditing(!isEditing)}
//         style={{ marginBottom: '10px' }}
//       >
//         {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa ma trận'}
//       </button>
//       {loading ? (
//         <p>Đang tải dữ liệu...</p>
//       ) : error ? (
//         <p>{error}</p>
//       ) : matrix.length > 0 && criteriaLabels.length > 0 ? (
//         <>
//           <table>
//             <thead>
//               <tr>
//                 <th></th>
//                 {criteriaLabels.map((label, idx) => (
//                   <th key={idx}>{label}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {matrix.map((row, rowIdx) => (
//                 <tr key={rowIdx}>
//                   <th>{criteriaLabels[rowIdx]}</th>
//                   {Array.isArray(row) ? (
//                     row.map((value, colIdx) => (
//                       <td
//                         key={colIdx}
//                         className={typeof value === 'number' && value > 1 ? 'highlight' : ''}
//                       >
//                         {isEditing && rowIdx < colIdx ? (
//                           <input
//                             type="number"
//                             step="0.1"
//                             min="0.1"
//                             max="9"
//                             value={value === '' ? '' : typeof value === 'number' ? value : value}
//                             onChange={(e) => handleMatrixChange(rowIdx, colIdx, e.target.value)}
//                             style={{ width: '60px', textAlign: 'center' }}
//                             onFocus={(e) => e.target.select()}
//                           />
//                         ) : (
//                           (typeof value === 'number' ? value.toFixed(2) : value || '1.00')
//                         )}
//                       </td>
//                     ))
//                   ) : (
//                     <td colSpan={criteriaLabels.length}>Dữ liệu ma trận không hợp lệ</td>
//                   )}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           {isEditing && (
//             <button
//               onClick={handleSaveMatrix}
//               style={{ marginTop: '10px' }}
//             >
//               Lưu ma trận
//             </button>
//           )}
//         </>
//       ) : (
//         <p>Không có dữ liệu ma trận để hiển thị.</p>
//       )}
//       <div className="consistency-ratio">
//         Consistency Ratio (CR): <span>{(currentCR || 0.01).toFixed(2)}</span>{' '}
//         {(currentCR || 0.01) <= 0.1 ? '(Nhất quán)' : '(Không nhất quán)'}
//       </div>
//     </div>
//   );
// };

// export default ComparisonMatrix;
import React, { useState, useEffect } from 'react';
import * as apiService from '../../services/apiService';

const ComparisonMatrix = ({ itemId }) => {
  const [matrix, setMatrix] = useState([]);
  const [criteriaLabels, setCriteriaLabels] = useState([]);
  const [currentCR, setCurrentCR] = useState(0.01);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Tạo danh sách trọng số hợp lệ dựa trên số lượng tiêu chí
  const generateValidWeights = (numCriteria) => {
    const weights = [];
    // Thêm các giá trị từ 1/x đến 1
    for (let i = numCriteria; i >= 1; i--) {
      const value = 1 / i;
      weights.push(Number(value.toFixed(2)));
    }
    // Thêm các giá trị từ 1 đến x
    for (let i = 1; i <= numCriteria; i++) {
      if (i === 1) {
        weights.push(1); // Đã có 1, bỏ qua để tránh trùng
        continue;
      }
      const fractionValue = (i - 1) / i; // 2/3, 3/4, ..., (x-1)/x
      weights.push(Number(fractionValue.toFixed(2)));
      weights.push(i); // 2, 3, ..., x
    }
    // Sắp xếp theo thứ tự tăng dần và loại bỏ giá trị trùng
    return [...new Set(weights)].sort((a, b) => a - b);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching tchi_user data for itemId:', itemId);
        const data = await apiService.fetchTchiUserAlternatives();
        console.log('API Response:', data);

        const item = data.find((item) => item.id === itemId);
        if (!item) {
          console.warn('Item not found for itemId:', itemId);
          setError(`Không tìm thấy phương án với ID ${itemId}.`);
          setMatrix([]);
          setCriteriaLabels([]);
          setCurrentCR(0.01);
          return;
        }

        const { criteria_comparison_matrix, criteria_list, consistency_ratio } = item;
        const size = criteria_list?.length || 0;

        console.log('Item Data:', { criteria_comparison_matrix, criteria_list, consistency_ratio, size });

        if (!criteria_list || criteria_list.length === 0) {
          console.warn('Empty criteria_list:', criteria_list);
          setError('Danh sách tiêu chí rỗng.');
          setMatrix([]);
          setCriteriaLabels([]);
          setCurrentCR(0.01);
          return;
        }

        const matrix2D = [];
        if (
          criteria_comparison_matrix &&
          Array.isArray(criteria_comparison_matrix) &&
          criteria_comparison_matrix.length === size * size
        ) {
          for (let i = 0; i < size; i++) {
            matrix2D.push(criteria_comparison_matrix.slice(i * size, (i + 1) * size));
          }
          console.log('Converted matrix2D:', matrix2D);
        } else {
          console.warn('Invalid criteria_comparison_matrix:', criteria_comparison_matrix);
          setError(
            `Ma trận không hợp lệ. Kích thước mong đợi: ${size * size}, thực tế: ${
              criteria_comparison_matrix?.length || 0
            }`
          );
          setMatrix([]);
          setCriteriaLabels(criteria_list);
          setCurrentCR(consistency_ratio || 0.01);
          return;
        }

        setMatrix(matrix2D);
        setCriteriaLabels(criteria_list);
        setCurrentCR(consistency_ratio || 0.01);
      } catch (err) {
        console.error('Error fetching tchi_user data:', err);
        setError('Không thể tải dữ liệu ma trận từ API: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [itemId]);

  const handleMatrixChange = (rowIndex, colIndex, value) => {
    console.log(`handleMatrixChange: row=${rowIndex}, col=${colIndex}, value=${value}`);

    const num = parseFloat(value);

    // Cập nhật ma trận
    const newMatrix = matrix.map((row, rIdx) =>
      row.map((cell, cIdx) => {
        if (rIdx === rowIndex && cIdx === colIndex) {
          return num;
        }
        if (rIdx === colIndex && cIdx === rowIndex) {
          return 1 / num; // Đảm bảo ma trận đối xứng
        }
        return cell;
      })
    );

    setMatrix(newMatrix);
  };

  const handleSaveMatrix = async () => {
    try {
      // Chuyển ma trận thành mảng 1 chiều
      const flatMatrix = matrix.flat().map((val) => parseFloat(val));
      // Kiểm tra giá trị 0 hoặc âm
      if (flatMatrix.some((val) => val <= 0)) {
        alert('Ma trận chứa giá trị không hợp lệ (phải lớn hơn 0).');
        return;
      }

      console.log('Sending to calculateCR:', { criteria_list: criteriaLabels, pairwise_matrix: flatMatrix });

      // Tính CR qua API
      const crData = await apiService.calculateCR({ criteria_list: criteriaLabels, pairwise_matrix: flatMatrix });
      console.log('Calculated CR:', crData);
      const newCR = crData.consistency_ratio || 0.01;
      setCurrentCR(newCR);

      // Lưu ma trận và CR
      const updateData = {
        comparison_matrix: flatMatrix,
        consistency_ratio: newCR,
      };

      await apiService.updateTchiUser(itemId, updateData);
      alert('Ma trận đã được cập nhật thành công!');
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving matrix or calculating CR:', err);
      let errorMessage = 'Lỗi khi lưu ma trận hoặc tính CR: ' + err.message;
      if (err.message.includes('422')) {
        errorMessage = 'Dữ liệu gửi không hợp lệ. Vui lòng kiểm tra ma trận và tiêu chí.';
      }
      alert(errorMessage);
    }
  };

  // Lấy danh sách trọng số hợp lệ
  const validWeights = generateValidWeights(criteriaLabels.length);

  return (
    <div className="comparison-matrix">
      <h5>Ma trận so sánh đôi (Tiêu chí):</h5>
      <button onClick={() => setIsEditing(!isEditing)} style={{ marginBottom: '10px' }}>
        {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa ma trận'}
      </button>
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : error ? (
        <p>{error}</p>
      ) : matrix.length > 0 && criteriaLabels.length > 0 ? (
        <>
          <table>
            <thead>
              <tr>
                <th></th>
                {criteriaLabels.map((label, idx) => (
                  <th key={idx}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <th>{criteriaLabels[rowIdx]}</th>
                  {Array.isArray(row) ? (
                    row.map((value, colIdx) => (
                      <td
                        key={colIdx}
                        className={typeof value === 'number' && value > 1 ? 'highlight' : ''}
                      >
                        {isEditing && rowIdx < colIdx ? (
                          <select
                            value={value}
                            onChange={(e) => handleMatrixChange(rowIdx, colIdx, e.target.value)}
                            style={{ width: '80px', textAlign: 'center' }}
                          >
                            {validWeights.map((weight) => (
                              <option key={weight} value={weight}>
                                {weight.toFixed(2)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          (typeof value === 'number' ? value.toFixed(2) : value || '1.00')
                        )}
                      </td>
                    ))
                  ) : (
                    <td colSpan={criteriaLabels.length}>Dữ liệu ma trận không hợp lệ</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {isEditing && (
            <button onClick={handleSaveMatrix} style={{ marginTop: '10px' }}>
              Lưu ma trận
            </button>
          )}
          <div className="consistency-ratio">
            Consistency Ratio (CR): <span>{(currentCR || 0.01).toFixed(2)}</span>{' '}
            {(currentCR || 0.01) <= 0.1 ? '(Nhất quán)' : '(Không nhất quán)'}
          </div>
        </>
      ) : (
        <p>Không có dữ liệu ma trận để hiển thị.</p>
      )}
    </div>
  );
};

export default ComparisonMatrix;