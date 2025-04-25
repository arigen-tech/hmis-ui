import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginImg from "../../assets/images/login-img.svg";
import Cardiogram from "../../assets/images/cardiogram.png";
import "./login.css";
import { postRequest } from "../../service/apiService";
import { LOGIN } from "../../config/apiConfig";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  // First, add a new state for password visibility
  const [showPassword, setShowPassword] = useState(false);

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
          roleId,
          jwtTokenExpiry,
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
          localStorage.setItem("roleId", roleId);
          localStorage.setItem("AuthValidation", validTime);
          localStorage.setItem("isTokenValid", isTokenValid);
        } else {
          sessionStorage.setItem("token", jwtToken);
          sessionStorage.setItem("refreshToken", refreshToken);
          sessionStorage.setItem("username", username);
          sessionStorage.setItem("roleId", roleId);
          sessionStorage.setItem("AuthValidation", validTime);
          sessionStorage.setItem("isTokenValid", isTokenValid);
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
      <div id="ihealth-layout" className="theme-tradewind">
        <div className="main p-2 py-3 p-xl-5">
          <div className="body d-flex p-0 p-xl-5">
            <div className="container-xxl">
              <div className="row g-0">
                <div className="col-lg-6 d-none d-lg-flex justify-content-center align-items-center rounded-lg auth-h100">
                  <div style={{ maxWidth: "25rem" }}>
                    <div className="cardiogram text-center mb-5">
                      <img src={Cardiogram} alt="cardiogram" />
                    </div>
                    <div className="mb-5">
                      <h2 className="color-900 text-center">
                        Arigen-Health, We aim to make your life better
                      </h2>
                    </div>
                    <div>
                      <img src={LoginImg} alt="login-img" />
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 d-flex justify-content-center align-items-center border-0 rounded-lg auth-h100">
                  <div className="w-100 p-3 p-md-5 card border-0 bg-theme text-light" style={{ maxWidth: "32rem" }}>
                    <form className="row g-1 p-3 p-md-4" onSubmit={handleLogin}>
                      <div className="col-12 text-center mb-5">
                        <h1>Sign in</h1>
                      </div>

                      <div className="col-12">
                        <div className="mb-2">
                          <label className="form-label">Username <span className="text-danger"
                          >*</span></label>
                          <input
                            type="text"
                            name="username"
                            className="form-control form-control-lg"
                            placeholder="6209150953"
                            value={formData.username}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="mb-2">
                          <label className="form-label">Password <span className="text-danger"
                          >*</span></label>
                          <div className="position-relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              name="password"
                              className="form-control form-control-lg"
                              placeholder="174620"
                              value={formData.password}
                              onChange={handleInputChange}
                              required
                            />
                            <button
                              type="button"
                              className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-decoration-none"
                              onClick={() => setShowPassword(!showPassword)}
                              style={{ zIndex: 1 }}
                            >
                              {showPassword ? (
                                <i className="bi bi-eye-slash"></i>
                              ) : (
                                <i className="bi bi-eye"></i>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="form-label">
                        <span className="d-flex justify-content-between align-items-center">
                          Password
                          <a href="/forgot-password">Forgot Password?</a>
                        </span>
                      </div>
                      <div className="col-12">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            name="rememberMe"
                            checked={formData.rememberMe}
                            onChange={handleInputChange}
                            id="flexCheckDefault"
                          />
                          <label className="form-check-label" htmlFor="flexCheckDefault">
                            Remember me
                          </label>
                        </div>
                      </div>
                      <div className="col-12 text-center mt-4">
                        <button type="submit" className="btn btn-lg btn-block btn-light lift text-uppercase">
                          SIGN IN
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
