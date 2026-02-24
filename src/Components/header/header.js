import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import notificationImg from "../../assets/images/xs/avatar1.jpg";
import ProfileImg from "../../assets/images/profile_av.png";
import { getRequest, getImageRequest } from "../../service/apiService";
import './header.css';

const Header = () => {
  const [currentUserData, setCurrentUserData] = useState();
  const [loading, setLoading] = useState(false);
  const currentUser = localStorage.getItem("username") || sessionStorage.getItem("username");
  const navigate = useNavigate();
  const [imageSrc, setImageSrc] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const allRoles = currentUserData?.rolesName?.split(",").map(role => role.trim()) || [];
  const displayedRoles = allRoles.length > 2 ? allRoles.slice(0, 2) : allRoles;
  const remainingRoles = allRoles.length > 2 ? allRoles.slice(2) : [];

  const toggleDropdown = (e) => {
    e.preventDefault();
    setShowDropdown(prev => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  console.log("Current User:", currentUserData);

  useEffect(() => {
    fetchCurrentUserData();
    fetchImageSrc();
  }, []);

  const fetchCurrentUserData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`/authController/getUsersForProfile/${currentUser}`);
      if (data.status === 200 && typeof data.response === 'object' && data.response !== null) {
        setCurrentUserData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setCurrentUserData(null);
      }
    } catch (error) {
      console.error("Error fetching Current User data:", error);
      setCurrentUserData(null);
    } finally {
      setLoading(false);
    }
  };


  console.log("Current User Data:", currentUserData);


  const fullUserName = [
    currentUserData?.firstName,
    currentUserData?.middleName,
    currentUserData?.lastName
  ]
    .filter(Boolean)
    .join(" ");

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();

    navigate("/");
  };

  const fetchImageSrc = async () => {
    try {
      const imageBlob = await getImageRequest(`/authController/getProfileImageSrc/${currentUser}`, {}, "blob");
      const imageUrl = URL.createObjectURL(imageBlob);
      setImageSrc(imageUrl);
    } catch (error) {
      console.error("Error fetching image source", error);
    }
  };



  return (
    <>
      <div className="header">
        <nav className="navbar py-4">
          <div className="container-xxl">
            {/* header rightbar icon */}
            <div className="h-right d-flex align-items-center mr-5 mr-lg-0 order-1">
              <div className="d-flex">
                <a
                  className="nav-link text-primary collapsed"
                  href="help.html"
                  title="Get Help"
                >
                  <i className="icofont-info-square fs-5" />
                </a>
              </div>
              <div className="dropdown notifications zindex-popover">
                <a
                  className="nav-link dropdown-toggle pulse"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                >
                  <i className="icofont-alarm fs-5" />
                  <span className="pulse-ring" />
                </a>
                <div
                  id="NotificationsDiv"
                  className="dropdown-menu rounded-lg shadow border-0 dropdown-animation dropdown-menu-sm-end p-0 m-0"
                >
                  <div className="card border-0 w380">
                    <div className="card-header border-0 p-3">
                      <h5 className="mb-0 font-weight-light d-flex justify-content-between">
                        <span>Notifications</span>
                        <span className="badge text-white">06</span>
                      </h5>
                    </div>
                    <div className="tab-content card-body">
                      <div className="tab-pane fade show active">
                        <ul className="list-unstyled list mb-0">
                          <li className="py-2 mb-1 border-bottom">
                            <a href="javascript:void(0);" className="d-flex">
                              <img
                                className="avatar rounded-circle"
                                src={notificationImg}
                                alt=""
                              />
                              <div className="flex-fill ms-2">
                                <p className="d-flex justify-content-between mb-0">
                                  <span className="font-weight-bold">
                                    Chloe Walkerr
                                  </span>
                                  <small>2MIN</small>
                                </p>
                                <span className="">
                                  Added Appointment 2021-06-19
                                  <span className="badge bg-success">Book</span>
                                </span>
                              </div>
                            </a>
                          </li>
                          <li className="py-2 mb-1 border-bottom">
                            <a href="javascript:void(0);" className="d-flex">
                              <div className="avatar rounded-circle no-thumbnail">
                                AH
                              </div>
                              <div className="flex-fill ms-2">
                                <p className="d-flex justify-content-between mb-0">
                                  <span className="font-weight-bold">
                                    Alan Hill
                                  </span>
                                  <small>13MIN</small>
                                </p>
                                <span className="">Lab sample collection</span>
                              </div>
                            </a>
                          </li>
                          <li className="py-2 mb-1 border-bottom">
                            <a href="javascript:void(0);" className="d-flex">
                              <img
                                className="avatar rounded-circle"
                                src="assets/images/xs/avatar3.jpg"
                                alt=""
                              />
                              <div className="flex-fill ms-2">
                                <p className="d-flex justify-content-between mb-0">
                                  <span className="font-weight-bold">
                                    Melanie Oliver
                                  </span>
                                  <small>1HR</small>
                                </p>
                                <span className="">
                                  Invoice Create Patient Room A-803
                                </span>
                              </div>
                            </a>
                          </li>
                          <li className="py-2 mb-1 border-bottom">
                            <a href="javascript:void(0);" className="d-flex">
                              <img
                                className="avatar rounded-circle"
                                src="assets/images/xs/avatar5.jpg"
                                alt=""
                              />
                              <div className="flex-fill ms-2">
                                <p className="d-flex justify-content-between mb-0">
                                  <span className="font-weight-bold">
                                    Boris Hart
                                  </span>
                                  <small>13MIN</small>
                                </p>
                                <span className="">
                                  Medicine Order to Medical
                                </span>
                              </div>
                            </a>
                          </li>
                          <li className="py-2 mb-1 border-bottom">
                            <a href="javascript:void(0);" className="d-flex">
                              <img
                                className="avatar rounded-circle"
                                src="assets/images/xs/avatar6.jpg"
                                alt=""
                              />
                              <div className="flex-fill ms-2">
                                <p className="d-flex justify-content-between mb-0">
                                  <span className="font-weight-bold">
                                    Alan Lambert
                                  </span>
                                  <small>1HR</small>
                                </p>
                                <span className="">Leave Apply</span>
                              </div>
                            </a>
                          </li>
                          <li className="py-2">
                            <a href="javascript:void(0);" className="d-flex">
                              <img
                                className="avatar rounded-circle"
                                src="assets/images/xs/avatar7.jpg"
                                alt=""
                              />
                              <div className="flex-fill ms-2">
                                <p className="d-flex justify-content-between mb-0">
                                  <span className="font-weight-bold">
                                    Zoe Wright
                                  </span>
                                  <small className="">1DAY</small>
                                </p>
                                <span className="">
                                  Patient Food Order Room A-809
                                </span>
                              </div>
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <a className="card-footer text-center border-top-0" href="#">
                      View all notifications
                    </a>
                  </div>
                </div>
              </div>
              <div className="dropdown user-profile ml-2 ml-sm-3 d-flex align-items-center zindex-popover">
                {loading ? (
                  <div className="u-info me-2 animate-pulse space-y-1 text-end">
                    <div className="h-4 bg-gray-300 rounded w-24 ml-auto"></div>
                    <div className="h-3 bg-gray-200 rounded w-20 ml-auto"></div>
                    <div className="h-3 bg-gray-200 rounded w-16 ml-auto"></div>
                  </div>
                ) : (
                  <div className="u-info me-2 text-end position-relative" ref={dropdownRef}>
                    <p className="mb-0 leading-snug">
                      <span className="fw-bold">{fullUserName}</span>
                    </p>
                    <small className="d-inline-block">
                      <strong>
                        {displayedRoles.join(", ")}
                        {remainingRoles.length > 0 && (<>
                          <span>,</span>
                          <span
                            className="rotate-dots"
                            onClick={toggleDropdown}
                            title={showDropdown ? "Hide roles" : "View all roles"}
                            style={{
                              cursor: "pointer",
                              marginLeft: "6px",
                              display: "inline-block",
                              fontWeight: "bold",
                              fontSize: "1.1rem",
                              userSelect: "none",
                              transform: showDropdown ? "rotate(90deg)" : "rotate(0deg)",
                              transition: "transform 0.3s ease-in-out, opacity 0.2s ease",
                              lineHeight: "1",
                            }}
                          >
                            ...
                          </span>

                        </>
                        )}
                      </strong>
                    </small>

                    {/* Department name from sessionStorage */}
                    <div className=" mt-1">
                      <i className="icofont-building me-1"></i>
                      Department: {sessionStorage.getItem("departmentName") || "N/A"}
                    </div>

                    {/* Dropdown List of Roles */}
                    {showDropdown && (
                      <div
                        className="dropdown-menu show position-absolute mt-1 p-2 shadow-sm"
                        style={{ right: 0, zIndex: 1000, minWidth: "200px" }}
                      >
                        <div className="small text-muted mb-1">All Roles</div>
                        <ul className="list-unstyled mb-0">
                          {allRoles.map((role, index) => (
                            <li key={index} className="py-1 border-bottom">
                              {role}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <a
                  className="nav-link dropdown-toggle pulse p-0"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  data-bs-display="static"
                >
                  <img
                    src={imageSrc || ProfileImg}
                    alt="Profile"
                    className="avatar lg rounded-circle img-thumbnail"
                  />
                </a>
                <div className="dropdown-menu rounded-lg shadow border-0 dropdown-animation dropdown-menu-end p-0 m-0">
                  <div className="card border-0 w280">
                    <div className="card-body pb-0">
                      <div className="d-flex align-items-center py-2 px-3">
                        <img
                          src={imageSrc || ProfileImg}
                          alt="Profile"
                          className="rounded-circle img-thumbnail me-3"
                          style={{ width: "56px", height: "56px", objectFit: "cover" }}
                        />

                        <div className="text-start">
                          <p className="mb-0 fw-semibold text-dark">{fullUserName}</p>
                          <small className="text-muted">{currentUserData?.userName}</small>
                        </div>
                      </div>

                      <div>
                        <hr className="dropdown-divider border-dark" />
                      </div>
                    </div>
                    <div className="list-group m-2">
                      <a
                        href="virtual.html"
                        className="list-group-item list-group-item-action border-0"
                      >
                        <i className="icofont-ui-video-chat fs-5 me-3" />
                        Arigen-Health Virtual
                      </a>
                      <a
                        href="patient-invoices.html"
                        className="list-group-item list-group-item-action border-0"
                      >
                        <i className="icofont-dollar fs-5 me-3" />
                        Patient Invoices
                      </a>
                      <a
                        onClick={logout}
                        className="list-group-item list-group-item-action border-0 logout-link"
                        role="button"
                      >
                        <i className="icofont-logout fs-6 me-3" />
                        Signout
                      </a>


                      <div>
                        <hr className="dropdown-divider border-dark" />
                      </div>
                      <a
                        href="ui-elements/auth-signup.html"
                        className="list-group-item list-group-item-action border-0"
                      >
                        <i className="icofont-contact-add fs-5 me-3" />
                        Add personal account
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="setting ms-2">
                <a href="#" data-bs-toggle="modal" data-bs-target="#Settingmodal">
                  <i className="icofont-gear-alt fs-5" />
                </a>
              </div>
            </div>
            {/* menu toggler */}
            <button
              className="navbar-toggler p-0 border-0 menu-toggle order-3"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#mainHeader"
            >
              <span className="fa fa-bars" />
            </button>
            {/* main menu Search*/}
            <div className="order-0 col-lg-4 col-md-4 col-sm-12 col-12 mb-3 mb-md-0">
              <div className="input-group flex-nowrap input-group-lg">
                <input
                  type="search"
                  className="form-control"
                  placeholder="Search"
                  aria-label="search"
                  aria-describedby="addon-wrapping"
                />
                <button
                  type="button"
                  className="input-group-text"
                  id="addon-wrapping"
                >
                  <i className="fa fa-search" />
                </button>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
export default Header;