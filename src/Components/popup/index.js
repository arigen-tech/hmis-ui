import React, { useState } from "react";
import ReactDOM from "react-dom";

const Popup = ({ message, type = "default", onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  const getStyleByType = () => {
    switch (type) {
      case "success":
        return {
          icon: "✓",
          iconColor: "text-success",
          buttonColor: "btn btn-success",
          titleColor: "text-success",
        };
      case "error":
        return {
          icon: "✘",
          iconColor: "text-danger",
          buttonColor: "btn btn-danger",
          titleColor: "text-danger",
        };
      case "warning":
        return {
          icon: "!",
          iconColor: "text-warning",
          buttonColor: "btn btn-warning",
          titleColor: "text-warning",
        };
      default:
        return {
          icon: "i",
          iconColor: "text-primary",
          buttonColor: "btn btn-primary",
          titleColor: "text-primary",
        };
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose(); 
    }
  };

  if (!isVisible) return null;

  const styles = getStyleByType();

  return ReactDOM.createPortal(
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex justify-content-center align-items-center"
      style={{ zIndex: 1050 }}
    >
      <div className="bg-white rounded shadow p-4 text-center" style={{ maxWidth: "90%", width: "25rem" }}>
        <div
          className={`d-flex align-items-center justify-content-center rounded-circle border border-4 ${styles.iconColor} mb-4 mx-auto`}
          style={{
            width: "4rem",
            height: "4rem",
          }}
        >
          <span style={{ fontSize: "2rem" }}>{styles.icon}</span>
        </div>
        <h3 className={`mb-4 ${styles.titleColor}`}>{message}</h3>
        <button
          className={`${styles.buttonColor} fw-bold px-4 py-2`}
          onClick={handleClose}
        >
          OK
        </button>
      </div>
    </div>,
    document.body
  );
};

export default Popup;

