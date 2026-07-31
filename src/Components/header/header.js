import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from "sweetalert2";
import notificationImg from "../../assets/images/xs/avatar1.jpg";
import ProfileImg from "../../assets/images/profile_av.png";
import { getRequest, getImageRequest, postRequest } from "../../service/apiService";
import { SWITCH_USER_CONTEXT } from "../../config/apiConfig";
import './header.css';

const Header = ({ toggleSidebar, collapsed }) => {
  const [currentUserData, setCurrentUserData] = useState();
  const [loading, setLoading] = useState(false);
  const currentUser = localStorage.getItem("username") || sessionStorage.getItem("username");
  const navigate = useNavigate();
  const [imageSrc, setImageSrc] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");

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
    fetchSwitchOptions();
  }, []);

  const getActiveStorage = () => {
    return localStorage.getItem("token") ? localStorage : sessionStorage;
  };

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

  const fetchSwitchOptions = async () => {
    if (!currentUser) {
      return;
    }

    try {
      const departmentsResponse = await getRequest(`/master/user-departments/getByUserName/${currentUser}`);

      let departments = [];
      if (departmentsResponse?.response) {
        departments = Array.isArray(departmentsResponse.response) ? departmentsResponse.response : [];
      }
      setAvailableDepartments(departments);

      const storedDepartmentId =
        localStorage.getItem("departmentId") ||
        sessionStorage.getItem("departmentId") ||
        "";

      setDepartmentId(storedDepartmentId || (departments[0]?.departmentId?.toString() || ""));
    } catch (error) {
      console.error("Error loading switch options", error);
    }
  };

  const handleSwitchContext = async () => {
    if (!departmentId) {
      return;
    }

    setSwitchLoading(true);
    try {
      const response = await postRequest(SWITCH_USER_CONTEXT, {
        departmentId: Number(departmentId),
      });

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
          departmentCode,
        } = response.response;

        const storage = getActiveStorage();
        const currentTime = Date.now();
        const isTokenValid = jwtTokenExpiry > currentTime;

        storage.setItem("token", jwtToken);
        storage.setItem("refreshToken", refreshToken);
        storage.setItem("username", username);
        storage.setItem("userId", userId);
        storage.setItem("roleId", roleId);
        storage.setItem("activeRoleId", roleId);
        storage.setItem("AuthValidation", jwtTokenExpiry);
        storage.setItem("isTokenValid", isTokenValid);
        storage.setItem("hospitalId", hospitalId);
        storage.setItem("departmentId", departmentId);
        storage.setItem("departmentName", departmentName);
        storage.setItem("departmentCode", departmentCode);

        await Swal.fire({
          icon: "success",
          title: "Department switched",
          text: `Now using ${departmentName}`,
          timer: 1500,
          showConfirmButton: false,
        });

        navigate("/dashboard");
        setTimeout(() => {
          window.location.reload();
        }, 50);
      } else {
        await Swal.fire({
          icon: "error",
          title: "Switch failed",
          text: response?.message || "Unable to switch role/department.",
        });
      }
    } catch (error) {
      const message =
        error?.response?.message ||
        error?.message ||
        "Unable to switch role/department.";
      await Swal.fire({
        icon: "error",
        title: "Switch failed",
        text: message,
      });
    } finally {
      setSwitchLoading(false);
    }
  };



  return (
    <>
      <div className="header">
        <nav className="navbar py-3">
          <div className="container-fluid d-flex align-items-center justify-content-between">
            {/* Left section: Hamburger & Search */}
            <div className="d-flex align-items-center gap-3">
              <button
                className="sidebar-toggle-btn btn p-0 border-0 d-flex align-items-center justify-content-center"
                type="button"
                onClick={toggleSidebar}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="hamburger-icon"
                >
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              <div className="header-search d-none d-sm-block">
                <div className="input-group flex-nowrap">
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search..."
                    aria-label="search"
                  />
                  <button
                    type="button"
                    className="input-group-text"
                  >
                    <i className="fa fa-search" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right section: Action items & Profile */}
            <div className="h-right d-flex align-items-center gap-2">
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
                  className="dropdown-toggle pulse p-0"
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
                    <div className="px-3 pb-2">
                      <div className="small text-muted mb-2">Switch department</div>
                      <div className="mb-2">
                        <label className="form-label mb-1 small">Department</label>
                        <select
                          className="form-select form-select-sm"
                          value={departmentId}
                          onChange={(e) => setDepartmentId(e.target.value)}
                          disabled={switchLoading || availableDepartments.length === 0}
                        >
                          <option value="">Select department</option>
                          {availableDepartments.map((dept) => (
                            <option key={dept.departmentId ?? dept.id} value={dept.departmentId ?? dept.id}>
                              {dept.departmentName || `Department ${dept.departmentId ?? dept.id}`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm w-100"
                        onClick={handleSwitchContext}
                        disabled={switchLoading || !departmentId}
                      >
                        {switchLoading ? "Switching..." : "Switch"}
                      </button>
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
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
export default Header;
