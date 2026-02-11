import React from 'react';

const ConfirmationPopup = ({
  message,
  type = 'info',
  onConfirm,
  onCancel,
  confirmText = 'Yes',
  cancelText = 'No',
  show = false
}) => {
  if (!show) return null;

  const getTitle = () => {
    switch (type) {
      case 'success': return 'Success';
      case 'warning': return 'Warning';
      case 'error': return 'Error';
      case 'danger': return 'Confirmation';
      default: return 'Confirmation';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return 'mdi-check-circle-outline text-success';
      case 'warning': return 'mdi-alert-circle-outline text-warning';
      case 'error': return 'mdi-close-circle-outline text-danger';
      case 'danger': return 'mdi-alert-circle-outline text-danger';
      default: return 'mdi-information-outline text-info';
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'success': return 'btn-success';
      case 'warning': return 'btn-warning';
      case 'error': return 'btn-danger';
      case 'danger': return 'btn-danger';
      default: return 'btn-primary';
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{getTitle()}</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onCancel}
            ></button>
          </div>
          <div className="modal-body">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <i className={`mdi ${getIcon()}`} style={{ fontSize: '24px' }}></i>
              </div>
              <div>
                <p className="mb-0">{message}</p>
              </div>
            </div>
          </div>
          <div className="modal-footer justify-content-center">
            {onCancel && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onCancel}
              >
                {cancelText}
              </button>
            )}
            <button 
              type="button" 
              className={`btn ${getButtonClass()}`} 
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup;