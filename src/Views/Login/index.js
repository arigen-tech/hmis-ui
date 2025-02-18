import React, {Suspense, useState} from 'react';
import { Link, useNavigate } from "react-router-dom";
import LoginImg from '../../assets/images/login-img.svg';
import Cardiogram from '../../assets/images/cardiogram.png';
import './login.css'
const Login = () => {



  return (
    <>
       <div id="ihealth-layout" className="theme-tradewind">
        {/* main body area */}
        <div className="main p-2 py-3 p-xl-5">
          {/* Body: Body */}
          <div className="body d-flex p-0 p-xl-5">
            <div className="container-xxl">
              <div className="row g-0">
                <div className="col-lg-6 d-none d-lg-flex justify-content-center align-items-center rounded-lg auth-h100">
                  <div style={{ maxWidth: "25rem" }}>
                    <div className="cardiogram text-center mb-5">
                      <img src={Cardiogram} />
                    </div>
                    <div className="mb-5">
                      <h2 className="color-900 text-center">
                        Arigen-Health, We aim to make your life better
                      </h2>
                    </div>
                    {/* Image block */}
                    <div className="">
                      <img src={LoginImg} alt="login-img" />
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 d-flex justify-content-center align-items-center border-0 rounded-lg auth-h100">
                  <div
                    className="w-100 p-3 p-md-5 card border-0 bg-theme text-light"
                    style={{ maxWidth: "32rem" }}
                  >
                    {/* Form */}
                    <form className="row g-1 p-3 p-md-4">
                      <div className="col-12 text-center mb-5">
                        <h1>Sign in</h1>
                      </div>

                      <div className="col-12">
                        <div className="mb-2">
                          <label className="form-label">Email address</label>
                          <input
                            type="email"
                            className="form-control form-control-lg"
                            placeholder="name@example.com"
                          />
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="mb-2">
                          <div className="form-label">
                            <span className="d-flex justify-content-between align-items-center">
                              Password
                              <a href="auth-password-reset.html">Forgot Password?</a>
                            </span>
                          </div>
                          <input
                            type="password"
                            className="form-control form-control-lg"
                            placeholder="***************"
                          />
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            defaultValue=""
                            id="flexCheckDefault"
                          />
                          <label
                            className="form-check-label"
                            htmlFor="flexCheckDefault"
                          >
                            Remember me
                          </label>
                        </div>
                      </div>
                      <div className="col-12 text-center mt-4">
                        <Link to='/dashboard'
                          href="index.html"
                          className="btn btn-lg btn-block btn-light lift text-uppercase"
                          atl="signin"
                        >
                          SIGN IN
                        </Link>
                      </div>
                      <div className="col-12 text-center mt-4">
                        <span>
                          Don't have an account yet?
                          <a href="auth-signup.html">Sign up here</a>
                        </span>
                      </div>
                    </form>
                    {/* End Form */}
                  </div>
                </div>
              </div>
              {/* End Row */}
            </div>
          </div>
        </div>
      </div>

    </>
  );
};
export default Login;
