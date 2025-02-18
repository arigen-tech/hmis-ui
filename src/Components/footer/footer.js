import React from 'react';
import './footer.css';
const Footer = () => {

    return(
        <>
          {/* partial:partials/_footer.html */}
          <footer className="footer">
            <div className="d-sm-flex justify-content-center footer-content">
              <span className="text-muted d-block text-center text-sm-left d-sm-inline-block">
                Copyright © HMIS 2025
              </span>
              
            </div>
          </footer>
        </>
    );
}
export default Footer;