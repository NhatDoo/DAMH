import React from 'react';
import './Footer.css'; // File CSS cho Footer

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>
          © {new Date().getFullYear()} AHP Decision Tool. All rights reserved.
        </p>
        <p>
          <a href="mailto:support@ahp-tool.com" className="footer-link">
            Liên hệ hỗ trợ
          </a>{' '}
          |{' '}
          <a href="/about" className="footer-link">
            Về chúng tôi
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;