
// // import React, { useEffect, useState } from "react";
// // import ReactDOM from "react-dom";

// // const SubmitScreen = ({ show, onClose, onSelectVisitType }) => {
// //   const [showSuccess, setShowSuccess] = useState(true);
// //   const [showFullPage, setShowFullPage] = useState(false);

// //   useEffect(() => {
// //     if (show) {
// //       document.body.style.overflow = 'hidden';
// //       setShowSuccess(true);
// //       setShowFullPage(false);
// //     } else {
// //       document.body.style.overflow = 'unset';
// //     }
// //     return () => {
// //       document.body.style.overflow = 'unset';
// //     };
// //   }, [show]);

// //   if (!show) return null;

// //   // Success Popup View
// //   if (showSuccess) {
// //     return ReactDOM.createPortal(
// //       <div
// //         style={{
// //           display: "block",
// //           backgroundColor: "rgba(0,0,0,0.5)",
// //           position: "fixed",
// //           top: 0,
// //           left: 0,
// //           right: 0,
// //           bottom: 0,
// //           zIndex: 99999,
// //         }}
// //       >
// //         <div
// //           style={{
// //             width: "350px",
// //             backgroundColor: "white",
// //             borderRadius: "8px",
// //             textAlign: "center",
// //             position: "fixed",
// //             top: "50%",
// //             left: "50%",
// //             transform: "translate(-50%, -50%)",
// //             zIndex: 100000,
// //           }}
// //         >
// //           <div style={{ padding: "2rem" }}>
// //             <i className="mdi mdi-check-circle" style={{ fontSize: "64px", color: "#4caf50" }}></i>
// //             <h5 className="mt-3 mb-2">Submit Successful!</h5>
// //             <p className="text-muted mb-0">Your data has been submitted successfully.</p>
// //           </div>
// //           <div style={{ justifyContent: "center", borderTop: "none", paddingBottom: "2rem", display: "flex" }}>
// //             <button
// //               className="btn btn-primary px-4"
// //               onClick={() => {
// //                 setShowSuccess(false);
// //                 setShowFullPage(true);
// //               }}
// //             >
// //               OK
// //             </button>
// //           </div>
// //         </div>
// //       </div>,
// //       document.body
// //     );
// //   }

// //   // Full Page View - 2 buttons in ONE LINE (horizontal) at left corner
// //   if (showFullPage) {
// //     return ReactDOM.createPortal(
// //       <div
// //         style={{
// //           position: "fixed",
// //           top: 0,
// //           left: 0,
// //           right: 0,
// //           bottom: 0,
// //           backgroundColor: "white",
// //           zIndex: 99999,
// //         }}
// //       >
// //         {/* Buttons - Horizontal layout at left top corner */}
// //         <div
// //           style={{
// //             position: "absolute",
// //             left: "40px",
// //             top: "5%",
// //             transform: "translateY(-50%)",
// //             display: "flex",
// //             flexDirection: "row",
// //             gap: "20px",
// //           }}
// //         >
// //           <button
// //             style={{
// //               padding: "12px 24px",
// //               fontSize: "16px",
// //               fontWeight: "bold",
// //               backgroundColor: "#6aab9c",
// //               color: "white",
// //               border: "none",
// //               borderRadius: "6px",
// //               cursor: "pointer",
// //               width: "160px",
// //             }}
// //             onClick={() => {
// //               onSelectVisitType("visits");
// //               onClose();
// //             }}
// //           >
// //             <i className="mdi mdi-printer me-2"></i>
// //             Print Report
// //           </button>
// //           <button
// //             style={{
// //               padding: "12px 24px",
// //               fontSize: "16px",
// //               fontWeight: "bold",
// //               backgroundColor: "#6aab9c",
// //               color: "white",
// //               border: "none",
// //               borderRadius: "6px",
// //               cursor: "pointer",
// //               width: "160px",
// //             }}
// //             onClick={() => {
// //               onSelectVisitType("vitals");
// //               onClose();
// //             }}
// //           >
// //             <i className="mdi mdi-eye me-2"></i>
// //             View Report
// //           </button>
// //         </div>

// //         {/* Close button */}
// //         <button
// //           style={{
// //             position: "absolute",
// //             top: "20px",
// //             right: "20px",
// //             background: "none",
// //             border: "none",
// //             fontSize: "28px",
// //             cursor: "pointer",
// //             color: "#333",
// //           }}
// //           onClick={onClose}
// //         >
// //           ✕
// //         </button>
// //       </div>,
// //       document.body
// //     );
// //   }

// //   return null;
// // };

// // export default SubmitScreen;

// import React, { useEffect, useState } from "react";
// import ReactDOM from "react-dom";

// const SubmitScreen = ({ show, onClose, onSelectVisitType }) => {
//   const [showSuccess, setShowSuccess] = useState(true);
//   const [showFullPage, setShowFullPage] = useState(false);

//   useEffect(() => {
//     if (show) {
//       document.body.style.overflow = 'hidden';
//       setShowSuccess(true);
//       setShowFullPage(false);
//     } else {
//       document.body.style.overflow = 'unset';
//     }
//     return () => {
//       document.body.style.overflow = 'unset';
//     };
//   }, [show]);

//   if (!show) return null;

//   // Success Popup View
//   if (showSuccess) {
//     return ReactDOM.createPortal(
//       <div
//         style={{
//           display: "block",
//           backgroundColor: "rgba(0,0,0,0.5)",
//           position: "fixed",
//           top: 0,
//           left: 0,
//           right: 0,
//           bottom: 0,
//           zIndex: 99999,
//         }}
//       >
//         <div
//           style={{
//             width: "350px",
//             backgroundColor: "white",
//             borderRadius: "8px",
//             textAlign: "center",
//             position: "fixed",
//             top: "50%",
//             left: "50%",
//             transform: "translate(-50%, -50%)",
//             zIndex: 100000,
//           }}
//         >
//           <div style={{ padding: "2rem" }}>
//             <i className="mdi mdi-check-circle" style={{ fontSize: "64px", color: "#4caf50" }}></i>
//             <h5 className="mt-3 mb-2">Submit Successful!</h5>
//             <p className="text-muted mb-0">Your data has been submitted successfully.</p>
//           </div>
//           <div style={{ justifyContent: "center", borderTop: "none", paddingBottom: "2rem", display: "flex" }}>
//             <button
//               className="btn btn-primary px-4"
//               onClick={() => {
//                 setShowSuccess(false);
//                 setShowFullPage(true);
//               }}
//             >
//               OK
//             </button>
//           </div>
//         </div>
//       </div>,
//       document.body
//     );
//   }

//   // Full Page View - 2 buttons in ONE LINE (horizontal) at left corner
//   if (showFullPage) {
//     return ReactDOM.createPortal(
//       <div
//         style={{
//           position: "fixed",
//           top: 0,
//           left: 0,
//           right: 0,
//           bottom: 0,
//           backgroundColor: "white",
//           zIndex: 99999,
//         }}
//       >
//         {/* Buttons - Horizontal layout at left */}
//         <div
//           style={{
//             position: "absolute",
//             left: "40px",
//             top: "5%",
//             transform: "translateY(-50%)",
//             display: "flex",
//             flexDirection: "row",
//             gap: "15px",
//           }}
//         >
//           <button
//             style={{
//               padding: "6px 12px",
//               fontSize: "12px",
//               fontWeight: "bold",
//               backgroundColor: "#6aab9c",
//               color: "white",
//               border: "none",
//               borderRadius: "4px",
//               cursor: "pointer",
//               width: "100px",
//             }}
//             onClick={() => {
//               onSelectVisitType("visits");
//               onClose();
//             }}
//           >
//             <i className="mdi mdi-printer me-1"></i>
//             Print
//           </button>
//           <button
//             style={{
//               padding: "6px 12px",
//               fontSize: "12px",
//               fontWeight: "bold",
//               backgroundColor: "#6aab9c",
//               color: "white",
//               border: "none",
//               borderRadius: "4px",
//               cursor: "pointer",
//               width: "100px",
//             }}
//             onClick={() => {
//               onSelectVisitType("vitals");
//               onClose();
//             }}
//           >
//             <i className="mdi mdi-eye me-1"></i>
//             View
//           </button>
//         </div>

//         {/* Close button */}
//         <button
//           style={{
//             position: "absolute",
//             top: "20px",
//             right: "20px",
//             background: "none",
//             border: "none",
//             fontSize: "24px",
//             cursor: "pointer",
//             color: "#333",
//           }}
//           onClick={onClose}
//         >
//           ✕
//         </button>
//       </div>,
//       document.body
//     );
//   }

//   return null;
// };

// export default SubmitScreen;

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";

const SubmitScreen = ({ show, onClose, onSelectVisitType }) => {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(true);
  const [showFullPage, setShowFullPage] = useState(false);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      setShowSuccess(true);
      setShowFullPage(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  if (!show) return null;

  // Success Popup View
  if (showSuccess) {
    return ReactDOM.createPortal(
      <div
        style={{
          display: "block",
          backgroundColor: "rgba(0,0,0,0.5)",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
        }}
      >
        <div
          style={{
            width: "350px",
            backgroundColor: "white",
            borderRadius: "8px",
            textAlign: "center",
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 100000,
          }}
        >
          <div style={{ padding: "2rem" }}>
            <i className="mdi mdi-check-circle" style={{ fontSize: "64px", color: "#4caf50" }}></i>
            <h5 className="mt-3 mb-2">Submit Successful!</h5>
            <p className="text-muted mb-0">Your data has been submitted successfully.</p>
          </div>
          <div style={{ justifyContent: "center", borderTop: "none", paddingBottom: "2rem", display: "flex" }}>
            <button
              className="btn btn-primary px-4"
              onClick={() => {
                setShowSuccess(false);
                setShowFullPage(true);
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Full Page View - 2 buttons
  if (showFullPage) {
    return ReactDOM.createPortal(
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "white",
          zIndex: 99999,
        }}
      >
        {/* Buttons */}
        <div
          style={{
            position: "absolute",
            left: "40px",
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "row",
            gap: "15px",
          }}
        >
          <button
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: "bold",
              backgroundColor: "#6aab9c",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              width: "100px",
            }}
            onClick={() => {
              // Navigate to ViewDownLoadReport page for Print Report
              navigate("/ViewDownLoadReport", {
                state: {
                  reportUrl: "your-print-report-url-here",
                  title: "Print Report",
                  fileName: "print_report.pdf"
                }
              });
              onClose();
            }}
          >
            <i className="mdi mdi-printer me-1"></i>
            Print
          </button>
          <button
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: "bold",
              backgroundColor: "#6aab9c",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              width: "100px",
            }}
            onClick={() => {
              // Navigate to ViewDownLoadReport page for View Report
              navigate("/ViewDownLoadReport", {
                state: {
                  reportUrl: "your-view-report-url-here",
                  title: "View Report",
                  fileName: "view_report.pdf"
                }
              });
              onClose();
            }}
          >
            <i className="mdi mdi-eye me-1"></i>
            View
          </button>
        </div>

        {/* Close button */}
        <button
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#333",
          }}
          onClick={onClose}
        >
          ✕
        </button>
      </div>,
      document.body
    );
  }

  return null;
};

export default SubmitScreen;