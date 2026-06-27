import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginImg from "../../assets/images/login-img.svg";
import Cardiogram from "../../assets/images/cardiogram.png";
import "./login.css";
import { postRequest, getRequest } from "../../service/apiService";
import { LOGIN, MAS_USER_DEPARTMENT } from "../../config/apiConfig";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
    departmentId: "",
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);


  const [showPassword, setShowPassword] = useState(false);


  useEffect(() => {
    if (formData.username?.trim().length === 10) {
      const timer = setTimeout(() => {
        fetchDepartments();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [formData.username]);



  const fetchDepartments = async (flag = 1) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_USER_DEPARTMENT}/getByUserName/${formData?.username}`);
      if (response && response.response) {
        setDepartments(response.response);
      }
    } catch (err) {
      console.error("Error fetching departments:", err);

    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await postRequest(LOGIN, formData);

      if (response?.response?.jwtToken) {
        const {
          jwtToken,
          refreshToken,
          username,
          userId,
          roleId,
          jwtTokenExpiry,
          hospitalId,
          departmentId,
          departmentName,
        } = response.response;

        const currentTime = Date.now();
        const isTokenValid = jwtTokenExpiry > currentTime;
        const validTime = jwtTokenExpiry;

        console.log("Current Time:", new Date(currentTime).toLocaleString());
        console.log("Token Expiry Time:", new Date(jwtTokenExpiry).toLocaleString());
        console.log("Is Token Valid:", isTokenValid);


        if (formData.rememberMe) {
          localStorage.setItem("token", jwtToken);
          localStorage.setItem("refreshToken", refreshToken);
          localStorage.setItem("username", username);
          localStorage.setItem("userId", userId);
          localStorage.setItem("roleId", roleId);
          localStorage.setItem("AuthValidation", validTime);
          localStorage.setItem("isTokenValid", isTokenValid);
          localStorage.setItem("hospitalId", hospitalId);
          localStorage.setItem("departmentId", departmentId);
          localStorage.setItem("departmentName", departmentName);
        } else {
          sessionStorage.setItem("token", jwtToken);
          sessionStorage.setItem("refreshToken", refreshToken);
          sessionStorage.setItem("username", username);
          localStorage.setItem("userId", userId);
          sessionStorage.setItem("roleId", roleId);
          sessionStorage.setItem("AuthValidation", validTime);
          sessionStorage.setItem("isTokenValid", isTokenValid);
          sessionStorage.setItem("hospitalId", hospitalId);
          sessionStorage.setItem("departmentId", departmentId);
          sessionStorage.setItem("departmentName", departmentName);
        }

        // Set up a timeout to auto-mark the token as expired
        const timeUntilExpiry = jwtTokenExpiry - currentTime;
        setTimeout(() => {
          if (formData.rememberMe) {
            localStorage.setItem("isTokenValid", "false");
            logout();
          } else {
            sessionStorage.setItem("isTokenValid", "false");
            logout();
          }
        }, timeUntilExpiry);

        navigate("/dashboard");
      } else {
        console.error("Login failed: Missing token in response.");
      }
    } catch (error) {
      console.error("Login request failed:", error);
    }
  };

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();

    navigate("/");
  };


  return (
    <>
      <div id="ihealth-layout" className="theme-tradewind login-page-container">
        <div className="main p-2 py-4 p-xl-5 login-main-wrapper">
          <div className="body d-flex p-0 p-xl-4 align-items-center justify-content-center w-100">
            <div className="container">
              <div className="row justify-content-center align-items-center g-4">
                
                {/* Left Side: Themed Gradient Panel */}
                <div className="col-lg-6 d-none d-lg-flex">
                  <div className="auth-left-panel">
                    {/* Decorative blobs */}
                    <div className="blob blob-1"></div>
                    <div className="blob blob-2"></div>
                    <div className="blob blob-3"></div>

                    <div className="left-panel-content">
                      {/* Logo + Brand */}
                      <div className="left-brand-header">
                        <div className="left-logo-icon">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="rgba(255,255,255,0.9)"/>
                          </svg>
                        </div>
                        <div>
                          <h1 className="left-brand-name">Arigen-Health</h1>
                          <p className="left-brand-tagline">Healthcare Management System</p>
                        </div>
                      </div>

                      {/* Main Headline */}
                      <div className="left-headline">
                        <h2 className="left-headline-text">
                          Empowering Healthcare,<br/>
                          <span className="left-headline-accent">One Click at a Time</span>
                        </h2>
                        <p className="left-headline-sub">
                          Manage patients, departments, labs and more from a unified platform built for modern hospitals.
                        </p>
                      </div>

                      {/* Health Stats Cards */}
                      <div className="health-stats-grid">
                        <div className="health-stat-card">
                          <div className="stat-icon-wrap">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <div>
                            <div className="stat-number">12K+</div>
                            <div className="stat-label">Patients</div>
                          </div>
                        </div>
                        <div className="health-stat-card">
                          <div className="stat-icon-wrap">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                              <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <div>
                            <div className="stat-number">48</div>
                            <div className="stat-label">Departments</div>
                          </div>
                        </div>
                        <div className="health-stat-card">
                          <div className="stat-icon-wrap">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <div>
                            <div className="stat-number">99.8%</div>
                            <div className="stat-label">Uptime</div>
                          </div>
                        </div>
                        <div className="health-stat-card">
                          <div className="stat-icon-wrap">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <div>
                            <div className="stat-number">HIPAA</div>
                            <div className="stat-label">Compliant</div>
                          </div>
                        </div>
                      </div>

                      {/* Floating Pulse Bar */}
                      <div className="pulse-bar-wrapper">
                        <div className="pulse-bar-label">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{marginRight: '6px'}}>
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Live System Health
                        </div>
                        <div className="pulse-bars">
                          {[40,65,30,80,50,90,45,70,55,85,35,75].map((h, i) => (
                            <div key={i} className="pulse-bar-item" style={{height: `${h}%`, animationDelay: `${i * 0.1}s`}}></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Sign-in Form */}
                <div className="col-lg-6 col-md-8 col-sm-10 d-flex justify-content-center align-items-center auth-right-panel">
                  <div className="login-card w-100 p-4 p-md-5">
                    
                    <form className="login-form" onSubmit={handleLogin}>
                      <div className="text-center mb-4">
                        <h1 className="login-title">Sign In</h1>
                        <span className="version-badge">
                          Version 2.50.5
                          <button
                            type="button"
                            className="info-tooltip-btn ms-1"
                            data-bs-toggle="tooltip"
                            data-bs-placement="right"
                            title="Now Release Version 2.50.4 — Under Testing"
                          >
                            <i className="bi bi-info-circle text-muted"></i>
                          </button>
                        </span>
                      </div>

                      {/* Username Field */}
                      <div className="form-group mb-3">
                        <label className="form-label-custom">
                          Username <span className="text-danger">*</span>
                        </label>
                        <div className="input-group-custom">
                          <span className="input-icon">
                            <i className="bi bi-person"></i>
                          </span>
                          <input
                            type="text"
                            name="username"
                            maxLength={10}
                            pattern="\d*"
                            className="form-input-custom"
                            placeholder="Enter username"
                            value={formData.username}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>

                      {/* Password Field */}
                      <div className="form-group mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="form-label-custom mb-0">
                            Password <span className="text-danger">*</span>
                          </label>
                        </div>
                        <div className="input-group-custom">
                          <span className="input-icon">
                            <i className="bi bi-lock"></i>
                          </span>
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            className="form-input-custom"
                            placeholder="Enter password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <i className="bi bi-eye-slash"></i>
                            ) : (
                              <i className="bi bi-eye"></i>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Department Field */}
                      <div className="form-group mb-3">
                        <label className="form-label-custom">
                          Department <span className="text-danger">*</span>
                        </label>
                        <div className="input-group-custom">
                          <span className="input-icon">
                            <i className="bi bi-building"></i>
                          </span>
                          <select
                            className="form-input-custom select-custom"
                            name="departmentId"
                            value={formData.departmentId}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                          >
                            <option value="">Select Department</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.departmentName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Remember Me & Forgot Password */}
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="custom-checkbox">
                          <input
                            className="custom-checkbox-input"
                            type="checkbox"
                            name="rememberMe"
                            checked={formData.rememberMe}
                            onChange={handleInputChange}
                            id="flexCheckDefault"
                          />
                          <label className="custom-checkbox-label" htmlFor="flexCheckDefault">
                            Remember me
                          </label>
                        </div>
                        
                        <a href="/forgot-password" className="forgot-password-link">
                          Forgot Password?
                        </a>
                      </div>

                      {/* Submit Button */}
                      <div className="mt-4">
                        <button
                          type="submit"
                          className="btn-login-gradient text-uppercase w-100"
                        >
                          {loading ? (
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          ) : null}
                          Sign In
                        </button>
                      </div>

                    </form>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

};

export default Login;
