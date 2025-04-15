import React, { useContext, useState, useEffect } from 'react';
import './sidebar.css';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {

  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <>
      <div className="sidebar px-4 py-4 py-md-5 me-0">
        <div className="d-flex flex-column h-100">
          <Link to="index" className="mb-0 brand-icon">
            <span className="logo-icon">
              <i className="icofont-heart-beat fs-2" />
            </span>
            <span className="logo-text">Arigen-Health</span>
          </Link>
          {/* Menu: main ul */}
          <ul className="menu-list flex-grow-1 mt-3">
            <li className="collapsed">
              <Link
                className="m-link active"
                data-bs-toggle="collapse"
                data-bs-target="#dashboard"
                to="#"
              >
                <i className="icofont-ui-home fs-5" /> <span>Dashboard</span>
                <span className="arrow icofont-rounded-down ms-auto text-end fs-5" />
              </Link>
              {/* Menu: Sub menu ul */}
              <ul className="sub-menu collapse show" id="dashboard">
                <li>
                  <Link className="ms-link active" to="index">
                    Hospital Dashboard
                  </Link>
                </li>

              </ul>
            </li>
            <li>
              <Link className="m-link" to="virtual">
                <i className="icofont-ui-video-chat fs-5" />
                <span>Arigen-Health Virtual</span>
              </Link>
            </li>
            <li className="collapsed">
              <Link
                className="m-link"
                data-bs-toggle="collapse"
                data-bs-target="#menu-Doctor"
                to="#"
              >
                <i className="icofont-doctor-alt fs-5" /> <span>Doctor</span>
                <span className="arrow icofont-rounded-down ms-auto text-end fs-5" />
              </Link>
              {/* Menu: Sub menu ul */}
              <ul className="sub-menu collapse" id="menu-Doctor">
                <li>
                  <Link className="ms-link" to="doctor-all">
                    All Doctors
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/AddDoctor') ? 'active' : ''}`} to="/AddDoctor">
                    Add Doctor
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/appointment') ? 'active' : ''}`} to="appointment">
                    Appointment
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/doctor-profile') ? 'active' : ''}`} to="doctor-profile">
                    Doctors Profile
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/doctor-schedule') ? 'active' : ''}`} to="doctor-schedule">
                    Doctor Schedule
                  </Link>
                </li>
              </ul>
            </li>
            <li className="collapsed">
              <Link
                className="m-link"
                data-bs-toggle="collapse"
                data-bs-target="#menu-Patient"
                to="#"
              >
                <i className="icofont-blind fs-5" /> <span>Patient</span>
                <span className="arrow icofont-rounded-down ms-auto text-end fs-5" />
              </Link>
              {/* Menu: Sub menu ul */}
              <ul className="sub-menu collapse" id="menu-Patient">
                <li>
                  <Link className="ms-link" to="patient-list">
                    Patient List
                  </Link>
                </li>
                <li>
                  <Link className="ms-link" to="patient-add">
                    Add Patient
                  </Link>
                </li>
                <li>
                  <Link className="ms-link" to="patient-profile">
                    Patient Profile
                  </Link>
                </li>
                <li>
                  <Link className="ms-link" to="patient-invoices">
                    Patient Invoices
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <Link className="m-link" to="accidents">
                <i className="icofont-stretcher fs-5" />
                <span>Accidents</span>
              </Link>
            </li>
            <li>
              <Link className="m-link" to="labs">
                <i className="icofont-blood-test fs-5" /> <span>Labs</span>
              </Link>
            </li>
            <li>
              <Link className="m-link" to="department">
                <i className="icofont-hospital fs-5" />
                <span>Department</span>
              </Link>
            </li>
            <li className="collapsed">
              <Link
                className="m-link"
                data-bs-toggle="collapse"
                data-bs-target="#menu-Componentsone"
                to="#"
              >
                <i className="icofont-ui-calculator" /> <span>Accounts</span>
                <span className="arrow icofont-rounded-down ms-auto text-end fs-5" />
              </Link>
              {/* Menu: Sub menu ul */}
              <ul className="sub-menu collapse" id="menu-Componentsone">
                <li>
                  <Link className="ms-link" to="invoices">
                    <span>Invoices</span>
                  </Link>
                </li>
                <li>
                  <Link className="ms-link" to="payments">
                    <span>Payments</span>
                  </Link>
                </li>
                <li>
                  <Link className="ms-link" to="expenses">
                    <span>Expenses</span>
                  </Link>
                </li>
              </ul>
            </li>
            <li className="collapsed">
              <Link
                className="m-link"
                data-bs-toggle="collapse"
                data-bs-target="#app"
                to="#"
              >
                <i className="icofont-code-alt fs-5" /> <span>App</span>
                <span className="arrow icofont-rounded-down ms-auto text-end fs-5" />
              </Link>
              {/* Menu: Sub menu ul */}
              <ul className="sub-menu collapse" id="app">
                <li>
                  <Link className="ms-link" to="calendar">
                    Calandar
                  </Link>
                </li>
                <li>
                  <Link className="ms-link" to="chat">
                    {" "}
                    Communication
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <Link className="m-link" to="ui-elements/ui-alerts">
                <i className="icofont-paint fs-5" />
                <span>UI Components</span>
              </Link>
            </li>
            <li className="collapsed">
              <Link
                className="m-link"
                data-bs-toggle="collapse"
                data-bs-target="#page"
                to="#"
              >
                <i className="icofont-page fs-5" /> <span>Pages Example</span>
                <span className="arrow icofont-rounded-down ms-auto text-end fs-5" />
              </Link>
              {/* Menu: Sub menu ul */}
              <ul className="sub-menu collapse" id="page">
                <li>
                  <Link className="ms-link" to="table">
                    Table Example
                  </Link>
                </li>
                <li>
                  <Link className="ms-link" to="forms">
                    {" "}
                    Forms Example
                  </Link>
                </li>
                <li>
                  <Link className="ms-link" to="icon">
                    {" "}
                    Icons Example
                  </Link>
                </li>
                <li>
                  <Link className="ms-link" to="contact">
                    {" "}
                    Contact Example
                  </Link>
                </li>
              </ul>
            </li>

            <li className="collapsed">
              <Link
                className="m-link"
                data-bs-toggle="collapse"
                data-bs-target="#menu-master"
                to="#"
              >
                <i className="icofont-crown fs-5" /> <span>Master</span>
                <span className="arrow icofont-rounded-down ms-auto text-end fs-5" />
              </Link>
              {/* Menu: Sub menu ul */}
              <ul className="sub-menu collapse" id="menu-master">
                <li>
                  <Link className={`ms-link ${isActive('/Gendermaster') ? 'active' : ''}`} to="Gendermaster">
                    Gender Master
                  </Link>
                </li>
                <li>
                  <Link  className={`ms-link ${isActive('/Relationmaster') ? 'active' : ''}`} to="Relationmaster">
                    Relation Master
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/Bloodmaster') ? 'active' : ''}`} to="Bloodmaster">
                    Blood Group Master
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/titlemaster') ? 'active' : ''}`}to="titlemaster">
                    Title Master
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/religionmaster') ? 'active' : ''}`}to="religionmaster">
                    Religion Master
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/maritalstatusmaster') ? 'active' : ''}`} to="maritalstatusmaster">
                    Marital Status Master
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/departmenttype') ? 'active' : ''}`} to="departmenttype">
                    Department Type
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/departmentmaster') ? 'active' : ''}`} to="departmentmaster">
                    Department Master
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/hospitalmaster') ? 'active' : ''}`} to="hospitalmaster">
                    Hospital Master
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/countrymaster') ? 'active' : ''}`} to="countrymaster">
                    Country Master
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/statemaster') ? 'active' : ''}`} to="statemaster">
                    State Master
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/districtmaster') ? 'active' : ''}`} to="districtmaster">
                    District Master
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/Identificationmaster') ? 'active' : ''}`} to="Identificationmaster">
                    Identification Master
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/rcmc') ? 'active' : ''}`} to="rcmc">
                    RCMC Master
                  </Link>
                </li>

                <li>
                  <Link className={`ms-link ${isActive('/frequencymaster') ? 'active' : ''}`}to="frequencymaster">
                    Frequency Master
                  </Link>
                </li>

                <li>
                  <Link className={`ms-link ${isActive('/treatmentadvicemaster') ? 'active' : ''}`} to="treatmentadvicemaster">
                    Treatment Advice Master
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/createusermaster') ? 'active' : ''}`} to="createusermaster">
                    Create User Master
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/userdepartment') ? 'active' : ''}`} to="userdepartment">
                    User Department
                  </Link>
                </li>
              </ul>
            </li>

            <li className="collapsed">
              <Link
                className="m-link"
                data-bs-toggle="collapse"
                data-bs-target="#menu-Store"
                to="#"
              >
                <i className="icofont-shopping-cart fs-5" /> <span>Stores</span>
                <span className="arrow icofont-rounded-down ms-auto text-end fs-5" />
              </Link>
              <ul className="sub-menu collapse" id="menu-Store">
                <li>
                  <Link className={`ms-link ${isActive('/itemclass') ? 'active' : ''}`} to="itemclass">
                    Item Class
                  </Link>
                </li>
                <li>
                  <Link  className={`ms-link ${isActive('/itemcategory') ? 'active' : ''}`} to="itemcategory">
                    Item Category
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/itemtype') ? 'active' : ''}`} to="itemtype">
                    Item Type
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/itemunit') ? 'active' : ''}`}  to="itemunit">
                    Item Unit
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/drugmaster') ? 'active' : ''}`} to="drugmaster">
                    Drug Master
                  </Link>
                </li>


              </ul>
            </li>


            {/* admin */}
            <li className="collapsed">
              <Link
                className="m-link"
                data-bs-toggle="collapse"
                data-bs-target="#menu-admin"
                to="#"
              >
                <i className="icofont-settings-alt fs-5" /> <span>Admin</span>
                <span className="arrow icofont-rounded-down ms-auto text-end fs-5" />
              </Link>
              {/* Menu: Sub menu ul */}
              <ul className="sub-menu collapse" id="menu-admin">
                <li>
                  <Link className={`ms-link ${isActive('/ApointmentSetup') ? 'active' : ''}`}  to="ApointmentSetup">
                    Apointment Setup
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/DoctorRoaster') ? 'active' : ''}`} to="DoctorRoaster">
                    Doctor Roaster
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/RegisterEmployee') ? 'active' : ''}`}  to="RegisterEmployee">
                  Register Employee
                  </Link>
                </li> 
                <li>
                  <Link className={`ms-link ${isActive('/approveemployee') ? 'active' : ''}`} to="approveemployee">
                    Approve Employee
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/ViewSearchEmployee') ? 'active' : ''}`} to="ViewSearchEmployee">
                   View and Search Employee
                  </Link>
                </li>    
                <li>
                  <Link className={`ms-link ${isActive('/manageuserapplication') ? 'active' : ''}`} to="manageuserapplication">
                    Manage User Application
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/addformreports') ? 'active' : ''}`} to="addformreports">
                    Add Form/Reports
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/templatemaster') ? 'active' : ''}`} to="templatemaster">
                    Manage Template
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/assignapplication') ? 'active' : ''}`} to="/assignapplication">
                    Assign Application To Template
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/rolesrights') ? 'active' : ''}`} to="/rolesrights">
                    Roles Rights
                  </Link>
                </li>
                <li>
                  <Link className={`ms-link ${isActive('/rolemaster') ? 'active' : ''}`}  to="/rolemaster">
                    Role Master
                  </Link>
                </li>

              </ul>
            </li>

            {/* Patient Registration */}
            <li className="collapsed">
              <Link
                className="m-link"
                data-bs-toggle="collapse"
                data-bs-target="#menu-Reception"
                to="#"
              >
                <i className="icofont-doctor-alt fs-5" /> <span>Reception</span>
                <span className="arrow icofont-rounded-down ms-auto text-end fs-5" />
              </Link>
              {/* Menu: Sub menu ul */}
              <ul className="sub-menu collapse" id="menu-Reception">
                <li>
                  <Link className="ms-link" to="PatientRegistration">
                    Patient Registration
                  </Link>
                </li>

              </ul>
                
            </li>



          </ul>


          {/* Menu: menu collepce btn */}
          <button
            type="button"
            className="btn btn-link sidebar-mini-btn text-light"
          >
            <span className="ms-2">
              <i className="icofont-bubble-right" />
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
export default Sidebar;