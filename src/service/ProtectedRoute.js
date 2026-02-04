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
  "/AppointmentForFollowUpPatient",
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
  "/PackageMaster",
  "/PackageInvestigationMaster",
  "/PendingForBilling",
  "/OPDBillingDetails",
  "/LabBillingDetails",
  "/StockStatusReport",
  "/OPDWaitingList",
  "/UpdateLabRegistration",
  "/UpdateUnitRate",
  "/DrugExpiry",
  "/PendingSampleCollection",
  "/PhysicalStockAdjustment",
  "/PhysicalStockAdjustmentViewUpdate",
  "/PhysicalStockAdjustmentApproval",
  "/SampleValidation",
  "/PendingForSampleCollection",
  "/PendingForResultEntry",
  "/PhysicalStockTakingRegister",
  "/OpeningBalanceRegister",
  "/OpdWaitingList",
  "/SampleMaster",
  "/PatientwiseBilldatails",
  "/ResultValidation",
  "/UpdateResultValidation",
  "/OpdRecallPatient",
  "/CreateIndent",
  "/ViewUpdateIndent",
  "/PendingIndentApproval",
  "/InvestigationMethodologyMaster",
  "/TrackIndent",
  "/InvestigationCategoryMaster",
  "/IndentIssue",
  "/IndentApproval",
  "/MedicineIssueRegister",
  "/IssueReferenceReport",
  "/PatientWaitingList",
  "/CareLevelMaster",
  "/WardCategoryMaster",
  "/WardManagementMaster",
  "/RoomCategoryMaster",
  "/RoomMasterScreen",
  "/BedManagement",
  "/BedStatusMaster",
  "/FamilyHistoryMaster",
  "/ProcedureMaster",
  "/ProcedureTypeMaster",
  "/BedTypeMaster",
  "/PatientAdmission",
  "/TokenDisplay",
  "/NewPatientAppointment",
  "/MealTypeMaster",
  "/DietTypeMaster",
  "/DietPreferenceMaster",
  "/DietScheduleMaster",
  "/ItemReceivingMainScreen",
  "/AdmissionStatusMaster",
  "/IntakeItemMaster",
  "/PatientacuityMaster",
  "/OutputTypeMaster",
  "/IntakeTypeMaster",
  "/InpatientMaster",
  "/SpecialityMaster",
  "/BillingPolicyMaster",
  "/DesignationMaster",
  "/OPDQuestionnaireMaster",
  "/OptionValueMaster",
  "/QuestionHeadingMaster",
  "/ToothConditionMaster",
  "/SpectacleUseMaster",
  "/EyeWearUseMaster",
  "/BookedStatusMaster",
  "/OpthColorVisionMaster",
  "/OpthDistanceVisionMaster",
  "/OpthNearVisionMaster",
  "/PatientPreparationMaster",
  "/ObConceptionMaster",
  "/ObConsanguinityMaster",
  "/PresentationMaster",
  "/TrimesterMaster",
  "/CervixPosition",
  "/PelvisType",
  "/StationPresentingMaster",
  "/SterilisationMaster",
  "/SmearResultMaster",
  "/MenstrualFlowMaster",
  "/MenstrualPatternMaster",
  "/MenarcheMaster",
  "/LabResultAmendment",
  "/ItemFacility",
  "/LabReports",
  "/InvestigationRegister",
  "/TATReport",
  "/ResultAmendmentReport",
  "/EntMasTonsilGrade",
  "/ReceivingReport",
  "/ReturnRegister",
  "/BookingAppointmentHistory",
  "/OrderTrackingReport",
  "/PendingInvestigationsReport",
  "/SampleRejectionReport",
  "/RadiologyInvestigationMaster",
  "/MembraneStatusMaster",
  "/LensTypeMaster",
  "/OpthMasSpectacleUse",
  "/ImmunisationStatus",
  "/LiquorMaster",
  "/CervixConsistencyMaster",
  "/EarTmStatusMaster",
  "/EarCanalMaster",
  "/EarRinneMaster",
  "/EarWeberMaster",
  "/EntMasSeptum",
  "/EntMasMucosaMaster",
  "/NonDrugMaster",
  "/PatientListForAdmission",
  "/InpatientAdmission",
  "/ItemStockLedgerReport",
  "/AppointmentSummaryReport",
  "/DailyCancellationReport",
  "/CommonStatusMaster",
  "/BagTypeMaster",
  "/BloodCollectionTypeMaster",
  "/BloodDonationStatusMaster",
  "/BloodCompatibilityMaster",
  "/BloodFailureReasonMaster",
  "/BloodComponentMaster",
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
