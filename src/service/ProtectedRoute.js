import React from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import PageNotFound from '../Components/PageNotFound/PageNotFound';

// List of all valid route paths in your app
const validRoutes = [
  "/dashboard",
  "/AddDoctor",
  "/Gendermaster",
  "/Relationmaster",
  "/Bloodmaster",
  "/maritalstatusmaster",
  "/manageuserapplication",
  "/addformreports",
  "/templatemaster",
  "/assignapplication",
  "/rolesrights",
  "/itemclass",
  "/itemcategory",
  "/itemtype",
  "/Itemunit",
  "/ApointmentSetup",
  "/DoctorRoaster",
  "/PatientRegistration",
  "/rolemaster",
  "/departmenttype",
  "/departmentmaster",
  "/countrymaster",
  "/statemaster",
  "/districtmaster",
  "/RegisterEmployee",
  "/ViewSearchEmployee",
  "/religionmaster",
  "/hospitalmaster",
  "/createusermaster",
  "/userdepartment",
  "/Identificationmaster",
  "/rcmc",
  "/treatmentadvicemaster",
  "/approveemployee",
  "/frequencymaster",
  "/opdmaster",
  "/updatepatientregistration",
  "/mainchargecode",
  "/subchargecode",
  "/labregistration",
  "/uommaster",
  "/samplecollectionmaster",
  "/investigationpricing",
  "/opdpreconsultation",
  "/investigationmaster",
  "/investigation-multiple-results",
  "/Drugmaster",
  "/OpeningBalanceEntry",
  "/OpeningBalanceApprovalList",
  "/OPDServiceMaster",
  "/ServiceCategory",
  "/ItemSection",
  "/HSNMaster",
  "/view-and-update",
  "/payment",
  "/lab-payment-success",
];

const NotAuthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center mt-5 text-danger">
      <h1 className="display-1 fw-bold mb-4">403</h1>
      <h2>You Are Not Authorized To Access This Page</h2>
      <button 
        className="btn btn-primary mt-3"
        onClick={() => navigate('/dashboard')}
      >
        Go Back To Dashboard
      </button>
    </div>
  );
};


const ProtectedRoute = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isAuth = sessionStorage.getItem("isTokenValid") || localStorage.getItem("isTokenValid");
  const allowedUrls = JSON.parse(sessionStorage.getItem("allowedUrls") || "[]");

  if (!isAuth) {
    return <Navigate to="/" replace />;
  }

  if (!validRoutes.includes(currentPath)) {
    return <PageNotFound />;
  }

  if (currentPath === "/dashboard" || allowedUrls.includes(currentPath)) {
    return <Outlet />;
  }

  return <NotAuthorized />;
};

export default ProtectedRoute;
