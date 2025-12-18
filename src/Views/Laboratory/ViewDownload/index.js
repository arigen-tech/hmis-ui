import React from 'react';

const ViewDownload = () => {

  const handleView = () => {
    // Your view logic here
    alert("View/Download action triggered");
  };

  const handlePrint = () => {
    // Your print logic here
    alert("Print action triggered");
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="lead">Result validated. Do you want to print?</h4>

            </div>

            <div className="card-body">
              {/* Message aligned to left top */}
              <div className="mb-4">
              </div>

              {/* Buttons aligned to left top */}
              <div className="d-flex gap-4">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleView}
                >
                  <i className="fa fa-eye me-2"></i> VIEW/DOWNLOAD
                </button>

                <button
                  className="btn btn-success btn-sm"
                  onClick={handlePrint}
                >
                  <i className="fa fa-print me-2"></i> PRINT
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewDownload;