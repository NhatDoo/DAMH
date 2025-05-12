export const flatArrayToMatrix = (flatArray, size, defaultMatrix) => {
  if (!Array.isArray(flatArray) || flatArray.length !== size * size) {
    console.warn('Invalid flat array, returning default matrix:', flatArray);
    return defaultMatrix;
  }
  const matrix = [];
  for (let i = 0; i < size; i++) {
    matrix.push(flatArray.slice(i * size, (i + 1) * size));
  }
  return matrix;
};

export const matrixToFlatArray = (matrix, size, defaultMatrix) => {
  if (!Array.isArray(matrix) || !matrix.every(row => Array.isArray(row) && row.length === size)) {
    console.warn('Invalid matrix for flattening, returning flat default matrix:', matrix);
    return defaultMatrix ? defaultMatrix.flat() : [];
  }
  const flatArray = matrix.flat();
  if (flatArray.length !== size * size || !flatArray.every(val => typeof val === 'number' && val >= 0.111 && val <= 9)) {
    console.warn('Flat array contains invalid values, returning flat default matrix:', flatArray);
    return defaultMatrix ? defaultMatrix.flat() : [];
  }
  return flatArray;
};