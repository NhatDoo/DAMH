import { useState, useEffect } from 'react';
import { flatArrayToMatrix, matrixToFlatArray } from '../utils/matrixUtils';

const useMatrix = ({ comparisonMatrix, consistencyRatio, criteriaLabels }) => {
  const defaultMatrix = Array(criteriaLabels.length)
    .fill()
    .map(() => Array(criteriaLabels.length).fill(1.0));

  const initializeMatrix = (matrix) => {
    const size = criteriaLabels.length;
    if (!matrix || !Array.isArray(matrix)) {
      return defaultMatrix;
    }
    if (matrix.length === size * size && !Array.isArray(matrix[0])) {
      return flatArrayToMatrix(matrix, size, defaultMatrix);
    }
    if (matrix.length === size && matrix.every(row => Array.isArray(row) && row.length === size)) {
      const isValid = matrix.every(row =>
        row.every(val => typeof val === 'number' && val >= 0.111 && val <= 9)
      );
      if (isValid) {
        return matrix;
      }
    }
    return defaultMatrix;
  };

  const [editableMatrix, setEditableMatrix] = useState(() => initializeMatrix(comparisonMatrix));
  const [currentCR, setCurrentCR] = useState(consistencyRatio || 0.01);

  useEffect(() => {
    const size = criteriaLabels.length;
    const newDefaultMatrix = Array(size)
      .fill()
      .map(() => Array(size).fill(1.0));

    if (editableMatrix.length !== size || editableMatrix[0]?.length !== size) {
      setEditableMatrix(newDefaultMatrix);
    }
  }, [criteriaLabels]);

  return { editableMatrix, setEditableMatrix, currentCR, setCurrentCR, initializeMatrix };
};

export default useMatrix;