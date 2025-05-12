import React from 'react';
import PropTypes from 'prop-types';

const Sidebar = ({ activeSection, onSectionChange }) => (
  <div className="sidebar">
    {[
      { id: 'phuong-an-goi-y', label: 'Điểm tiêu chí gợi ý' },
      { id: 'tieu-chi-cua-ban', label: 'Tiêu chí của bạn' },
      { id: 'ca-dat', label: 'Cài đặt' },
    ].map((section) => (
      <div
        key={section.id}
        className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
        onClick={() => onSectionChange(section.id)}
      >
        {section.label}
      </div>
    ))}
  </div>
);

Sidebar.propTypes = {
  activeSection: PropTypes.string.isRequired,
  onSectionChange: PropTypes.func.isRequired,
};

export default Sidebar;