import React from 'react';
import PropTypes from 'prop-types';

const CriterionEditor = ({ criterion, value, onChange, onSave, onCancel }) => (
  <input
    type="number"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onSave}
    onKeyPress={(e) => e.key === 'Enter' && onSave()}
    autoFocus
    className="w-16"
  />
);

CriterionEditor.propTypes = {
  criterion: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default CriterionEditor;