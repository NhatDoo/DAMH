import React from 'react';

const AlternativeInput = ({ newAlternative, setNewAlternative, onAddAlternative }) => {
  return (
    <div className="add-alternative-padding" style={{ padding: '20px 0', borderTop: '1px solid #ccc', marginTop: '10px' }}>
      <h5>Thêm phương án mới:</h5>
      <input
        type="text"
        value={newAlternative}
        onChange={(e) => setNewAlternative(e.target.value)}
        placeholder="Nhập tên phương án mới"
        style={{ width: '200px', padding: '5px', marginRight: '10px', border: '1px solid #ccc' }}
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddAlternative();
        }}
        style={{ padding: '5px 10px' }}
      >
        Thêm
      </button>
    </div>
  );
};

export default AlternativeInput;