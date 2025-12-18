import React from 'react';

const ViewDownload = () => {
  
  const handleView = () => {
    // Your view logic here
    alert("View/Download action triggered");
  };

  const handlePrint = () => {
    // Your download logic here
    alert("print action triggered");
  };

  return (
    <div className="content-wrapper d-flex justify-content-center align-items-center min-vh-100">
      <div className="card form-card">
        <div className="card-header">
          <h4>Do You Want Print</h4>
        </div>
        
        <div className="card-body text-center py-5">
          
          {/* Two main buttons - centered and spaced */}
          <div className="d-flex justify-content-center gap-4">
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleView}
              style={{ minWidth: '150px' }}
            >
              <i className="fa fa-eye me-2"></i> VIEW/DOWNLOAD
            </button>
            
            <button 
              className="btn btn-success btn-sm"
              onClick={handlePrint}
              style={{ minWidth: '150px' }}
            >
              <i className="fa fa-download me-2"></i> PRINT
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ViewDownload;