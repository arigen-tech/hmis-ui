import React from "react";
import ambulanceImage from "../../assets/images/ambulanceimage.jpg";

const LoadingScreen = () => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1050,
      }}
    >
      <div
        style={{
          textAlign: "center",
          color: "#2c3e50",
        }}
      >
        {/* Ambulance Animation */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "150px",
            margin: "0 auto",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "-20%",
              transform: "translateY(-50%)",
              width: "150px",
              height: "auto",
              animation: "drive 3s linear infinite",
            }}
          >
            <img 
              src={ambulanceImage} 
              alt="Ambulance" 
              style={{
                width: "100%",
                height: "auto",
              }}
            />
          </div>
        </div>
        {/* Loading Text */}
        <h3 style={{ marginTop: "30px", fontSize: "1.5rem", fontWeight: "500" }}>
          Loading Hospital Data...
        </h3>
        <p style={{ marginTop: "10px", fontSize: "1rem", color: "#7f8c8d" }}>
          Please wait while we prepare everything for you.
        </p>
      </div>
      {/* CSS Animations */}
      <style>
        {`
          @keyframes drive {
            0% {
              left: -20%;
            }
            100% {
              left: 100%;
            }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingScreen;